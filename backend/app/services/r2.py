"""
Cloudflare R2 service (S3-compatible, fully async via aioboto3).

Usage:
    from app.services.r2 import r2, R2_AVAILABLE

    if R2_AVAILABLE:
        url = await r2.upload(file_bytes, filename, content_type="image/jpeg")
"""

import uuid
import mimetypes
from pathlib import Path
from app.core.config import settings

try:
    import aioboto3
    _aioboto_available = True
except ImportError:
    _aioboto_available = False

R2_AVAILABLE = _aioboto_available and bool(settings.R2_ACCOUNT_ID and settings.R2_ACCESS_KEY_ID)


def _session():
    if not R2_AVAILABLE:
        raise RuntimeError(
            "R2 not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, "
            "R2_SECRET_ACCESS_KEY in .env and install aioboto3."
        )
    return aioboto3.Session(
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )


def _endpoint() -> str:
    return f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"


class R2Service:
    """Async Cloudflare R2 upload/delete helper."""

    async def upload(
        self,
        data: bytes,
        filename: str,
        folder: str = "uploads",
        content_type: str | None = None,
    ) -> str:
        """Upload bytes to R2. Returns the public URL."""
        ext = Path(filename).suffix
        object_key = f"{folder}/{uuid.uuid4().hex}{ext}"

        if not content_type:
            content_type, _ = mimetypes.guess_type(filename)
            content_type = content_type or "application/octet-stream"

        async with _session().client("s3", endpoint_url=_endpoint()) as client:
            await client.put_object(
                Bucket=settings.R2_BUCKET_NAME,
                Key=object_key,
                Body=data,
                ContentType=content_type,
            )

        return f"{settings.R2_PUBLIC_URL.rstrip('/')}/{object_key}"

    async def delete(self, url: str) -> None:
        """Delete an object by its public URL."""
        if not settings.R2_PUBLIC_URL:
            return
        base = settings.R2_PUBLIC_URL.rstrip("/") + "/"
        if not url.startswith(base):
            return
        object_key = url[len(base):]
        async with _session().client("s3", endpoint_url=_endpoint()) as client:
            await client.delete_object(Bucket=settings.R2_BUCKET_NAME, Key=object_key)

    async def presigned_url(self, object_key: str, expires_in: int = 3600) -> str:
        """Generate a pre-signed GET URL for private objects."""
        async with _session().client("s3", endpoint_url=_endpoint()) as client:
            return await client.generate_presigned_url(
                "get_object",
                Params={"Bucket": settings.R2_BUCKET_NAME, "Key": object_key},
                ExpiresIn=expires_in,
            )


r2 = R2Service()
