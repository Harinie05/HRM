from fastapi import APIRouter, Header, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from utils.audit_logger import audit_crud

from database import get_tenant_engine, logger
from models.models_tenant import OrganizationBranding

from schemas.schemas_tenant import (
    OrganizationBrandingCreate,
    OrganizationBrandingResponse
)

from utils.permission import require_permission

router = APIRouter(prefix="/organization", tags=["Organization Branding"])

# ---------------------------------------------------
# GET ORGANIZATION BRANDING 🔒 Protected
# ---------------------------------------------------
@router.get("/branding", response_model=OrganizationBrandingResponse | dict)
def get_organization_branding(
    tenant: str = Header(...),
    user = Depends(require_permission("view_organization_branding"))
):
    logger.info(f"Getting organization branding for tenant {tenant} by user {user.get('email')}")
    try:
        engine = get_tenant_engine(tenant)
        db = Session(bind=engine)
        branding = db.query(OrganizationBranding).first()

        if not branding:
            return {}

        return branding

    except Exception as e:
        logger.error(f"Error getting organization branding for tenant {tenant}: {e}")
        raise

# ---------------------------------------------------
# CREATE / UPDATE ORGANIZATION BRANDING 🔒 Protected
# ---------------------------------------------------
@router.post("/branding", response_model=OrganizationBrandingResponse)
def save_organization_branding(
    data: OrganizationBrandingCreate,
    request: Request,
    tenant: str = Header(...),
    user = Depends(require_permission("add_organization_branding"))
):
    logger.info(f"Saving organization branding for tenant {tenant} by user {user.get('email')}")

    try:
        engine = get_tenant_engine(tenant)
        db = Session(bind=engine)

        branding = db.query(OrganizationBranding).first()

        if branding:
            logger.info(f"Updating organization branding for tenant {tenant}")
            old_values = {key: getattr(branding, key) for key in data.dict().keys()}
            for key, value in data.dict().items():
                setattr(branding, key, value)
            audit_crud(request, db, user, "UPDATE_ORGANIZATION_BRANDING", "organization_branding", str(branding.id), old_values, data.dict())
        else:
            logger.info(f"Creating new organization branding for tenant {tenant}")
            branding = OrganizationBranding(**data.dict())
            db.add(branding)
            db.commit()
            db.refresh(branding)
            audit_crud(request, db, user, "CREATE_ORGANIZATION_BRANDING", "organization_branding", str(branding.id), {}, data.dict())

        db.commit()
        db.refresh(branding)
        return branding

    except Exception as e:
        logger.error(f"Error saving organization branding for tenant {tenant}: {e}")
        raise