# routes/EIS/documents.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from typing import List, Optional

from routes.hospital import get_current_user
from database import get_tenant_engine
from utils.audit_logger import audit_crud
from models.models_tenant import EmployeeDocuments
from schemas.schemas_tenant import DocumentCreate, DocumentOut
from utils.permission import require_permission

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
    request: Request,
    employee_id: str = Form(...),
    document_name: str = Form(...),
    file: UploadFile = File(...),
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)
    try:
        # Handle employee_id conversion
        if isinstance(employee_id, str) and employee_id.startswith('user_'):
            numeric_employee_id = int(employee_id.replace('user_', ''))
        else:
            numeric_employee_id = int(employee_id)
        
        file_content = await file.read()
        
        document = EmployeeDocuments(
            employee_id=numeric_employee_id,
            doc_name=document_name,
            file=file_content,
            file_name=file.filename
        )

        db.add(document)
        db.commit()
        db.refresh(document)
        audit_crud(request, db, user, "CREATE", "employee_documents", str(document.id), {}, document.__dict__)

        # Convert to dict before closing session
        result = {
            "id": document.id,
            "employee_id": document.employee_id,
            "doc_name": document.doc_name,
            "file_name": document.file_name,
            "uploaded_on": document.uploaded_on
        }
        return result
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Failed to upload document: {str(e)}")
    finally:
        db.close()

# -------------------------------------------------------------------------
# 2. GET DOCUMENTS
# -------------------------------------------------------------------------
@router.get("/{employee_id}")
def get_documents(employee_id: str, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    try:
        # Handle employee_id conversion
        if isinstance(employee_id, str) and employee_id.startswith('user_'):
            numeric_id = int(employee_id.replace('user_', ''))
        else:
            numeric_id = int(employee_id)

        documents = (
            db.query(EmployeeDocuments)
            .filter(EmployeeDocuments.employee_id == numeric_id)
            .order_by(EmployeeDocuments.uploaded_on.desc())
            .all()
        )
        
        # Convert to list of dicts before closing session
        result = [{
            "id": doc.id,
            "employee_id": doc.employee_id,
            "doc_name": doc.doc_name,
            "file_name": doc.file_name,
            "uploaded_on": doc.uploaded_on
        } for doc in documents]
        
        return result
    finally:
        db.close()

# -------------------------------------------------------------------------
# 3. DELETE DOCUMENT
# -------------------------------------------------------------------------
@router.delete("/{document_id}")
def delete_document(document_id: int, request: Request, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    document = db.query(EmployeeDocuments).filter(EmployeeDocuments.id == document_id).first()
    if not document:
        raise HTTPException(404, "Document not found")

    old_values = document.__dict__.copy()
    db.delete(document)
    db.commit()
    audit_crud(request, db, user, "DELETE", "employee_documents", str(document_id), old_values, {})

    return {"message": "Document deleted successfully"}