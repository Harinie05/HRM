# routes/EIS/exit.py

from fastapi import APIRouter, Depends, HTTPException, Request, Form, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from routes.hospital import get_current_user
from database import get_tenant_engine
from utils.audit_logger import audit_crud
from models.models_tenant import EmployeeExit, User
# Removed schema imports that were causing validation issues
from utils.permission import require_permission

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

router = APIRouter(prefix="/employee/exit", tags=["Employee Exit & Separation"])

@router.get("/test")
def test_endpoint():
    return {"message": "Exit router is working"}

@router.post("/test-form")
async def test_form_endpoint(
    test_field: str = Form(...),
    test_file: Optional[UploadFile] = File(None)
):
    return {"message": "Test form endpoint working", "field": test_field}

@router.post("/add")
async def add_exit(request: Request):
    try:
        print("=== EXIT ADD REQUEST RECEIVED ===")
        
        # Parse form data manually
        form_data = await request.form()
        print(f"Form data keys: {list(form_data.keys())}")
        
        # Extract form fields
        employee_id = form_data.get("employee_id")
        resignation_date = form_data.get("resignation_date")
        last_working_date = form_data.get("last_working_date")
        notice_period_days = form_data.get("notice_period_days")
        reason_for_leaving = form_data.get("reason_for_leaving")
        exit_interview_date = form_data.get("exit_interview_date")
        exit_interview_feedback = form_data.get("exit_interview_feedback")
        handover_status = form_data.get("handover_status", "Pending")
        final_settlement_amount = form_data.get("final_settlement_amount")
        relieving_letter_issued = form_data.get("relieving_letter_issued")
        experience_certificate_issued = form_data.get("experience_certificate_issued")
        assets_returned = form_data.get("assets_returned")
        exit_clearance_completed = form_data.get("exit_clearance_completed")
        file = form_data.get("file")
        
        print(f"employee_id: {employee_id}")
        print(f"resignation_date: {resignation_date}")
        print(f"notice_period_days: {notice_period_days}")
        
        # Basic validation
        if not employee_id:
            return JSONResponse({"error": "employee_id required"}, status_code=400)
        if not resignation_date:
            return JSONResponse({"error": "resignation_date required"}, status_code=400)
        
        # Convert employee_id
        if str(employee_id).startswith('user_'):
            emp_id = int(str(employee_id).replace('user_', ''))
        else:
            emp_id = int(employee_id)
        
        # Get database session - using test tenant for now
        from database import get_master_db
        engine = get_tenant_engine("test")
        db = Session(bind=engine)
        
        # Convert dates
        resignation_dt = datetime.strptime(resignation_date, "%Y-%m-%d").date()
        last_working_dt = datetime.strptime(last_working_date, "%Y-%m-%d").date()
        exit_interview_dt = None
        if exit_interview_date:
            exit_interview_dt = datetime.strptime(exit_interview_date, "%Y-%m-%d").date()
        
        # Create exit record with correct field mapping
        exit_record = EmployeeExit(
            employee_id=emp_id,
            resignation_date=resignation_dt,
            last_working_day=last_working_dt,
            reason=reason_for_leaving,  # Maps to 'reason' in model
            notice_period=notice_period_days,  # Maps to 'notice_period' in model
            exit_interview_date=exit_interview_dt,
            handover_status=handover_status,
            asset_return_status="Completed" if assets_returned == "true" else "Pending",
            final_settlement="Completed" if final_settlement_amount else "Pending",
            clearance_status="Completed" if exit_clearance_completed == "true" else "Pending",
            notes=exit_interview_feedback
        )
        
        db.add(exit_record)
        db.commit()
        db.refresh(exit_record)
        
        result = {
            "message": "Exit record created successfully",
            "id": exit_record.id,
            "employee_id": exit_record.employee_id
        }
        
        return JSONResponse(result)
        
    except Exception as e:
        print(f"Error in add_exit: {e}")
        if 'db' in locals():
            db.rollback()
        return JSONResponse({"error": str(e)}, status_code=500)
    finally:
        if 'db' in locals():
            db.close()

@router.get("/{employee_id}")
def get_exit(employee_id: str, user=Depends(get_current_user)):
    try:
        print(f"=== GET EXIT REQUEST: {employee_id} ===")
        
        # Extract numeric ID
        if employee_id.startswith('user_'):
            emp_id = int(employee_id.replace('user_', ''))
        else:
            emp_id = int(employee_id)
            
        print(f"Converted employee_id: {emp_id}")
        
        db = get_tenant_session(user)
        
        exit_data = db.query(EmployeeExit).filter(EmployeeExit.employee_id == emp_id).first()
        if not exit_data:
            print("No exit data found")
            return JSONResponse({"message": "No exit data found"}, status_code=404)
        
        # Convert to dict before closing session
        result = {
            "id": exit_data.id,
            "employee_id": exit_data.employee_id,
            "resignation_date": str(exit_data.resignation_date),
            "last_working_day": str(exit_data.last_working_day),
            "reason": exit_data.reason,
            "notice_period": exit_data.notice_period,
            "handover_status": exit_data.handover_status,
            "clearance_status": exit_data.clearance_status
        }
        print(f"Returning result: {result}")
        return JSONResponse(result)
    except Exception as e:
        print(f"Error in get_exit: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)
    finally:
        if 'db' in locals():
            db.close()