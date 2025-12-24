from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_tenant_db
from utils.audit_logger import audit_crud
from pydantic import BaseModel
from typing import List, Union

from models.models_tenant import SalaryStructure
from schemas.schemas_tenant import (
    SalaryStructureCreate,
    SalaryStructureOut
)

class LinkEmployeesRequest(BaseModel):
    employee_ids: List[Union[str, int]]

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


@router.get("/")
def list_salary_structures(
    db: Session = Depends(get_tenant_db)
):
    # Use raw SQL to ensure we get the employee_ids column
    query = text("SELECT * FROM salary_structures")
    result = db.execute(query).fetchall()
    
    structures = []
    for row in result:
        structure_dict = {
            "id": row.id,
            "name": row.name,
            "ctc": row.ctc,
            "basic_percent": row.basic_percent,
            "hra_percent": row.hra_percent,
            "allowances": row.allowances,
            "deductions": row.deductions,
            "is_active": row.is_active,
            "created_at": row.created_at,
            "employee_ids": getattr(row, 'employee_ids', '') or ''
        }
        structures.append(structure_dict)
    
    return structures


@router.get("/{structure_id}", response_model=SalaryStructureOut)
def get_salary_structure(
    structure_id: int,
    db: Session = Depends(get_tenant_db)
):
    structure = db.query(SalaryStructure).filter(
        SalaryStructure.id == structure_id
    ).first()
    if not structure:
        raise HTTPException(status_code=404, detail="Salary structure not found")
    return structure


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

@router.post("/{structure_id}/link-employees")
def link_employees_to_structure(
    structure_id: int,
    data: LinkEmployeesRequest,
    db: Session = Depends(get_tenant_db)
):
    try:
        print(f"Linking employees to structure {structure_id}: {data.employee_ids}")
        employee_ids = data.employee_ids
        
        # Get the salary structure first
        structure = db.query(SalaryStructure).filter(SalaryStructure.id == structure_id).first()
        if not structure:
            raise HTTPException(status_code=404, detail="Salary structure not found")
        
        # Convert employee IDs to string and ensure uniqueness
        employee_ids_str = ','.join(map(str, set(employee_ids))) if employee_ids else ''
        print(f"Employee IDs string to save: {employee_ids_str}")
        
        # Update using raw SQL to ensure it works
        update_query = text("""
            UPDATE salary_structures 
            SET employee_ids = :employee_ids 
            WHERE id = :structure_id
        """)
        
        result = db.execute(update_query, {
            "employee_ids": employee_ids_str,
            "structure_id": structure_id
        })
        print(f"Update result: {result.rowcount} rows affected")
        
        # Verify the update
        verify_query = text("SELECT employee_ids FROM salary_structures WHERE id = :structure_id")
        verify_result = db.execute(verify_query, {"structure_id": structure_id}).fetchone()
        print(f"Verification - Stored employee_ids: {verify_result[0] if verify_result else 'None'}")
        
        db.commit()
        print("Database commit successful")
        
        return {"message": f"Linked {len(employee_ids)} employees to salary structure"}
    except Exception as e:
        print(f"Error linking employees: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

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