from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
import uuid

from app.db.session import get_db
from app.models.ziswaf import ZiswafTransaction, ZiswafType
from app.models.jamaah import Jamaah
from app.models.finance import Transaction, TransactionType
from app.schemas.ziswaf import ZiswafCreate, ZiswafUpdate, ZiswafResponse, ZiswafTypeSummary, ZiswafSummary
from app.api.v1.auth import require_module
from app.models.user import User
from app.services import cache

router = APIRouter()


def _resolve_donor(trx: ZiswafTransaction, db: Session) -> str | None:
    if trx.is_anonymous:
        return "Anonim"
    if trx.jamaah_id:
        j = db.get(Jamaah, trx.jamaah_id)
        return j.full_name if j else trx.donor_name
    return trx.donor_name


def _to_response(trx: ZiswafTransaction, db: Session) -> ZiswafResponse:
    data = ZiswafResponse.model_validate(trx)
    data.resolved_donor_name = _resolve_donor(trx, db)
    return data


TYPE_TO_CATEGORY = {
    "zakat_mal": "zakat_mal",
    "zakat_profesi": "zakat_profesi",
    "infaq": "infaq",
    "shadaqah": "shadaqah",
    "wakaf_tunai": "wakaf_tunai",
    "wakaf_aset": "wakaf_aset",
}


def _sync_to_finance(ziswaf: ZiswafTransaction, db: Session, user_id):
    """Create a finance Transaction record for a ziswaf entry."""
    # Use asset_value for wakaf_aset, else use amount
    type_val = str(ziswaf.type).replace("ZiswafType.", "")
    if type_val in ("wakaf_aset",):
        amount = getattr(ziswaf, "asset_value", None) or ziswaf.amount
    else:
        amount = ziswaf.amount

    if not amount or amount <= 0:
        return

    trx = Transaction(
        transaction_type=TransactionType.INCOME,
        amount=amount,
        transaction_date=ziswaf.transaction_date,
        income_category=TYPE_TO_CATEGORY.get(type_val, "lainnya"),
        donor_name=ziswaf.donor_name,
        donor_jamaah_id=ziswaf.jamaah_id,
        is_anonymous=ziswaf.is_anonymous or False,
        description=f"ZISWAF - {type_val.replace('_', ' ').title()}",
        payment_method="cash",
        source_type="ziswaf",
        source_id=ziswaf.id,
        created_by=user_id,
    )
    db.add(trx)


def _delete_finance_for_ziswaf(ziswaf_id, db: Session):
    """Delete finance transactions linked to a ziswaf record."""
    db.query(Transaction).filter(
        Transaction.source_type == "ziswaf",
        Transaction.source_id == ziswaf_id,
    ).delete()


@router.get("/ziswaf", response_model=List[ZiswafResponse])
def list_ziswaf(
    type: Optional[ZiswafType] = None,
    jamaah_id: Optional[uuid.UUID] = None,
    is_verified: Optional[bool] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("ziswaf")),
):
    q = db.query(ZiswafTransaction)
    if type:
        q = q.filter(ZiswafTransaction.type == type)
    if jamaah_id:
        q = q.filter(ZiswafTransaction.jamaah_id == jamaah_id)
    if is_verified is not None:
        q = q.filter(ZiswafTransaction.is_verified == is_verified)
    if date_from:
        q = q.filter(ZiswafTransaction.transaction_date >= date_from)
    if date_to:
        q = q.filter(ZiswafTransaction.transaction_date <= date_to)
    transactions = q.order_by(ZiswafTransaction.transaction_date.desc()).offset(skip).limit(limit).all()
    return [_to_response(t, db) for t in transactions]


@router.post("/ziswaf", response_model=ZiswafResponse, status_code=201)
async def create_ziswaf(
    data: ZiswafCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("ziswaf")),
):
    trx = ZiswafTransaction(**data.model_dump())
    db.add(trx)
    db.commit()
    db.refresh(trx)
    # Sync to finance
    _sync_to_finance(trx, db, current_user.id)
    db.commit()
    await cache.queue_invalidation()
    return _to_response(trx, db)


@router.get("/ziswaf/summary", response_model=ZiswafTypeSummary)
def ziswaf_summary(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("ziswaf")),
):
    if not date_from:
        # default: current year
        today = date.today()
        date_from = date(today.year, 1, 1)
    if not date_to:
        date_to = date.today()

    rows = (
        db.query(ZiswafTransaction.type, func.count().label("count"), func.sum(ZiswafTransaction.amount).label("total"))
        .filter(
            ZiswafTransaction.transaction_date >= date_from,
            ZiswafTransaction.transaction_date <= date_to,
        )
        .group_by(ZiswafTransaction.type)
        .all()
    )

    by_type = [
        ZiswafSummary(type=r.type, count=r.count, total_amount=r.total or Decimal(0))
        for r in rows
    ]
    grand_total = sum(s.total_amount for s in by_type)

    return ZiswafTypeSummary(
        period_start=date_from,
        period_end=date_to,
        by_type=by_type,
        grand_total=grand_total,
    )


@router.get("/ziswaf/{record_id}", response_model=ZiswafResponse)
def get_ziswaf(
    record_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("ziswaf")),
):
    trx = db.get(ZiswafTransaction, record_id)
    if not trx:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan")
    return _to_response(trx, db)


@router.put("/ziswaf/{record_id}", response_model=ZiswafResponse)
async def update_ziswaf(
    record_id: uuid.UUID,
    data: ZiswafUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("ziswaf")),
):
    trx = db.get(ZiswafTransaction, record_id)
    if not trx:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(trx, field, value)
    db.commit()
    db.refresh(trx)
    # Re-sync to finance
    _delete_finance_for_ziswaf(record_id, db)
    _sync_to_finance(trx, db, current_user.id)
    db.commit()
    await cache.queue_invalidation()
    return _to_response(trx, db)


@router.delete("/ziswaf/{record_id}", status_code=204)
async def delete_ziswaf(
    record_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("ziswaf")),
):
    trx = db.get(ZiswafTransaction, record_id)
    if not trx:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan")
    # Remove linked finance transactions first
    _delete_finance_for_ziswaf(record_id, db)
    db.delete(trx)
    db.commit()
    await cache.queue_invalidation()


@router.post("/ziswaf/{record_id}/verify", response_model=ZiswafResponse)
def verify_ziswaf(
    record_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("ziswaf")),
):
    trx = db.get(ZiswafTransaction, record_id)
    if not trx:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan")
    trx.is_verified = True
    trx.verified_at = datetime.utcnow()
    trx.verified_by = current_user.email
    db.commit()
    db.refresh(trx)
    return _to_response(trx, db)
