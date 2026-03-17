"""
Redis-backed multi-domain cache.

Cache key pattern: {domain}:data:{md5(client_ip + endpoint + sorted_params)}
Invalidation queue: {domain}:inv_queue (Redis list, rpush producer / blpop worker)

Supported domains:
- finance: transactions, budgets, ziswaf, financial summaries
- jamaah: congregation members, families, tags, zakat fitrah

On any write operation, call queue_invalidation(domain="...").
The background worker (cache_worker.py) drains queues and flushes all
{domain}:data:* keys via SCAN so every client re-fetches fresh data.
"""

import hashlib
import json
import logging
from typing import Any

log = logging.getLogger(__name__)

try:
    import redis.asyncio as aioredis
    _redis_pkg_available = True
except ImportError:
    _redis_pkg_available = False

CACHE_AVAILABLE = False  # flipped to True by init_cache() on startup
_client: Any = None


def _make_client():
    from app.core.config import settings
    return aioredis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        password=settings.REDIS_PASSWORD or None,
        db=settings.REDIS_DB,
        decode_responses=True,
        socket_connect_timeout=5,
        socket_timeout=10,  # Must be >= blpop timeout (5s) + buffer
    )


def get_client():
    global _client
    if _client is None and _redis_pkg_available:
        _client = _make_client()
    return _client


async def init_cache() -> bool:
    """Ping Redis; sets CACHE_AVAILABLE. Call once on startup."""
    global CACHE_AVAILABLE
    if not _redis_pkg_available:
        log.warning("redis package not installed — finance cache disabled")
        return False
    try:
        await get_client().ping()
        CACHE_AVAILABLE = True
        log.info("Redis connected — finance cache enabled")
        return True
    except Exception as exc:
        log.warning("Redis unavailable (%s) — finance cache disabled", exc)
        CACHE_AVAILABLE = False
        return False


def make_key(client_ip: str, endpoint: str, params: dict, domain: str = "finance") -> str:
    """Stable cache key from (IP, endpoint name, query params)."""
    raw = f"{client_ip}:{endpoint}:{json.dumps(params, sort_keys=True, default=str)}"
    return f"{domain}:data:" + hashlib.md5(raw.encode()).hexdigest()


def _get_client_ip(request) -> str:
    """Best-effort real IP (handles X-Forwarded-For from nginx)."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def get(key: str) -> Any:
    if not CACHE_AVAILABLE:
        return None
    try:
        val = await get_client().get(key)
        return json.loads(val) if val else None
    except Exception:
        return None


async def set(key: str, value: Any, ttl: int = 1800) -> None:
    """Store value with TTL (default 30 min)."""
    if not CACHE_AVAILABLE:
        return
    try:
        await get_client().setex(key, ttl, json.dumps(value, default=str))
    except Exception:
        pass


async def queue_invalidation(domain: str = "finance") -> None:
    """Enqueue a domain cache flush (non-blocking, fire-and-forget).

    Args:
        domain: Cache domain to invalidate ("finance", "jamaah", etc.)
    """
    if not CACHE_AVAILABLE:
        return
    try:
        await get_client().rpush(
            f"{domain}:inv_queue",
            json.dumps({"action": "flush_all", "domain": domain})
        )
    except Exception:
        pass
