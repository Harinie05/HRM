# routes/EIS/salary.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from routes.hospital import get_current_user
from database import get_tenant_engine
from models.models_tenant import EmployeeSalary, Grade
from schemas.schemas_tenant import SalaryCreate, SalaryOut


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
@router.post("/add", response_model=SalaryOut)
def add_salary(data: SalaryCreate, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    # If grade is selected → load salary split automatically
    grade = None
    if data.grade:
        grade = db.query(Grade).filter(Grade.code == data.grade).first()
        if not grade:
            raise HTTPException(404, "Grade not found")

    salary = EmployeeSalary(
        employee_id=data.employee_id,
        ctc=data.ctc,

        # Use grade percentages if selected, else use manual values
        basic_percent=grade.basic_percent if grade else data.basic_percent,
        hra_percent=grade.hra_percent if grade else data.hra_percent,
        allowances_percent=grade.allowance_percent if grade else data.allowances_percent,
        special_percent=grade.special_percent if grade else data.special_percent,

        pf_eligible=grade.pf_applicable if grade else data.pf_applicable,
        esi_eligible=grade.esi_applicable if grade else data.esi_applicable
    )

    db.add(salary)
    db.commit()
    db.refresh(salary)

    return salary


# -------------------------------------------------------------------------
# 2. GET EMPLOYEE SALARY
# -------------------------------------------------------------------------
@router.get("/{employee_id}", response_model=SalaryOut)
def get_salary(employee_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    sal = db.query(EmployeeSalary).filter(EmployeeSalary.employee_id == employee_id).first()
    if not sal:
        raise HTTPException(404, "Salary structure not found")

    return sal


# -------------------------------------------------------------------------
# 3. UPDATE SALARY STRUCTURE
# -------------------------------------------------------------------------
@router.put("/{employee_id}", response_model=SalaryOut)
def update_salary(employee_id: int, data: SalaryCreate, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    sal = db.query(EmployeeSalary).filter(EmployeeSalary.employee_id == employee_id).first()
    if not sal:
        raise HTTPException(404, "Salary structure not found")

    # If grade selected → auto-apply salary split
    grade = None
    if data.grade:
        grade = db.query(Grade).filter(Grade.code == data.grade).first()
        if not grade:
            raise HTTPException(404, "Grade not found")

    setattr(sal, 'ctc', data.ctc)
    setattr(sal, 'basic_percent', grade.basic_percent if grade else data.basic_percent)
    setattr(sal, 'hra_percent', grade.hra_percent if grade else data.hra_percent)
    setattr(sal, 'allowances_percent', grade.allowance_percent if grade else data.allowances_percent)
    setattr(sal, 'special_percent', grade.special_percent if grade else data.special_percent)

    setattr(sal, 'pf_eligible', grade.pf_applicable if grade else data.pf_applicable)
    setattr(sal, 'esi_eligible', grade.esi_applicable if grade else data.esi_applicable)

    db.commit()
    db.refresh(sal)

    return sal
