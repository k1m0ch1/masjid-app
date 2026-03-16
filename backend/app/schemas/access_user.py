from pydantic import BaseModel, EmailStr, UUID4, field_validator
from datetime import datetime
from typing import Optional
from app.models.user import UserRole, ALL_MODULES


class UserAccessResponse(BaseModel):
    id: UUID4
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    is_verified: bool
    is_allowed: bool
    allowed_modules: list[str]
    created_at: datetime
    last_login_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class InviteUserRequest(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole = UserRole.MEMBER
    is_allowed: bool = True
    allowed_modules: list[str]

    @field_validator("allowed_modules")
    @classmethod
    def validate_modules(cls, value: list[str]) -> list[str]:
        normalized = sorted(set(value))
        if not normalized:
            raise ValueError("allowed_modules tidak boleh kosong")
        invalid = [module for module in normalized if module not in ALL_MODULES]
        if invalid:
            raise ValueError(f"module tidak valid: {', '.join(invalid)}")
        return normalized


class UpdateUserAccessRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    is_allowed: Optional[bool] = None
    allowed_modules: Optional[list[str]] = None

    @field_validator("allowed_modules")
    @classmethod
    def validate_modules(cls, value: Optional[list[str]]) -> Optional[list[str]]:
        if value is None:
            return value
        normalized = sorted(set(value))
        invalid = [module for module in normalized if module not in ALL_MODULES]
        if invalid:
            raise ValueError(f"module tidak valid: {', '.join(invalid)}")
        return normalized


class InviteUserResponse(BaseModel):
    user: UserAccessResponse
    invited: bool
    message: str


class DeleteUserResponse(BaseModel):
    message: str
