# routes/EIS/id_docs.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from routes.hospital import get_current_user
from database import get_tenant_engine
from models.models_tenant import EmployeeIDDocs
from schemas.schemas_tenant import IDDocCreate, IDDocOut


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


router = APIRouter(prefix="/employee/id-docs", tags=["Employee ID & Verification"])


# -------------------------------------------------------------------------
# 1. UPLOAD ID DOCUMENT (Aadhaar, PAN, Passport etc.)
# -------------------------------------------------------------------------
@router.post("/upload", response_model=IDDocOut)
async def upload_id_doc(
    employee_id: int,
    document_type: str,
    file: UploadFile = File(...),
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)

    file_bytes = await file.read()

    new_doc = EmployeeIDDocs(
        employee_id=employee_id,
        document_type=document_type,
        file_name=file.filename,
        file=file_bytes,
        status="Uploaded"
    )

    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    return new_doc


# -------------------------------------------------------------------------
# 2. GET ALL ID DOCUMENTS FOR EMPLOYEE
# -------------------------------------------------------------------------
@router.get("/{employee_id}", response_model=List[IDDocOut])
def get_id_docs(employee_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    return (
        db.query(EmployeeIDDocs)
        .filter(EmployeeIDDocs.employee_id == employee_id)
        .order_by(EmployeeIDDocs.id.asc())
        .all()
    )


# -------------------------------------------------------------------------
# 3. UPDATE DOCUMENT (Re-upload)
# -------------------------------------------------------------------------
@router.put("/{doc_id}", response_model=IDDocOut)
async def update_id_doc(
    doc_id: int,
    file: UploadFile = File(...),
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)

    doc = db.query(EmployeeIDDocs).filter(EmployeeIDDocs.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")

    setattr(doc, 'file', await file.read())
    setattr(doc, 'file_name', file.filename)
    setattr(doc, 'status', "Uploaded")

    db.commit()
    db.refresh(doc)

    return doc


# -------------------------------------------------------------------------
# 4. VERIFY / REJECT DOCUMENT
# -------------------------------------------------------------------------
@router.post("/verify/{doc_id}")
def verify_doc(doc_id: int, action: str, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    doc = db.query(EmployeeIDDocs).filter(EmployeeIDDocs.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")

    if action not in ["Verified", "Rejected"]:
        raise HTTPException(400, "Action must be Verified or Rejected")

    setattr(doc, 'status', action)
    db.commit()

    return {"message": f"Document {action} successfully"}


# -------------------------------------------------------------------------
# 5. DELETE DOCUMENT
# -------------------------------------------------------------------------
@router.delete("/{doc_id}")
def delete_id_doc(doc_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    doc = db.query(EmployeeIDDocs).filter(EmployeeIDDocs.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")

    db.delete(doc)
    db.commit()

    return {"message": "ID document deleted successfully"}
