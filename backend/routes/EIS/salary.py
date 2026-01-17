# routes/EIS/salary.py

from fastapi import APIRouter, Depends, HTTPException, Form, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from routes.hospital import get_current_user
from database import get_tenant_engine
from utils.audit_logger import audit_crud
from models.models_tenant import EmployeeSalary
from schemas.schemas_tenant import SalaryCreate, SalaryOut
from pydantic import BaseModel
from typing import Optional
import json
import os
from utils.permission import require_permission

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

    try:
        hospital = master.query(Hospital).filter(Hospital.db_name == tenant_db).first()
        if not hospital:
            raise HTTPException(404, "Tenant not found")

        engine = get_tenant_engine(hospital.db_name)
        return Session(bind=engine)
    finally:
        master.close()

router = APIRouter(prefix="/employee/salary", tags=["Employee Salary Structure"])

# -------------------------------------------------------------------------
# 1. SAVE SALARY STRUCTURE
# -------------------------------------------------------------------------
class SalaryAddRequest(BaseModel):
    employee_id: int
    ctc: float
    basic_percent: Optional[float] = 40.0
    hra_percent: Optional[float] = 20.0
    allowances_percent: Optional[float] = 20.0
    special_percent: Optional[float] = 20.0
    pf_eligible: Optional[bool] = True
    esi_eligible: Optional[bool] = True

@router.post("/add")
async def add_salary(
    request: Request,
    user=Depends(get_current_user),
    employee_id: str = Form(...),
    ctc: str = Form(...),
    basic_percent: str = Form("40"),
    hra_percent: str = Form("20"),
    allowances_percent: str = Form("20"),
    special_percent: str = Form("20"),
    pf_eligible: str = Form("true"),
    esi_eligible: str = Form("true")
):
    db = None
    try:
        db = get_tenant_session(user)
        print(f"DEBUG: Database session created successfully")
        
        # Convert string values to proper types
        # Handle both numeric and user_X format employee IDs
        if employee_id.startswith('user_'):
            emp_id = int(employee_id.split('_')[1])
        else:
            emp_id = int(employee_id)
            
        ctc_val = int(float(ctc))  # Convert to int to avoid precision issues
        basic = float(basic_percent)
        hra = float(hra_percent)
        allowances = float(allowances_percent)
        special = float(special_percent)
        pf = pf_eligible.lower() in ['true', '1', 'yes']
        esi = esi_eligible.lower() in ['true', '1', 'yes']
        
        print(f"DEBUG: employee_id={emp_id}, ctc={ctc_val}")
        print(f"DEBUG: Parsed values - basic: {basic}, hra: {hra}, allowances: {allowances}")
        print(f"DEBUG: Boolean values - pf: {pf}, esi: {esi}")
        
        # Check if salary already exists
        print(f"DEBUG: Checking for existing salary for employee_id: {emp_id}")
        existing = db.query(EmployeeSalary).filter(EmployeeSalary.employee_id == emp_id).first()
        
        if existing:
            print(f"DEBUG: Updating existing salary record with ID: {existing.id}")
            # Update existing record
            existing.ctc = ctc_val  # type: ignore
            existing.basic_percent = basic  # type: ignore
            existing.hra_percent = hra  # type: ignore
            existing.allowances_percent = allowances  # type: ignore
            existing.special_percent = special  # type: ignore
            existing.pf_eligible = pf  # type: ignore
            existing.esi_eligible = esi  # type: ignore
            salary = existing
        else:
            print(f"DEBUG: Creating new salary record")
            # Create new record
            salary = EmployeeSalary(
                employee_id=emp_id,
                ctc=ctc_val,
                basic_percent=basic,
                hra_percent=hra,
                allowances_percent=allowances,
                special_percent=special,
                pf_eligible=pf,
                esi_eligible=esi
            )
            db.add(salary)
            print(f"DEBUG: Added salary to session")

        print(f"DEBUG: Committing transaction")
        db.commit()
        print(f"DEBUG: Refreshing salary object")
        db.refresh(salary)
        audit_crud(request, user.get("tenant_db"), user, "CREATE" if not existing else "UPDATE", "employee_salary", str(salary.id), {}, salary.__dict__)
        print(f"DEBUG: Salary saved successfully with ID: {salary.id}")

        result = {"message": "Salary structure saved successfully", "id": salary.id}
        print(f"DEBUG: Returning result: {result}")
        return result
        
    except HTTPException as he:
        print(f"DEBUG: HTTPException in add_salary: {str(he)}")
        if db:
            db.rollback()
        raise
    except Exception as e:
        print(f"DEBUG: Unexpected error in add_salary: {str(e)}")
        print(f"DEBUG: Error type: {type(e)}")
        import traceback
        print(f"DEBUG: Full traceback: {traceback.format_exc()}")
        if db:
            db.rollback()
        raise HTTPException(500, f"Failed to add salary: {str(e)}")
    finally:
        if db:
            db.close()

# -------------------------------------------------------------------------
# 2. GET EMPLOYEE SALARY
# -------------------------------------------------------------------------
@router.get("/{employee_id}")
def get_salary(employee_id: str, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    try:
        # Handle both numeric and user_X format employee IDs
        if employee_id.startswith('user_'):
            emp_id = int(employee_id.split('_')[1])
        else:
            emp_id = int(employee_id)
            
        sal = db.query(EmployeeSalary).filter(EmployeeSalary.employee_id == emp_id).first()
        if not sal:
            raise HTTPException(404, "Salary structure not found")

        # Convert to dict before closing session
        result = {
            "id": sal.id,
            "employee_id": sal.employee_id,
            "ctc": sal.ctc,
            "basic_percent": sal.basic_percent,
            "hra_percent": sal.hra_percent,
            "allowances_percent": sal.allowances_percent,
            "special_percent": sal.special_percent,
            "pf_eligible": sal.pf_eligible,
            "esi_eligible": sal.esi_eligible
        }
        return result
    finally:
        db.close()

# -------------------------------------------------------------------------
# 3. UPDATE SALARY STRUCTURE
# -------------------------------------------------------------------------
@router.put("/{employee_id}", response_model=SalaryOut)
def update_salary(employee_id: int, data: SalaryCreate, request: Request, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    try:
        sal = db.query(EmployeeSalary).filter(EmployeeSalary.employee_id == employee_id).first()
        if not sal:
            raise HTTPException(404, "Salary structure not found")

        # If grade selected → auto-apply salary split
        # grade = None
        # if hasattr(data, 'grade') and data.grade:
        #     grade = db.query(Grade).filter(Grade.code == data.grade).first()
        #     if not grade:
        #         raise HTTPException(404, "Grade not found")

        setattr(sal, 'ctc', data.ctc)
        setattr(sal, 'basic_percent', getattr(data, 'basic_percent', sal.basic_percent))
        setattr(sal, 'hra_percent', getattr(data, 'hra_percent', sal.hra_percent))
        setattr(sal, 'allowances_percent', getattr(data, 'allowances_percent', sal.allowances_percent))
        setattr(sal, 'special_percent', getattr(data, 'special_percent', sal.special_percent))
        setattr(sal, 'pf_eligible', getattr(data, 'pf_eligible', sal.pf_eligible))
        setattr(sal, 'esi_eligible', getattr(data, 'esi_eligible', sal.esi_eligible))

        db.commit()
        db.refresh(sal)
        audit_crud(request, user.get("tenant_db"), user, "UPDATE", "employee_salary", str(employee_id), {}, sal.__dict__)

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
        # grade = None
        # if data.grade:
        #     grade = db.query(Grade).filter(Grade.code == data.grade).first()
        #     if not grade:
        #         raise HTTPException(404, f"Grade '{data.grade}' not found")

        # Use default percentages since Grade model doesn't exist
        basic_percent = 40.0
        hra_percent = 20.0
        allowances_percent = 20.0
        special_percent = 20.0
        
        pf_eligible = True
        esi_eligible = True

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

# -------------------------------------------------------------------------
# 5. SERVE PAYSLIP PDF
# -------------------------------------------------------------------------
@router.get("/payslip/{filename}")
def serve_payslip(filename: str, user=Depends(get_current_user)):
    """Serve payslip PDF files"""
    try:
        # Security: Only allow PDF files and sanitize filename
        if not filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files allowed")
        
        # Remove any path traversal attempts
        filename = os.path.basename(filename)
        
        # Construct file path (adjust path as needed)
        file_path = os.path.join("C:/Users/Harinie/Downloads", filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Payslip not found")
        
        return FileResponse(
            path=file_path,
            media_type='application/pdf',
            filename=filename,
            headers={
                "Content-Disposition": f"inline; filename={filename}",
                "Cache-Control": "no-cache"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error serving payslip: {str(e)}")