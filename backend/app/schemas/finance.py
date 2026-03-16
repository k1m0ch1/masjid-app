from pydantic import BaseModel, UUID4, condecimal
from datetime import datetime, date
from typing import Optional
from decimal import Decimal
from app.models.finance import TransactionType


class TransactionBase(BaseModel):
    """Base transaction schema."""
    transaction_type: TransactionType
    amount: condecimal(max_digits=15, decimal_places=2)
    transaction_date: date
    payment_method: Optional[str] = "cash"
    description: str
    notes: Optional[str] = None
    reference_number: Optional[str] = None
    receipt_url: Optional[str] = None


class IncomeCreate(TransactionBase):
    """Schema for creating income."""
    transaction_type: TransactionType = TransactionType.INCOME
    income_category: Optional[str] = None
    donor_name: Optional[str] = None
    donor_jamaah_id: Optional[UUID4] = None
    is_anonymous: bool = False


class ExpenseCreate(TransactionBase):
    """Schema for creating expense."""
    transaction_type: TransactionType = TransactionType.EXPENSE
    expense_category: Optional[str] = None
    vendor_name: Optional[str] = None


class TransactionCreate(BaseModel):
    """Unified schema for creating any transaction."""
    transaction_type: TransactionType
    amount: condecimal(max_digits=15, decimal_places=2)
    transaction_date: date
    payment_method: Optional[str] = "cash"
    description: str
    notes: Optional[str] = None
    reference_number: Optional[str] = None
    receipt_url: Optional[str] = None
    # Income fields
    income_category: Optional[str] = None
    donor_name: Optional[str] = None
    donor_jamaah_id: Optional[UUID4] = None
    is_anonymous: bool = False
    # Expense fields
    expense_category: Optional[str] = None
    vendor_name: Optional[str] = None


class TransactionUpdate(BaseModel):
    """Schema for updating transaction."""
    amount: Optional[condecimal(max_digits=15, decimal_places=2)] = None
    transaction_date: Optional[date] = None
    income_category: Optional[str] = None
    expense_category: Optional[str] = None
    donor_name: Optional[str] = None
    vendor_name: Optional[str] = None
    payment_method: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    reference_number: Optional[str] = None
    receipt_url: Optional[str] = None
    is_anonymous: Optional[bool] = None


class TransactionResponse(BaseModel):
    """Schema for transaction response."""
    id: UUID4
    transaction_type: TransactionType
    amount: Decimal
    transaction_date: date
    income_category: Optional[str]
    expense_category: Optional[str]
    donor_name: Optional[str]
    donor_jamaah_id: Optional[UUID4]
    vendor_name: Optional[str]
    payment_method: Optional[str]
    reference_number: Optional[str]
    description: str
    notes: Optional[str]
    receipt_url: Optional[str]
    is_anonymous: Optional[bool]
    source_type: Optional[str]
    source_id: Optional[UUID4]
    created_by: UUID4
    approved_by: Optional[UUID4]
    approved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BudgetBase(BaseModel):
    """Base budget schema."""
    year: str
    month: Optional[str] = None
    category: str
    planned_amount: condecimal(max_digits=15, decimal_places=2)
    description: Optional[str] = None


class BudgetCreate(BudgetBase):
    """Schema for creating budget."""
    pass


class BudgetUpdate(BaseModel):
    """Schema for updating budget."""
    planned_amount: Optional[condecimal(max_digits=15, decimal_places=2)] = None
    description: Optional[str] = None


class BudgetResponse(BudgetBase):
    """Schema for budget response."""
    id: UUID4
    created_by: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FinancialSummary(BaseModel):
    """Schema for financial summary."""
    total_income: Decimal
    total_expense: Decimal
    balance: Decimal
    period_start: date
    period_end: date
