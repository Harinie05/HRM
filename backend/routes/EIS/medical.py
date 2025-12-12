# routes/EIS/medical.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from routes.hospital import get_current_user
from database import get_tenant_engine
from models.models_tenant import EmployeeMedical
from schemas.schemas_tenant import MedicalCreate, MedicalOut


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


router = APIRouter(prefix="/employee/medical", tags=["Employee Medical Details"])


# -------------------------------------------------------------------------
# 1. ADD MEDICAL DETAILS (with optional certificate)
# -------------------------------------------------------------------------
@router.post("/add", response_model=MedicalOut)
async def add_medical(
    employee_id: int,
    blood_group: str,
    remarks: str | None = None,
    file: UploadFile = File(None),
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)

    file_bytes = None
    file_name = None

    if file:
        file_bytes = await file.read()
        file_name = file.filename

    med = EmployeeMedical(
        employee_id=employee_id,
        blood_group=blood_group,
        remarks=remarks,
        medical_certificate=file_bytes,
        certificate_name=file_name
    )

    db.add(med)
    db.commit()
    db.refresh(med)

    return med


# -------------------------------------------------------------------------
# 2. GET MEDICAL DETAILS
# -------------------------------------------------------------------------
@router.get("/{employee_id}", response_model=MedicalOut)
def get_medical(employee_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    med = db.query(EmployeeMedical).filter(EmployeeMedical.employee_id == employee_id).first()
    if not med:
        raise HTTPException(404, "No medical details found")

    return med


# -------------------------------------------------------------------------
# 3. UPDATE MEDICAL DETAILS
# -------------------------------------------------------------------------
@router.put("/{employee_id}", response_model=MedicalOut)
async def update_medical(
    employee_id: int,
    blood_group: str,
    remarks: str | None = None,
    file: UploadFile = File(None),
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)

    med = db.query(EmployeeMedical).filter(EmployeeMedical.employee_id == employee_id).first()
    if not med:
        raise HTTPException(404, "Medical record not found")

    setattr(med, 'blood_group', blood_group)
    setattr(med, 'remarks', remarks or '')

    if file:
        setattr(med, 'medical_certificate', await file.read())
        setattr(med, 'certificate_name', file.filename)

    db.commit()
    db.refresh(med)

    return med


# -------------------------------------------------------------------------
# 4. DELETE MEDICAL RECORD (optional — but useful)
# -------------------------------------------------------------------------
@router.delete("/{employee_id}")
def delete_medical(employee_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    med = db.query(EmployeeMedical).filter(EmployeeMedical.employee_id == employee_id).first()
    if not med:
        raise HTTPException(404, "Medical record not found")

    db.delete(med)
    db.commit()

    return {"message": "Medical record removed successfully"}
