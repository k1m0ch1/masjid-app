from sqlalchemy import Column, String, Text
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base
import uuid


class MosqueSetting(Base):
    __tablename__ = "mosque_settings"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String, unique=True, nullable=False, index=True)
    value = Column(Text, nullable=True)
