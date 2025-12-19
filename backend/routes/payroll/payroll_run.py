from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_tenant_db
from pydantic import BaseModel
from typing import Optional

from models.models_tenant import PayrollRun

router = APIRouter(
    prefix="/payroll/run",
    tags=["Payroll - Payroll Run"]
)

class PayrollRunCreate(BaseModel):
    employee_id: int
    month: str
    year: Optional[int] = None
    present_days: Optional[int] = 0
    lop_days: Optional[int] = 0
    ot_hours: Optional[float] = 0
    gross_salary: Optional[float] = 0
    net_salary: Optional[float] = 0
    status: Optional[str] = "Completed"

@router.post("/")
def create_payroll_run(
    data: PayrollRunCreate,
    db: Session = Depends(get_tenant_db)
):
    try:
        existing = db.query(PayrollRun).filter(
            PayrollRun.employee_id == data.employee_id,
            PayrollRun.month == data.month
        ).first()
        
        if existing:
            for key, value in data.dict().items():
                setattr(existing, key, value)
            db.commit()
            db.refresh(existing)
            return existing
        else:
            payroll_run = PayrollRun(**data.dict())
            db.add(payroll_run)
            db.commit()
            db.refresh(payroll_run)
            return payroll_run
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating payroll run: {str(e)}")

@router.get("/")
def list_payroll_runs(
    db: Session = Depends(get_tenant_db)
):
    try:
        runs = db.query(PayrollRun).all()
        return runs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching payroll runs: {str(e)}")

@router.get("/{run_id}")
def get_payroll_run(
    run_id: int,
    db: Session = Depends(get_tenant_db)
):
    run = db.query(PayrollRun).filter(PayrollRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Payroll run not found")
    return run

@router.delete("/{run_id}")
def delete_payroll_run(
    run_id: int,
    db: Session = Depends(get_tenant_db)
):
    run = db.query(PayrollRun).filter(PayrollRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Payroll run not found")
    
    db.delete(run)
    db.commit()
    return {"message": "Payroll run deleted successfully"}