from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import uuid
from app.db.session import Base


class MessageQueue(Base):
    """WhatsApp message queue — scheduled or immediate sends."""
    __tablename__ = "message_queue"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Linked event (optional)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id", ondelete="SET NULL"), nullable=True)

    # Recipient
    recipient_type = Column(String(10), nullable=False)   # "personal" | "group"
    recipient = Column(String(200), nullable=False)        # phone@s.whatsapp.net or JID@g.us
    recipient_name = Column(String(200), nullable=True)   # display label

    # Message content
    message_type = Column(String(10), nullable=False, default="text")  # "text" | "image"
    message = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)
    caption = Column(Text, nullable=True)

    # Schedule
    send_now = Column(Boolean, default=True)
    scheduled_at = Column(DateTime, nullable=True)  # null = send immediately

    # Status
    status = Column(String(20), nullable=False, default="pending")  # pending|processing|sent|failed|cancelled
    sent_at = Column(DateTime, nullable=True)
    error = Column(Text, nullable=True)
    attempt_count = Column(String(5), nullable=True, default="0")

    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    event = relationship("Event")
