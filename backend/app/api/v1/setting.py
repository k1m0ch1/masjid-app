from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict
from app.db.session import get_db
from app.models.setting import MosqueSetting
from app.api.v1.auth import require_module
from app.models.user import User

router = APIRouter()

DEFAULTS = {
    "mosque_name": "Masjid Al-Ikhlas",
    "mosque_address": "",
    "mosque_city": "",
    "mosque_province": "",
    "mosque_phone": "",
    "mosque_email": "",
    "mosque_website": "",
    "mosque_founded_year": "",
    "mosque_capacity": "",
    "mosque_area": "",
    "chairman_name": "",
    "secretary_name": "",
    "treasurer_name": "",
    "bank_name": "",
    "bank_account": "",
    "bank_account_name": "",
    "google_map_location": "",
    "notes": "",
}


@router.get("/settings")
def get_settings(db: Session = Depends(get_db), current_user: User = Depends(require_module("setting"))):
    rows = db.query(MosqueSetting).all()
    result = dict(DEFAULTS)
    for row in rows:
        result[row.key] = row.value or ""
    return result


@router.put("/settings")
def update_settings(data: Dict[str, str], db: Session = Depends(get_db), current_user: User = Depends(require_module("setting"))):
    for key, value in data.items():
        if key not in DEFAULTS:
            continue
        row = db.query(MosqueSetting).filter(MosqueSetting.key == key).first()
        if row:
            row.value = value
        else:
            db.add(MosqueSetting(key=key, value=value))
    db.commit()
    # Return updated settings
    rows = db.query(MosqueSetting).all()
    result = dict(DEFAULTS)
    for row in rows:
        result[row.key] = row.value or ""
    return result
