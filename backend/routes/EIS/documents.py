# routes/EIS/documents.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional

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

router = APIRouter(prefix="/employee/documents", tags=["Employee Documents"])



# -------------------------------------------------------------------------
# 1. UPLOAD DOCUMENT
# -------------------------------------------------------------------------
@router.post("/upload")
async def upload_document(
    employee_id: int = Form(...),
    document_name: str = Form(...),
    file: UploadFile = File(...),
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)
    
    file_content = await file.read()
    
    document = EmployeeDocuments(
        employee_id=employee_id,
        doc_name=document_name,
        file=file_content,
        file_name=file.filename
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return document

# -------------------------------------------------------------------------
# 2. GET DOCUMENTS
# -------------------------------------------------------------------------
@router.get("/{employee_id}")
def get_documents(employee_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    return (
        db.query(EmployeeDocuments)
        .filter(EmployeeDocuments.employee_id == employee_id)
        .order_by(EmployeeDocuments.uploaded_on.desc())
        .all()
    )

# -------------------------------------------------------------------------
# 3. DELETE DOCUMENT
# -------------------------------------------------------------------------
@router.delete("/{document_id}")
def delete_document(document_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    document = db.query(EmployeeDocuments).filter(EmployeeDocuments.id == document_id).first()
    if not document:
        raise HTTPException(404, "Document not found")

    db.delete(document)
    db.commit()

    return {"message": "Document deleted successfully"}