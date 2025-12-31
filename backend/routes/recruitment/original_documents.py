from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_tenant_db
from models.models_tenant import EmployeeOriginalDocument
from schemas.schemas_tenant import OriginalDocumentCreate, OriginalDocumentUpdate, OriginalDocumentOut
from typing import List

router = APIRouter(prefix="/original-documents", tags=["Original Documents"])

# Default document types
DEFAULT_DOCUMENT_TYPES = [
    "Degree Certificate",
    "Provisional Certificate", 
    "Mark Sheets",
    "Experience Letter",
    "Relieving Letter",
    "ID Proof (Aadhaar / PAN)",
    "Passport"
]

@router.get("/{employee_id}", response_model=List[OriginalDocumentOut])
def get_employee_documents(employee_id: int, db: Session = Depends(get_tenant_db)):
    """Get original documents collection status for an employee"""
    documents = db.query(EmployeeOriginalDocument).filter(
        EmployeeOriginalDocument.employee_id == employee_id
    ).all()
    
    # If no records exist, create default entries
    if not documents:
        for doc_type in DEFAULT_DOCUMENT_TYPES:
            doc = EmployeeOriginalDocument(
                employee_id=employee_id,
                document_type=doc_type,
                is_collected=False
            )
            db.add(doc)
        db.commit()
        
        documents = db.query(EmployeeOriginalDocument).filter(
            EmployeeOriginalDocument.employee_id == employee_id
        ).all()
    
    return documents

@router.post("/", response_model=List[OriginalDocumentOut])
def save_documents_collection(
    documents: List[OriginalDocumentUpdate], 
    employee_id: int,
    collected_by: int,
    db: Session = Depends(get_tenant_db)
):
    """Save documents collection status"""
    # Delete existing records for this employee
    db.query(EmployeeOriginalDocument).filter(
        EmployeeOriginalDocument.employee_id == employee_id
    ).delete()
    
    # Create new records for all documents (including custom ones)
    for doc_update in documents:
        doc_record = EmployeeOriginalDocument(
            employee_id=employee_id,
            document_type=doc_update.document_type,
            is_collected=doc_update.is_collected or False,
            collected_date=doc_update.collected_date,
            collected_by=collected_by if doc_update.is_collected else None,
            remarks=doc_update.remarks
        )
        db.add(doc_record)
    
    db.commit()
    
    # Return updated documents
    return db.query(EmployeeOriginalDocument).filter(
        EmployeeOriginalDocument.employee_id == employee_id
    ).all()