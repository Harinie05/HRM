from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_tenant_db
from routes.hospital import get_current_user
from models.models_tenant import User, EmployeeExit
from schemas.schemas_tenant import ExitCreate, ExitOut
from typing import List
from datetime import datetime, date

router = APIRouter(prefix="/exit", tags=["Exit Management"])

# =====================================================
# 1. RESIGNATION & NOTICE TRACKING
# =====================================================

@router.get("/resignations", response_model=List[ExitOut])
def get_all_resignations(user=Depends(get_current_user), db: Session = Depends(get_tenant_db)):
    """Get all resignation requests"""
    exits = db.query(EmployeeExit).join(User, EmployeeExit.employee_id == User.id).all()
    return exits

@router.post("/resignation/apply", response_model=ExitOut)
def apply_resignation(data: ExitCreate, user=Depends(get_current_user), db: Session = Depends(get_tenant_db)):
    """Employee applies for resignation"""
    # Check if employee already has an active resignation
    existing = db.query(EmployeeExit).filter(
        EmployeeExit.employee_id == data.employee_id,
        EmployeeExit.overall_status.in_(["Initiated", "Approved", "In Progress"])
    ).first()
    
    if existing:
        raise HTTPException(400, "Employee already has an active resignation request")
    
    exit_record = EmployeeExit(**data.dict())
    exit_record.overall_status = "Initiated"
    
    db.add(exit_record)
    db.commit()
    db.refresh(exit_record)
    return exit_record

@router.put("/resignation/{exit_id}/approve")
def approve_resignation(exit_id: int, user=Depends(get_current_user), db: Session = Depends(get_tenant_db)):
    """HR approves resignation request"""
    exit_record = db.query(EmployeeExit).filter(EmployeeExit.id == exit_id).first()
    if not exit_record:
        raise HTTPException(404, "Resignation request not found")
    
    exit_record.overall_status = "Approved"
    exit_record.notice_served = True
    
    db.commit()
    return {"message": "Resignation approved successfully"}

@router.put("/resignation/{exit_id}/reject")
def reject_resignation(exit_id: int, reason: str, user=Depends(get_current_user), db: Session = Depends(get_tenant_db)):
    """HR rejects resignation request"""
    exit_record = db.query(EmployeeExit).filter(EmployeeExit.id == exit_id).first()
    if not exit_record:
        raise HTTPException(404, "Resignation request not found")
    
    exit_record.overall_status = "Rejected"
    exit_record.notes = f"Rejected: {reason}"
    
    db.commit()
    return {"message": "Resignation rejected"}

# =====================================================
# 2. CLEARANCE & EXIT WORKFLOW (DISABLED - Models not available)
# =====================================================

# @router.get("/clearance/{exit_id}")
# def get_clearance_status(exit_id: int, user=Depends(get_current_user), db: Session = Depends(get_tenant_db)):
#     """Get clearance status for an exit"""
#     clearances = db.query(ExitClearance).filter(ExitClearance.exit_id == exit_id).all()
#     return clearances

# =====================================================
# 3. F&F SETTLEMENT & RELIEVING DOCUMENTS (DISABLED - Models not available)
# =====================================================

@router.get("/dashboard")
def exit_dashboard(user=Depends(get_current_user), db: Session = Depends(get_tenant_db)):
    """Get exit management dashboard data"""
    total_exits = db.query(EmployeeExit).count()
    pending_approvals = db.query(EmployeeExit).filter(EmployeeExit.overall_status == "Initiated").count()
    in_progress = db.query(EmployeeExit).filter(EmployeeExit.overall_status == "In Progress").count()
    completed = db.query(EmployeeExit).filter(EmployeeExit.overall_status == "Completed").count()
    
    return {
        "total_exits": total_exits,
        "pending_approvals": pending_approvals,
        "in_progress": in_progress,
        "completed": completed
    }