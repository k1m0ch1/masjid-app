"""
Finance cache invalidation worker.

Runs as a background asyncio task. Blocks on finance:inv_queue with a
5-second timeout so it's idle when nothing is happening, and wakes
immediately when a write triggers queue_invalidation().
"""

import asyncio
import json
import logging

log = logging.getLogger(__name__)


async def run_cache_worker():
    from app.services import cache as c

    while True:
        try:
            if not c.CACHE_AVAILABLE:
                await asyncio.sleep(5)
                continue

            client = c.get_client()
            result = await client.blpop("finance:inv_queue", timeout=5)
            if result is None:
                continue  # timeout — loop again

            _, raw = result
            task = json.loads(raw)

            if task.get("action") == "flush_all":
                await _flush_all(client)

        except asyncio.CancelledError:
            break
        except Exception as exc:
            log.error("Cache worker error: %s", exc)
            await asyncio.sleep(1)


async def _flush_all(client):
    """Delete every finance:data:* key using SCAN (cursor-safe)."""
    deleted = 0
    cursor = 0
    try:
        while True:
            cursor, keys = await client.scan(cursor, match="finance:data:*", count=200)
            if keys:
                await client.delete(*keys)
                deleted += len(keys)
            if cursor == 0:
                break
        if deleted:
            log.info("Finance cache flushed: %d keys deleted", deleted)
    except Exception as exc:
        log.error("Cache flush error: %s", exc)
