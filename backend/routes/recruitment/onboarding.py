from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from sqlalchemy.orm import Session
from database import get_master_db, get_tenant_engine
from models.models_master import Hospital
from models.models_tenant import (
    JobApplication, OfferLetter, BGV, OnboardingCandidate, 
    DocumentUpload, User, Department, Branch, Grade
)
from routes.hospital import get_current_user
from typing import List, Optional
from utils.email import send_email
import uuid
import json
from datetime import datetime

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])

def get_tenant_session(user):
    tenant_db = user.get("tenant_db")
    master = next(get_master_db())
    hospital = master.query(Hospital).filter(Hospital.db_name == tenant_db).first()
    if not hospital:
        raise HTTPException(404, "Hospital not found")
    engine = get_tenant_engine(hospital.db_name)
    return Session(bind=engine)

@router.get("/candidates")
def get_onboarding_candidates(user=Depends(get_current_user)):
    db = get_tenant_session(user)
    
    bgv_cleared = db.query(BGV).filter(BGV.status == "Cleared").all()
    candidates = []
    
    for bgv in bgv_cleared:
        candidate = db.query(JobApplication).filter(JobApplication.id == bgv.application_id).first()
        offer = db.query(OfferLetter).filter(OfferLetter.application_id == bgv.application_id).first()
        onboarding = db.query(OnboardingCandidate).filter(OnboardingCandidate.application_id == bgv.application_id).first()
        
        if candidate and offer:
            candidates.append({
                "id": candidate.id,
                "name": str(candidate.name),
                "job_title": str(offer.job_title),
                "department": str(offer.department),
                "joining_date": str(offer.joining_date) if str(offer.joining_date) != 'None' else None,
                "location": str(offer.location),
                "ctc": offer.ctc,
                "onboarding_status": str(onboarding.status) if onboarding else "Not Started",
                "onboarding_id": onboarding.id if onboarding else None
            })
    
    return candidates

@router.post("/start/{candidate_id}")
def start_onboarding(candidate_id: int, request: dict, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    
    candidate = db.query(JobApplication).filter(JobApplication.id == candidate_id).first()
    if not candidate:
        raise HTTPException(404, "Candidate not found")
    
    offer = db.query(OfferLetter).filter(OfferLetter.application_id == candidate_id).first()
    
    # Use joining date from request if provided, otherwise from offer
    joining_date = None
    if request.get("joining_date"):
        from datetime import datetime
        try:
            joining_date = datetime.strptime(request["joining_date"], "%Y-%m-%d").date()
        except:
            joining_date = offer.joining_date if offer else None
    else:
        joining_date = offer.joining_date if offer else None
    
    onboarding = OnboardingCandidate(
        application_id=candidate_id,
        candidate_name=candidate.name,
        job_title=offer.job_title if offer else "Not specified",
        department=offer.department if offer else "Not specified",
        joining_date=joining_date,
        work_location=request.get("work_location"),
        reporting_manager=request.get("reporting_manager"),
        work_shift=request.get("work_shift", "General"),
        probation_period=request.get("probation_period", "3 Months"),
        status="Pending Docs"
    )
    
    db.add(onboarding)
    db.commit()
    db.refresh(onboarding)
    
    return onboarding

@router.post("/documents/upload/{onboarding_id}")
def upload_documents(onboarding_id: int, files: List[UploadFile] = File(...), user=Depends(get_current_user)):
    db = get_tenant_session(user)
    
    onboarding = db.query(OnboardingCandidate).filter(OnboardingCandidate.id == onboarding_id).first()
    if not onboarding:
        raise HTTPException(404, "Onboarding record not found")
    
    uploaded_docs = []
    for file in files:
        if file.filename:
            file_path = f"uploads/{uuid.uuid4()}_{file.filename}"
            
            doc = DocumentUpload(
                onboarding_id=onboarding_id,
                document_type=file.filename.split('_')[0] if '_' in file.filename else "Other",
                file_name=file.filename,
                file_path=file_path,
                status="Uploaded"
            )
            db.add(doc)
            uploaded_docs.append(doc)
    
    setattr(onboarding, 'status', "Docs Submitted")
    db.commit()
    
    return {"message": f"{len(uploaded_docs)} documents uploaded successfully"}

@router.put("/documents/verify/{doc_id}")
def verify_document(doc_id: int, request: dict, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    
    doc = db.query(DocumentUpload).filter(DocumentUpload.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    
    setattr(doc, 'status', request.get('status', 'Verified'))
    setattr(doc, 'remarks', request.get('remarks', ''))
    db.commit()
    
    return {"message": "Document verification updated"}

@router.get("/details/{onboarding_id}")
def get_onboarding_details(onboarding_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    
    onboarding = db.query(OnboardingCandidate).filter(OnboardingCandidate.id == onboarding_id).first()
    if not onboarding:
        raise HTTPException(404, "Onboarding record not found")
    
    documents = db.query(DocumentUpload).filter(DocumentUpload.onboarding_id == onboarding_id).all()
    candidate = db.query(JobApplication).filter(JobApplication.id == onboarding.application_id).first()
    
    return {
        "onboarding": {
            "id": onboarding.id,
            "candidate_name": str(onboarding.candidate_name),
            "job_title": str(onboarding.job_title),
            "department": str(onboarding.department),
            "joining_date": str(onboarding.joining_date) if str(onboarding.joining_date) != 'None' else None,
            "work_location": str(onboarding.work_location) if str(onboarding.work_location) != 'None' else None,
            "reporting_manager": str(onboarding.reporting_manager) if str(onboarding.reporting_manager) != 'None' else None,
            "work_shift": str(onboarding.work_shift),
            "probation_period": str(onboarding.probation_period),
            "status": str(onboarding.status),
            "employee_grade": str(onboarding.employee_grade) if str(onboarding.employee_grade) != 'None' else None,
            "candidate_email": str(candidate.email) if candidate else None
        },
        "documents": [
            {
                "id": doc.id,
                "document_type": str(doc.document_type),
                "file_name": str(doc.file_name),
                "status": str(doc.status),
                "remarks": str(doc.remarks) if str(doc.remarks) != 'None' else ""
            } for doc in documents
        ]
    }

@router.put("/approve/{onboarding_id}")
def approve_documents(onboarding_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    
    onboarding = db.query(OnboardingCandidate).filter(OnboardingCandidate.id == onboarding_id).first()
    if not onboarding:
        raise HTTPException(404, "Onboarding record not found")
    
    setattr(onboarding, 'status', "Ready for Joining")
    db.commit()
    
    return {"message": "Documents approved successfully"}

@router.put("/reject/{onboarding_id}")
def reject_documents(onboarding_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    
    onboarding = db.query(OnboardingCandidate).filter(OnboardingCandidate.id == onboarding_id).first()
    if not onboarding:
        raise HTTPException(404, "Onboarding record not found")
    
    setattr(onboarding, 'status', "Pending Docs")
    db.commit()
    
    return {"message": "Documents rejected, candidate can re-upload"}

@router.get("/grades")
def get_grades(user=Depends(get_current_user)):
    db = get_tenant_session(user)
    grades = db.query(Grade).filter(Grade.status == "Active").all()
    return [{"code": g.code, "name": str(g.name), "min_salary": g.min_salary, "max_salary": g.max_salary} for g in grades]

@router.post("/appointment/{onboarding_id}")
def generate_appointment(onboarding_id: int, request: dict, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    
    onboarding = db.query(OnboardingCandidate).filter(OnboardingCandidate.id == onboarding_id).first()
    if not onboarding:
        raise HTTPException(404, "Onboarding record not found")
    
    # Get candidate email from job application
    candidate = db.query(JobApplication).filter(JobApplication.id == onboarding.application_id).first()
    offer = db.query(OfferLetter).filter(OfferLetter.application_id == onboarding.application_id).first()
    
    # Generate appointment letter content
    appointment_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">NUTRYAH</h1>
            <p style="color: #666; margin: 0;">Healthcare Management Solutions</p>
        </div>
        
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #1f2937; margin-bottom: 5px;">APPOINTMENT LETTER</h2>
            <p style="color: #666; margin: 0;">Date: {datetime.now().strftime('%B %d, %Y')}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <p>Dear <strong>{str(onboarding.candidate_name)}</strong>,</p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <p>We are pleased to confirm your appointment with NUTRYAH as <strong>{str(onboarding.job_title)}</strong> in the <strong>{str(onboarding.department)}</strong> department.</p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1f2937; margin-top: 0;">Employment Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; font-weight: bold;">Designation:</td><td>{str(onboarding.job_title)}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Department:</td><td>{str(onboarding.department)}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Grade:</td><td>{request.get('grade', 'G3')}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Joining Date:</td><td>{str(onboarding.joining_date) if str(onboarding.joining_date) != 'None' else 'To be confirmed'}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Work Location:</td><td>{str(onboarding.work_location) if str(onboarding.work_location) != 'None' else 'Head Office'}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Reporting Manager:</td><td>{str(onboarding.reporting_manager) if str(onboarding.reporting_manager) != 'None' else 'To be assigned'}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Probation Period:</td><td>{str(onboarding.probation_period)}</td></tr>
            </table>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h3 style="color: #1f2937;">Terms & Conditions:</h3>
            <p>{request.get('terms', 'Standard terms and conditions as per company policy will apply. Detailed terms will be provided in your employment contract.')}</p>
        </div>
        
        <div style="margin-bottom: 30px;">
            <p>Please report to the HR department on your joining date with all required documents.</p>
            <p>We look forward to your valuable contribution to our organization.</p>
        </div>
        
        <div style="margin-top: 40px;">
            <p>Sincerely,</p>
            <p><strong>HR Department</strong><br>
            NUTRYAH<br>
            Email: hr@nutryah.com</p>
        </div>
    </div>
    """
    
    setattr(onboarding, 'appointment_letter', appointment_content)
    setattr(onboarding, 'employee_grade', request.get('grade', 'G3'))
    db.commit()
    
    return {
        "message": "Appointment letter generated successfully",
        "appointment_content": appointment_content,
        "candidate_email": str(candidate.email) if candidate else None
    }

@router.post("/appointment/send/{onboarding_id}")
def send_appointment_letter(onboarding_id: int, request: dict, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    
    onboarding = db.query(OnboardingCandidate).filter(OnboardingCandidate.id == onboarding_id).first()
    if not onboarding:
        raise HTTPException(404, "Onboarding record not found")
    
    candidate = db.query(JobApplication).filter(JobApplication.id == onboarding.application_id).first()
    if not candidate or str(candidate.email) == 'None':
        raise HTTPException(400, "Candidate email not found")
    
    # Use stored appointment letter or generate new one
    appointment_content = str(onboarding.appointment_letter) if str(onboarding.appointment_letter) != 'None' else ""
    if not appointment_content:
        raise HTTPException(400, "Appointment letter not generated yet")
    
    # Send email
    subject = f"Appointment Letter - {str(onboarding.candidate_name)} | NUTRYAH"
    
    email_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">NUTRYAH</h1>
            <p style="color: #666;">Healthcare Management Solutions</p>
        </div>
        
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1e40af; margin-top: 0;">🎉 Congratulations!</h2>
            <p>Dear <strong>{str(onboarding.candidate_name)}</strong>,</p>
            <p>We are delighted to share your official appointment letter with NUTRYAH.</p>
        </div>
        
        <div style="margin-bottom: 20px;">
            {appointment_content}
        </div>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #92400e; margin-top: 0;">📋 Next Steps:</h3>
            <ul style="color: #92400e; margin: 0;">
                <li>Review the appointment letter carefully</li>
                <li>Prepare all required documents for joining</li>
                <li>Report to HR on your joining date</li>
                <li>Contact us if you have any questions</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #666; margin: 0;">Welcome to the NUTRYAH family!</p>
            <p style="color: #666; font-size: 14px;">For any queries, contact us at hr@nutryah.com</p>
        </div>
    </div>
    """
    
    success = send_email(str(candidate.email), subject, email_body)
    
    if success:
        return {"message": f"Appointment letter sent successfully to {str(candidate.email)}"}
    else:
        raise HTTPException(500, "Failed to send appointment letter")

@router.post("/create-employee/{onboarding_id}")
def create_employee(onboarding_id: int, request: dict, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    
    onboarding = db.query(OnboardingCandidate).filter(OnboardingCandidate.id == onboarding_id).first()
    if not onboarding:
        raise HTTPException(404, "Onboarding record not found")
    
    emp_code = request.get('employee_code') or f"EMP-2025-{str(uuid.uuid4())[:3].upper()}"
    
    employee = User(
        name=onboarding.candidate_name,
        email=request.get('official_email'),
        password="temp123",
        role_id=1,
        department_id=1,
        employee_code=emp_code,
        employee_type=request.get('employee_type', 'Permanent'),
        designation=onboarding.job_title,
        joining_date=onboarding.joining_date,
        status="Active"
    )
    
    db.add(employee)
    setattr(onboarding, 'status', "Completed")
    setattr(onboarding, 'employee_code', emp_code)
    db.commit()
    
    return {
        "message": "Employee created successfully",
        "employee_code": emp_code,
        "employee_id": employee.id
    }

@router.get("/locations")
def get_locations(user=Depends(get_current_user)):
    db = get_tenant_session(user)
    branches = db.query(Branch).all()
    return [{"id": b.id, "name": str(b.branch_name), "city": str(b.city)} for b in branches]

@router.get("/managers")
def get_managers(user=Depends(get_current_user)):
    db = get_tenant_session(user)
    managers = db.query(User).filter(User.role_id.in_([1, 2])).all()
    return [{"id": u.id, "name": str(u.name), "department": str(u.department.name) if u.department else ""} for u in managers]

