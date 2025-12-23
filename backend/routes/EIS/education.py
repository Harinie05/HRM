# routes/EIS/education.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid

from routes.hospital import get_current_user
from database import get_tenant_engine
from utils.audit_logger import audit_crud
from models.models_tenant import EmployeeEducation
from schemas.schemas_tenant import EducationCreate, EducationOut
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

router = APIRouter(prefix="/employee/education", tags=["Employee Education"])

# -------------------------------------------------------------------------
# 1. ADD EDUCATION RECORD
# -------------------------------------------------------------------------
@router.post("/add")
async def add_education(
    employee_id: int = Form(...),
    degree: str = Form(...),
    specialization: str = Form(""),
    university: str = Form(...),
    board_university: str = Form(""),
    start_year: str = Form(""),
    end_year: str = Form(""),
    percentage_cgpa: str = Form(""),
    education_type: str = Form("Full-time"),
    country: str = Form("India"),
    state: str = Form(""),
    city: str = Form(""),
    year: str = Form(""),  # Keep for backward compatibility
    file: Optional[UploadFile] = File(None),
    request: Request = None,
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)
    
    file_path = None
    file_name = None
    if file:
        # Create uploads directory if it doesn't exist
        os.makedirs("uploads", exist_ok=True)
        
        # Generate unique filename
        filename = file.filename or 'unknown'
        file_extension = os.path.splitext(filename)[1]
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = f"uploads/{unique_filename}"
        
        # Save file to disk
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        file_name = filename

    education = EmployeeEducation(
        employee_id=employee_id,
        degree=degree,
        specialization=specialization,
        university=university,
        board_university=board_university,
        start_year=start_year,
        end_year=end_year or year,  # Use end_year if provided, fallback to year
        percentage_cgpa=percentage_cgpa,
        education_type=education_type,
        country=country,
        state=state,
        city=city,
        certificate=file_path,
        file_name=file_name
    )

    db.add(education)
    db.commit()
    db.refresh(education)
    if request:
        audit_crud(request, user.get("tenant_db"), user, "CREATE", "employee_education", education.id, None, education.__dict__)

    return education

# -------------------------------------------------------------------------
# 2. GET EDUCATION RECORDS
# -------------------------------------------------------------------------
@router.get("/{employee_id}")
def get_education(employee_id: int, user=Depends(get_current_user)):
    try:
        db = get_tenant_session(user)
        print(f"Fetching education for employee_id: {employee_id}")

        records = (
            db.query(EmployeeEducation)
            .filter(EmployeeEducation.employee_id == employee_id)
            .all()
        )
        
        print(f"Found {len(records)} education records")
        
        # Convert to dict to avoid serialization issues
        result = []
        for record in records:
            result.append({
                "id": record.id,
                "employee_id": record.employee_id,
                "degree": record.degree,
                "specialization": record.specialization,
                "university": record.university,
                "board_university": getattr(record, 'board_university', None),
                "start_year": getattr(record, 'start_year', None),
                "end_year": getattr(record, 'end_year', None),
                "year": getattr(record, 'year', None),
                "percentage_cgpa": getattr(record, 'percentage_cgpa', None),
                "education_type": getattr(record, 'education_type', None),
                "country": getattr(record, 'country', None),
                "state": getattr(record, 'state', None),
                "city": getattr(record, 'city', None),
                "file_name": getattr(record, 'file_name', None),
                "certificate": getattr(record, 'certificate', None)
            })
        
        # Sort by end_year if available, otherwise by year, with newest first
        def sort_key(record):
            return record.get('end_year') or record.get('year') or "0000"
        
        sorted_result = sorted(result, key=sort_key, reverse=True)
        print(f"Returning {len(sorted_result)} records")
        return sorted_result
        
    except Exception as e:
        print(f"Error in get_education: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Internal server error: {str(e)}")

# -------------------------------------------------------------------------
# 3. UPDATE EDUCATION RECORD
# -------------------------------------------------------------------------
@router.put("/{education_id}")
async def update_education(
    education_id: int,
    degree: str = Form(...),
    specialization: str = Form(""),
    university: str = Form(...),
    board_university: str = Form(""),
    start_year: str = Form(""),
    end_year: str = Form(""),
    percentage_cgpa: str = Form(""),
    education_type: str = Form("Full-time"),
    country: str = Form("India"),
    state: str = Form(""),
    city: str = Form(""),
    year: str = Form(""),  # Keep for backward compatibility
    file: Optional[UploadFile] = File(None),
    request: Request = None,
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)

    education = db.query(EmployeeEducation).filter(EmployeeEducation.id == education_id).first()
    if not education:
        raise HTTPException(404, "Education record not found")

    setattr(education, 'degree', degree)
    setattr(education, 'specialization', specialization or '')
    setattr(education, 'university', university)
    setattr(education, 'board_university', board_university or '')
    setattr(education, 'start_year', start_year or '')
    setattr(education, 'end_year', end_year or year or '')
    setattr(education, 'percentage_cgpa', percentage_cgpa or '')
    setattr(education, 'education_type', education_type or 'Full-time')
    setattr(education, 'country', country or 'India')
    setattr(education, 'state', state or '')
    setattr(education, 'city', city or '')

    if file:
        # Create uploads directory if it doesn't exist
        os.makedirs("uploads", exist_ok=True)
        
        # Generate unique filename
        filename = file.filename or 'unknown'
        file_extension = os.path.splitext(filename)[1]
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = f"uploads/{unique_filename}"
        
        # Save file to disk
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        setattr(education, 'certificate', file_path)
        setattr(education, 'file_name', filename)

    db.commit()
    db.refresh(education)
    if request:
        audit_crud(request, user.get("tenant_db"), user, "UPDATE", "employee_education", education_id, None, education.__dict__)

    return education

# -------------------------------------------------------------------------
# 4. VIEW EDUCATION CERTIFICATE
# -------------------------------------------------------------------------
@router.get("/certificate/{education_id}")
def view_certificate(education_id: int, token: str = Query(None)):
    if not token:
        raise HTTPException(401, "Token required")
    
    from utils.token import verify_token
    user = verify_token(token)
    if not user:
        raise HTTPException(401, "Invalid or expired token")
    
    db = get_tenant_session(user)
    
    education = db.query(EmployeeEducation).filter(EmployeeEducation.id == education_id).first()
    if not education or not getattr(education, 'certificate', None):
        raise HTTPException(404, "Certificate not found")
    
    file_path = getattr(education, 'certificate', None)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(404, "File not found")
    
    # Determine media type for inline viewing
    file_name = getattr(education, 'file_name', None) or ''
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
# 4.5. DEBUG EDUCATION DATA
# -------------------------------------------------------------------------
@router.get("/debug/{education_id}")
def debug_education(education_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    education = db.query(EmployeeEducation).filter(EmployeeEducation.id == education_id).first()
    
    if not education:
        return {"error": "Education record not found"}
    
    certificate_value = getattr(education, 'certificate', None) or ''
    return {
        "id": education.id,
        "degree": education.degree,
        "file_name": education.file_name,
        "has_certificate": bool(certificate_value),
        "certificate_length": len(certificate_value) if certificate_value else 0,
        "certificate_start": certificate_value[:100] if certificate_value else None
    }

# -------------------------------------------------------------------------
# 5. DELETE EDUCATION RECORD
# -------------------------------------------------------------------------
@router.delete("/{education_id}")
def delete_education(education_id: int, request: Request, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    education = db.query(EmployeeEducation).filter(EmployeeEducation.id == education_id).first()
    if not education:
        raise HTTPException(404, "Education record not found")

    old_values = education.__dict__.copy()
    db.delete(education)
    db.commit()
    audit_crud(request, user.get("tenant_db"), user, "DELETE", "employee_education", education_id, old_values, None)

    return {"message": "Education record deleted successfully"}