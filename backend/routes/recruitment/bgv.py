from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from database import get_master_db
from models.models_tenant import Candidate, BGV
from schemas.schemas_tenant import BGVCreate, BGVUpdate, BGVOut
from datetime import datetime
import os, uuid

router = APIRouter(prefix="/bgv", tags=["BGV"])

UPLOAD_DIR = "uploads/bgv"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# -----------------------------------------------------------
# 1) CREATE BGV ENTRY
# -----------------------------------------------------------
@router.post("/{candidate_id}/create", response_model=BGVOut)
def create_bgv(candidate_id: int, data: BGVCreate, db: Session = Depends(get_master_db)):

    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    bgv = BGV(
        candidate_id=candidate_id,
        agency=data.agency,
        status=data.status,
        remarks=data.remarks
    )

    db.add(bgv)
    db.commit()
    db.refresh(bgv)
    return bgv


# -----------------------------------------------------------
# 2) UPLOAD BGV DOCUMENT
# -----------------------------------------------------------
@router.post("/{candidate_id}/upload", response_model=BGVOut)
def upload_bgv_document(
    candidate_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_master_db)
):

    bgv = db.query(BGV).filter(BGV.candidate_id == candidate_id).first()
    if not bgv:
        raise HTTPException(status_code=404, detail="BGV record not found")

    filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        f.write(file.file.read())

    # append
    current_docs = getattr(bgv, 'documents') or ""
    if current_docs:
        new_docs = current_docs + "," + filename
    else:
        new_docs = filename
    
    setattr(bgv, 'documents', new_docs)

    db.commit()
    db.refresh(bgv)
    return bgv


# -----------------------------------------------------------
# 3) UPDATE BGV STATUS
# -----------------------------------------------------------
@router.put("/{candidate_id}/update", response_model=BGVOut)
def update_bgv(candidate_id: int, data: BGVUpdate, db: Session = Depends(get_master_db)):
    bgv = db.query(BGV).filter(BGV.candidate_id == candidate_id).first()
    if not bgv:
        raise HTTPException(status_code=404, detail="BGV record not found")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(bgv, key, value)

    setattr(bgv, 'updated_at', datetime.utcnow())

    db.commit()
    db.refresh(bgv)
    return bgv
