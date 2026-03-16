from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date, datetime
from decimal import Decimal
import uuid
from app.models.ziswaf import ZiswafType


class ZiswafBase(BaseModel):
    type: ZiswafType
    jamaah_id: Optional[uuid.UUID] = None
    donor_name: Optional[str] = None
    is_anonymous: bool = False
    amount: Optional[Decimal] = None
    transaction_date: date
    purpose: Optional[str] = None
    asset_description: Optional[str] = None
    asset_value: Optional[Decimal] = None
    notes: Optional[str] = None

    @field_validator('amount', 'asset_value', mode='before')
    @classmethod
    def empty_to_none(cls, v):
        if v == '' or v == 0:
            return None
        return v


class ZiswafCreate(ZiswafBase):
    pass


class ZiswafUpdate(BaseModel):
    type: Optional[ZiswafType] = None
    jamaah_id: Optional[uuid.UUID] = None
    donor_name: Optional[str] = None
    is_anonymous: Optional[bool] = None
    amount: Optional[Decimal] = None
    transaction_date: Optional[date] = None
    purpose: Optional[str] = None
    asset_description: Optional[str] = None
    asset_value: Optional[Decimal] = None
    is_verified: Optional[bool] = None
    notes: Optional[str] = None


class ZiswafResponse(ZiswafBase):
    id: uuid.UUID
    is_verified: bool
    verified_at: Optional[datetime] = None
    verified_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    # Donor name resolved from jamaah if linked
    resolved_donor_name: Optional[str] = None

    model_config = {"from_attributes": True}


class ZiswafSummary(BaseModel):
    type: ZiswafType
    total_amount: Decimal
    count: int

    model_config = {"from_attributes": True}


class ZiswafTypeSummary(BaseModel):
    period_start: date
    period_end: date
    by_type: list[ZiswafSummary]
    grand_total: Decimal
