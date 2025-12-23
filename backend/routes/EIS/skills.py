# routes/EIS/skills.py

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List

from routes.hospital import get_current_user
from database import get_tenant_engine
from utils.audit_logger import audit_crud
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
def add_skill(data: SkillCreate, request: Request, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    try:
        new_skill = EmployeeSkills(
            employee_id=data.employee_id,
            skill_name=data.skill,
            rating=data.rating
        )

        db.add(new_skill)
        db.commit()
        db.refresh(new_skill)
        audit_crud(request, user.get("tenant_db"), user, "CREATE", "employee_skills", new_skill.id, None, new_skill.__dict__)

        # Convert to response format
        return SkillOut(
            id=getattr(new_skill, 'id'),
            employee_id=getattr(new_skill, 'employee_id'),
            skill=getattr(new_skill, 'skill_name'),
            rating=getattr(new_skill, 'rating')
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Failed to add skill: {str(e)}")
    finally:
        db.close()


# -------------------------------------------------------------------------
# 2. LIST SKILLS FOR EMPLOYEE
# -------------------------------------------------------------------------
@router.get("/{employee_id}", response_model=List[SkillOut])
def get_skills(employee_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    try:
        skills = (
            db.query(EmployeeSkills)
            .filter(EmployeeSkills.employee_id == employee_id)
            .order_by(EmployeeSkills.id.asc())
            .all()
        )
        
        return [
            SkillOut(
                id=getattr(skill, 'id'),
                employee_id=getattr(skill, 'employee_id'),
                skill=getattr(skill, 'skill_name'),
                rating=getattr(skill, 'rating')
            ) for skill in skills
        ]
    finally:
        db.close()


# -------------------------------------------------------------------------
# 3. UPDATE SKILL
# -------------------------------------------------------------------------
@router.put("/{skill_id}", response_model=SkillOut)
def update_skill(skill_id: int, data: SkillCreate, request: Request, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    try:
        sk = db.query(EmployeeSkills).filter(EmployeeSkills.id == skill_id).first()
        if not sk:
            raise HTTPException(404, "Skill not found")

        setattr(sk, 'skill_name', data.skill)
        setattr(sk, 'rating', data.rating)

        db.commit()
        db.refresh(sk)
        audit_crud(request, user.get("tenant_db"), user, "UPDATE", "employee_skills", skill_id, None, sk.__dict__)

        return SkillOut(
            id=getattr(sk, 'id'),
            employee_id=getattr(sk, 'employee_id'),
            skill=getattr(sk, 'skill_name'),
            rating=getattr(sk, 'rating')
        )
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Failed to update skill: {str(e)}")
    finally:
        db.close()


# -------------------------------------------------------------------------
# 4. DELETE SKILL
# -------------------------------------------------------------------------
@router.delete("/{skill_id}")
def delete_skill(skill_id: int, request: Request, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    try:
        sk = db.query(EmployeeSkills).filter(EmployeeSkills.id == skill_id).first()
        if not sk:
            raise HTTPException(404, "Skill not found")

        old_values = sk.__dict__.copy()
        db.delete(sk)
        db.commit()
        audit_crud(request, user.get("tenant_db"), user, "DELETE", "employee_skills", skill_id, old_values, None)

        return {"message": "Skill deleted successfully"}
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Failed to delete skill: {str(e)}")
    finally:
        db.close()
