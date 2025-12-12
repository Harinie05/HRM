# routes/EIS/experience.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from routes.hospital import get_current_user
from database import get_tenant_engine
from models.models_tenant import EmployeeExperience
from schemas.schemas_tenant import ExperienceCreate, ExperienceOut


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


router = APIRouter(prefix="/employee/experience", tags=["Employee Experience Details"])


# -------------------------------------------------------------------------
# 1. ADD EXPERIENCE + RELIEVING LETTER (OPTIONAL FILE)
# -------------------------------------------------------------------------
@router.post("/add", response_model=ExperienceOut)
async def add_experience(
    employee_id: int,
    company: str,
    role: str,
    from_year: str,
    to_year: str | None = None,
    file: UploadFile = File(None),
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)

    file_bytes = None
    file_name = None

    if file:
        file_bytes = await file.read()
        file_name = file.filename

    new_exp = EmployeeExperience(
        employee_id=employee_id,
        company=company,
        role=role,
        from_year=from_year,
        to_year=to_year,
        relieving_doc=file_bytes,
        file_name=file_name
    )

    db.add(new_exp)
    db.commit()
    db.refresh(new_exp)

    return new_exp


# -------------------------------------------------------------------------
# 2. LIST EXPERIENCE RECORDS
# -------------------------------------------------------------------------
@router.get("/{employee_id}", response_model=List[ExperienceOut])
def get_experience_list(employee_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    return (
        db.query(EmployeeExperience)
        .filter(EmployeeExperience.employee_id == employee_id)
        .order_by(EmployeeExperience.id.asc())
        .all()
    )


# -------------------------------------------------------------------------
# 3. UPDATE EXPERIENCE RECORD
# -------------------------------------------------------------------------
@router.put("/{experience_id}", response_model=ExperienceOut)
async def update_experience(
    experience_id: int,
    company: str,
    role: str,
    from_year: str,
    to_year: str | None = None,
    file: UploadFile = File(None),
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)

    exp = db.query(EmployeeExperience).filter(EmployeeExperience.id == experience_id).first()
    if not exp:
        raise HTTPException(404, "Experience record not found")

    setattr(exp, 'company', company)
    setattr(exp, 'role', role)
    setattr(exp, 'from_year', from_year)
    setattr(exp, 'to_year', to_year)

    if file:
        setattr(exp, 'relieving_doc', await file.read())
        setattr(exp, 'file_name', file.filename)

    db.commit()
    db.refresh(exp)

    return exp


# -------------------------------------------------------------------------
# 4. DELETE EXPERIENCE RECORD
# -------------------------------------------------------------------------
@router.delete("/{experience_id}")
def delete_experience(experience_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    exp = db.query(EmployeeExperience).filter(EmployeeExperience.id == experience_id).first()
    if not exp:
        raise HTTPException(404, "Experience record not found")

    db.delete(exp)
    db.commit()

    return {"message": "Experience record deleted successfully"}
