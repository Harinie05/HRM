# routes/EIS/documents.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from routes.hospital import get_current_user
from database import get_tenant_engine
from models.models_tenant import EmployeeDocuments
from schemas.schemas_tenant import DocumentCreate, DocumentOut


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


router = APIRouter(prefix="/employee/documents", tags=["Employee Documents Vault"])


# -------------------------------------------------------------------------
# 1. UPLOAD DOCUMENT
# -------------------------------------------------------------------------
@router.post("/upload", response_model=DocumentOut)
async def upload_document(
    employee_id: int,
    document_name: str,
    file: UploadFile = File(...),
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)

    file_bytes = await file.read()

    new_doc = EmployeeDocuments(
        employee_id=employee_id,
        doc_name=document_name,
        file_name=file.filename,
        file=file_bytes,
        uploaded_on=datetime.utcnow()
    )

    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    return new_doc


# -------------------------------------------------------------------------
# 2. LIST DOCUMENTS
# -------------------------------------------------------------------------
@router.get("/{employee_id}", response_model=List[DocumentOut])
def get_documents(employee_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    return (
        db.query(EmployeeDocuments)
        .filter(EmployeeDocuments.employee_id == employee_id)
        .order_by(EmployeeDocuments.id.desc())
        .all()
    )


# -------------------------------------------------------------------------
# 3. DOWNLOAD / VIEW DOCUMENT
# -------------------------------------------------------------------------
@router.get("/view/{doc_id}")
def view_document(doc_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    doc = db.query(EmployeeDocuments).filter(EmployeeDocuments.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")

    # Auto-set mime type
    mime = "application/octet-stream"
    file_name = str(doc.file_name)
    if file_name.endswith(".pdf"):
        mime = "application/pdf"
    elif file_name.endswith(".jpg") or file_name.endswith(".jpeg"):
        mime = "image/jpeg"
    elif file_name.endswith(".png"):
        mime = "image/png"

    return Response(content=doc.file, media_type=mime)


# -------------------------------------------------------------------------
# 4. DELETE DOCUMENT
# -------------------------------------------------------------------------
@router.delete("/{doc_id}")
def delete_document(doc_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    doc = db.query(EmployeeDocuments).filter(EmployeeDocuments.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")

    db.delete(doc)
    db.commit()

    return {"message": "Document deleted successfully"}
