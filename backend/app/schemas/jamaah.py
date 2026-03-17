from pydantic import BaseModel, EmailStr, UUID4
from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal
from app.models.jamaah import Gender, JamaahRole, EconomicStatus, ZakatFitrahPaymentType


# ─── Tag ───────────────────────────────────────────────────────────────────────

class TagResponse(BaseModel):
    id: UUID4
    name: str
    color: str
    created_at: datetime

    class Config:
        from_attributes = True


class TagCreate(BaseModel):
    name: str
    color: str = "#6B7280"


class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


# ─── Jamaah ────────────────────────────────────────────────────────────────────

class JamaahBase(BaseModel):
    full_name: str
    gender: Gender
    date_of_birth: Optional[date] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    rt_rw: Optional[str] = None
    kelurahan: Optional[str] = None
    kecamatan: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    family_role: Optional[str] = None

    role: JamaahRole = JamaahRole.JAMAAH
    skills: Optional[List[str]] = []
    needs: Optional[List[str]] = []

    education_level: Optional[str] = None
    occupation: Optional[str] = None
    economic_status: Optional[EconomicStatus] = EconomicStatus.MENENGAH
    health_status: Optional[str] = "sehat"

    monthly_honorarium: Optional[Decimal] = Decimal("0")
    bank_account: Optional[str] = None

    is_active: bool = True
    join_date: Optional[date] = None
    notes: Optional[str] = None


class JamaahCreate(JamaahBase):
    family_id: Optional[UUID4] = None
    tag_ids: Optional[List[UUID4]] = []


class JamaahUpdate(BaseModel):
    full_name: Optional[str] = None
    gender: Optional[Gender] = None
    date_of_birth: Optional[date] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    rt_rw: Optional[str] = None
    kelurahan: Optional[str] = None
    kecamatan: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    family_id: Optional[UUID4] = None
    family_role: Optional[str] = None

    role: Optional[JamaahRole] = None
    skills: Optional[List[str]] = None
    needs: Optional[List[str]] = None

    education_level: Optional[str] = None
    occupation: Optional[str] = None
    economic_status: Optional[EconomicStatus] = None
    health_status: Optional[str] = None

    monthly_honorarium: Optional[Decimal] = None
    bank_account: Optional[str] = None

    is_active: Optional[bool] = None
    join_date: Optional[date] = None
    notes: Optional[str] = None
    tag_ids: Optional[List[UUID4]] = None


class JamaahResponse(JamaahBase):
    id: UUID4
    user_id: Optional[UUID4] = None
    family_id: Optional[UUID4] = None
    tags: List[TagResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JamaahSummary(BaseModel):
    """Minimal jamaah info for embedding in other responses."""
    id: UUID4
    full_name: str
    role: JamaahRole

    class Config:
        from_attributes = True


# ─── Family ────────────────────────────────────────────────────────────────────

class FamilyBase(BaseModel):
    family_name: str
    address: Optional[str] = None
    notes: Optional[str] = None


class FamilyCreate(FamilyBase):
    head_of_family_id: Optional[UUID4] = None


class FamilyUpdate(BaseModel):
    family_name: Optional[str] = None
    head_of_family_id: Optional[UUID4] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class FamilyResponse(FamilyBase):
    id: UUID4
    head_of_family_id: Optional[UUID4] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── Zakat Fitrah ──────────────────────────────────────────────────────────────

class ZakatFitrahCreate(BaseModel):
    jamaah_id: UUID4
    year: str
    jumlah_jiwa: int = 1
    payment_type: ZakatFitrahPaymentType = ZakatFitrahPaymentType.UANG
    amount_beras_kg: Optional[Decimal] = None
    amount_uang: Optional[Decimal] = None
    rate_per_jiwa: Optional[Decimal] = None
    is_paid: bool = False
    paid_at: Optional[datetime] = None
    notes: Optional[str] = None


class ZakatFitrahUpdate(BaseModel):
    jumlah_jiwa: Optional[int] = None
    payment_type: Optional[ZakatFitrahPaymentType] = None
    amount_beras_kg: Optional[Decimal] = None
    amount_uang: Optional[Decimal] = None
    rate_per_jiwa: Optional[Decimal] = None
    is_paid: Optional[bool] = None
    paid_at: Optional[datetime] = None
    notes: Optional[str] = None


class ZakatFitrahResponse(BaseModel):
    id: UUID4
    jamaah_id: UUID4
    jamaah: Optional[JamaahSummary] = None
    year: str
    jumlah_jiwa: int
    payment_type: ZakatFitrahPaymentType
    amount_beras_kg: Optional[Decimal] = None
    amount_uang: Optional[Decimal] = None
    rate_per_jiwa: Optional[Decimal] = None
    is_paid: bool
    paid_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ZakatFitrahSummary(BaseModel):
    year: str
    total_records: int
    total_jiwa: int
    total_paid: int
    total_pending: int
    total_jiwa_paid: int
    total_beras_kg: float
    total_uang_idr: float
