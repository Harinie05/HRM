from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List

from database import get_master_db, get_tenant_engine, logger
from utils.audit_logger import audit_crud
from models.models_master import Hospital
from models.models_tenant import Grade
from schemas.schemas_tenant import GradeCreate, GradeOut, GradeUpdate
from routes.hospital import get_current_user

router = APIRouter(prefix="/grades", tags=["Grade / Pay Structure"])

def get_tenant_session(user):
    tenant_db = user.get("tenant_db")
    master_db = next(get_master_db())
    hospital = master_db.query(Hospital).filter(Hospital.db_name == tenant_db).first()
    if not hospital:
        raise HTTPException(404, "Hospital not found")
    engine = get_tenant_engine(str(hospital.db_name))
    return Session(bind=engine)

# -------------------------------------------
# CREATE GRADE
# -------------------------------------------
@router.post("/", response_model=GradeOut)
def create_grade(data: GradeCreate, request: Request, user = Depends(get_current_user)):
    db = get_tenant_session(user)
    logger.info(f"[GRADE CREATE] Request received for code: {data.code}")

    # Check duplicate grade code
    exists = db.query(Grade).filter(Grade.code == data.code).first()
    if exists:
        logger.warning(f"[GRADE CREATE] Grade code already exists: {data.code}")
        raise HTTPException(status_code=400, detail="Grade code already exists")

    # Validate % must total 100
    total = data.basic_percent + data.hra_percent + data.allowance_percent + data.special_percent
    if total != 100:
        logger.error("[GRADE CREATE] Salary component % must total 100")
        raise HTTPException(status_code=400, detail="Salary component % must total 100")

    grade = Grade(**data.dict())
    db.add(grade)
    db.commit()
    db.refresh(grade)
    audit_crud(request, user.get("tenant_db"), user, "CREATE", "grades", grade.id, None, grade.__dict__)

    logger.info(f"[GRADE CREATED] Grade '{data.name}' created successfully")
    return grade


# -------------------------------------------
# GET ALL GRADES
# -------------------------------------------
@router.get("/", response_model=List[GradeOut])
def get_grades(user = Depends(get_current_user)):
    db = get_tenant_session(user)
    logger.info("[GRADE FETCH] Fetching all grades")
    return db.query(Grade).all()


# -------------------------------------------
# GET SINGLE GRADE
# -------------------------------------------
@router.get("/{grade_id}", response_model=GradeOut)
def get_grade_by_id(grade_id: int, user = Depends(get_current_user)):
    db = get_tenant_session(user)
    logger.info(f"[GRADE FETCH] Fetch grade id: {grade_id}")
    grade = db.query(Grade).filter(Grade.id == grade_id).first()

    if not grade:
        logger.error(f"[GRADE FETCH] Grade not found id={grade_id}")
        raise HTTPException(status_code=404, detail="Grade not found")

    return grade


# -------------------------------------------
# UPDATE GRADE
# -------------------------------------------
@router.put("/{grade_id}", response_model=GradeOut)
def update_grade(grade_id: int, data: GradeUpdate, request: Request, user = Depends(get_current_user)):
    db = get_tenant_session(user)
    logger.info(f"[GRADE UPDATE] Request for grade id: {grade_id}")

    grade = db.query(Grade).filter(Grade.id == grade_id).first()

    if not grade:
        logger.error("[GRADE UPDATE] Grade not found")
        raise HTTPException(status_code=404, detail="Grade not found")

    old_values = grade.__dict__.copy()
    for key, value in data.dict(exclude_unset=True).items():
        setattr(grade, key, value)

    db.commit()
    db.refresh(grade)
    audit_crud(request, user.get("tenant_db"), user, "UPDATE", "grades", grade.id, old_values, grade.__dict__)

    logger.info(f"[GRADE UPDATED] Grade updated id={grade_id}")
    return grade


# -------------------------------------------
# DELETE GRADE
# -------------------------------------------
@router.delete("/{grade_id}")
def delete_grade(grade_id: int, request: Request, user = Depends(get_current_user)):
    db = get_tenant_session(user)
    logger.info(f"[GRADE DELETE] requested id={grade_id}")

    grade = db.query(Grade).filter(Grade.id == grade_id).first()

    if not grade:
        logger.error("[GRADE DELETE] Grade not found")
        raise HTTPException(status_code=404, detail="Grade not found")

    old_values = grade.__dict__.copy()
    db.delete(grade)
    db.commit()
    audit_crud(request, user.get("tenant_db"), user, "DELETE", "grades", grade_id, old_values, None)

    logger.info(f"[GRADE DELETED] id={grade_id}")
    return {"message": "Grade deleted successfully"}
