# routes/EIS/family.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from routes.hospital import get_current_user
from database import get_tenant_engine
from models.models_tenant import EmployeeFamily
from schemas.schemas_tenant import FamilyCreate, FamilyOut


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


router = APIRouter(prefix="/employee/family", tags=["Employee Family Details"])


# -------------------------------------------------------------------------
# 1. ADD FAMILY MEMBER
# -------------------------------------------------------------------------
@router.post("/add", response_model=FamilyOut)
def add_family_member(data: FamilyCreate, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    try:
        new_member = EmployeeFamily(
            employee_id=data.employee_id,
            name=data.name,
            relationship=data.relationship,
            age=data.age,
            contact=data.contact,
            dependent=data.dependent
        )

        db.add(new_member)
        db.commit()
        db.refresh(new_member)

        return new_member
        
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Failed to add family member: {str(e)}")
    finally:
        db.close()


# -------------------------------------------------------------------------
# 2. GET FAMILY DETAILS FOR EMPLOYEE
# -------------------------------------------------------------------------
@router.get("/{employee_id}", response_model=List[FamilyOut])
def get_family_list(employee_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    try:
        return (
            db.query(EmployeeFamily)
            .filter(EmployeeFamily.employee_id == employee_id)
            .order_by(EmployeeFamily.id.asc())
            .all()
        )
    finally:
        db.close()


# -------------------------------------------------------------------------
# 3. UPDATE FAMILY MEMBER
# -------------------------------------------------------------------------
@router.put("/{family_id}", response_model=FamilyOut)
def update_family_member(family_id: int, data: FamilyCreate, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    try:
        member = db.query(EmployeeFamily).filter(EmployeeFamily.id == family_id).first()
        if not member:
            raise HTTPException(404, "Family member not found")

        setattr(member, 'name', data.name)
        setattr(member, 'relationship', data.relationship)
        setattr(member, 'age', data.age)
        setattr(member, 'contact', data.contact)
        setattr(member, 'dependent', data.dependent)

        db.commit()
        db.refresh(member)

        return member
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Failed to update family member: {str(e)}")
    finally:
        db.close()


# -------------------------------------------------------------------------
# 4. DELETE FAMILY MEMBER
# -------------------------------------------------------------------------
@router.delete("/{family_id}")
def delete_family_member(family_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    try:
        member = db.query(EmployeeFamily).filter(EmployeeFamily.id == family_id).first()
        if not member:
            raise HTTPException(404, "Family member not found")

        db.delete(member)
        db.commit()

        return {"message": "Family member removed successfully"}
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Failed to delete family member: {str(e)}")
    finally:
        db.close()
