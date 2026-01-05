# routes/EIS/id_docs.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import os
import uuid

from routes.hospital import get_current_user
from database import get_tenant_engine
from utils.audit_logger import audit_crud
from models.models_tenant import EmployeeIDDocs
from schemas.schemas_tenant import IDDocCreate, IDDocOut
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

router = APIRouter(prefix="/employee/id-docs", tags=["Employee ID & Verification"])

# -------------------------------------------------------------------------
# 1. UPLOAD ID DOCUMENT (Aadhaar, PAN, Passport etc.)
# -------------------------------------------------------------------------
@router.post("/upload")
@require_permission("add_id_documents_record")
async def upload_id_doc(
    employee_id: int = Form(...),
    document_type: str = Form(...),
    file: UploadFile = File(...),
    expiry_date: str = Form(None),
    request: Request = None,
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)
    try:
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

        new_doc = EmployeeIDDocs(
            employee_id=employee_id,
            document_type=document_type,
            file_name=file.filename,
            file=file_path,
            expiry_date=datetime.strptime(expiry_date, "%Y-%m-%d").date() if expiry_date else None,
            status="Uploaded"
        )

        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)
        if request:
            audit_crud(request, user.get("tenant_db"), user, "CREATE", "employee_id_docs", new_doc.id, None, new_doc.__dict__)

        return {"message": "ID document uploaded successfully", "id": new_doc.id}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Failed to upload document: {str(e)}")
    finally:
        db.close()

# -------------------------------------------------------------------------
# 2. GET ALL ID DOCUMENTS FOR EMPLOYEE
# -------------------------------------------------------------------------
@router.get("/{employee_id}")
@require_permission("view_id_documents")
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
@router.put("/{doc_id}")
@require_permission("edit_id_documents_record")
async def update_id_doc(
    doc_id: int,
    file: UploadFile = File(...),
    request: Request = None,
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)

    doc = db.query(EmployeeIDDocs).filter(EmployeeIDDocs.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")

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

    doc.file = file_path
    doc.file_name = file.filename
    doc.status = "Uploaded"

    db.commit()
    db.refresh(doc)
    if request:
        audit_crud(request, user.get("tenant_db"), user, "UPDATE", "employee_id_docs", doc_id, None, doc.__dict__)

    return {"message": "ID document updated successfully"}

# -------------------------------------------------------------------------
# 4. VIEW ID DOCUMENT
# -------------------------------------------------------------------------
@router.get("/document/{doc_id}")
@require_permission("view_id_documents_details")
def view_document(
    doc_id: int, 
    token: str = Query(None),
    request: Request = None
):
    if not token:
        raise HTTPException(401, "Token required")
    
    from utils.token import verify_token
    user = verify_token(token)
    if not user:
        raise HTTPException(401, "Invalid or expired token")
    
    db = get_tenant_session(user)
    
    doc = db.query(EmployeeIDDocs).filter(EmployeeIDDocs.id == doc_id).first()
    if not doc or not doc.file:
        raise HTTPException(404, "Document not found")
    
    file_path = doc.file
    if not os.path.exists(file_path):
        raise HTTPException(404, "File not found")
    
    # Determine media type for inline viewing
    file_ext = os.path.splitext(doc.file_name)[1].lower() if doc.file_name else ''
    
    if file_ext == '.pdf':
        media_type = 'application/pdf'
    elif file_ext in ['.jpg', '.jpeg']:
        media_type = 'image/jpeg'
    elif file_ext == '.png':
        media_type = 'image/png'
    else:
        media_type = 'application/octet-stream'
    
    # Audit log for ID document view
    if request:
        audit_crud(request, db, user, "VIEW_ID_DOCUMENT", "document_access", str(doc_id), {}, {
            "document_type": "id_document",
            "file_name": getattr(doc, 'file_name', None),
            "employee_id": doc.employee_id,
            "doc_type": doc.doc_type
        })
    
    return FileResponse(
        path=file_path,
        media_type=media_type,
        headers={"Content-Disposition": "inline"}
    )

# -------------------------------------------------------------------------
# 5. VERIFY / REJECT DOCUMENT
# -------------------------------------------------------------------------
@router.post("/verify/{doc_id}")
@require_permission("edit_id_documents_record")
def verify_doc(doc_id: int, action: str, request: Request, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    doc = db.query(EmployeeIDDocs).filter(EmployeeIDDocs.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")

    if action not in ["Verified", "Rejected"]:
        raise HTTPException(400, "Action must be Verified or Rejected")

    setattr(doc, 'status', action)
    db.commit()
    audit_crud(request, user.get("tenant_db"), user, "UPDATE", "employee_id_docs", doc_id, None, {"status": action})

    return {"message": f"Document {action} successfully"}

# -------------------------------------------------------------------------
# 6. DELETE DOCUMENT
# -------------------------------------------------------------------------
@router.delete("/{doc_id}")
@require_permission("delete_id_documents_record")
def delete_id_doc(doc_id: int, request: Request, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    doc = db.query(EmployeeIDDocs).filter(EmployeeIDDocs.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")

    old_values = doc.__dict__.copy()
    db.delete(doc)
    db.commit()
    audit_crud(request, user.get("tenant_db"), user, "DELETE", "employee_id_docs", doc_id, old_values, None)

    return {"message": "ID document deleted successfully"}

# -------------------------------------------------------------------------
# 7. GET EXPIRING DOCUMENTS ALERTS
# -------------------------------------------------------------------------
@router.get("/test")
def test_endpoint():
    return {"message": "ID docs router is working"}

@router.get("/alerts")
@require_permission("view_id_documents")
def get_document_alerts():
    return {"alerts": [
        {
            "employee_id": 1,
            "document_type": "Dental License",
            "expiry_date": "2026-07-01",
            "days_until_expiry": 550,
            "alert_level": "warning",
            "file_name": "Documents11.pdf"
        }
    ]}
