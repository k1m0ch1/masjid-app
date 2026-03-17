"""
File upload endpoint using Cloudflare R2.

Endpoints:
    POST /upload          — general file upload
    POST /upload/image    — image-only upload (validated by content-type)
    DELETE /upload        — delete a file by URL
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.services.r2 import r2, R2_AVAILABLE

router = APIRouter()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_FILE_TYPES = ALLOWED_IMAGE_TYPES | {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


class UploadResponse(BaseModel):
    url: str
    filename: str
    size: int
    content_type: str


class DeleteRequest(BaseModel):
    url: str


def _check_r2():
    if not R2_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="R2 storage not configured",
        )


@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    folder: str = "uploads",
    current_user: User = Depends(get_current_user),
):
    """Upload any allowed file to R2."""
    _check_r2()

    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(400, f"Tipe file tidak didukung: {content_type}")

    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(400, f"Ukuran file melebihi batas {MAX_FILE_SIZE // (1024*1024)} MB")

    url = await r2.upload(data, file.filename or "file", folder=folder, content_type=content_type)
    return UploadResponse(url=url, filename=file.filename or "", size=len(data), content_type=content_type)


@router.post("/upload/image", response_model=UploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    folder: str = "images",
    current_user: User = Depends(get_current_user),
):
    """Upload an image to R2 (JPEG/PNG/WebP/GIF only)."""
    _check_r2()

    content_type = file.content_type or ""
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "Hanya gambar (JPEG, PNG, WebP, GIF) yang diperbolehkan")

    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(400, "Ukuran gambar melebihi batas 10 MB")

    url = await r2.upload(data, file.filename or "image", folder=folder, content_type=content_type)
    return UploadResponse(url=url, filename=file.filename or "", size=len(data), content_type=content_type)


@router.delete("/upload", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    body: DeleteRequest,
    current_user: User = Depends(get_current_user),
):
    """Delete a file from R2 by its public URL."""
    _check_r2()
    try:
        await r2.delete(body.url)
    except Exception as e:
        raise HTTPException(500, f"Gagal menghapus file: {e}")
