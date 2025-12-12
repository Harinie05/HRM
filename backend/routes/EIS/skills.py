# routes/EIS/skills.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from routes.hospital import get_current_user
from database import get_tenant_engine
from models.models_tenant import EmployeeSkills
from schemas.schemas_tenant import SkillCreate, SkillOut


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


router = APIRouter(prefix="/employee/skills", tags=["Employee Skills & Competencies"])


# -------------------------------------------------------------------------
# 1. ADD SKILL
# -------------------------------------------------------------------------
@router.post("/add", response_model=SkillOut)
def add_skill(data: SkillCreate, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    new_skill = EmployeeSkills(
        employee_id=data.employee_id,
        skill_name=data.skill,
        rating=data.rating  # Rating: 1–5 stars
    )

    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)

    return new_skill


# -------------------------------------------------------------------------
# 2. LIST SKILLS FOR EMPLOYEE
# -------------------------------------------------------------------------
@router.get("/{employee_id}", response_model=List[SkillOut])
def get_skills(employee_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    return (
        db.query(EmployeeSkills)
        .filter(EmployeeSkills.employee_id == employee_id)
        .order_by(EmployeeSkills.id.asc())
        .all()
    )


# -------------------------------------------------------------------------
# 3. UPDATE SKILL
# -------------------------------------------------------------------------
@router.put("/{skill_id}", response_model=SkillOut)
def update_skill(skill_id: int, data: SkillCreate, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    sk = db.query(EmployeeSkills).filter(EmployeeSkills.id == skill_id).first()
    if not sk:
        raise HTTPException(404, "Skill not found")

    setattr(sk, 'skill_name', data.skill)
    setattr(sk, 'rating', data.rating)

    db.commit()
    db.refresh(sk)

    return sk


# -------------------------------------------------------------------------
# 4. DELETE SKILL
# -------------------------------------------------------------------------
@router.delete("/{skill_id}")
def delete_skill(skill_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    sk = db.query(EmployeeSkills).filter(EmployeeSkills.id == skill_id).first()
    if not sk:
        raise HTTPException(404, "Skill not found")

    db.delete(sk)
    db.commit()

    return {"message": "Skill deleted successfully"}
