from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel
from app.db.session import get_db
from app.models.user import User
from app.models.event import Event, Attendance
from app.api.v1.auth import require_module

router = APIRouter()


class EventBase(BaseModel):
    title: str
    event_type: str = "other"
    description: Optional[str] = None
    start_datetime: datetime
    end_datetime: Optional[datetime] = None
    location: Optional[str] = None
    speaker: Optional[str] = None
    organizer: Optional[str] = None
    max_participants: Optional[int] = None
    registration_required: bool = False
    registration_deadline: Optional[datetime] = None
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None
    recurrence_days: Optional[List[str]] = None
    notes: Optional[str] = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = None
    event_type: Optional[str] = None
    description: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    location: Optional[str] = None
    speaker: Optional[str] = None
    organizer: Optional[str] = None
    max_participants: Optional[int] = None
    registration_required: Optional[bool] = None
    registration_deadline: Optional[datetime] = None
    is_recurring: Optional[bool] = None
    recurrence_pattern: Optional[str] = None
    recurrence_days: Optional[List[str]] = None
    notes: Optional[str] = None


class EventResponse(EventBase):
    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AttendanceCreate(BaseModel):
    jamaah_id: UUID
    notes: Optional[str] = None


class AttendanceResponse(BaseModel):
    id: UUID
    event_id: UUID
    jamaah_id: UUID
    attended_at: datetime
    notes: Optional[str]
    recorded_by: Optional[UUID]
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("/events", response_model=List[EventResponse])
def list_events(
    skip: int = 0,
    limit: int = 100,
    event_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("events")),
):
    q = db.query(Event)
    if event_type:
        q = q.filter(Event.event_type == event_type)
    events = q.order_by(Event.start_datetime.asc()).offset(skip).limit(limit).all()
    return [EventResponse.model_validate(e) for e in events]


@router.post("/events", response_model=EventResponse, status_code=201)
def create_event(
    event: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("events")),
):
    data = event.model_dump()
    data["created_by"] = current_user.id
    db_event = Event(**data)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return EventResponse.model_validate(db_event)


@router.get("/events/{event_id}", response_model=EventResponse)
def get_event(
    event_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("events")),
):
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return EventResponse.model_validate(event)


@router.put("/events/{event_id}", response_model=EventResponse)
def update_event(
    event_id: UUID,
    event_update: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("events")),
):
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    for field, value in event_update.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return EventResponse.model_validate(event)


@router.delete("/events/{event_id}", status_code=204)
def delete_event(
    event_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("events")),
):
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()


@router.post("/events/{event_id}/attendance", response_model=AttendanceResponse, status_code=201)
def record_attendance(
    event_id: UUID,
    attendance: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("events")),
):
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    existing = db.query(Attendance).filter(
        Attendance.event_id == event_id,
        Attendance.jamaah_id == attendance.jamaah_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Attendance already recorded")
    db_att = Attendance(event_id=event_id, jamaah_id=attendance.jamaah_id,
                        notes=attendance.notes, recorded_by=current_user.id)
    db.add(db_att)
    db.commit()
    db.refresh(db_att)
    return AttendanceResponse.model_validate(db_att)


@router.get("/events/{event_id}/attendance", response_model=List[AttendanceResponse])
def get_event_attendance(
    event_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("events")),
):
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    atts = db.query(Attendance).filter(Attendance.event_id == event_id).all()
    return [AttendanceResponse.model_validate(a) for a in atts]
