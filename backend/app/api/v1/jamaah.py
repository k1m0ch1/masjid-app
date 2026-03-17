from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date
from app.db.session import get_db
from app.models.user import User
from app.models.jamaah import Jamaah, Family, ZakatFitrah, JamaahTag
from app.models.finance import Transaction, TransactionType
from app.schemas.jamaah import (
    JamaahCreate,
    JamaahUpdate,
    JamaahResponse,
    FamilyCreate,
    FamilyUpdate,
    FamilyResponse,
    ZakatFitrahCreate,
    ZakatFitrahUpdate,
    ZakatFitrahResponse,
    ZakatFitrahSummary,
    TagResponse,
    TagCreate,
    TagUpdate,
)
from app.api.v1.auth import require_module
from app.services import cache

router = APIRouter()


# ─── Tags ───────────────────────────────────────────────────────────────────────
# NOTE: /jamaah/tags must be declared BEFORE /jamaah/{jamaah_id}

@router.get("/jamaah/tags", response_model=List[TagResponse])
async def list_tags(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("jamaah")),
):
    return db.query(JamaahTag).order_by(JamaahTag.name).all()


@router.post("/jamaah/tags", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(
    data: TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("jamaah")),
):
    if db.query(JamaahTag).filter(JamaahTag.name == data.name).first():
        raise HTTPException(status_code=400, detail="Tag dengan nama ini sudah ada")
    tag = JamaahTag(**data.model_dump(), created_by=current_user.id)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@router.put("/jamaah/tags/{tag_id}", response_model=TagResponse)
async def update_tag(
    tag_id: UUID,
    data: TagUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("jamaah")),
):
    tag = db.query(JamaahTag).filter(JamaahTag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(tag, field, value)
    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/jamaah/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("jamaah")),
):
    tag = db.query(JamaahTag).filter(JamaahTag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    db.delete(tag)
    db.commit()


# ─── Jamaah ────────────────────────────────────────────────────────────────────

@router.get("/jamaah", response_model=List[JamaahResponse])
async def list_jamaah(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    tag_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("jamaah")),
):
    query = db.query(Jamaah).options(joinedload(Jamaah.tags))

    if search:
        query = query.filter(
            or_(
                Jamaah.full_name.ilike(f"%{search}%"),
                Jamaah.phone.ilike(f"%{search}%"),
                Jamaah.email.ilike(f"%{search}%"),
            )
        )
    if role:
        query = query.filter(Jamaah.role == role)
    if is_active is not None:
        query = query.filter(Jamaah.is_active == is_active)
    if tag_id:
        query = query.filter(Jamaah.tags.any(JamaahTag.id == tag_id))

    return [JamaahResponse.model_validate(j) for j in query.offset(skip).limit(limit).all()]


@router.post("/jamaah", response_model=JamaahResponse, status_code=status.HTTP_201_CREATED)
async def create_jamaah(
    jamaah: JamaahCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("jamaah")),
):
    data = jamaah.model_dump(exclude={"tag_ids"})
    db_jamaah = Jamaah(**data)
    db.add(db_jamaah)

    if jamaah.tag_ids:
        tags = db.query(JamaahTag).filter(JamaahTag.id.in_(jamaah.tag_ids)).all()
        db_jamaah.tags = tags

    db.commit()
    db.refresh(db_jamaah)
    return JamaahResponse.model_validate(db_jamaah)


@router.get("/jamaah/{jamaah_id}", response_model=JamaahResponse)
async def get_jamaah(
    jamaah_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("jamaah")),
):
    jamaah = db.query(Jamaah).options(joinedload(Jamaah.tags)).filter(Jamaah.id == jamaah_id).first()
    if not jamaah:
        raise HTTPException(status_code=404, detail="Jamaah not found")
    return JamaahResponse.model_validate(jamaah)


@router.put("/jamaah/{jamaah_id}", response_model=JamaahResponse)
async def update_jamaah(
    jamaah_id: UUID,
    jamaah_update: JamaahUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("jamaah")),
):
    jamaah = db.query(Jamaah).options(joinedload(Jamaah.tags)).filter(Jamaah.id == jamaah_id).first()
    if not jamaah:
        raise HTTPException(status_code=404, detail="Jamaah not found")

    update_data = jamaah_update.model_dump(exclude_unset=True)
    tag_ids = update_data.pop("tag_ids", None)

    for field, value in update_data.items():
        setattr(jamaah, field, value)

    if tag_ids is not None:
        tags = db.query(JamaahTag).filter(JamaahTag.id.in_(tag_ids)).all()
        jamaah.tags = tags

    db.commit()
    db.refresh(jamaah)
    return JamaahResponse.model_validate(jamaah)


@router.delete("/jamaah/{jamaah_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_jamaah(
    jamaah_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("jamaah")),
):
    jamaah = db.query(Jamaah).filter(Jamaah.id == jamaah_id).first()
    if not jamaah:
        raise HTTPException(status_code=404, detail="Jamaah not found")
    db.delete(jamaah)
    db.commit()


# ─── Family ────────────────────────────────────────────────────────────────────

@router.get("/families", response_model=List[FamilyResponse])
async def list_families(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("jamaah")),
):
    families = db.query(Family).offset(skip).limit(limit).all()
    return [FamilyResponse.model_validate(f) for f in families]


@router.post("/families", response_model=FamilyResponse, status_code=status.HTTP_201_CREATED)
async def create_family(
    family: FamilyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("jamaah")),
):
    db_family = Family(**family.model_dump())
    db.add(db_family)
    db.commit()
    db.refresh(db_family)
    return FamilyResponse.model_validate(db_family)


@router.get("/families/{family_id}", response_model=FamilyResponse)
async def get_family(
    family_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("jamaah")),
):
    family = db.query(Family).filter(Family.id == family_id).first()
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    return FamilyResponse.model_validate(family)


@router.get("/families/{family_id}/members", response_model=List[JamaahResponse])
async def get_family_members(
    family_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("jamaah")),
):
    family = db.query(Family).filter(Family.id == family_id).first()
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    members = db.query(Jamaah).filter(Jamaah.family_id == family_id).all()
    return [JamaahResponse.model_validate(m) for m in members]


# ─── Zakat Fitrah ──────────────────────────────────────────────────────────────
# NOTE: /zakat-fitrah/summary must be declared BEFORE /zakat-fitrah/{record_id}

@router.get("/zakat-fitrah/summary", response_model=ZakatFitrahSummary)
async def zakat_fitrah_summary(
    year: str = Query(default=str(datetime.now().year)),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("jamaah")),
):
    """Aggregate stats for zakat fitrah in a given year."""
    records = db.query(ZakatFitrah).filter(ZakatFitrah.year == year).all()

    total_jiwa = sum(r.jumlah_jiwa for r in records)
    paid_records = [r for r in records if r.is_paid]
    total_jiwa_paid = sum(r.jumlah_jiwa for r in paid_records)
    total_beras_kg = float(sum(r.amount_beras_kg or 0 for r in paid_records))
    total_uang_idr = float(sum(r.amount_uang or 0 for r in paid_records))

    return ZakatFitrahSummary(
        year=year,
        total_records=len(records),
        total_jiwa=total_jiwa,
        total_paid=len(paid_records),
        total_pending=len(records) - len(paid_records),
        total_jiwa_paid=total_jiwa_paid,
        total_beras_kg=total_beras_kg,
        total_uang_idr=total_uang_idr,
    )


@router.get("/zakat-fitrah", response_model=List[ZakatFitrahResponse])
async def list_zakat_fitrah(
    year: Optional[str] = None,
    jamaah_id: Optional[UUID] = None,
    is_paid: Optional[bool] = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("jamaah")),
):
    query = db.query(ZakatFitrah)
    if year:
        query = query.filter(ZakatFitrah.year == year)
    if jamaah_id:
        query = query.filter(ZakatFitrah.jamaah_id == jamaah_id)
    if is_paid is not None:
        query = query.filter(ZakatFitrah.is_paid == is_paid)

    return [ZakatFitrahResponse.model_validate(r) for r in query.offset(skip).limit(limit).all()]


@router.post("/zakat-fitrah", response_model=ZakatFitrahResponse, status_code=status.HTTP_201_CREATED)
async def create_zakat_fitrah(
    data: ZakatFitrahCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("jamaah")),
):
    record = ZakatFitrah(**data.model_dump(), created_by=current_user.id)
    db.add(record)
    db.commit()
    db.refresh(record)
    await cache.queue_invalidation()
    return ZakatFitrahResponse.model_validate(record)


@router.get("/zakat-fitrah/{record_id}", response_model=ZakatFitrahResponse)
async def get_zakat_fitrah(
    record_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("jamaah")),
):
    record = db.query(ZakatFitrah).filter(ZakatFitrah.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return ZakatFitrahResponse.model_validate(record)


@router.put("/zakat-fitrah/{record_id}", response_model=ZakatFitrahResponse)
async def update_zakat_fitrah(
    record_id: UUID,
    data: ZakatFitrahUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("jamaah")),
):
    record = db.query(ZakatFitrah).filter(ZakatFitrah.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)
    await cache.queue_invalidation()
    return ZakatFitrahResponse.model_validate(record)


@router.delete("/zakat-fitrah/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_zakat_fitrah(
    record_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("jamaah")),
):
    record = db.query(ZakatFitrah).filter(ZakatFitrah.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    # Remove linked finance transactions
    db.query(Transaction).filter(
        Transaction.source_type == "zakat_fitrah",
        Transaction.source_id == record_id,
    ).delete()
    db.delete(record)
    db.commit()
    await cache.queue_invalidation()


@router.post("/zakat-fitrah/{record_id}/pay", response_model=ZakatFitrahResponse)
async def mark_zakat_paid(
    record_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module("jamaah")),
):
    """Mark a zakat fitrah record as paid."""
    record = db.query(ZakatFitrah).filter(ZakatFitrah.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    record.is_paid = True
    record.paid_at = datetime.utcnow()
    db.commit()
    db.refresh(record)

    # Sync to finance: create income transaction for zakat fitrah payment
    # Determine amount: use amount_uang for cash, or 0 for beras-only
    amount = record.amount_uang or 0
    if amount and amount > 0:
        # Remove any existing finance record for this zakat fitrah (avoid duplicates)
        db.query(Transaction).filter(
            Transaction.source_type == "zakat_fitrah",
            Transaction.source_id == record.id,
        ).delete()
        # Resolve donor name
        donor_name = None
        if record.jamaah_id:
            j = db.get(Jamaah, record.jamaah_id)
            donor_name = j.full_name if j else None
        trx = Transaction(
            transaction_type=TransactionType.INCOME,
            amount=amount,
            transaction_date=date.today(),
            income_category="zakat_fitrah",
            donor_name=donor_name,
            donor_jamaah_id=record.jamaah_id,
            description=f"Zakat Fitrah - {donor_name or 'Jamaah'} ({record.jumlah_jiwa} jiwa)",
            payment_method="cash",
            source_type="zakat_fitrah",
            source_id=record.id,
            created_by=current_user.id,
        )
        db.add(trx)
        db.commit()

    await cache.queue_invalidation()
    return ZakatFitrahResponse.model_validate(record)
