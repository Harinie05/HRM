# routes/EIS/experience.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Header
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid

from routes.hospital import get_current_user
from database import get_tenant_engine
from models.models_tenant import EmployeeExperience
from schemas.schemas_tenant import ExperienceCreate, ExperienceOut


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


router = APIRouter(prefix="/employee/experience", tags=["Employee Experience Details"])


# -------------------------------------------------------------------------
# 1. ADD EXPERIENCE + RELIEVING LETTER (OPTIONAL FILE)
# -------------------------------------------------------------------------
@router.post("/add")
async def add_experience(
    employee_id: int = Form(...),
    company: str = Form(...),
    job_title: str = Form(...),
    department: str = Form(""),
    employment_type: str = Form(""),
    start_date: Optional[str] = Form(None),
    end_date: Optional[str] = Form(None),
    current_job: bool = Form(False),
    salary: str = Form(""),
    location: str = Form(""),
    job_description: str = Form(""),
    achievements: str = Form(""),
    reason_for_leaving: str = Form(""),
    reporting_manager: str = Form(""),
    manager_contact: str = Form(""),
    # Keep old fields for backward compatibility
    role: str = Form(""),
    from_year: str = Form(""),
    to_year: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)
    try:
        file_path = None
        file_name = None

        if file:
            # Create uploads directory if it doesn't exist
            os.makedirs("uploads", exist_ok=True)
            
            # Generate unique filename
            filename = str(file.filename) if file.filename else 'unknown'
            file_extension = os.path.splitext(filename)[1]
            unique_filename = f"{uuid.uuid4()}_{filename}"
            file_path = f"uploads/{unique_filename}"
            
            # Save file to disk
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            file_name = filename

        new_exp = EmployeeExperience(
            employee_id=employee_id,
            company=company,
            job_title=job_title,
            department=department or '',
            employment_type=employment_type or '',
            start_date=start_date,
            end_date=end_date,
            current_job=current_job,
            salary=salary or '',
            location=location or '',
            job_description=job_description or '',
            achievements=achievements or '',
            reason_for_leaving=reason_for_leaving or '',
            reporting_manager=reporting_manager or '',
            manager_contact=manager_contact or '',
            relieving_doc=file_path,
            file_name=file_name or ''
        )

        db.add(new_exp)
        db.commit()
        db.refresh(new_exp)

        return new_exp
        
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Failed to add experience: {str(e)}")
    finally:
        db.close()


# -------------------------------------------------------------------------
# 2. LIST EXPERIENCE RECORDS
# -------------------------------------------------------------------------
@router.get("/{employee_id}")
def get_experience_list(employee_id: int, user=Depends(get_current_user)):
    try:
        db = get_tenant_session(user)
        print(f"Fetching experience for employee_id: {employee_id}")

        records = (
            db.query(EmployeeExperience)
            .filter(EmployeeExperience.employee_id == employee_id)
            .all()
        )
        
        print(f"Found {len(records)} experience records")
        
        # Convert to dict to avoid serialization issues
        result = []
        for record in records:
            result.append({
                "id": record.id,
                "employee_id": record.employee_id,
                "company": record.company,
                "job_title": getattr(record, 'job_title', getattr(record, 'role', None)),
                "role": getattr(record, 'role', None),
                "department": getattr(record, 'department', None),
                "employment_type": getattr(record, 'employment_type', None),
                "start_date": getattr(record, 'start_date', None),
                "end_date": getattr(record, 'end_date', None),
                "from_year": getattr(record, 'from_year', None),
                "to_year": getattr(record, 'to_year', None),
                "current_job": getattr(record, 'current_job', False),
                "salary": getattr(record, 'salary', None),
                "location": getattr(record, 'location', None),
                "job_description": getattr(record, 'job_description', None),
                "achievements": getattr(record, 'achievements', None),
                "reason_for_leaving": getattr(record, 'reason_for_leaving', None),
                "reporting_manager": getattr(record, 'reporting_manager', None),
                "manager_contact": getattr(record, 'manager_contact', None),
                "file_name": getattr(record, 'file_name', None),
                "relieving_doc": getattr(record, 'relieving_doc', None)
            })
        
        # Sort by start_date or from_year, newest first
        def sort_key(record):
            return str(record.get('start_date') or record.get('from_year') or "0000")
        
        sorted_result = sorted(result, key=sort_key, reverse=True)
        print(f"Returning {len(sorted_result)} records")
        return sorted_result
        
    except Exception as e:
        print(f"Error in get_experience_list: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Internal server error: {str(e)}")


# -------------------------------------------------------------------------
# 3. UPDATE EXPERIENCE RECORD
# -------------------------------------------------------------------------
@router.put("/{experience_id}")
async def update_experience(
    experience_id: int,
    company: str = Form(...),
    job_title: str = Form(...),
    department: str = Form(""),
    employment_type: str = Form(""),
    start_date: Optional[str] = Form(None),
    end_date: Optional[str] = Form(None),
    current_job: bool = Form(False),
    salary: str = Form(""),
    location: str = Form(""),
    job_description: str = Form(""),
    achievements: str = Form(""),
    reason_for_leaving: str = Form(""),
    reporting_manager: str = Form(""),
    manager_contact: str = Form(""),
    file: Optional[UploadFile] = File(None),
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)

    exp = db.query(EmployeeExperience).filter(EmployeeExperience.id == experience_id).first()
    if not exp:
        raise HTTPException(404, "Experience record not found")

    setattr(exp, 'company', company)
    setattr(exp, 'job_title', job_title)
    setattr(exp, 'department', department or '')
    setattr(exp, 'employment_type', employment_type or '')
    setattr(exp, 'start_date', start_date)
    setattr(exp, 'end_date', end_date)
    setattr(exp, 'current_job', current_job)
    setattr(exp, 'salary', salary or '')
    setattr(exp, 'location', location or '')
    setattr(exp, 'job_description', job_description or '')
    setattr(exp, 'achievements', achievements or '')
    setattr(exp, 'reason_for_leaving', reason_for_leaving or '')
    setattr(exp, 'reporting_manager', reporting_manager or '')
    setattr(exp, 'manager_contact', manager_contact or '')

    if file:
        # Create uploads directory if it doesn't exist
        os.makedirs("uploads", exist_ok=True)
        
        # Generate unique filename
        filename = str(file.filename) if file.filename else 'unknown'
        file_extension = os.path.splitext(filename)[1]
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = f"uploads/{unique_filename}"
        
        # Save file to disk
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        setattr(exp, 'relieving_doc', file_path)
        setattr(exp, 'file_name', filename or '')

    db.commit()
    db.refresh(exp)

    return exp


# -------------------------------------------------------------------------
# 4. VIEW EXPERIENCE DOCUMENT
# -------------------------------------------------------------------------
@router.get("/document/{experience_id}")
def view_document(experience_id: int, token: Optional[str] = Query(None), Authorization: Optional[str] = None):
    # Handle authentication - either from query parameter or header
    user = None
    
    if token:
        # Use token from query parameter
        from utils.token import verify_token
        payload = verify_token(token)
        if not payload:
            raise HTTPException(401, "Invalid or expired token")
        user = payload
    elif Authorization:
        # Use Authorization header
        try:
            if not Authorization.startswith('Bearer '):
                raise HTTPException(401, "Invalid token format")
            
            token_from_header = Authorization.split(" ")[1]
            from utils.token import verify_token
            payload = verify_token(token_from_header)
            if not payload:
                raise HTTPException(401, "Token expired/invalid")
            user = payload
        except Exception as e:
            raise HTTPException(401, "Token required")
    else:
        raise HTTPException(401, "Token required")
    
    db = get_tenant_session(user)
    
    exp = db.query(EmployeeExperience).filter(EmployeeExperience.id == experience_id).first()
    if not exp or not getattr(exp, 'relieving_doc', None):
        raise HTTPException(404, "Document not found")
    
    file_path = str(getattr(exp, 'relieving_doc', '')) if getattr(exp, 'relieving_doc', None) else ''
    if not os.path.exists(file_path):
        raise HTTPException(404, "File not found")
    
    # Determine media type for inline viewing
    file_name = str(getattr(exp, 'file_name', '')) if getattr(exp, 'file_name', None) else ''
    file_ext = os.path.splitext(file_name)[1].lower() if file_name else ''
    
    if file_ext == '.pdf':
        media_type = 'application/pdf'
    elif file_ext in ['.jpg', '.jpeg']:
        media_type = 'image/jpeg'
    elif file_ext == '.png':
        media_type = 'image/png'
    else:
        media_type = 'application/octet-stream'
    
    return FileResponse(
        path=file_path,
        media_type=media_type,
        headers={"Content-Disposition": "inline"}
    )

# -------------------------------------------------------------------------
# 5. DELETE EXPERIENCE RECORD
# -------------------------------------------------------------------------
@router.delete("/{experience_id}")
def delete_experience(experience_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    exp = db.query(EmployeeExperience).filter(EmployeeExperience.id == experience_id).first()
    if not exp:
        raise HTTPException(404, "Experience record not found")

    db.delete(exp)
    db.commit()

    return {"message": "Experience record deleted successfully"}
