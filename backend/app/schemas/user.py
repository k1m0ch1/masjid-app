from pydantic import BaseModel, EmailStr, UUID4
from datetime import datetime
from typing import Optional
from app.models.user import UserRole


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    full_name: str


class UserCreate(UserBase):
    """Schema for creating user."""
    google_id: str
    avatar_url: Optional[str] = None


class UserUpdate(BaseModel):
    """Schema for updating user."""
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Optional[UserRole] = None


class UserResponse(UserBase):
    """Schema for user response."""
    id: UUID4
    google_id: Optional[str]
    avatar_url: Optional[str]
    role: UserRole
    is_active: bool
    is_verified: bool
    is_allowed: bool
    allowed_modules: list[str]
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime]
    deleted_at: Optional[datetime]

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Schema for token response."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
