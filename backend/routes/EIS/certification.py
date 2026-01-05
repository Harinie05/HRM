# routes/EIS/certifications.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid

from routes.hospital import get_current_user
from database import get_tenant_engine
from utils.audit_logger import audit_crud
from models.models_tenant import EmployeeCertifications
from schemas.schemas_tenant import CertificationCreate, CertificationOut
from utils.permission import require_permission

# ---------------------- TENANT SESSION ----------------------
def get_tenant_session(user):
    from models.models_master import Hospital
    from database import get_master_db

    tenant_db = user.get("tenant_db")
    master = next(get_master_db())

    hospital = master.query(Hospital).filter(Hospital.db_name == tenant_db).first()
    if not hospital:
        raise HTTPException(404, "Tenant not found")

    engine = get_tenant_engine(hospital.db_name)
    return Session(bind=engine)

router = APIRouter(prefix="/employee/certifications", tags=["Employee Certifications"])

# -------------------------------------------------------------------------
# 1. ADD CERTIFICATION + OPTIONAL FILE
# -------------------------------------------------------------------------
@router.post("/add", response_model=None)
@require_permission("add_certifications_record")
async def add_certification(
    request: Request,
    employee_id: int = Form(...),
    name: str = Form(...),
    issued_by: Optional[str] = Form(None),
    expiry: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)
    try:
        file_path = None
        file_name = None

        if file:
            # Create uploads directory if it doesn't exist
            os.makedirs("uploads", exist_ok=True)
            
            # Generate unique filename
            filename = file.filename or 'unknown'
            file_extension = os.path.splitext(filename)[1]
            unique_filename = f"{uuid.uuid4()}_{filename}"
            file_path = f"uploads/{unique_filename}"
            
            # Save file to disk
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            file_name = filename

        cert = EmployeeCertifications(
            employee_id=employee_id,
            certification=name,
            issued_by=issued_by,
            expiry_date=expiry,
            certificate_file=file_path,
            file_name=file_name
        )

        db.add(cert)
        db.commit()
        db.refresh(cert)
        audit_crud(request, db, user, "CREATE", "employee_certifications", str(cert.id), {}, cert.__dict__)

        return cert
        
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Failed to add certification: {str(e)}")
    finally:
        db.close()

# -------------------------------------------------------------------------
# 2. LIST CERTIFICATIONS
# -------------------------------------------------------------------------
@router.get("/{employee_id}", response_model=None)
@require_permission("view_certifications")
def get_certifications(employee_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    return (
        db.query(EmployeeCertifications)
        .filter(EmployeeCertifications.employee_id == employee_id)
        .order_by(EmployeeCertifications.id.asc())
        .all()
    )

# -------------------------------------------------------------------------
# 3. UPDATE CERTIFICATION
# -------------------------------------------------------------------------
@router.put("/{cert_id}", response_model=None)
@require_permission("edit_certifications_record")
async def update_certification(
    request: Request,
    cert_id: int,
    name: str = Form(...),
    issued_by: Optional[str] = Form(None),
    expiry: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)

    cert = db.query(EmployeeCertifications).filter(EmployeeCertifications.id == cert_id).first()
    if not cert:
        raise HTTPException(404, "Certification not found")

    setattr(cert, 'certification', name)
    setattr(cert, 'issued_by', issued_by or '')
    setattr(cert, 'expiry_date', expiry)

    if file:
        # Create uploads directory if it doesn't exist
        os.makedirs("uploads", exist_ok=True)
        
        # Generate unique filename
        filename = file.filename or 'unknown'
        file_extension = os.path.splitext(filename)[1]
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = f"uploads/{unique_filename}"
        
        # Save file to disk
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        setattr(cert, 'certificate_file', file_path)
        setattr(cert, 'file_name', filename)

    db.commit()
    db.refresh(cert)
    audit_crud(request, db, user, "UPDATE", "employee_certifications", str(cert_id), {}, cert.__dict__)

    return {"message": "Certification updated successfully"}

# -------------------------------------------------------------------------
# 4. VIEW CERTIFICATION CERTIFICATE
# -------------------------------------------------------------------------
@router.get("/certificate/{cert_id}", response_model=None)
@require_permission("view_certifications_details")
def view_certificate(
    request: Request,
    cert_id: int, 
    token: str = Query(None)
):
    if not token:
        raise HTTPException(401, "Token required")
    
    from utils.token import verify_token
    user = verify_token(token)
    if not user:
        raise HTTPException(401, "Invalid or expired token")
    
    db = get_tenant_session(user)
    
    cert = db.query(EmployeeCertifications).filter(EmployeeCertifications.id == cert_id).first()
    if not cert or cert.certificate_file is None:
        raise HTTPException(404, "Certificate not found")
    
    file_path = getattr(cert, 'certificate_file', None)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(404, "File not found")
    
    # Audit log for certificate view
    audit_crud(request, db, user, "VIEW_EMPLOYEE_CERTIFICATE", "document_access", str(cert_id), {}, {
        "document_type": "certification",
        "file_name": getattr(cert, 'file_name', None),
        "employee_id": cert.employee_id
    })
    
    # Determine media type for inline viewing
    file_name = getattr(cert, 'file_name', None)
    file_ext = os.path.splitext(file_name)[1].lower() if file_name else ''
    
    if file_ext == '.pdf':
        media_type = 'application/pdf'
    elif file_ext in ['.jpg', '.jpeg']:
        media_type = 'image/jpeg'
    elif file_ext == '.png':
        media_type = 'image/png'
    else:
        media_type = 'application/octet-stream'
    
    return FileResponse(
        path=file_path,
        media_type=media_type,
        headers={"Content-Disposition": "inline"}
    )

# -------------------------------------------------------------------------
# 5. DELETE CERTIFICATION
# -------------------------------------------------------------------------
@router.delete("/{cert_id}", response_model=None)
@require_permission("delete_certifications_record")
def delete_certification(cert_id: int, request: Request, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    cert = db.query(EmployeeCertifications).filter(EmployeeCertifications.id == cert_id).first()
    if not cert:
        raise HTTPException(404, "Certification not found")

    old_values = cert.__dict__.copy()
    db.delete(cert)
    db.commit()
    audit_crud(request, user.get("tenant_db"), user, "DELETE", "employee_certifications", str(cert_id), old_values, {})

    return {"message": "Certification deleted successfully"}
