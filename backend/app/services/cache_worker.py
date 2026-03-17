"""
Multi-domain cache invalidation worker.

Runs as a background asyncio task. Monitors invalidation queues for multiple
domains (finance, jamaah, etc.) and flushes respective caches on write operations.
Uses a 5-second timeout per queue so it's idle when nothing is happening.
"""

import asyncio
import json
import logging

log = logging.getLogger(__name__)


async def run_cache_worker():
    from app.services import cache as c

    # Domains to monitor for cache invalidation
    DOMAINS = ["finance", "jamaah"]

    while True:
        try:
            if not c.CACHE_AVAILABLE:
                await asyncio.sleep(5)
                continue

            client = c.get_client()

            # Check all domain queues (blpop with multiple keys returns first available)
            queues = [f"{domain}:inv_queue" for domain in DOMAINS]
            result = await client.blpop(queues, timeout=5)
            if result is None:
                continue  # timeout — loop again

            queue_name, raw = result
            task = json.loads(raw)

            if task.get("action") == "flush_all":
                domain = task.get("domain", "finance")  # fallback to finance for old messages
                await _flush_all(client, domain)

        except asyncio.CancelledError:
            break
        except Exception as exc:
            log.error("Cache worker error: %s", exc)
            await asyncio.sleep(1)


async def _flush_all(client, domain: str = "finance"):
    """Delete all cache keys for a domain using SCAN (cursor-safe).

    Args:
        client: Redis client
        domain: Cache domain to flush ("finance", "jamaah", etc.)
    """
    deleted = 0
    cursor = 0
    pattern = f"{domain}:data:*"
    try:
        while True:
            cursor, keys = await client.scan(cursor, match=pattern, count=200)
            if keys:
                await client.delete(*keys)
                deleted += len(keys)
            if cursor == 0:
                break
        if deleted:
            log.info("%s cache flushed: %d keys deleted", domain.capitalize(), deleted)
    except Exception as exc:
        log.error("Cache flush error for %s: %s", domain, exc)
