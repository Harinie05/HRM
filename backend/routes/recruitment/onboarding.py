from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io
from database import get_tenant_db
from models.models_tenant import Candidate, OnboardingCandidate, DocumentUpload, Employee, BGV
from schemas.schemas_tenant import OnboardingCreate, OnboardingResponse, DocumentUploadResponse
from datetime import datetime
import uuid, os
from utils.email import send_email

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])

UPLOAD_DIR = "uploads/onboarding"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# -----------------------------------------------------------
# 1) CREATE ONBOARDING ENTRY
# -----------------------------------------------------------
@router.post("/create/{candidate_id}", response_model=OnboardingResponse)
def create_onboarding(candidate_id: int, data: OnboardingCreate, db: Session = Depends(get_tenant_db)):

    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Use employee ID from form data if provided
    employee_id = getattr(data, 'employee_id', None)
    if not employee_id:
        # Generate employee ID if not provided
        dept_prefix = data.department[:3].upper() if data.department else "EMP"
        timestamp = str(datetime.now().timestamp()).replace('.', '')[-6:]
        employee_id = f"{dept_prefix}{timestamp}"

    record = OnboardingCandidate(
        application_id=candidate_id,
        candidate_name=candidate.name,
        job_title=data.job_title,
        department=data.department,
        joining_date=data.joining_date,
        work_location=data.work_location,
        reporting_manager=data.reporting_manager,
        work_shift=data.work_shift,
        probation_period=data.probation_period,
        employee_id=employee_id,
        status="Pending Docs"
    )

    db.add(record)
    db.commit()
    db.refresh(record)
    
    # Send joining formalities email
    try:
        send_joining_email(candidate.email, candidate.name, data.job_title, data.joining_date, employee_id)
    except Exception as e:
        print(f"Failed to send email: {e}")
    
    # Update offer status to indicate onboarding has started
    try:
        from models.models_tenant import OfferLetter
        offer = db.query(OfferLetter).filter(OfferLetter.candidate_id == candidate_id).first()
        if offer:
            setattr(offer, 'offer_status', 'Onboarding Started')
            db.commit()
    except Exception as e:
        print(f"Failed to update offer status: {e}")
    
    # Mark BGV as completed since onboarding has started
    try:
        from models.models_tenant import BGV
        bgv_record = db.query(BGV).filter(BGV.candidate_id == candidate_id).first()
        
        if not bgv_record:
            # Create new BGV record if it doesn't exist
            bgv_record = BGV(
                candidate_id=candidate_id,
                verification_type="Internal HR Team",
                status="Cleared",
                identity_verified=True,
                address_verified=True,
                employment_verified=True,
                education_verified=True,
                criminal_verified=True,
                remarks="BGV completed successfully. Candidate cleared for onboarding."
            )
            db.add(bgv_record)
        else:
            # Update existing BGV record
            bgv_record.status = "Cleared"
            bgv_record.identity_verified = True
            bgv_record.address_verified = True
            bgv_record.employment_verified = True
            bgv_record.education_verified = True
            bgv_record.criminal_verified = True
            bgv_record.remarks = "BGV completed successfully. Candidate cleared for onboarding."
        
        db.commit()
        print(f"BGV marked as completed for candidate {candidate_id}")
    except Exception as e:
        print(f"Failed to update BGV status: {e}")
    

    
    return record







# -----------------------------------------------------------
# 4) UPLOAD DOCUMENTS
# -----------------------------------------------------------
@router.post("/upload-document")
def upload_document_form(
    candidate_id: int = Form(...),
    document_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_tenant_db)
):
    filename = f"{uuid.uuid4()}_{file.filename}"
    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as f:
        f.write(file.file.read())

    doc = DocumentUpload(
        candidate_id=candidate_id,
        document_type=document_type,
        file_name=filename,
        file_path=path,
        status="Uploaded",
        uploaded_at=datetime.utcnow()
    )

    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"message": "Document uploaded successfully", "document_id": doc.id}

@router.post("/{candidate_id}/upload-document", response_model=DocumentUploadResponse)
def upload_document(
    candidate_id: int,
    document_type: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_tenant_db)
):

    filename = f"{uuid.uuid4()}_{file.filename}"
    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as f:
        f.write(file.file.read())

    doc = DocumentUpload(
        candidate_id=candidate_id,
        document_type=document_type,
        file_name=filename,
        file_path=path,
        status="Uploaded",
        uploaded_at=datetime.utcnow()
    )

    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


# -----------------------------------------------------------
# 5) VIEW ALL DOCUMENTS OF A CANDIDATE
# -----------------------------------------------------------
@router.get("/{candidate_id}/documents", response_model=list[DocumentUploadResponse])
def get_documents(candidate_id: int, db: Session = Depends(get_tenant_db)):
    docs = db.query(DocumentUpload).filter(DocumentUpload.candidate_id == candidate_id).all()
    return docs


# -----------------------------------------------------------
# 6) LIST ALL ONBOARDING CANDIDATES
# -----------------------------------------------------------
@router.get("/candidates")
def list_onboarding_candidates(db: Session = Depends(get_tenant_db)):
    candidates = db.query(OnboardingCandidate).all()
    return candidates


# -----------------------------------------------------------
# 7) LIST ALL ONBOARDED EMPLOYEES FOR EIS
# -----------------------------------------------------------
@router.get("/list")
def list_onboarded_employees(db: Session = Depends(get_tenant_db)):
    """Get all onboarded employees with their details for EIS"""
    try:
        employees = db.query(OnboardingCandidate).all()
        
        # Get candidate email from Candidate table
        enriched_employees = []
        for emp in employees:
            candidate = db.query(Candidate).filter(Candidate.id == emp.application_id).first()
            
            employee_data = {
                "id": emp.id,
                "application_id": emp.application_id,
                "candidate_name": emp.candidate_name,
                "candidate_email": candidate.email if candidate else None,
                "job_title": emp.job_title,
                "department": emp.department,
                "employee_id": emp.employee_id,
                "joining_date": emp.joining_date,
                "work_location": emp.work_location,
                "reporting_manager": emp.reporting_manager,
                "work_shift": emp.work_shift,
                "probation_period": emp.probation_period,
                "status": emp.status,
                "created_at": emp.created_at
            }
            enriched_employees.append(employee_data)
        
        return enriched_employees
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch employees: {str(e)}")


# -----------------------------------------------------------
# 8) VIEW DOCUMENT FROM DATABASE
# -----------------------------------------------------------
@router.get("/document/{doc_id}/view")
def view_document(doc_id: int, db: Session = Depends(get_tenant_db)):
    doc = db.query(DocumentUpload).filter(DocumentUpload.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        with open(doc.file_path, "rb") as f:
            file_content = f.read()
        
        # Determine content type based on file extension
        file_ext = doc.file_name.split('.')[-1].lower()
        content_type = "application/octet-stream"
        
        if file_ext in ['jpg', 'jpeg']:
            content_type = "image/jpeg"
        elif file_ext == 'png':
            content_type = "image/png"
        elif file_ext == 'pdf':
            content_type = "application/pdf"
        elif file_ext in ['doc', 'docx']:
            content_type = "application/msword"
        
        return StreamingResponse(
            io.BytesIO(file_content),
            media_type=content_type,
            headers={"Content-Disposition": f"inline; filename={doc.file_name}"}
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found on disk")

# -----------------------------------------------------------
# 9) DELETE DOCUMENT
# -----------------------------------------------------------
@router.delete("/document/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_tenant_db)):
    doc = db.query(DocumentUpload).filter(DocumentUpload.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file from disk
    try:
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)
    except Exception as e:
        print(f"Failed to delete file from disk: {e}")
    
    # Delete record from database
    db.delete(doc)
    db.commit()
    
    return {"message": "Document deleted successfully"}

# -----------------------------------------------------------
# 10) GET MASTER DATA FOR DROPDOWNS
# -----------------------------------------------------------
@router.get("/locations")
def get_locations(db: Session = Depends(get_tenant_db)):
    return [
        {"id": 1, "name": "Main Office"},
        {"id": 2, "name": "Branch Office"},
        {"id": 3, "name": "Remote"}
    ]

@router.get("/managers")
def get_managers(db: Session = Depends(get_tenant_db)):
    return [
        {"id": 1, "name": "John Smith"},
        {"id": 2, "name": "Sarah Johnson"},
        {"id": 3, "name": "Mike Wilson"}
    ]

@router.get("/grades")
def get_grades(db: Session = Depends(get_tenant_db)):
    from models.models_tenant import Grade
    grades = db.query(Grade).all()
    return [{"code": g.code, "name": g.name} for g in grades] if grades else [
        {"code": "G1", "name": "Grade 1"},
        {"code": "G2", "name": "Grade 2"},
        {"code": "G3", "name": "Grade 3"}
    ]

@router.get("/jobs")
def get_jobs(db: Session = Depends(get_tenant_db)):
    from models.models_tenant import JobRequisition
    jobs = db.query(JobRequisition).all()
    return [{"value": j.title, "label": j.title} for j in jobs] if jobs else [
        {"value": "Software Engineer", "label": "Software Engineer"},
        {"value": "HR Manager", "label": "HR Manager"}
    ]

@router.get("/statuses")
def get_statuses():
    return [
        {"value": "Pending Docs", "label": "Pending Docs"},
        {"value": "Docs Submitted", "label": "Docs Submitted"},
        {"value": "Ready for Joining", "label": "Ready for Joining"},
        {"value": "Completed", "label": "Completed"}
    ]


# -----------------------------------------------------------
# EMAIL FUNCTION
# -----------------------------------------------------------
def send_joining_email(candidate_email: str, candidate_name: str, job_title: str, joining_date, employee_id: str):
    subject = "Welcome to the Team - Joining Formalities"
    
    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                Welcome to Our Organization!
            </h2>
            
            <p>Dear <strong>{candidate_name}</strong>,</p>
            
            <p>Congratulations! We are excited to welcome you to our team as <strong>{job_title}</strong>.</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #2563eb;">Joining Details:</h3>
                <p><strong>Employee ID:</strong> {employee_id}</p>
                <p><strong>Position:</strong> {job_title}</p>
                <p><strong>Joining Date:</strong> {joining_date}</p>
            </div>
            
            <h3 style="color: #2563eb;">Pre-Joining Formalities:</h3>
            <p>Please complete the following before your joining date:</p>
            
            <ul style="background-color: #f8fafc; padding: 20px; border-radius: 5px;">
                <li>Submit all required documents (Aadhaar, PAN, Educational certificates, etc.)</li>
                <li>Complete medical check-up if required</li>
                <li>Fill out employee information forms</li>
                <li>Provide bank account details for salary processing</li>
                <li>Submit passport-size photographs</li>
            </ul>
            
            <h3 style="color: #2563eb;">First Day Instructions:</h3>
            <ul style="background-color: #f8fafc; padding: 20px; border-radius: 5px;">
                <li>Report to HR department at 9:00 AM</li>
                <li>Bring original documents for verification</li>
                <li>Carry a copy of this email for reference</li>
                <li>Dress code: Business formal</li>
            </ul>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our HR team.</p>
            
            <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>HR Team</strong><br>
                <em>Human Resources Department</em>
            </p>
        </div>
    </body>
    </html>
    """
    
    return send_email(candidate_email, subject, html_body)
