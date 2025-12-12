# routes/EIS/education.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from routes.hospital import get_current_user
from database import get_tenant_engine
from models.models_tenant import EmployeeEducation
from schemas.schemas_tenant import EducationCreate, EducationOut


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


router = APIRouter(prefix="/employee/education", tags=["Employee Education Details"])


# -------------------------------------------------------------------------
# 1. ADD EDUCATION + OPTIONAL CERTIFICATE FILE
# -------------------------------------------------------------------------
@router.post("/add", response_model=EducationOut)
async def add_education(
    employee_id: int,
    degree: str,
    university: str = None,
    year: str = None,
    file: UploadFile = File(None),
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)

    file_bytes = None
    file_name = None

    if file:
        file_bytes = await file.read()
        file_name = file.filename

    new_record = EmployeeEducation(
        employee_id=employee_id,
        degree=degree,
        university=university,
        year=year,
        certificate=file_bytes,
        file_name=file_name
    )

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return new_record


# -------------------------------------------------------------------------
# 2. GET EDUCATION LIST FOR EMPLOYEE
# -------------------------------------------------------------------------
@router.get("/{employee_id}", response_model=List[EducationOut])
def get_education_list(employee_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    return (
        db.query(EmployeeEducation)
        .filter(EmployeeEducation.employee_id == employee_id)
        .order_by(EmployeeEducation.id.asc())
        .all()
    )


# -------------------------------------------------------------------------
# 3. UPDATE EDUCATION RECORD
# -------------------------------------------------------------------------
@router.put("/{education_id}", response_model=EducationOut)
async def update_education(
    education_id: int,
    degree: str,
    university: str = None,
    year: str = None,
    file: UploadFile = File(None),
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)

    edu = db.query(EmployeeEducation).filter(EmployeeEducation.id == education_id).first()
    if not edu:
        raise HTTPException(404, "Education record not found")

    # Update basic fields
    edu.degree = degree
    edu.university = university
    edu.year = year

    # If a file is uploaded → Replace existing certificate
    if file:
        edu.certificate = await file.read()
        edu.file_name = file.filename

    db.commit()
    db.refresh(edu)

    return edu


# -------------------------------------------------------------------------
# 4. DELETE EDUCATION RECORD
# -------------------------------------------------------------------------
@router.delete("/{education_id}")
def delete_education(education_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    edu = db.query(EmployeeEducation).filter(EmployeeEducation.id == education_id).first()
    if not edu:
        raise HTTPException(404, "Education record not found")

    db.delete(edu)
    db.commit()

    return {"message": "Education record deleted successfully"}
