from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from datetime import datetime
from sqlalchemy.orm import Session

from app.api.v1.auth import get_supabase_client, require_admin
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from pydantic import ValidationError

from app.schemas.access_user import (
    DeleteUserResponse,
    InviteUserRequest,
    InviteUserResponse,
    UpdateUserAccessRequest,
    UserAccessResponse,
)

router = APIRouter()


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(
        func.lower(User.email) == _normalize_email(email),
        User.deleted_at.is_(None),
    ).first()


@router.get("/user-access", response_model=list[UserAccessResponse])
def list_user_access(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    users = db.query(User).filter(User.deleted_at.is_(None)).order_by(User.email.asc()).all()
    result: list[UserAccessResponse] = []
    for user in users:
        try:
            result.append(UserAccessResponse.model_validate(user))
        except ValidationError:
            continue
    return result


@router.post("/user-access/invite", response_model=InviteUserResponse)
def invite_user_access(
    payload: InviteUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    normalized_email = _normalize_email(payload.email)

    user = _get_user_by_email(db, normalized_email)
    if not user:
        user = User(
            email=normalized_email,
            full_name=payload.full_name or normalized_email,
            role=payload.role,
            is_active=True,
            is_verified=False,
            is_allowed=payload.is_allowed,
            allowed_modules=payload.allowed_modules,
        )
        db.add(user)
    else:
        user.full_name = payload.full_name or user.full_name or normalized_email
        user.role = payload.role
        user.is_allowed = payload.is_allowed
        user.allowed_modules = payload.allowed_modules

    db.commit()
    db.refresh(user)

    if not settings.SUPABASE_SERVICE_ROLE_KEY:
        return InviteUserResponse(
            user=UserAccessResponse.model_validate(user),
            invited=False,
            message="User disimpan, invite Supabase dilewati (SUPABASE_SERVICE_ROLE_KEY belum di-set)",
        )

    supabase_admin = get_supabase_client(use_service_role=True)
    invite_options = {}
    if settings.SUPABASE_INVITE_REDIRECT_URL:
        invite_options["redirect_to"] = settings.SUPABASE_INVITE_REDIRECT_URL

    try:
        supabase_admin.auth.admin.invite_user_by_email(normalized_email, invite_options)
        invited = True
        message = "User disimpan dan invite Supabase berhasil dikirim"
    except Exception as exc:
        invited = False
        message = f"User disimpan, tapi invite Supabase gagal: {exc}"

    return InviteUserResponse(
        user=UserAccessResponse.model_validate(user),
        invited=invited,
        message=message,
    )


@router.put("/user-access/{user_id}", response_model=UserAccessResponse)
def update_user_access(
    user_id: UUID,
    payload: UpdateUserAccessRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User tidak ditemukan",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return UserAccessResponse.model_validate(user)


@router.delete("/user-access/{user_id}", response_model=DeleteUserResponse)
@router.post("/user-access/{user_id}/delete", response_model=DeleteUserResponse)
@router.post("/user-access/{user_id}/remove", response_model=DeleteUserResponse)
@router.put("/user-access/{user_id}/remove", response_model=DeleteUserResponse)
def delete_user_access(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User tidak ditemukan",
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tidak bisa menghapus akun sendiri",
        )

    user.is_active = False
    user.is_allowed = False
    user.deleted_at = datetime.utcnow()
    db.commit()

    return DeleteUserResponse(
        message="User berhasil dihapus (soft delete). Data relasi tidak diubah.",
    )
