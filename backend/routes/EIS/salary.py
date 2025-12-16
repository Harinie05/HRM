# routes/EIS/salary.py

from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session

from routes.hospital import get_current_user
from database import get_tenant_engine
from models.models_tenant import EmployeeSalary, Grade
from schemas.schemas_tenant import SalaryCreate, SalaryOut
from pydantic import BaseModel
from typing import Optional

# Simple salary input schema
class SimpleSalaryCreate(BaseModel):
    employee_id: int
    ctc: float
    grade: Optional[str] = None


# ---------------------- TENANT SESSION ----------------------
def get_tenant_session(user):
    from models.models_master import Hospital
    from database import get_master_db

    tenant_db = user.get("tenant_db")
    master = next(get_master_db())

    hospital = master.query(Hospital).filter(Hospital.db_name == tenant_db).first()
    if not hospital:
        raise HTTPException(404, "Tenant not found")

    engine = get_tenant_engine(hospital.db_name)
    return Session(bind=engine)


router = APIRouter(prefix="/employee/salary", tags=["Employee Salary Structure"])


# -------------------------------------------------------------------------
# 1. SAVE SALARY STRUCTURE
# -------------------------------------------------------------------------
@router.post("/add")
async def add_salary(
    employee_id: int = Form(...),
    ctc: float = Form(...),
    basic_percent: float = Form(40.0),
    hra_percent: float = Form(20.0),
    allowances_percent: float = Form(20.0),
    special_percent: float = Form(20.0),
    pf_eligible: bool = Form(True),
    esi_eligible: bool = Form(True),
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)
    
    try:
        # Check if salary already exists
        existing = db.query(EmployeeSalary).filter(EmployeeSalary.employee_id == employee_id).first()
        if existing:
            # Update existing record
            existing.ctc = ctc
            existing.basic_percent = basic_percent
            existing.hra_percent = hra_percent
            existing.allowances_percent = allowances_percent
            existing.special_percent = special_percent
            existing.pf_eligible = pf_eligible
            existing.esi_eligible = esi_eligible
            salary = existing
        else:
            # Create new record
            salary = EmployeeSalary(
                employee_id=employee_id,
                ctc=ctc,
                basic_percent=basic_percent,
                hra_percent=hra_percent,
                allowances_percent=allowances_percent,
                special_percent=special_percent,
                pf_eligible=pf_eligible,
                esi_eligible=esi_eligible
            )
            db.add(salary)

        db.commit()
        db.refresh(salary)

        return {"message": "Salary structure saved successfully", "id": salary.id}
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Failed to add salary: {str(e)}")
    finally:
        db.close()


# -------------------------------------------------------------------------
# 2. GET EMPLOYEE SALARY
# -------------------------------------------------------------------------
@router.get("/{employee_id}", response_model=SalaryOut)
def get_salary(employee_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    try:
        sal = db.query(EmployeeSalary).filter(EmployeeSalary.employee_id == employee_id).first()
        if not sal:
            raise HTTPException(404, "Salary structure not found")

        return sal
    finally:
        db.close()


# -------------------------------------------------------------------------
# 3. UPDATE SALARY STRUCTURE
# -------------------------------------------------------------------------
@router.put("/{employee_id}", response_model=SalaryOut)
def update_salary(employee_id: int, data: SalaryCreate, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    try:
        sal = db.query(EmployeeSalary).filter(EmployeeSalary.employee_id == employee_id).first()
        if not sal:
            raise HTTPException(404, "Salary structure not found")

        # If grade selected → auto-apply salary split
        grade = None
        if hasattr(data, 'grade') and data.grade:
            grade = db.query(Grade).filter(Grade.code == data.grade).first()
            if not grade:
                raise HTTPException(404, "Grade not found")

        setattr(sal, 'ctc', data.ctc)
        setattr(sal, 'basic_percent', grade.basic_percent if grade else getattr(data, 'basic_percent', sal.basic_percent))
        setattr(sal, 'hra_percent', grade.hra_percent if grade else getattr(data, 'hra_percent', sal.hra_percent))
        setattr(sal, 'allowances_percent', grade.allowance_percent if grade else getattr(data, 'allowances_percent', sal.allowances_percent))
        setattr(sal, 'special_percent', grade.special_percent if grade else getattr(data, 'special_percent', sal.special_percent))
        setattr(sal, 'pf_eligible', grade.pf_applicable if grade else getattr(data, 'pf_eligible', sal.pf_eligible))
        setattr(sal, 'esi_eligible', grade.esi_applicable if grade else getattr(data, 'esi_eligible', sal.esi_eligible))

        db.commit()
        db.refresh(sal)

        return sal
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Failed to update salary: {str(e)}")
    finally:
        db.close()


# -------------------------------------------------------------------------
# 4. SIMPLE SALARY CREATION (MINIMAL INPUT)
# -------------------------------------------------------------------------
@router.post("/create-simple", response_model=SalaryOut)
def create_simple_salary(data: SimpleSalaryCreate, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    
    try:
        # Check if salary already exists
        existing = db.query(EmployeeSalary).filter(EmployeeSalary.employee_id == data.employee_id).first()
        if existing:
            raise HTTPException(400, "Salary structure already exists for this employee")
            
        # If grade is provided, get grade details
        grade = None
        if data.grade:
            grade = db.query(Grade).filter(Grade.code == data.grade).first()
            if not grade:
                raise HTTPException(404, f"Grade '{data.grade}' not found")

        # Use grade percentages if available, else use defaults
        basic_percent = grade.basic_percent if grade else 40.0
        hra_percent = grade.hra_percent if grade else 20.0
        allowances_percent = grade.allowance_percent if grade else 20.0
        special_percent = grade.special_percent if grade else 20.0
        
        pf_eligible = grade.pf_applicable if grade else True
        esi_eligible = grade.esi_applicable if grade else True

        salary = EmployeeSalary(
            employee_id=data.employee_id,
            ctc=data.ctc,
            basic_percent=basic_percent,
            hra_percent=hra_percent,
            allowances_percent=allowances_percent,
            special_percent=special_percent,
            pf_eligible=pf_eligible,
            esi_eligible=esi_eligible
        )

        db.add(salary)
        db.commit()
        db.refresh(salary)

        return salary
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Failed to create salary: {str(e)}")
    finally:
        db.close()