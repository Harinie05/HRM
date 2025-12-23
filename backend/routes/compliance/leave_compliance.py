from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from models.models_tenant import LeaveWorkingCompliance, User
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user

router = APIRouter(prefix="/compliance/leave", tags=["Compliance"])

class LeaveComplianceRequest(BaseModel):
    employee_id: str
    employee_name: str
    total_working_days: str = ""
    leaves_taken: str = ""
    overtime_hours: str = ""
    compliance_status: str = "Compliant"
    month: str = ""
    year: str = ""

@router.post("/")
def create_leave_compliance(data: LeaveComplianceRequest, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        # Find user by employee_code
        user = db.query(User).filter(User.employee_code == data.employee_id).first()
        if not user:
            # Use employee_id as numeric ID if not found by code
            user_id = 1  # Default user ID for testing
        else:
            user_id = user.id
        
        # Convert form data
        current_date = datetime.now()
        month = data.month if data.month else str(current_date.month).zfill(2)
        year = int(data.year) if data.year else current_date.year
        
        total_days = int(data.total_working_days) if data.total_working_days else None
        leaves = int(data.leaves_taken) if data.leaves_taken else None
        overtime = float(data.overtime_hours) if data.overtime_hours else None
        
        # Create record
        record = LeaveWorkingCompliance(
            employee_id=user_id,
            total_working_days=total_days,
            leaves_taken=leaves,
            overtime_hours=overtime,
            compliance_status=data.compliance_status,
            month=month,
            year=year
        )
        
        db.add(record)
        db.commit()
        db.refresh(record)
        
        # Audit log
        audit_crud(request, "tenant", user, "CREATE_LEAVE_COMPLIANCE", "leave_working_compliance", str(record.id), None, data.dict())
        
        return {"message": "Leave compliance record saved to database successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/")
def get_leave_compliance(db: Session = Depends(get_tenant_db)):
    try:
        records = db.query(LeaveWorkingCompliance).order_by(LeaveWorkingCompliance.created_at.desc()).all()
        print(f"Found {len(records)} leave compliance records")
        
        result = []
        for record in records:
            user = db.query(User).filter(User.id == record.employee_id).first()
            print(f"Processing record {record.id} for employee {record.employee_id}")
            
            result.append({
                "id": record.id,
                "employee_id": user.employee_code if user else str(record.employee_id),
                "employee_name": user.name if user else f"Employee {record.employee_id}",
                "total_working_days": record.total_working_days or 0,
                "actual_working_days": (record.total_working_days or 0) - (record.leaves_taken or 0),
                "leaves_taken": record.leaves_taken or 0,
                "overtime_hours": record.overtime_hours or 0.0,
                "compliance_status": record.compliance_status or "Unknown",
                "month": record.month,
                "year": record.year
            })
        
        print(f"Returning {len(result)} records")
        return result
        
    except Exception as e:
        print(f"Error in get_leave_compliance: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")