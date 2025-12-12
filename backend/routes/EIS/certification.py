# routes/EIS/certifications.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from routes.hospital import get_current_user
from database import get_tenant_engine
from models.models_tenant import EmployeeCertifications
from schemas.schemas_tenant import CertificationCreate, CertificationOut


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
@router.post("/add", response_model=CertificationOut)
async def add_certification(
    employee_id: int,
    name: str,
    issued_by: str = None,
    expiry: str = None,
    file: UploadFile = File(None),
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)

    file_bytes = None
    file_name = None

    if file:
        file_bytes = await file.read()
        file_name = file.filename

    cert = EmployeeCertifications(
        employee_id=employee_id,
        certification=name,
        issued_by=issued_by,
        expiry_date=expiry,
        certificate_file=file_bytes,
        file_name=file_name
    )

    db.add(cert)
    db.commit()
    db.refresh(cert)

    return cert


# -------------------------------------------------------------------------
# 2. LIST CERTIFICATIONS
# -------------------------------------------------------------------------
@router.get("/{employee_id}", response_model=List[CertificationOut])
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
@router.put("/{cert_id}", response_model=CertificationOut)
async def update_certification(
    cert_id: int,
    name: str,
    issued_by: str = None,
    expiry: str = None,
    file: UploadFile = File(None),
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)

    cert = db.query(EmployeeCertifications).filter(EmployeeCertifications.id == cert_id).first()
    if not cert:
        raise HTTPException(404, "Certification not found")

    cert.certification = name
    cert.issued_by = issued_by
    cert.expiry_date = expiry

    if file:
        cert.certificate_file = await file.read()
        cert.file_name = file.filename

    db.commit()
    db.refresh(cert)

    return cert


# -------------------------------------------------------------------------
# 4. DELETE CERTIFICATION
# -------------------------------------------------------------------------
@router.delete("/{cert_id}")
def delete_certification(cert_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    cert = db.query(EmployeeCertifications).filter(EmployeeCertifications.id == cert_id).first()
    if not cert:
        raise HTTPException(404, "Certification not found")

    db.delete(cert)
    db.commit()

    return {"message": "Certification deleted successfully"}
