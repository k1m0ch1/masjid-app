from sqlalchemy import Column, String, Date, DateTime, Enum, ForeignKey, Text, Boolean, Numeric, Integer, Table
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime, date
import uuid
import enum
from app.db.session import Base


# Many-to-many association: jamaah ↔ tags
jamaah_tag_association = Table(
    "jamaah_tag_associations",
    Base.metadata,
    Column("jamaah_id", UUID(as_uuid=True), ForeignKey("jamaah.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", UUID(as_uuid=True), ForeignKey("jamaah_tags.id", ondelete="CASCADE"), primary_key=True),
)


class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"


class JamaahRole(str, enum.Enum):
    JAMAAH = "jamaah"
    PENGURUS = "pengurus"
    IMAM = "imam"
    MUADZIN = "muadzin"
    MARBOT = "marbot"
    BENDAHARA = "bendahara"
    KETUA = "ketua"
    USTADZ = "ustadz"


class EconomicStatus(str, enum.Enum):
    MAMPU = "mampu"
    MENENGAH = "menengah"
    KURANG_MAMPU = "kurang_mampu"
    TIDAK_MAMPU = "tidak_mampu"
    TIDAK_DISEBUTKAN = "tidak_disebutkan"


class ZakatFitrahPaymentType(str, enum.Enum):
    BERAS = "beras"
    UANG = "uang"


class Jamaah(Base):
    """Congregation member model."""
    __tablename__ = "jamaah"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Personal Information
    full_name = Column(String, nullable=False, index=True)
    gender = Column(Enum(Gender), nullable=False)
    date_of_birth = Column(Date, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(Text, nullable=True)

    # Detailed address (Indonesian format)
    rt_rw = Column(String, nullable=True)
    kelurahan = Column(String, nullable=True)
    kecamatan = Column(String, nullable=True)
    city = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)

    # Family
    family_id = Column(UUID(as_uuid=True), ForeignKey("families.id"), nullable=True)
    family_role = Column(String, nullable=True)

    # Mosque Role
    role = Column(Enum(JamaahRole), default=JamaahRole.JAMAAH, nullable=False, index=True)

    # Skills and Needs (PostgreSQL text arrays)
    skills = Column(ARRAY(String), nullable=True, default=list)
    needs = Column(ARRAY(String), nullable=True, default=list)

    # Background
    education_level = Column(String, nullable=True)
    occupation = Column(String, nullable=True)
    economic_status = Column(Enum(EconomicStatus), default=EconomicStatus.MENENGAH, nullable=True)
    health_status = Column(String, nullable=True, default="sehat")

    # SDM / Honorarium (for imam, muadzin, marbot)
    monthly_honorarium = Column(Numeric(15, 2), nullable=True, default=0)
    bank_account = Column(String, nullable=True)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    join_date = Column(Date, nullable=True, default=date.today)

    notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="jamaah_profile")
    family = relationship("Family", back_populates="members", foreign_keys=[family_id])
    zakat_fitrah = relationship("ZakatFitrah", back_populates="jamaah", cascade="all, delete-orphan")
    ziswaf_transactions = relationship("ZiswafTransaction", back_populates="jamaah")
    tags = relationship("JamaahTag", secondary=jamaah_tag_association, back_populates="jamaah_members")

    def __repr__(self):
        return f"<Jamaah {self.full_name}>"


class JamaahTag(Base):
    """Custom label/tag that can be assigned to multiple jamaah."""
    __tablename__ = "jamaah_tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, unique=True, index=True)
    color = Column(String, nullable=False, default="#6B7280")  # hex color

    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    jamaah_members = relationship("Jamaah", secondary=jamaah_tag_association, back_populates="tags")

    def __repr__(self):
        return f"<JamaahTag {self.name}>"


class Family(Base):
    """Family / household model."""
    __tablename__ = "families"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    family_name = Column(String, nullable=False)
    head_of_family_id = Column(UUID(as_uuid=True), ForeignKey("jamaah.id"), nullable=True)
    address = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    head_of_family = relationship("Jamaah", foreign_keys=[head_of_family_id], post_update=True)
    members = relationship("Jamaah", back_populates="family", foreign_keys=[Jamaah.family_id])

    def __repr__(self):
        return f"<Family {self.family_name}>"


class ZakatFitrah(Base):
    """Zakat Fitrah payment record per jamaah per year."""
    __tablename__ = "zakat_fitrah"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    jamaah_id = Column(UUID(as_uuid=True), ForeignKey("jamaah.id"), nullable=False, index=True)

    # Period
    year = Column(String(4), nullable=False, index=True)  # e.g. "2026"

    # Coverage
    jumlah_jiwa = Column(Integer, nullable=False, default=1)

    # Payment
    payment_type = Column(Enum(ZakatFitrahPaymentType), default=ZakatFitrahPaymentType.UANG, nullable=False)
    amount_beras_kg = Column(Numeric(10, 2), nullable=True)
    amount_uang = Column(Numeric(15, 2), nullable=True)
    rate_per_jiwa = Column(Numeric(15, 2), nullable=True)

    # Status
    is_paid = Column(Boolean, default=False, nullable=False)
    paid_at = Column(DateTime, nullable=True)

    notes = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    jamaah = relationship("Jamaah", back_populates="zakat_fitrah")
    creator = relationship("User", foreign_keys=[created_by])

    def __repr__(self):
        return f"<ZakatFitrah {self.jamaah_id} {self.year}>"
