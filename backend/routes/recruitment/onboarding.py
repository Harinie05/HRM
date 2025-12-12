from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from database import get_tenant_db
from models.models_tenant import Candidate, OnboardingCandidate, DocumentUpload, Employee
from schemas.schemas_tenant import OnboardingCreate, OnboardingUpdate, OnboardingResponse, DocumentUploadResponse
from datetime import datetime
import uuid, os

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
        status="Pending Docs"
    )

    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# -----------------------------------------------------------
# 2) UPDATE ONBOARDING ENTRY
# -----------------------------------------------------------
@router.put("/update/{onboard_id}", response_model=OnboardingResponse)
def update_onboarding(onboard_id: int, data: OnboardingUpdate, db: Session = Depends(get_tenant_db)):

    record = db.query(OnboardingCandidate).filter(OnboardingCandidate.id == onboard_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Onboarding record not found")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(record, key, value)

    db.commit()
    db.refresh(record)
    return record


# -----------------------------------------------------------
# 3) UPLOAD DOCUMENTS
# -----------------------------------------------------------
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
# 4) VIEW ALL DOCUMENTS OF A CANDIDATE
# -----------------------------------------------------------
@router.get("/{candidate_id}/documents", response_model=list[DocumentUploadResponse])
def get_documents(candidate_id: int, db: Session = Depends(get_tenant_db)):
    docs = db.query(DocumentUpload).filter(DocumentUpload.candidate_id == candidate_id).all()
    return docs


# -----------------------------------------------------------
# 5) LIST ALL ONBOARDING CANDIDATES
# -----------------------------------------------------------
@router.get("/list")
def list_onboarding_candidates(db: Session = Depends(get_tenant_db)):
    candidates = db.query(OnboardingCandidate).all()
    return candidates
