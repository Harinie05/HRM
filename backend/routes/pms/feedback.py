from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_tenant_db
from models.models_tenant import PMSFeedback, User
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class FeedbackCreate(BaseModel):
    from_employee_id: int
    to_employee_id: int
    relationship: str
    cycle: str
    rating: float
    comments: str

@router.post("/feedback")
async def create_feedback(feedback: dict, db: Session = Depends(get_tenant_db)):
    try:
        db_feedback = PMSFeedback(
            from_employee_id=feedback.get('from_employee_id'),
            to_employee_id=feedback.get('to_employee_id'),
            relationship=feedback.get('relationship'),
            cycle=feedback.get('cycle'),
            rating=feedback.get('rating'),
            comments=feedback.get('comments'),
            strengths=feedback.get('strengths', ''),
            improvements=feedback.get('improvements', ''),
            goals=feedback.get('goals', '')
        )
        db.add(db_feedback)
        db.commit()
        db.refresh(db_feedback)
        return {"message": "Feedback created successfully", "id": db_feedback.id}
    except Exception as e:
        db.rollback()
        print(f"Error creating feedback: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error creating feedback: {str(e)}")

@router.get("/feedback")
async def get_feedback(db: Session = Depends(get_tenant_db)):
    try:
        feedback_list = db.query(PMSFeedback).all()
        
        # Process feedback data with progress tracking
        feedback_data = []
        for feedback in feedback_list:
            # Get employee names
            from_employee_name = "Unknown"
            to_employee_name = "Unknown"
            
            if feedback.from_employee_id is not None:
                from_employee = db.query(User).filter(User.id == feedback.from_employee_id).first()
                if from_employee:
                    from_employee_name = from_employee.name
            
            if feedback.to_employee_id is not None:
                to_employee = db.query(User).filter(User.id == feedback.to_employee_id).first()
                if to_employee:
                    to_employee_name = to_employee.name
            
            # Calculate completion progress
            completion_percentage = 0
            has_rating = feedback.rating is not None
            has_comments = feedback.comments is not None and str(feedback.comments).strip() != ''
            
            if has_rating and has_comments:
                completion_percentage = 100
            elif has_rating or has_comments:
                completion_percentage = 50
            
            feedback_data.append({
                "id": feedback.id,
                "from_employee_id": feedback.from_employee_id,
                "to_employee_id": feedback.to_employee_id,
                "from_employee_name": from_employee_name,
                "to_employee_name": to_employee_name,
                "relationship": feedback.relationship,
                "cycle": feedback.cycle,
                "rating": feedback.rating,
                "comments": feedback.comments,
                "strengths": getattr(feedback, 'strengths', '') or '',
                "improvements": getattr(feedback, 'improvements', '') or '',
                "goals": getattr(feedback, 'goals', '') or '',
                "progress": f"{completion_percentage}%",
                "progress_percentage": completion_percentage,
                "created_at": feedback.created_at.strftime('%Y-%m-%d %H:%M:%S') if feedback.created_at is not None else None
            })
        
        return {"data": feedback_data}
    except Exception as e:
        print(f"Error fetching feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching feedback: {str(e)}")

@router.put("/feedback/{feedback_id}")
async def update_feedback(feedback_id: int, feedback: dict, db: Session = Depends(get_tenant_db)):
    try:
        db_feedback = db.query(PMSFeedback).filter(PMSFeedback.id == feedback_id).first()
        if not db_feedback:
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        for field, value in feedback.items():
            if hasattr(db_feedback, field):
                setattr(db_feedback, field, value)
        
        db.commit()
        return {"message": "Feedback updated successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error updating feedback: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error updating feedback: {str(e)}")

@router.delete("/feedback/{feedback_id}")
async def delete_feedback(feedback_id: int, db: Session = Depends(get_tenant_db)):
    db_feedback = db.query(PMSFeedback).filter(PMSFeedback.id == feedback_id).first()
    if not db_feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    db.delete(db_feedback)
    db.commit()
    return {"message": "Feedback deleted successfully"}