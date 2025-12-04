from fastapi import APIRouter, Header, HTTPException, Depends
from sqlalchemy.orm import Session

from database import get_tenant_engine
from models.models_tenant import Shift
from schemas.schemas_tenant import ShiftCreate, ShiftResponse

# 🔐 added for login protection
from routes.hospital import get_current_user

router = APIRouter(prefix="/shifts", tags=["Shifts"])


# ------------------------------
# CREATE SHIFT 🔒 Protected
# ------------------------------
@router.post("/{tenant}/create", response_model=ShiftResponse)
def create_shift(
    tenant: str,
    payload: ShiftCreate,
    user = Depends(get_current_user)  # 🔐 Token required
):
    try:
        engine = get_tenant_engine(tenant)
        db = Session(bind=engine)

        new_shift = Shift(
            name=payload.name,
            start_time=payload.start_time,
            end_time=payload.end_time
        )

        db.add(new_shift)
        db.commit()
        db.refresh(new_shift)

        return new_shift

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------
# LIST SHIFTS 🔒 Protected
# ------------------------------
@router.get("/{tenant}/list")
def list_shifts(
    tenant: str,
    user = Depends(get_current_user)  # 🔐 Token required
):
    try:
        engine = get_tenant_engine(tenant)
        db = Session(bind=engine)

        shifts = db.query(Shift).all()
        return {"shifts": shifts}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
