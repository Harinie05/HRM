from fastapi import APIRouter, Header, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from utils.audit_logger import audit_crud
import os
import base64
import uuid
from PIL import Image
import io

from database import get_tenant_engine, logger
from models.models_tenant import OrganizationBranding

from schemas.schemas_tenant import (
    OrganizationBrandingCreate,
    OrganizationBrandingResponse
)

from utils.permission import require_permission

router = APIRouter(prefix="/organization", tags=["Organization Branding"])

def save_logo_file(base64_data, filename=None):
    """Save base64 logo data as a file and return the file path"""
    try:
        if not base64_data:
            return None
        
        # Remove data URL prefix if present
        if base64_data.startswith('data:image'):
            base64_data = base64_data.split(',')[1]
        
        # Create uploads directory if it doesn't exist
        upload_dir = "uploads/logos"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        file_path = os.path.join(upload_dir, f"{file_id}.png")
        
        # Decode and save the image
        image_data = base64.b64decode(base64_data)
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode in ('RGBA', 'LA', 'P'):
            image = image.convert('RGB')
        
        # Save the image
        image.save(file_path, format='PNG', optimize=True, quality=85)
        
        logger.info(f"Logo saved to: {file_path}")
        return file_path
        
    except Exception as e:
        logger.error(f"Error saving logo file: {e}")
        return None

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
        
        # Handle logo file storage
        logo_path = None
        if data.logo and data.logo.startswith('data:image'):
            logger.info("Converting base64 logo to file")
            logo_path = save_logo_file(data.logo, data.logo_filename)
            if logo_path:
                # Delete old logo file if exists
                if branding and branding.logo_path and os.path.exists(branding.logo_path):
                    try:
                        os.remove(branding.logo_path)
                        logger.info(f"Deleted old logo file: {branding.logo_path}")
                    except Exception as e:
                        logger.warning(f"Could not delete old logo file: {e}")
        elif branding and branding.logo_path:
            # Keep existing logo path if no new logo provided
            logo_path = branding.logo_path

        if branding:
            logger.info(f"Updating organization branding for tenant {tenant}")
            old_values = {key: getattr(branding, key) for key in data.dict().keys()}
            for key, value in data.dict().items():
                if key != 'logo':  # Don't store base64 in database
                    setattr(branding, key, value)
            
            # Set logo path instead of base64 data
            if logo_path:
                branding.logo_path = logo_path
                branding.logo = None  # Clear base64 data
            
            audit_crud(request, db, user, "UPDATE_ORGANIZATION_BRANDING", "organization_branding", str(branding.id), old_values, data.dict())
        else:
            logger.info(f"Creating new organization branding for tenant {tenant}")
            branding_data = data.dict()
            branding_data['logo'] = None  # Don't store base64
            branding_data['logo_path'] = logo_path  # Store file path
            
            branding = OrganizationBranding(**branding_data)
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