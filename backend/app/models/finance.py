from sqlalchemy import Column, String, Numeric, DateTime, Enum, ForeignKey, Text, Date, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.db.session import Base


class TransactionType(str, enum.Enum):
    """Transaction type enum."""
    INCOME = "income"
    EXPENSE = "expense"


class Transaction(Base):
    """Financial transaction model."""
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Transaction Details
    transaction_type = Column(Enum(TransactionType), nullable=False, index=True)
    amount = Column(Numeric(15, 2), nullable=False)
    transaction_date = Column(Date, nullable=False, index=True, default=datetime.utcnow)

    # Income specific
    income_category = Column(String, nullable=True)
    donor_name = Column(String, nullable=True)
    donor_jamaah_id = Column(UUID(as_uuid=True), ForeignKey("jamaah.id"), nullable=True)

    # Expense specific
    expense_category = Column(String, nullable=True)
    vendor_name = Column(String, nullable=True)

    # Common fields
    payment_method = Column(String, default="cash")
    reference_number = Column(String, nullable=True)  # Invoice/receipt number
    description = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)

    # Attachments
    receipt_url = Column(String, nullable=True)

    # New fields
    is_anonymous = Column(Boolean, default=False)
    source_type = Column(String, nullable=True)   # e.g. 'ziswaf', 'zakat_fitrah', 'manual'
    source_id = Column(UUID(as_uuid=True), nullable=True)

    # Metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    donor = relationship("Jamaah", foreign_keys=[donor_jamaah_id])
    creator = relationship("User", foreign_keys=[created_by])
    approver = relationship("User", foreign_keys=[approved_by])

    def __repr__(self):
        return f"<Transaction {self.transaction_type} {self.amount}>"


class Budget(Base):
    """Budget planning model."""
    __tablename__ = "budgets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Budget Period
    year = Column(String(4), nullable=False)
    month = Column(String(2), nullable=True)  # Null for yearly budget

    # Budget Details
    category = Column(String, nullable=False)
    planned_amount = Column(Numeric(15, 2), nullable=False)
    description = Column(Text, nullable=True)

    # Metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator = relationship("User")

    def __repr__(self):
        period = f"{self.year}-{self.month}" if self.month else self.year
        return f"<Budget {period} {self.category}>"
