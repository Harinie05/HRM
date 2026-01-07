# routes/EIS/exit.py

from fastapi import APIRouter, Depends, HTTPException, Request, Form, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from routes.hospital import get_current_user
from database import get_tenant_engine
from utils.audit_logger import audit_crud
from models.models_tenant import EISEmployeeExit, User
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

@router.get("/get-simple/{employee_id}")
def get_exit_simple(employee_id: str):
    try:
        print(f"=== SIMPLE GET EXIT REQUEST: {employee_id} ===")
        return JSONResponse({"message": f"Simple GET working for {employee_id}"})
    except Exception as e:
        print(f"Error: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@router.post("/test-form")
async def test_form_endpoint(
    test_field: str = Form(...),
    test_file: Optional[UploadFile] = File(None)
):
    return {"message": "Test form endpoint working", "field": test_field}

@router.post("/add-json")
async def add_exit_json(request: Request):
    try:
        print("=== JSON EXIT ADD REQUEST RECEIVED ===")
        
        # Parse JSON data
        json_data = await request.json()
        print(f"JSON data: {json_data}")
        
        # Extract fields
        employee_id = json_data.get("employee_id")
        resignation_date = json_data.get("resignation_date")
        last_working_day = json_data.get("last_working_day")
        
        # Basic validation
        if not employee_id or not resignation_date or not last_working_day:
            return JSONResponse({"error": "Missing required fields"}, status_code=400)
        
        # Convert employee_id
        if str(employee_id).startswith('user_'):
            emp_id = int(str(employee_id).replace('user_', ''))
        else:
            emp_id = int(str(employee_id))
        
        # Get database session
        engine = get_tenant_engine("test")
        db = Session(bind=engine)
        
        # Convert dates
        resignation_dt = datetime.strptime(str(resignation_date), "%Y-%m-%d").date()
        last_working_dt = datetime.strptime(str(last_working_day), "%Y-%m-%d").date()
        
        # Create record
        exit_record = EISEmployeeExit(
            employee_id=emp_id,
            resignation_date=resignation_dt,
            last_working_day=last_working_dt,
            notice_period="30",
            handover_status="Pending"
        )
        
        db.add(exit_record)
        db.commit()
        db.refresh(exit_record)
        
        return JSONResponse({
            "message": "Exit record created successfully",
            "id": exit_record.id
        })
        
    except Exception as e:
        print(f"Error: {e}")
        if 'db' in locals():
            db.rollback()
        return JSONResponse({"error": str(e)}, status_code=500)
    finally:
        if 'db' in locals():
            db.close()

@router.post("/add")
async def add_exit(request: Request):
    try:
        print("=== EXIT ADD REQUEST RECEIVED ===")
        
        # Parse form data manually
        form_data = await request.form()
        print(f"Form data keys: {list(form_data.keys())}")
        print(f"Form data values: {dict(form_data)}")
        
        # Extract form fields
        employee_id = form_data.get("employee_id")
        resignation_date = form_data.get("resignation_date")
        last_working_day = form_data.get("last_working_day")
        notice_period = form_data.get("notice_period")
        reason = form_data.get("reason")
        exit_interview_date = form_data.get("exit_interview_date")
        handover_status = form_data.get("handover_status", "Pending")
        
        print(f"Raw values - employee_id: {employee_id}, resignation_date: {resignation_date}, last_working_day: {last_working_day}")
        
        # Basic validation
        if not employee_id:
            print("ERROR: employee_id missing")
            return JSONResponse({"error": "employee_id required"}, status_code=400)
        if not resignation_date:
            print("ERROR: resignation_date missing")
            return JSONResponse({"error": "resignation_date required"}, status_code=400)
        if not last_working_day:
            print("ERROR: last_working_day missing")
            return JSONResponse({"error": "last_working_day required"}, status_code=400)
        
        # Convert employee_id
        try:
            if str(employee_id).startswith('user_'):
                emp_id = int(str(employee_id).replace('user_', ''))
            else:
                emp_id = int(str(employee_id))
            print(f"Converted emp_id: {emp_id}")
        except Exception as e:
            print(f"ERROR converting employee_id: {e}")
            return JSONResponse({"error": f"Invalid employee_id: {e}"}, status_code=400)
        
        # Get database session - using test tenant for now
        try:
            from database import get_master_db
            engine = get_tenant_engine("test")
            db = Session(bind=engine)
            print("Database connection established")
        except Exception as e:
            print(f"ERROR connecting to database: {e}")
            return JSONResponse({"error": f"Database connection failed: {e}"}, status_code=500)
        
        # Convert dates
        try:
            resignation_dt = datetime.strptime(str(resignation_date), "%Y-%m-%d").date()
            last_working_dt = datetime.strptime(str(last_working_day), "%Y-%m-%d").date()
            exit_interview_dt = None
            if exit_interview_date and str(exit_interview_date).strip():
                exit_interview_dt = datetime.strptime(str(exit_interview_date), "%Y-%m-%d").date()
            print(f"Dates converted - resignation: {resignation_dt}, last_working: {last_working_dt}, exit_interview: {exit_interview_dt}")
        except Exception as e:
            print(f"ERROR converting dates: {e}")
            return JSONResponse({"error": f"Invalid date format: {e}"}, status_code=400)
        
        # Create exit record with all provided fields
        try:
            print("Creating EISEmployeeExit record...")
            exit_record = EISEmployeeExit(
                employee_id=emp_id,
                resignation_date=resignation_dt,
                last_working_day=last_working_dt,
                notice_period=str(notice_period) if notice_period else "30",
                reason=str(reason) if reason else None,
                exit_interview_date=exit_interview_dt,
                handover_status=str(handover_status)
            )
            print(f"Record created with values: emp_id={emp_id}, resignation={resignation_dt}, last_working={last_working_dt}")
        except Exception as e:
            print(f"ERROR creating record: {e}")
            return JSONResponse({"error": f"Failed to create record: {e}"}, status_code=500)
        
        try:
            print("Adding to database...")
            db.add(exit_record)
            print("Committing...")
            db.commit()
            print("Refreshing...")
            db.refresh(exit_record)
            print("Database operations completed successfully")
        except Exception as e:
            print(f"ERROR in database operations: {e}")
            db.rollback()
            return JSONResponse({"error": f"Database error: {e}"}, status_code=500)
        
        result = {
            "message": "Exit record created successfully",
            "id": exit_record.id,
            "employee_id": exit_record.employee_id
        }
        
        print(f"Success: {result}")
        return JSONResponse(result)
        
    except Exception as e:
        print(f"UNEXPECTED ERROR in add_exit: {e}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        if 'db' in locals():
            db.rollback()
        return JSONResponse({"error": str(e)}, status_code=500)
    finally:
        if 'db' in locals():
            db.close()

@router.get("/{employee_id}")
def get_exit(employee_id: str):
    try:
        print(f"=== GET EXIT REQUEST: {employee_id} ===")
        
        # Extract numeric ID
        if employee_id.startswith('user_'):
            emp_id = int(employee_id.replace('user_', ''))
        else:
            emp_id = int(employee_id)
            
        print(f"Converted employee_id: {emp_id}")
        
        # Get database session directly
        engine = get_tenant_engine("test")
        db = Session(bind=engine)
        
        exit_data = db.query(EISEmployeeExit).filter(EISEmployeeExit.employee_id == emp_id).first()
        if not exit_data:
            print("No exit data found")
            return JSONResponse({"message": "No exit data found"}, status_code=404)
        
        # Convert to dict with only available fields
        result = {
            "id": exit_data.id,
            "employee_id": exit_data.employee_id,
            "resignation_date": str(exit_data.resignation_date) if exit_data.resignation_date else None,
            "last_working_day": str(exit_data.last_working_day) if exit_data.last_working_day else None,
            "reason": exit_data.reason,
            "notice_period": exit_data.notice_period,
            "handover_status": exit_data.handover_status,
            "exit_interview_date": str(exit_data.exit_interview_date) if exit_data.exit_interview_date else None
        }
        print(f"Returning result: {result}")
        return JSONResponse(result)
    except Exception as e:
        print(f"Error in get_exit: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return JSONResponse({"error": str(e)}, status_code=500)
    finally:
        if 'db' in locals():
            db.close()