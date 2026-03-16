from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.db.session import Base


# All valid event types (stored as plain string — more flexible than PG enum)
EVENT_TYPES = [
    "pengajian", "tahfidz", "kajian", "tpq", "friday_prayer",
    "tarawih", "eid", "qurban", "aqiqah", "wedding", "funeral",
    "meeting", "cleaning", "renovation", "other",
]


class Event(Base):
    __tablename__ = "events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    title = Column(String, nullable=False)
    event_type = Column(String, nullable=False, index=True, default="other")
    description = Column(Text, nullable=True)

    start_datetime = Column(DateTime, nullable=False, index=True)
    end_datetime = Column(DateTime, nullable=True)

    location = Column(String, nullable=True)
    speaker = Column(String, nullable=True)
    organizer = Column(String, nullable=True)

    max_participants = Column(Integer, nullable=True)
    registration_required = Column(Boolean, default=False)
    registration_deadline = Column(DateTime, nullable=True)

    is_recurring = Column(Boolean, default=False)
    recurrence_pattern = Column(String, nullable=True)
    recurrence_days = Column(ARRAY(String), nullable=True, default=list)

    notes = Column(Text, nullable=True)

    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = relationship("User")
    attendances = relationship("Attendance", back_populates="event", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Event {self.title}>"


class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"), nullable=False)
    jamaah_id = Column(UUID(as_uuid=True), ForeignKey("jamaah.id"), nullable=False)

    attended_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)

    recorded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    event = relationship("Event", back_populates="attendances")
    jamaah = relationship("Jamaah")
    recorder = relationship("User")
