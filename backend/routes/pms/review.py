from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from models.models_tenant import PMSReview, User
from pydantic import BaseModel
from typing import Optional
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user

router = APIRouter()

class ReviewCreate(BaseModel):
    employee_id: int
    cycle: str
    review_type: str
    self_score: Optional[float] = None
    manager_score: Optional[float] = None
    self_comments: Optional[str] = None
    manager_comments: Optional[str] = None
    status: str = "Pending"

@router.post("/reviews")
async def create_review(review: dict, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        db_review = PMSReview(
            employee_id=review.get('employee_id'),
            cycle=review.get('cycle'),
            review_type=review.get('review_type'),
            self_score=review.get('self_score'),
            manager_score=review.get('manager_score'),
            self_comments=review.get('self_comments'),
            manager_comments=review.get('manager_comments'),
            status=review.get('status', 'Pending')
        )
        db.add(db_review)
        db.commit()
        db.refresh(db_review)
        
        # Audit log
        audit_crud(request, "tenant", user, "CREATE_REVIEW", "pms_reviews", str(db_review.id), None, review)
        
        return {"message": "Review created successfully", "id": db_review.id}
    except Exception as e:
        db.rollback()
        print(f"Error creating review: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error creating review: {str(e)}")

@router.get("/reviews")
async def get_reviews(db: Session = Depends(get_tenant_db)):
    try:
        reviews = db.query(PMSReview).all()
        
        # Calculate progress for each review cycle
        reviews_data = []
        for review in reviews:
            # Get employee name
            employee_name = "Unknown"
            if review.employee_id is not None:
                employee = db.query(User).filter(User.id == review.employee_id).first()
                if employee:
                    employee_name = employee.name
            
            # Calculate completion progress
            completion_percentage = 0
            if review.self_score is not None and review.manager_score is not None:
                completion_percentage = 100
            elif review.self_score is not None or review.manager_score is not None:
                completion_percentage = 50
            
            reviews_data.append({
                "id": review.id,
                "employee_id": review.employee_id,
                "employee_name": employee_name,
                "cycle": review.cycle,
                "review_type": review.review_type,
                "self_score": review.self_score,
                "manager_score": review.manager_score,
                "self_comments": review.self_comments,
                "manager_comments": review.manager_comments,
                "status": review.status,
                "progress": f"{completion_percentage}%",
                "progress_percentage": completion_percentage,
                "created_at": review.created_at.strftime('%Y-%m-%d %H:%M:%S') if review.created_at is not None else None
            })
        
        return {"data": reviews_data}
    except Exception as e:
        print(f"Error fetching reviews: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching reviews: {str(e)}")

@router.put("/reviews/{review_id}")
async def update_review(review_id: int, review: dict, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        db_review = db.query(PMSReview).filter(PMSReview.id == review_id).first()
        if not db_review:
            raise HTTPException(status_code=404, detail="Review not found")
        
        # Store old values for audit
        old_values = {field: getattr(db_review, field) for field in review.keys() if hasattr(db_review, field)}
        
        # Update fields
        for field, value in review.items():
            if hasattr(db_review, field):
                setattr(db_review, field, value)
        
        db.commit()
        
        # Audit log
        audit_crud(request, "tenant", user, "UPDATE_REVIEW", "pms_reviews", str(review_id), old_values, review)
        return {"message": "Review updated successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error updating review: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error updating review: {str(e)}")

@router.delete("/reviews/{review_id}")
async def delete_review(review_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    db_review = db.query(PMSReview).filter(PMSReview.id == review_id).first()
    if not db_review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Store old values for audit
    old_values = {"employee_id": db_review.employee_id, "cycle": db_review.cycle, "review_type": db_review.review_type}
    
    db.delete(db_review)
    db.commit()
    
    # Audit log
    audit_crud(request, "tenant", user, "DELETE_REVIEW", "pms_reviews", str(review_id), old_values, None)
    return {"message": "Review deleted successfully"}