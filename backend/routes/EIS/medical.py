# routes/EIS/medical.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
import uuid

from routes.hospital import get_current_user
from database import get_tenant_engine
from utils.audit_logger import audit_crud
from models.models_tenant import EmployeeMedical
from schemas.schemas_tenant import MedicalCreate, MedicalOut


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


router = APIRouter(prefix="/employee/medical", tags=["Employee Medical Details"])


# -------------------------------------------------------------------------
# 1. ADD MEDICAL DETAILS (with optional certificate)
# -------------------------------------------------------------------------
@router.post("/add")
async def add_medical(
    employee_id: int = Form(...),
    blood_group: str = Form(...),
    height: str = Form(None),
    weight: str = Form(None),
    allergies: str = Form(None),
    chronic_conditions: str = Form(None),
    medications: str = Form(None),
    emergency_contact_name: str = Form(None),
    emergency_contact_phone: str = Form(None),
    emergency_contact_relation: str = Form(None),
    medical_insurance_provider: str = Form(None),
    medical_insurance_number: str = Form(None),
    remarks: str = Form(None),
    file: UploadFile = File(None),
    request: Request = None,
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
            file_extension = os.path.splitext(file.filename)[1]
            unique_filename = f"{uuid.uuid4()}_{file.filename}"
            file_path = f"uploads/{unique_filename}"
            
            # Save file to disk
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            file_name = file.filename

        med = EmployeeMedical(
            employee_id=employee_id,
            blood_group=blood_group,
            height=height,
            weight=weight,
            allergies=allergies,
            chronic_conditions=chronic_conditions,
            medications=medications,
            emergency_contact_name=emergency_contact_name,
            emergency_contact_phone=emergency_contact_phone,
            emergency_contact_relation=emergency_contact_relation,
            medical_insurance_provider=medical_insurance_provider,
            medical_insurance_number=medical_insurance_number,
            remarks=remarks,
            medical_certificate=file_path,
            certificate_name=file_name
        )

        db.add(med)
        db.commit()
        db.refresh(med)
        if request:
            audit_crud(request, user.get("tenant_db"), user, "CREATE", "employee_medical", med.id, None, med.__dict__)

        return {"message": "Medical details added successfully", "id": med.id}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Failed to add medical details: {str(e)}")
    finally:
        db.close()


# -------------------------------------------------------------------------
# 2. GET MEDICAL DETAILS
# -------------------------------------------------------------------------
@router.get("/{employee_id}", response_model=MedicalOut)
def get_medical(employee_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    med = db.query(EmployeeMedical).filter(EmployeeMedical.employee_id == employee_id).first()
    if not med:
        raise HTTPException(404, "No medical details found")

    return med


# -------------------------------------------------------------------------
# 3. UPDATE MEDICAL DETAILS
# -------------------------------------------------------------------------
@router.put("/{employee_id}")
async def update_medical(
    employee_id: int,
    blood_group: str = Form(...),
    height: str = Form(None),
    weight: str = Form(None),
    allergies: str = Form(None),
    chronic_conditions: str = Form(None),
    medications: str = Form(None),
    emergency_contact_name: str = Form(None),
    emergency_contact_phone: str = Form(None),
    emergency_contact_relation: str = Form(None),
    medical_insurance_provider: str = Form(None),
    medical_insurance_number: str = Form(None),
    remarks: str = Form(None),
    file: UploadFile = File(None),
    request: Request = None,
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)

    med = db.query(EmployeeMedical).filter(EmployeeMedical.employee_id == employee_id).first()
    if not med:
        raise HTTPException(404, "Medical record not found")

    med.blood_group = blood_group
    med.height = height
    med.weight = weight
    med.allergies = allergies
    med.chronic_conditions = chronic_conditions
    med.medications = medications
    med.emergency_contact_name = emergency_contact_name
    med.emergency_contact_phone = emergency_contact_phone
    med.emergency_contact_relation = emergency_contact_relation
    med.medical_insurance_provider = medical_insurance_provider
    med.medical_insurance_number = medical_insurance_number
    med.remarks = remarks
    
    if file:
        # Create uploads directory if it doesn't exist
        os.makedirs("uploads", exist_ok=True)
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = f"uploads/{unique_filename}"
        
        # Save file to disk
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        med.medical_certificate = file_path
        med.certificate_name = file.filename

    db.commit()
    db.refresh(med)
    if request:
        audit_crud(request, user.get("tenant_db"), user, "UPDATE", "employee_medical", employee_id, None, med.__dict__)

    return {"message": "Medical details updated successfully"}


# -------------------------------------------------------------------------
# 4. VIEW MEDICAL CERTIFICATE
# -------------------------------------------------------------------------
@router.get("/certificate/{employee_id}")
def view_certificate(employee_id: int, token: str = Query(None)):
    if not token:
        raise HTTPException(401, "Token required")
    
    from utils.token import verify_token
    user = verify_token(token)
    if not user:
        raise HTTPException(401, "Invalid or expired token")
    
    db = get_tenant_session(user)
    
    med = db.query(EmployeeMedical).filter(EmployeeMedical.employee_id == employee_id).first()
    if not med or not med.medical_certificate:
        raise HTTPException(404, "Medical certificate not found")
    
    file_path = med.medical_certificate
    if not os.path.exists(file_path):
        raise HTTPException(404, "File not found")
    
    # Determine media type for inline viewing
    file_ext = os.path.splitext(med.certificate_name)[1].lower() if med.certificate_name else ''
    
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
# 5. DELETE MEDICAL RECORD
# -------------------------------------------------------------------------
@router.delete("/{employee_id}")
def delete_medical(employee_id: int, request: Request, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    med = db.query(EmployeeMedical).filter(EmployeeMedical.employee_id == employee_id).first()
    if not med:
        raise HTTPException(404, "Medical record not found")

    old_values = med.__dict__.copy()
    db.delete(med)
    db.commit()
    audit_crud(request, user.get("tenant_db"), user, "DELETE", "employee_medical", employee_id, old_values, None)

    return {"message": "Medical record removed successfully"}
