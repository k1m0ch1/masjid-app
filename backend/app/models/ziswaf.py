from sqlalchemy import Column, String, Date, DateTime, Enum, ForeignKey, Text, Boolean, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, date
import uuid
import enum
from app.db.session import Base


class ZiswafType(str, enum.Enum):
    ZAKAT_MAL = "zakat_mal"
    ZAKAT_PROFESI = "zakat_profesi"
    INFAQ = "infaq"
    SHADAQAH = "shadaqah"
    WAKAF_TUNAI = "wakaf_tunai"
    WAKAF_ASET = "wakaf_aset"


class ZiswafTransaction(Base):
    """ZISWAF donation transaction — covers Zakat Mal/Profesi, Infaq, Shadaqah, Wakaf."""
    __tablename__ = "ziswaf_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(Enum(ZiswafType), nullable=False)

    # Donor — either linked jamaah or manual name
    jamaah_id = Column(UUID(as_uuid=True), ForeignKey("jamaah.id", ondelete="SET NULL"), nullable=True)
    donor_name = Column(String(200), nullable=True)   # for non-jamaah / anonymous donors
    is_anonymous = Column(Boolean, default=False)

    # Amount (for all cash-based types)
    amount = Column(Numeric(15, 2), nullable=True)

    # Date
    transaction_date = Column(Date, nullable=False, default=date.today)

    # Purpose / allocation label (e.g., "Renovasi Masjid", "Operasional")
    purpose = Column(String(300), nullable=True)

    # Wakaf Aset specific
    asset_description = Column(Text, nullable=True)
    asset_value = Column(Numeric(15, 2), nullable=True)  # estimated value

    # Status
    is_verified = Column(Boolean, default=False)
    verified_at = Column(DateTime, nullable=True)
    verified_by = Column(String(100), nullable=True)

    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    jamaah = relationship("Jamaah", back_populates="ziswaf_transactions")
