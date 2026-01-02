from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from uuid import uuid4
from models.models_tenant import GrievanceTicket
from schemas.schemas_tenant import (
    GrievanceCreate,
    GrievanceUpdate,
    GrievanceOut
)
from database import get_tenant_db
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user
import logging
from datetime import datetime

logger = logging.getLogger("HRM")

router = APIRouter(prefix="/hr/grievances", tags=["HR Grievances"])

@router.post("/", response_model=dict)
def create_grievance(
    payload: dict,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    try:
        from models.models_tenant import User
        
        logger.info(f"📥 Received payload: {payload}")
        employee_identifier = payload.get('employeeId') or payload.get('employee_id')
        logger.info(f"🔍 Looking for employee: {employee_identifier} (type: {type(employee_identifier)})")
        
        # Get first user as fallback if no employee specified
        if not employee_identifier:
            user = db.query(User).first()
            logger.info(f"⚠️ No employee_id provided, using first user: {user.id if user else 'None'}")
        else:
            user = None
            if isinstance(employee_identifier, str):
                user = db.query(User).filter(User.employee_code == employee_identifier).first()
            elif isinstance(employee_identifier, int):
                user = db.query(User).filter(User.id == employee_identifier).first()
        
        if not user:
            logger.error(f"❌ Employee not found: {employee_identifier}")
            raise HTTPException(status_code=404, detail=f"Employee not found: {employee_identifier}")
        
        logger.info(f"✅ Found user: {user.name} (ID: {user.id})")
        
        ticket = GrievanceTicket(
            ticket_code=f"G-{uuid4().hex[:6].upper()}",
            employee_id=user.id,
            category=payload.get('grievanceType') or payload.get('category'),
            description=payload.get('description'),
            priority=payload.get('priority', 'Medium'),
            assigned_to=payload.get('assigned_to'),
            attachment=payload.get('attachment'),
            status='Under Investigation'
        )
        db.add(ticket)
        db.commit()
        db.refresh(ticket)
        audit_crud(request, db, user, "CREATE_GRIEVANCE", "grievance_tickets", str(ticket.id), {}, payload)
        logger.info(f"✅ Grievance created: {ticket.ticket_code}")
        return {"message": "Grievance created", "ticket_code": ticket.ticket_code}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating grievance: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
def list_grievances(db: Session = Depends(get_tenant_db)):
    try:
        from models.models_tenant import User
        
        grievances = db.query(GrievanceTicket).order_by(
            GrievanceTicket.created_at.desc()
        ).all()
        
        result = []
        for grievance in grievances:
            user = db.query(User).filter(User.id == grievance.employee_id).first()
            result.append({
                "id": grievance.id,
                "ticket_code": grievance.ticket_code,
                "employee_name": user.name if user else f"Employee {grievance.employee_id}",
                "employee_code": user.employee_code if user else str(grievance.employee_id),
                "category": grievance.category,
                "description": grievance.description,
                "priority": grievance.priority,
                "status": grievance.status,
                "assigned_to": grievance.assigned_to,
                "created_at": grievance.created_at.isoformat() if grievance.created_at is not None else None
            })
        
        return result
    except Exception as e:
        logger.error(f"❌ Error fetching grievances: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{ticket_id}", response_model=dict)
def get_grievance(ticket_id: int, db: Session = Depends(get_tenant_db)):
    try:
        from models.models_tenant import User
        
        grievance = db.query(GrievanceTicket).filter(
            GrievanceTicket.id == ticket_id
        ).first()
        
        if not grievance:
            raise HTTPException(status_code=404, detail="Grievance not found")
        
        user = db.query(User).filter(User.id == grievance.employee_id).first()
        
        return {
            "id": grievance.id,
            "ticket_code": grievance.ticket_code,
            "employee_name": user.name if user else f"Employee {grievance.employee_id}",
            "employee_code": user.employee_code if user else str(grievance.employee_id),
            "category": grievance.category,
            "description": grievance.description,
            "priority": grievance.priority,
            "status": grievance.status,
            "assigned_to": grievance.assigned_to,
            "attachment": grievance.attachment,
            "resolution_notes": grievance.resolution_notes,
            "created_at": grievance.created_at.isoformat() if grievance.created_at is not None else None,
            "resolved_at": grievance.resolved_at.isoformat() if grievance.resolved_at is not None else None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching grievance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{ticket_id}", response_model=dict)
def delete_grievance(
    ticket_id: int, 
    request: Request, 
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    try:
        grievance = db.query(GrievanceTicket).filter(
            GrievanceTicket.id == ticket_id
        ).first()
        
        if not grievance:
            raise HTTPException(status_code=404, detail="Grievance not found")
        
        old_values = {"ticket_code": grievance.ticket_code, "status": grievance.status}
        db.delete(grievance)
        db.commit()
        audit_crud(request, db, user, "DELETE_GRIEVANCE", "grievance_tickets", str(ticket_id), old_values, {})
        
        logger.info(f"✅ Grievance {grievance.ticket_code} deleted")
        return {"message": "Grievance deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting grievance: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{ticket_id}/complete", response_model=dict)
def complete_investigation(
    ticket_id: int, 
    request: Request, 
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    try:
        grievance = db.query(GrievanceTicket).filter(
            GrievanceTicket.id == ticket_id
        ).first()
        
        if not grievance:
            raise HTTPException(status_code=404, detail="Grievance not found")
        
        setattr(grievance, 'status', "Resolved")
        setattr(grievance, 'resolved_at', datetime.now())
        
        db.commit()
        audit_crud(request, db, user, "COMPLETE_GRIEVANCE_INVESTIGATION", "grievance_tickets", str(ticket_id), {"old_status": "Under Investigation"}, {"status": "Resolved"})
        
        logger.info(f"✅ Grievance {grievance.ticket_code} marked as Investigation Completed")
        return {"message": "Investigation marked as completed"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error completing investigation: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
