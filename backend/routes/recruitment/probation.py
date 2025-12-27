from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_tenant_db
from models.models_tenant import EmployeeProbation, User
from schemas.schemas_tenant import (
    EmployeeProbationCreate, 
    EmployeeProbationOut, 
    EmployeeProbationUpdate
)
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta

router = APIRouter()

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_tenant_db
from models.models_tenant import EmployeeProbation, User
from schemas.schemas_tenant import (
    EmployeeProbationCreate, 
    EmployeeProbationOut, 
    EmployeeProbationUpdate
)
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta

router = APIRouter()

@router.get("/probations")
def get_all_probations(db: Session = Depends(get_tenant_db)):
    probations = db.query(EmployeeProbation).all()
    result = []
    
    for probation in probations:
        employee = db.query(User).filter(User.id == probation.employee_id).first()
        probation_dict = {
            "id": probation.id,
            "employee_id": probation.employee_id,
            "employee_name": employee.name if employee else f"Employee {probation.employee_id}",
            "date_of_joining": probation.date_of_joining,
            "probation_end_date": probation.probation_end_date,
            "probation_status": probation.probation_status,
            "extension_end_date": probation.extension_end_date,
            "remarks": probation.remarks,
            "created_at": probation.created_at,
            "updated_at": probation.updated_at
        }
        result.append(probation_dict)
    
    return result

@router.post("/probations", response_model=EmployeeProbationOut)
def create_probation(probation: EmployeeProbationCreate, db: Session = Depends(get_tenant_db)):
    db_probation = EmployeeProbation(**probation.model_dump())
    db.add(db_probation)
    db.commit()
    db.refresh(db_probation)
    return db_probation

@router.put("/probations/{probation_id}", response_model=EmployeeProbationOut)
def update_probation(probation_id: int, probation: EmployeeProbationUpdate, db: Session = Depends(get_tenant_db)):
    db_probation = db.query(EmployeeProbation).filter(EmployeeProbation.id == probation_id).first()
    if not db_probation:
        raise HTTPException(status_code=404, detail="Probation not found")
    
    for key, value in probation.model_dump(exclude_unset=True).items():
        setattr(db_probation, key, value)
    
    db.commit()
    db.refresh(db_probation)
    return db_probation

@router.post("/probations/{probation_id}/confirm")
def confirm_probation(probation_id: int, db: Session = Depends(get_tenant_db)):
    db_probation = db.query(EmployeeProbation).filter(EmployeeProbation.id == probation_id).first()
    if not db_probation:
        raise HTTPException(status_code=404, detail="Probation not found")
    
    db_probation.probation_status = "Confirmed"
    db.commit()
    return {"message": "Probation confirmed successfully"}

@router.post("/probations/{probation_id}/extend")
def extend_probation(probation_id: int, request: dict, db: Session = Depends(get_tenant_db)):
    db_probation = db.query(EmployeeProbation).filter(EmployeeProbation.id == probation_id).first()
    if not db_probation:
        raise HTTPException(status_code=404, detail="Probation not found")
    
    months = request.get("months", 3)
    db_probation.probation_status = "Extended"
    db_probation.extension_end_date = db_probation.probation_end_date + relativedelta(months=months)
    db.commit()
    return {"message": f"Probation extended by {months} months"}

@router.post("/probations/{probation_id}/end")
def end_probation(probation_id: int, remarks: str = "", db: Session = Depends(get_tenant_db)):
    db_probation = db.query(EmployeeProbation).filter(EmployeeProbation.id == probation_id).first()
    if not db_probation:
        raise HTTPException(status_code=404, detail="Probation not found")
    
    db_probation.probation_status = "Confirmed"
    if remarks:
        db_probation.remarks = remarks
    db.commit()
    return {"message": "Probation ended and employee confirmed"}

@router.post("/probations/{probation_id}/terminate")
def terminate_probation(probation_id: int, remarks: str, db: Session = Depends(get_tenant_db)):
    db_probation = db.query(EmployeeProbation).filter(EmployeeProbation.id == probation_id).first()
    if not db_probation:
        raise HTTPException(status_code=404, detail="Probation not found")
    
    db_probation.probation_status = "Terminated"
    db_probation.remarks = remarks
    db.commit()
    return {"message": "Probation terminated"}

@router.get("/probations/pending-actions")
def get_pending_actions(db: Session = Depends(get_tenant_db)):
    today = date.today()
    upcoming_deadline = today + timedelta(days=30)
    
    pending = db.query(EmployeeProbation).filter(
        EmployeeProbation.probation_status == "In Progress",
        EmployeeProbation.probation_end_date <= upcoming_deadline
    ).all()
    
    return pending

@router.get("/probations/dashboard-stats")
def get_dashboard_stats(db: Session = Depends(get_tenant_db)):
    today = date.today()
    
    pending_actions = db.query(EmployeeProbation).filter(
        EmployeeProbation.probation_status == "In Progress",
        EmployeeProbation.probation_end_date <= today + timedelta(days=30)
    ).count()
    
    confirmed = db.query(EmployeeProbation).filter(
        EmployeeProbation.probation_status == "Confirmed"
    ).count()
    
    total_probations = db.query(EmployeeProbation).count()
    
    return {
        "pending_actions": pending_actions,
        "confirmed": confirmed,
        "total_probations": total_probations
    }

@router.get("/employees-without-probation")
def get_employees_without_probation(db: Session = Depends(get_tenant_db)):
    # Get employees who don't have probation records
    employees_with_probation = db.query(EmployeeProbation.employee_id).distinct()
    employees_without = db.query(User).filter(
        ~User.id.in_(employees_with_probation),
        User.status == "Active"
    ).all()
    
    return [{"id": emp.id, "name": emp.name, "email": emp.email} for emp in employees_without]