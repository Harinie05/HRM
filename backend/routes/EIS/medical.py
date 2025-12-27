# routes/EIS/medical.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
import uuid
import json

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
    employee_id: str = Form(...),
    blood_group: str = Form(None),
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
    medical_council_registration_number: str = Form(None),
    medical_council_name: str = Form(None),
    medical_council_expiry_date: str = Form(None),
    vaccination_records: str = Form(None),
    professional_licenses: str = Form(None),
    license_alert_enabled: str = Form("true"),
    license_alert_days: str = Form("30"),
    remarks: str = Form(None),
    file: UploadFile = File(None),
    request: Request = None,
    user=Depends(get_current_user)
):
    print(f"DEBUG: Received license_alert_enabled: {license_alert_enabled} (type: {type(license_alert_enabled)})")
    print(f"DEBUG: Received license_alert_days: {license_alert_days} (type: {type(license_alert_days)})")
    print(f"DEBUG: Received employee_id: {employee_id} (type: {type(employee_id)})")
    
    db = get_tenant_session(user)
    try:
        # Extract numeric ID if it has 'user_' prefix
        if isinstance(employee_id, str) and employee_id.startswith('user_'):
            employee_id = int(employee_id.replace('user_', ''))
        elif isinstance(employee_id, str):
            employee_id = int(employee_id)
        
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

        # Convert string values to proper types
        license_alert_enabled_bool = license_alert_enabled.lower() == "true" if license_alert_enabled else True
        license_alert_days_int = int(license_alert_days) if license_alert_days else 30
        
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
            medical_council_registration_number=medical_council_registration_number,
            medical_council_name=medical_council_name,
            medical_council_expiry_date=medical_council_expiry_date,
            vaccination_records=json.loads(vaccination_records) if vaccination_records else None,
            professional_licenses=json.loads(professional_licenses) if professional_licenses else None,
            license_alert_enabled=license_alert_enabled_bool,
            license_alert_days=license_alert_days_int,
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
        print(f"DEBUG: Medical add error: {str(e)}")
        print(f"DEBUG: Error type: {type(e)}")
        import traceback
        print(f"DEBUG: Traceback: {traceback.format_exc()}")
        raise HTTPException(500, f"Failed to add medical details: {str(e)}")
    finally:
        db.close()


# -------------------------------------------------------------------------
# 6. GET LICENSE RENEWAL ALERTS
# -------------------------------------------------------------------------
@router.get("/license-alerts")
def get_license_alerts(user=Depends(get_current_user)):
    """Get all employees with licenses expiring soon"""
    db = get_tenant_session(user)
    from datetime import datetime, timedelta
    
    try:
        # Get all medical records with professional licenses
        medical_records = db.query(EmployeeMedical).filter(
            EmployeeMedical.professional_licenses.isnot(None),
            EmployeeMedical.license_alert_enabled == True
        ).all()
        
        alerts = []
        today = datetime.now().date()
        
        for record in medical_records:
            if record.professional_licenses:
                for license_data in record.professional_licenses:
                    if license_data.get('expiry_date'):
                        try:
                            expiry_date = datetime.strptime(license_data['expiry_date'], '%Y-%m-%d').date()
                            days_until_expiry = (expiry_date - today).days
                            
                            # Check if license is expiring within alert days
                            if days_until_expiry <= record.license_alert_days and days_until_expiry >= 0:
                                alerts.append({
                                    'employee_id': record.employee_id,
                                    'license_type': license_data.get('license_type'),
                                    'license_number': license_data.get('license_number'),
                                    'expiry_date': license_data.get('expiry_date'),
                                    'days_until_expiry': days_until_expiry,
                                    'status': license_data.get('status', 'Active'),
                                    'alert_level': 'critical' if days_until_expiry <= 7 else 'warning'
                                })
                        except ValueError:
                            continue
        
        return {'alerts': alerts}
        
    except Exception as e:
        raise HTTPException(500, f"Failed to get license alerts: {str(e)}")
    finally:
        db.close()


# -------------------------------------------------------------------------
# 2. GET MEDICAL DETAILS
# -------------------------------------------------------------------------
@router.get("/{employee_id}", response_model=MedicalOut)
def get_medical(employee_id: str, user=Depends(get_current_user)):
    # Extract numeric ID if it has 'user_' prefix
    if employee_id.startswith('user_'):
        employee_id = int(employee_id.replace('user_', ''))
    else:
        employee_id = int(employee_id)
    
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
    employee_id: str,
    blood_group: str = Form(None),
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
    medical_council_registration_number: str = Form(None),
    medical_council_name: str = Form(None),
    medical_council_expiry_date: str = Form(None),
    vaccination_records: str = Form(None),
    professional_licenses: str = Form(None),
    license_alert_enabled: str = Form("true"),
    license_alert_days: str = Form("30"),
    remarks: str = Form(None),
    file: UploadFile = File(None),
    request: Request = None,
    user=Depends(get_current_user)
):
    # Extract numeric ID if it has 'user_' prefix
    if employee_id.startswith('user_'):
        employee_id = int(employee_id.replace('user_', ''))
    else:
        employee_id = int(employee_id)
    
    db = get_tenant_session(user)
    try:
        med = db.query(EmployeeMedical).filter(EmployeeMedical.employee_id == employee_id).first()
        if not med:
            raise HTTPException(404, "Medical record not found")

        # Convert string values to proper types
        license_alert_enabled_bool = license_alert_enabled.lower() == "true" if license_alert_enabled else True
        license_alert_days_int = int(license_alert_days) if license_alert_days else 30
        
        # Update fields
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
        med.medical_council_registration_number = medical_council_registration_number
        med.medical_council_name = medical_council_name
        med.medical_council_expiry_date = medical_council_expiry_date
        med.vaccination_records = json.loads(vaccination_records) if vaccination_records else None
        med.professional_licenses = json.loads(professional_licenses) if professional_licenses else None
        med.license_alert_enabled = license_alert_enabled_bool
        med.license_alert_days = license_alert_days_int
        med.remarks = remarks
        
        if file:
            os.makedirs("uploads", exist_ok=True)
            file_extension = os.path.splitext(file.filename)[1]
            unique_filename = f"{uuid.uuid4()}_{file.filename}"
            file_path = f"uploads/{unique_filename}"
            
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
        
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Failed to update medical details: {str(e)}")
    finally:
        db.close()


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
# 7. DELETE MEDICAL RECORD
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
