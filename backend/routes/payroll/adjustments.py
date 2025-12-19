from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_tenant_db
from pydantic import BaseModel
from typing import Optional

from models.models_tenant import PayrollAdjustment

router = APIRouter(
    prefix="/payroll/adjustments",
    tags=["Payroll - Adjustments"]
)

class PayrollAdjustmentCreate(BaseModel):
    employee_id: int
    month: str
    adjustment_type: str
    amount: float
    description: Optional[str] = None

@router.post("/")
def add_adjustment(
    data: PayrollAdjustmentCreate,
    db: Session = Depends(get_tenant_db)
):
    try:
        adjustment = PayrollAdjustment(**data.dict())
        db.add(adjustment)
        db.commit()
        db.refresh(adjustment)
        return adjustment
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating adjustment: {str(e)}")

@router.get("/")
def list_adjustments(
    db: Session = Depends(get_tenant_db)
):
    try:
        return db.query(PayrollAdjustment).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching adjustments: {str(e)}")

@router.get("/{adjustment_id}")
def get_adjustment(
    adjustment_id: int,
    db: Session = Depends(get_tenant_db)
):
    adjustment = db.query(PayrollAdjustment).filter(PayrollAdjustment.id == adjustment_id).first()
    if not adjustment:
        raise HTTPException(status_code=404, detail="Adjustment not found")
    return adjustment

@router.put("/{adjustment_id}")
def update_adjustment(
    adjustment_id: int,
    data: PayrollAdjustmentCreate,
    db: Session = Depends(get_tenant_db)
):
    adjustment = db.query(PayrollAdjustment).filter(PayrollAdjustment.id == adjustment_id).first()
    if not adjustment:
        raise HTTPException(status_code=404, detail="Adjustment not found")
    
    try:
        for key, value in data.dict().items():
            setattr(adjustment, key, value)
        db.commit()
        db.refresh(adjustment)
        return adjustment
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating adjustment: {str(e)}")

@router.delete("/{adjustment_id}")
def delete_adjustment(
    adjustment_id: int,
    db: Session = Depends(get_tenant_db)
):
    adjustment = db.query(PayrollAdjustment).filter(PayrollAdjustment.id == adjustment_id).first()
    if not adjustment:
        raise HTTPException(status_code=404, detail="Adjustment not found")
    
    try:
        db.delete(adjustment)
        db.commit()
        return {"message": "Adjustment deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting adjustment: {str(e)}")