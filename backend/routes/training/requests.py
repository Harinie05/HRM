from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_tenant_db
from models.models_tenant import TrainingRequest
from schemas.schemas_tenant import (
    TrainingRequestCreate,
    TrainingRequestUpdate,
    TrainingRequestOut
)

router = APIRouter(prefix="/requests", tags=["Training Requests"])

@router.post("/")
def create_request(data: dict, db: Session = Depends(get_tenant_db)):
    try:
        # Handle employee_id - extract actual ID from user_ prefix
        employee_id_raw = data.get('employee_id')
        if employee_id_raw and str(employee_id_raw).startswith('user_'):
            employee_id = int(str(employee_id_raw).replace('user_', ''))
        elif employee_id_raw:
            employee_id = int(employee_id_raw)
        else:
            raise HTTPException(status_code=400, detail="Employee ID is required")
        
        # Handle training_program_id
        training_program_id = data.get('training_program_id')
        if training_program_id == '' or training_program_id is None:
            training_program_id = None
        else:
            training_program_id = int(training_program_id)
        
        req = TrainingRequest(
            employee_id=employee_id,
            training_program_id=training_program_id,
            requested_training=data.get('requested_training'),
            justification=data.get('justification'),
            priority=data.get('priority', 'Medium')
        )
        db.add(req)
        db.commit()
        db.refresh(req)
        return {"message": "Training request submitted", "id": req.id}
    except Exception as e:
        db.rollback()
        print(f"Error creating training request: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error creating training request: {str(e)}")

@router.put("/{request_id}")
def update_request(request_id: int, data: TrainingRequestUpdate, db: Session = Depends(get_tenant_db)):
    req = db.query(TrainingRequest).get(request_id)
    for k, v in data.dict(exclude_unset=True).items():
        setattr(req, k, v)
    db.commit()
    return {"message": "Request updated"}

@router.put("/{request_id}/approve")
def approve_request(request_id: int, data: dict, db: Session = Depends(get_tenant_db)):
    try:
        req = db.query(TrainingRequest).filter(TrainingRequest.id == request_id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Training request not found")
        
        action = data.get('action')
        comment = data.get('comment', '')
        
        if action == 'approve':
            setattr(req, 'status', "HR Approved")
        elif action == 'reject':
            setattr(req, 'status', "Rejected")
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
        
        setattr(req, 'approver', comment)
        db.commit()
        return {"message": f"Request {action}d successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
@router.get("/", response_model=list[TrainingRequestOut])
def list_requests(db: Session = Depends(get_tenant_db)):
    return db.query(TrainingRequest).all()
