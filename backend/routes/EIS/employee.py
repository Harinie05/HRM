# routes/EIS/employee.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_tenant_engine
from routes.hospital import get_current_user
from models.models_tenant import (
    Employee,
    EmployeeFamily,
    EmployeeEducation,
    EmployeeExperience,
    EmployeeMedical,
    EmployeeIDDocs,
    EmployeeSkills,
    EmployeeCertifications,
    EmployeeSalary,
    EmployeeDocuments,
    EmployeeExit,
)
from schemas.schemas_tenant import (
    EmployeeCreate,
    EmployeeOut,
    FullEmployeeProfile
)

# Dynamic tenant connection
def get_tenant_session(user):
    from models.models_master import Hospital
    from database import get_master_db

    tenant_db = user.get("tenant_db")
    master = next(get_master_db())
    hospital = master.query(Hospital).filter(Hospital.db_name == tenant_db).first()

    if not hospital:
        raise HTTPException(404, "Tenant not found")

    engine = get_tenant_engine(hospital.db_name)
    db = Session(bind=engine)
    return db


router = APIRouter(prefix="/employee", tags=["Employee Information System"])


# -------------------------------------------------------------------------
# 1. CREATE EMPLOYEE (After Onboarding Completion)
# -------------------------------------------------------------------------
@router.post("/create", response_model=EmployeeOut)
def create_employee(data: EmployeeCreate, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    # Check duplicate employee code
    if db.query(Employee).filter(Employee.employee_code == data.employee_code).first():
        raise HTTPException(400, "Employee code already exists")

    new_emp = Employee(
        employee_code=data.employee_code,
        name=data.name,
        gender=data.gender,
        dob=data.dob,
        contact=data.contact,
        email=data.email,
        department=data.department,
        designation=data.designation,
        grade=data.grade,
        doj=data.doj,
        status=data.status,
        reporting_manager=data.reporting_manager,
        work_mode=data.work_mode,
        shift=data.shift,
        offer_id=data.offer_id,
        created_at=datetime.utcnow()
    )

    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)

    return new_emp


# -------------------------------------------------------------------------
# 2. GET ALL EMPLOYEES (List Page)
# -------------------------------------------------------------------------
@router.get("/", response_model=List[EmployeeOut])
def list_employees(department: str = None, status: str = None, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    query = db.query(Employee)

    if department:
        query = query.filter(Employee.department == department)
    if status:
        query = query.filter(Employee.status == status)

    return query.order_by(Employee.id.desc()).all()


# -------------------------------------------------------------------------
# 3. GET SINGLE EMPLOYEE FULL PROFILE (Everything)
# -------------------------------------------------------------------------
@router.get("/{employee_id}/profile", response_model=FullEmployeeProfile)
def get_employee_profile(employee_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")

    family = db.query(EmployeeFamily).filter(EmployeeFamily.employee_id == employee_id).all()
    education = db.query(EmployeeEducation).filter(EmployeeEducation.employee_id == employee_id).all()
    experience = db.query(EmployeeExperience).filter(EmployeeExperience.employee_id == employee_id).all()
    medical = db.query(EmployeeMedical).filter(EmployeeMedical.employee_id == employee_id).first()
    id_docs = db.query(EmployeeIDDocs).filter(EmployeeIDDocs.employee_id == employee_id).all()
    skills = db.query(EmployeeSkills).filter(EmployeeSkills.employee_id == employee_id).all()
    certifications = db.query(EmployeeCertifications).filter(EmployeeCertifications.employee_id == employee_id).all()
    salary = db.query(EmployeeSalary).filter(EmployeeSalary.employee_id == employee_id).first()
    documents = db.query(EmployeeDocuments).filter(EmployeeDocuments.employee_id == employee_id).all()
    exit_data = db.query(EmployeeExit).filter(EmployeeExit.employee_id == employee_id).first()

    return FullEmployeeProfile(
        employee=emp,
        family=family,
        education=education,
        experience=experience,
        medical=medical,
        id_docs=id_docs,
        skills=skills,
        certifications=certifications,
        salary=salary,
        documents=documents,
        exit=exit_data
    )
