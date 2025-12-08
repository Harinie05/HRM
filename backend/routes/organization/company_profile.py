from fastapi import APIRouter, Header, HTTPException, Depends
from sqlalchemy.orm import Session

from database import get_tenant_engine, logger
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
    logger.info(f"Getting company profile for tenant {tenant} by user {user.get('email')}")
    try:
        engine = get_tenant_engine(tenant)
        db = Session(bind=engine)
        profile = db.query(CompanyProfile).first()

        if not profile:
            print("ℹ️ No profile found, returning {}")
            return {}

        return profile

    except Exception as e:
        logger.error(f"Error getting company profile for tenant {tenant}: {e}")
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
    logger.info(f"Saving company profile for tenant {tenant} by user {user.get('email')}")

    try:
        engine = get_tenant_engine(tenant)
        db = Session(bind=engine)

        profile = db.query(CompanyProfile).first()

        if profile:
            logger.info(f"Updating company profile for tenant {tenant}")
            for key, value in data.dict().items():
                setattr(profile, key, value)
        else:
            logger.info(f"Creating new company profile for tenant {tenant}")
            profile = CompanyProfile(**data.dict())
            db.add(profile)

        db.commit()
        db.refresh(profile)
        return profile

    except Exception as e:
        logger.error(f"Error saving company profile for tenant {tenant}: {e}")
        raise
