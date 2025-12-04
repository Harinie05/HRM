from fastapi import APIRouter, Header, HTTPException, Depends
from sqlalchemy.orm import Session

from database import get_tenant_engine
from models.models_tenant import CompanyProfile

from schemas.schemas_tenant import (
    CompanyProfileBase,
    CompanyProfileResponse
)

# 🔐 added for authentication
from routes.hospital import get_current_user

router = APIRouter(prefix="/organization", tags=["Organization Setup"])


# ---------------------------------------------------
# GET COMPANY PROFILE 🔒 Protected
# ---------------------------------------------------
@router.get("/company-profile", response_model=CompanyProfileResponse | dict)
def get_company_profile(
    tenant: str = Header(...),
    user = Depends(get_current_user)    # 🔐 Token required
):
    print("🔍 GET /company-profile | Tenant:", tenant)
    try:
        engine = get_tenant_engine(tenant)
        db = Session(bind=engine)
        profile = db.query(CompanyProfile).first()

        if not profile:
            print("ℹ️ No profile found, returning {}")
            return {}

        return profile

    except Exception as e:
        print("❌ ERROR in GET /company-profile:", e)
        raise


# ---------------------------------------------------
# CREATE / UPDATE COMPANY PROFILE 🔒 Protected
# ---------------------------------------------------
@router.post("/company-profile", response_model=CompanyProfileResponse)
def save_company_profile(
    data: CompanyProfileBase,
    tenant: str = Header(...),
    user = Depends(get_current_user)    # 🔐 Token required
):
    print("🔍 POST /company-profile | Tenant:", tenant)
    print("📥 Incoming data:", data.dict())

    try:
        engine = get_tenant_engine(tenant)
        db = Session(bind=engine)

        profile = db.query(CompanyProfile).first()

        if profile:
            print("✏️ Updating profile")
            for key, value in data.dict().items():
                setattr(profile, key, value)
        else:
            print("➕ Creating new profile")
            profile = CompanyProfile(**data.dict())
            db.add(profile)

        db.commit()
        db.refresh(profile)
        return profile

    except Exception as e:
        print("❌ ERROR in POST /company-profile:", e)
        raise
