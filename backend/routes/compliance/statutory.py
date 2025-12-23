from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from models.models_tenant import EmployeeStatutory, User
from schemas.schemas_tenant import StatutoryCreate
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user

router = APIRouter(prefix="/compliance/statutory", tags=["Compliance"])

class StatutoryDeductionRequest(BaseModel):
    employee_id: str
    employee_name: str
    basic_salary: float
    gross_salary: float
    pf_enabled: bool = True
    pf_percentage: float = 12.0
    esi_enabled: bool = True
    esi_percentage: float = 1.75
    pt_enabled: bool = True
    pt_amount: float = 200.0
    tds_enabled: bool = False
    tds_percentage: float = 10.0
    month: Optional[str] = None
    year: Optional[int] = None
    department: Optional[str] = None
    designation: Optional[str] = None

@router.post("/calculate")
def calculate_statutory(data: StatutoryDeductionRequest, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        # Calculate deductions
        pf_employee = data.basic_salary * (data.pf_percentage / 100) if data.pf_enabled else 0
        pf_employer = pf_employee
        
        esi_employee = data.gross_salary * (data.esi_percentage / 100) if data.esi_enabled else 0
        esi_employer = esi_employee * 3.25 / 1.75
        
        pt_amount = data.pt_amount if data.pt_enabled else 0
        
        # Use current month/year if not provided
        current_date = datetime.now()
        month = data.month or str(current_date.month).zfill(2)
        year = data.year or current_date.year
        
        # Find user by employee_code, fallback to creating with raw employee_id
        user = db.query(User).filter(User.employee_code == data.employee_id).first()
        employee_id = user.id if user else int(data.employee_id) if data.employee_id.isdigit() else None
        
        if not employee_id:
            raise HTTPException(status_code=404, detail=f"Employee with code {data.employee_id} not found")
        
        record = EmployeeStatutory(
            employee_id=employee_id,
            month=month,
            year=year,
            basic_salary=data.basic_salary,
            pf_employee=pf_employee,
            pf_employer=pf_employer,
            esi_employee=esi_employee,
            esi_employer=esi_employer,
            professional_tax=pt_amount
        )
        
        db.add(record)
        db.commit()
        db.refresh(record)
        
        # Audit log
        audit_crud(request, "tenant", user, "CREATE_STATUTORY_CALCULATION", "employee_statutory", str(record.id), None, data.dict())
        
        return {
            "message": "Statutory deductions calculated and saved successfully",
            "data": {
                "employee_id": data.employee_id,
                "employee_name": data.employee_name,
                "pf_employee": round(pf_employee, 2),
                "esi_employee": round(esi_employee, 2),
                "professional_tax": round(pt_amount, 2),
                "total_deductions": round(pf_employee + esi_employee + pt_amount, 2),
                "month": month,
                "year": year
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/")
def get_statutory_calculations(db: Session = Depends(get_tenant_db)):
    try:
        # Get all statutory records
        records = db.query(EmployeeStatutory).order_by(EmployeeStatutory.created_at.desc()).limit(50).all()
        
        result = []
        for record in records:
            # Try to find user by ID first, then by employee_code matching the stored employee_id
            user = db.query(User).filter(User.id == record.employee_id).first()
            if not user:
                user = db.query(User).filter(User.employee_code == str(record.employee_id)).first()
            
            result.append({
                "id": record.id,
                "employee_id": user.employee_code if user and user.employee_code else str(record.employee_id),
                "employee_name": user.name if user else f"Employee {record.employee_id}",
                "basic_salary": record.basic_salary,
                "pf_amount": record.pf_employee,
                "esi_amount": record.esi_employee,
                "pt_amount": record.professional_tax,
                "tds_amount": 0,
                "total_deductions": record.pf_employee + record.esi_employee + record.professional_tax,
                "month": record.month,
                "year": record.year
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.put("/{record_id}")
def update_statutory_calculation(record_id: int, data: StatutoryDeductionRequest, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        record = db.query(EmployeeStatutory).filter(EmployeeStatutory.id == record_id).first()
        if not record:
            raise HTTPException(status_code=404, detail="Record not found")
        
        # Store old values for audit
        old_values = {"employee_id": record.employee_id, "basic_salary": record.basic_salary, "pf_employee": record.pf_employee}
        
        # Find user by employee_code, fallback to raw employee_id
        user = db.query(User).filter(User.employee_code == data.employee_id).first()
        employee_id = user.id if user else int(data.employee_id) if data.employee_id.isdigit() else record.employee_id
        
        # Calculate new deductions
        pf_employee = data.basic_salary * (data.pf_percentage / 100) if data.pf_enabled else 0
        esi_employee = data.gross_salary * (data.esi_percentage / 100) if data.esi_enabled else 0
        pt_amount = data.pt_amount if data.pt_enabled else 0
        
        # Update record
        record.employee_id = employee_id
        record.basic_salary = data.basic_salary
        record.pf_employee = pf_employee
        record.pf_employer = pf_employee
        record.esi_employee = esi_employee
        record.esi_employer = esi_employee * 3.25 / 1.75
        record.professional_tax = pt_amount
        record.month = data.month or record.month
        record.year = data.year or record.year
        
        db.commit()
        
        # Audit log
        audit_crud(request, "tenant", user, "UPDATE_STATUTORY_CALCULATION", "employee_statutory", str(record_id), old_values, data.dict())
        
        return {"message": "Record updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.delete("/{record_id}")
def delete_statutory_calculation(record_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        record = db.query(EmployeeStatutory).filter(EmployeeStatutory.id == record_id).first()
        if not record:
            raise HTTPException(status_code=404, detail="Record not found")
        
        # Store old values for audit
        old_values = {"employee_id": record.employee_id, "basic_salary": record.basic_salary, "pf_employee": record.pf_employee}
        
        db.delete(record)
        db.commit()
        
        # Audit log
        audit_crud(request, "tenant", user, "DELETE_STATUTORY_CALCULATION", "employee_statutory", str(record_id), old_values, None)
        
        return {"message": "Record deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
