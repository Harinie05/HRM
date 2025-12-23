from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from utils.audit_logger import audit_crud

from models.models_tenant import SalaryStructure
from schemas.schemas_tenant import (
    SalaryStructureCreate,
    SalaryStructureOut
)

router = APIRouter(
    prefix="/payroll/salary-structures",
    tags=["Payroll - Salary Structure"]
)


@router.post("/", response_model=SalaryStructureOut)
def create_salary_structure(
    data: SalaryStructureCreate,
    request: Request,
    db: Session = Depends(get_tenant_db)
):
    structure = SalaryStructure(**data.dict())
    db.add(structure)
    db.commit()
    db.refresh(structure)
    audit_crud(request, "tenant_db", {"email": "system"}, "CREATE", "salary_structures", structure.id, None, structure.__dict__)
    return structure


@router.get("/", response_model=list[SalaryStructureOut])
def list_salary_structures(
    db: Session = Depends(get_tenant_db)
):
    return db.query(SalaryStructure).all()


@router.get("/{structure_id}", response_model=SalaryStructureOut)
def get_salary_structure(
    structure_id: int,
    db: Session = Depends(get_tenant_db)
):
    return db.query(SalaryStructure).filter(
        SalaryStructure.id == structure_id
    ).first()


@router.put("/{structure_id}")
def update_salary_structure(
    structure_id: int,
    data: SalaryStructureCreate,
    request: Request,
    db: Session = Depends(get_tenant_db)
):
    structure = db.query(SalaryStructure).filter(
        SalaryStructure.id == structure_id
    ).first()
    if not structure:
        raise HTTPException(status_code=404, detail="Salary structure not found")
    
    try:
        for key, value in data.dict().items():
            setattr(structure, key, value)
        db.commit()
        db.refresh(structure)
        audit_crud(request, "tenant_db", {"email": "system"}, "UPDATE", "salary_structures", structure_id, None, structure.__dict__)
        return structure
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating salary structure: {str(e)}")

@router.delete("/{structure_id}")
def delete_salary_structure(
    structure_id: int,
    request: Request,
    db: Session = Depends(get_tenant_db)
):
    structure = db.query(SalaryStructure).filter(
        SalaryStructure.id == structure_id
    ).first()
    if not structure:
        raise HTTPException(status_code=404, detail="Salary structure not found")

    try:
        old_values = structure.__dict__.copy()
        db.delete(structure)
        db.commit()
        audit_crud(request, "tenant_db", {"email": "system"}, "DELETE", "salary_structures", structure_id, old_values, None)
        return {"message": "Salary structure deleted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting salary structure: {str(e)}")
