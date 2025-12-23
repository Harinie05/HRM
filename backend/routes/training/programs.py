from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from models.models_tenant import TrainingProgram, User
from pydantic import BaseModel
from typing import Optional
from datetime import date
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user

router = APIRouter()

class TrainingProgramCreate(BaseModel):
    title: str
    category: str
    type: str
    trainer: str
    department: Optional[str] = None
    start_date: date
    end_date: date
    max_participants: Optional[int] = None
    status: str = "Draft"

@router.post("/programs")
async def create_training_program(program: dict, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        # Parse dates
        start_date = None
        end_date = None
        if program.get('startDate'):
            from datetime import datetime
            start_date = datetime.strptime(program['startDate'], '%Y-%m-%d').date()
        if program.get('endDate'):
            from datetime import datetime
            end_date = datetime.strptime(program['endDate'], '%Y-%m-%d').date()

        # Handle empty max_participants
        max_participants = program.get('maxParticipants')
        if max_participants == '' or max_participants is None:
            max_participants = None
        else:
            max_participants = int(max_participants)

        db_program = TrainingProgram(
            title=program.get('title'),
            category=program.get('category'),
            type=program.get('type'),
            trainer=program.get('trainer'),
            department=program.get('department') if program.get('department') else None,
            start_date=start_date,
            end_date=end_date,
            max_participants=max_participants,
            description=program.get('description'),
            status=program.get('status', 'Draft')
        )
        db.add(db_program)
        db.commit()
        db.refresh(db_program)
        
        # Audit log
        audit_crud(request, "tenant", user, "CREATE_TRAINING_PROGRAM", "training_programs", str(db_program.id), None, program)
        
        return {"message": "Training program created successfully", "id": db_program.id}
    except Exception as e:
        db.rollback()
        print(f"Error creating training program: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error creating training program: {str(e)}")

@router.get("/programs")
async def get_training_programs(db: Session = Depends(get_tenant_db)):
    try:
        programs = db.query(TrainingProgram).all()
        
        programs_data = []
        for program in programs:
            programs_data.append({
                "id": program.id,
                "title": program.title,
                "category": program.category,
                "type": program.type,
                "trainer": program.trainer,
                "department": program.department,
                "startDate": program.start_date.strftime('%Y-%m-%d') if program.start_date else None,
                "endDate": program.end_date.strftime('%Y-%m-%d') if program.end_date else None,
                "maxParticipants": program.max_participants,
                "status": program.status,
                "created_at": program.created_at.strftime('%Y-%m-%d %H:%M:%S') if program.created_at else None
            })
        
        return {"data": programs_data}
    except Exception as e:
        print(f"Error fetching training programs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching training programs: {str(e)}")

@router.put("/programs/{program_id}")
async def update_training_program(program_id: int, program: dict, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        db_program = db.query(TrainingProgram).filter(TrainingProgram.id == program_id).first()
        if not db_program:
            raise HTTPException(status_code=404, detail="Training program not found")
        
        # Store old values for audit
        old_values = {"title": db_program.title, "category": db_program.category, "type": db_program.type, "status": db_program.status}
        
        # Parse dates
        if program.get('startDate'):
            from datetime import datetime
            db_program.start_date = datetime.strptime(program['startDate'], '%Y-%m-%d').date()
        if program.get('endDate'):
            from datetime import datetime
            db_program.end_date = datetime.strptime(program['endDate'], '%Y-%m-%d').date()
        
        # Update other fields
        if program.get('title'):
            db_program.title = program['title']
        if program.get('category'):
            db_program.category = program['category']
        if program.get('type'):
            db_program.type = program['type']
        if program.get('trainer'):
            db_program.trainer = program['trainer']
        if program.get('department'):
            db_program.department = program['department']
        if program.get('maxParticipants'):
            db_program.max_participants = program['maxParticipants']
        if program.get('status'):
            db_program.status = program['status']
        
        db.commit()
        
        # Audit log
        audit_crud(request, "tenant", user, "UPDATE_TRAINING_PROGRAM", "training_programs", str(program_id), old_values, program)
        
        return {"message": "Training program updated successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error updating training program: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error updating training program: {str(e)}")

@router.delete("/programs/{program_id}")
async def delete_training_program(program_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        db_program = db.query(TrainingProgram).filter(TrainingProgram.id == program_id).first()
        if not db_program:
            raise HTTPException(status_code=404, detail="Training program not found")
        
        # Store old values for audit
        old_values = {"title": db_program.title, "category": db_program.category, "type": db_program.type}
        
        db.delete(db_program)
        db.commit()
        
        # Audit log
        audit_crud(request, "tenant", user, "DELETE_TRAINING_PROGRAM", "training_programs", str(program_id), old_values, None)
        
        return {"message": "Training program deleted successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error deleting training program: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error deleting training program: {str(e)}")