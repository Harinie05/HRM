from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.models_tenant import HRCommunication
from database import get_tenant_db
import logging
from datetime import datetime

logger = logging.getLogger("HRM")

router = APIRouter(prefix="/hr/communication", tags=["HR Communication"])


@router.post("/", response_model=dict)
def create_communication(
    payload: dict,
    db: Session = Depends(get_tenant_db)
):
    try:
        # Map frontend fields to backend fields
        communication_data = {
            "letter_type": payload.get("letterType", "Notice"),
            "subject": payload.get("subject", ""),
            "content": payload.get("content", ""),
            "sent_to_type": "Single" if payload.get("employeeId") else "All",
            "sent_to_ids": [payload.get("employeeId")] if payload.get("employeeId") else None,
            "status": "Ready",
            "created_by": 1  # Default admin user
        }
        
        record = HRCommunication(**communication_data)
        db.add(record)
        db.commit()
        db.refresh(record)
        
        logger.info(f"✅ Communication created with ID: {record.id}")
        return {"message": "Communication sent", "id": record.id}
    except Exception as e:
        logger.error(f"❌ Error creating communication: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/draft", response_model=dict)
def save_draft(
    payload: dict,
    db: Session = Depends(get_tenant_db)
):
    try:
        # Map frontend fields to backend fields for draft
        communication_data = {
            "letter_type": payload.get("letterType", "Notice"),
            "subject": payload.get("subject", ""),
            "content": payload.get("content", ""),
            "sent_to_type": "Single" if payload.get("employeeId") else "All",
            "sent_to_ids": [payload.get("employeeId")] if payload.get("employeeId") else None,
            "status": "Draft",
            "created_by": 1  # Default admin user
        }
        
        record = HRCommunication(**communication_data)
        db.add(record)
        db.commit()
        db.refresh(record)
        
        logger.info(f"✅ Draft saved with ID: {record.id}")
        return {"message": "Draft saved", "id": record.id}
    except Exception as e:
        logger.error(f"❌ Error saving draft: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{communication_id}", response_model=dict)
def get_communication(
    communication_id: int,
    db: Session = Depends(get_tenant_db)
):
    try:
        communication = db.query(HRCommunication).filter(
            HRCommunication.id == communication_id
        ).first()
        
        if not communication:
            raise HTTPException(status_code=404, detail="Communication not found")
        
        return {
            "id": communication.id,
            "letter_type": communication.letter_type,
            "subject": communication.subject,
            "content": communication.content,
            "sent_to_ids": communication.sent_to_ids,
            "status": communication.status
        }
    except Exception as e:
        logger.error(f"❌ Error fetching communication: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{communication_id}", response_model=dict)
def update_communication(
    communication_id: int,
    payload: dict,
    db: Session = Depends(get_tenant_db)
):
    try:
        communication = db.query(HRCommunication).filter(
            HRCommunication.id == communication_id
        ).first()
        
        if not communication:
            raise HTTPException(status_code=404, detail="Communication not found")
        
        # Update fields
        communication.letter_type = payload.get("letterType", communication.letter_type)
        communication.subject = payload.get("subject", communication.subject)
        communication.content = payload.get("content", communication.content)
        communication.sent_to_ids = [payload.get("employeeId")] if payload.get("employeeId") else communication.sent_to_ids
        communication.status = payload.get("status", communication.status)
        
        db.commit()
        
        logger.info(f"✅ Communication {communication_id} updated successfully")
        return {"message": "Communication updated successfully", "id": communication.id}
    except Exception as e:
        logger.error(f"❌ Error updating communication: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{communication_id}/send", response_model=dict)
def send_draft_communication(
    communication_id: int,
    db: Session = Depends(get_tenant_db)
):
    try:
        communication = db.query(HRCommunication).filter(
            HRCommunication.id == communication_id,
            HRCommunication.status == "Draft"
        ).first()
        
        if not communication:
            raise HTTPException(status_code=404, detail="Draft communication not found")
        
        communication.status = "Ready"
        db.commit()
        
        logger.info(f"✅ Draft communication {communication_id} sent successfully")
        return {"message": "Communication sent successfully", "id": communication.id}
    except Exception as e:
        logger.error(f"❌ Error sending draft communication: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{communication_id}", response_model=dict)
def delete_communication(
    communication_id: int,
    db: Session = Depends(get_tenant_db)
):
    try:
        communication = db.query(HRCommunication).filter(
            HRCommunication.id == communication_id
        ).first()
        
        if not communication:
            raise HTTPException(status_code=404, detail="Communication not found")
        
        db.delete(communication)
        db.commit()
        
        logger.info(f"✅ Communication {communication_id} deleted successfully")
        return {"message": "Communication deleted successfully"}
    except Exception as e:
        logger.error(f"❌ Error deleting communication: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=list)
def list_communications(db: Session = Depends(get_tenant_db)):
    try:
        communications = db.query(HRCommunication).order_by(
            HRCommunication.created_at.desc()
        ).all()
        
        result = []
        for comm in communications:
            result.append({
                "id": comm.id,
                "letter_type": comm.letter_type,
                "subject": comm.subject,
                "content": comm.content,
                "sent_to_type": comm.sent_to_type,
                "sent_to_ids": comm.sent_to_ids,
                "status": comm.status,
                "created_at": comm.created_at.isoformat() if comm.created_at else None
            })
        
        return result
    except Exception as e:
        logger.error(f"❌ Error fetching communications: {e}")
        raise HTTPException(status_code=500, detail=str(e))
