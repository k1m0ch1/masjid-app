from sqlalchemy import Column, String, Boolean, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from datetime import datetime
import uuid
import enum
from app.db.session import Base


class UserRole(str, enum.Enum):
    """User roles in the mosque management system."""
    ADMIN = "admin"
    PENGURUS = "pengurus"  # Board member
    BENDAHARA = "bendahara"  # Treasurer
    IMAM = "imam"
    MUADZIN = "muadzin"
    MEMBER = "member"  # Regular jamaah


class ModuleAccess(str, enum.Enum):
    DASHBOARD = "dashboard"
    JAMAAH = "jamaah"
    ZISWAF = "ziswaf"
    FINANCE = "finance"
    EVENTS = "events"
    PESAN_KIRIM = "pesan_kirim"
    SETTING = "setting"


ALL_MODULES = [module.value for module in ModuleAccess]


class User(Base):
    """User model for authentication and authorization."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    google_id = Column(String, unique=True, index=True)
    avatar_url = Column(String, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.MEMBER, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_allowed = Column(Boolean, default=False, nullable=False)
    allowed_modules = Column(ARRAY(String), nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)
    deleted_at = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<User {self.email}>"
