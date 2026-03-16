import httpx
import asyncio
import base64
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel
from app.db.session import get_db, SessionLocal
from app.models.user import User
from app.models.message_queue import MessageQueue
from app.api.v1.auth import require_module

router = APIRouter()

from app.core.config import settings

WA_BASE = settings.WA_BASE_URL
WA_AUTH = (settings.WA_USER, settings.WA_PASS)


# ── Schemas ──────────────────────────────────────────────────────────────────

class QueueCreate(BaseModel):
    event_id: Optional[UUID] = None
    recipient_type: str          # "personal" | "group"
    recipient: str               # phone@s.whatsapp.net or JID@g.us
    recipient_name: Optional[str] = None
    message_type: str = "text"  # "text" | "image"
    message: Optional[str] = None
    image_url: Optional[str] = None
    caption: Optional[str] = None
    send_now: bool = True
    scheduled_at: Optional[datetime] = None


class QueueResponse(BaseModel):
    id: UUID
    event_id: Optional[UUID]
    recipient_type: str
    recipient: str
    recipient_name: Optional[str]
    message_type: str
    message: Optional[str]
    image_url: Optional[str]
    caption: Optional[str]
    send_now: bool
    scheduled_at: Optional[datetime]
    status: str
    sent_at: Optional[datetime]
    error: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── WA proxy helpers ──────────────────────────────────────────────────────────

async def _send_text(phone: str, message: str) -> dict:
    async with httpx.AsyncClient(auth=WA_AUTH, timeout=30) as client:
        r = await client.post(f"{WA_BASE}/send/message", json={"phone": phone, "message": message})
        r.raise_for_status()
        return r.json()


async def _send_image(phone: str, image_url: str, caption: str = "") -> dict:
    async with httpx.AsyncClient(auth=WA_AUTH, timeout=30) as client:
        r = await client.post(f"{WA_BASE}/send/image", data={
            "phone": phone,
            "caption": caption or "",
            "image_url": image_url,
            "compress": "false",
        })
        r.raise_for_status()
        return r.json()


async def _process_queue_entry(entry: MessageQueue, db: Session):
    """Send a single queue entry and update its status."""
    entry.status = "processing"
    db.commit()
    try:
        if entry.message_type == "image" and entry.image_url:
            await _send_image(entry.recipient, entry.image_url, entry.caption or "")
        else:
            await _send_text(entry.recipient, entry.message or "")
        entry.status = "sent"
        entry.sent_at = datetime.utcnow()
        entry.error = None
    except Exception as e:
        entry.status = "failed"
        entry.error = str(e)[:500]
    db.commit()


async def _send_immediate(entry_id: UUID):
    """Send immediately using a fresh DB session (safe for background tasks)."""
    db = SessionLocal()
    try:
        entry = db.get(MessageQueue, entry_id)
        if entry:
            await _process_queue_entry(entry, db)
    finally:
        db.close()


# ── Background scheduler ──────────────────────────────────────────────────────

async def run_scheduler():
    """Runs every 30 seconds, processes due pending messages."""
    while True:
        await asyncio.sleep(30)
        try:
            db = SessionLocal()
            now = datetime.utcnow()
            pending = db.query(MessageQueue).filter(
                MessageQueue.status == "pending",
                (MessageQueue.scheduled_at == None) | (MessageQueue.scheduled_at <= now),
            ).limit(20).all()
            for entry in pending:
                await _process_queue_entry(entry, db)
            db.close()
        except Exception:
            pass  # don't crash the scheduler


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/whatsapp/groups")
async def get_groups(current_user: User = Depends(require_module("pesan_kirim"))):
    """Proxy: fetch WhatsApp groups from WA API."""
    async with httpx.AsyncClient(auth=WA_AUTH, timeout=15) as client:
        try:
            r = await client.get(f"{WA_BASE}/user/my/groups")
            r.raise_for_status()
            return r.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail="WA API error")
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"WA API tidak tersedia: {e}")


@router.post("/whatsapp/queue", response_model=QueueResponse, status_code=201)
async def create_queue(
    payload: QueueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("pesan_kirim")),
):
    entry = MessageQueue(
        event_id=payload.event_id,
        recipient_type=payload.recipient_type,
        recipient=payload.recipient,
        recipient_name=payload.recipient_name,
        message_type=payload.message_type,
        message=payload.message,
        image_url=payload.image_url,
        caption=payload.caption,
        send_now=payload.send_now,
        scheduled_at=payload.scheduled_at if not payload.send_now else None,
        status="pending",
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    # If send_now, dispatch immediately using a fresh session (request db closes after response)
    if payload.send_now:
        asyncio.create_task(_send_immediate(entry.id))

    db.refresh(entry)
    return QueueResponse.model_validate(entry)


@router.get("/whatsapp/queue", response_model=List[QueueResponse])
def list_queue(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("pesan_kirim")),
):
    q = db.query(MessageQueue)
    if status:
        q = q.filter(MessageQueue.status == status)
    items = q.order_by(MessageQueue.created_at.desc()).offset(skip).limit(limit).all()
    return [QueueResponse.model_validate(i) for i in items]


@router.delete("/whatsapp/queue/{queue_id}", status_code=204)
def cancel_queue(
    queue_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("pesan_kirim")),
):
    entry = db.get(MessageQueue, queue_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Tidak ditemukan")
    if entry.status not in ("pending",):
        raise HTTPException(status_code=400, detail=f"Tidak bisa dibatalkan (status: {entry.status})")
    entry.status = "cancelled"
    db.commit()


@router.post("/whatsapp/queue/{queue_id}/retry", response_model=QueueResponse)
async def retry_queue(
    queue_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("pesan_kirim")),
):
    entry = db.get(MessageQueue, queue_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Tidak ditemukan")
    if entry.status not in ("failed", "cancelled"):
        raise HTTPException(status_code=400, detail="Hanya bisa retry pesan gagal/dibatalkan")
    entry.status = "pending"
    entry.error = None
    db.commit()
    asyncio.create_task(_send_immediate(entry.id))
    db.refresh(entry)
    return QueueResponse.model_validate(entry)
