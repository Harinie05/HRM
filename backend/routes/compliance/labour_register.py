from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from models.models_tenant import LabourLawRegister, User
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user

router = APIRouter(prefix="/compliance/labour", tags=["Compliance"])

class LabourRegisterRequest(BaseModel):
    employee_id: str
    employee_name: str
    register_type: str
    register_number: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    issuing_authority: Optional[str] = None
    compliance_status: str = "Active"
    month: Optional[str] = None
    year: Optional[int] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    remarks: Optional[str] = None

@router.post("/")
def create_register(data: LabourRegisterRequest, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        # Find user by employee_code
        user = db.query(User).filter(User.employee_code == data.employee_id).first()
        if not user and data.employee_id.isdigit():
            user = db.query(User).filter(User.id == int(data.employee_id)).first()
        
        if not user:
            raise HTTPException(status_code=404, detail=f"Employee with code {data.employee_id} not found")
        
        # Use current month/year if not provided
        current_date = datetime.now()
        month = data.month or str(current_date.month).zfill(2)
        year = data.year or current_date.year
        
        record = LabourLawRegister(
            employee_id=user.id,
            register_type=data.register_type,
            month=month,
            year=year,
            remarks=data.remarks or ""
        )
        
        db.add(record)
        db.commit()
        db.refresh(record)
        
        # Audit log
        audit_crud(request, "tenant", user, "CREATE_LABOUR_REGISTER", "labour_law_registers", str(record.id), {}, data.dict())
        
        return {"message": "Labour register added successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/")
def get_registers(db: Session = Depends(get_tenant_db)):
    try:
        records = db.query(LabourLawRegister).order_by(LabourLawRegister.created_at.desc()).limit(50).all()
        
        result = []
        for record in records:
            user = db.query(User).filter(User.id == record.employee_id).first()
            if not user:
                user = db.query(User).filter(User.employee_code == str(record.employee_id)).first()
            
            result.append({
                "id": record.id,
                "employee_id": user.employee_code if user else str(record.employee_id),
                "employee_name": user.name if user else f"Employee {record.employee_id}",
                "register_type": record.register_type,
                "compliance_status": "Active",
                "month": record.month,
                "year": record.year,
                "remarks": record.remarks
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.put("/{record_id}")
def update_register(record_id: int, data: LabourRegisterRequest, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        record = db.query(LabourLawRegister).filter(LabourLawRegister.id == record_id).first()
        if not record:
            raise HTTPException(status_code=404, detail="Record not found")
        
        # Store old values for audit
        old_values = {"employee_id": record.employee_id, "register_type": record.register_type, "month": record.month, "year": record.year}
        
        # Find user by employee_code
        user = db.query(User).filter(User.employee_code == data.employee_id).first()
        if not user and data.employee_id.isdigit():
            user = db.query(User).filter(User.id == int(data.employee_id)).first()
        
        if not user:
            raise HTTPException(status_code=404, detail=f"Employee with code {data.employee_id} not found")
        
        # Update record using setattr to avoid type issues
        setattr(record, 'employee_id', user.id)
        setattr(record, 'register_type', data.register_type)
        setattr(record, 'month', data.month or record.month)
        setattr(record, 'year', data.year or record.year)
        setattr(record, 'remarks', data.remarks or "")
        
        db.commit()
        
        # Audit log
        audit_crud(request, "tenant", user, "UPDATE_LABOUR_REGISTER", "labour_law_registers", str(record_id), old_values, data.dict())
        
        return {"message": "Record updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.delete("/{record_id}")
def delete_register(record_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        record = db.query(LabourLawRegister).filter(LabourLawRegister.id == record_id).first()
        if not record:
            raise HTTPException(status_code=404, detail="Record not found")
        
        # Store old values for audit
        old_values = {"employee_id": record.employee_id, "register_type": record.register_type, "month": record.month, "year": record.year}
        
        db.delete(record)
        db.commit()
        
        # Audit log
        audit_crud(request, "tenant", user, "DELETE_LABOUR_REGISTER", "labour_law_registers", str(record_id), old_values, {})
        
        return {"message": "Record deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")