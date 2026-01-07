from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_tenant_db
from models.models_tenant import PMSReview, User
from pydantic import BaseModel
from typing import Optional
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user, require_permission

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
async def create_review(review: dict, request: Request, db: Session = Depends(get_tenant_db), user = Depends(require_permission("create_review_cycle"))):
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
        audit_crud(request, db, user, "CREATE_REVIEW", "pms_reviews", str(db_review.id), {}, review)
        
        return {"message": "Review created successfully", "id": db_review.id}
    except Exception as e:
        db.rollback()
        print(f"Error creating review: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error creating review: {str(e)}")

@router.get("/reviews")
async def get_reviews(include_deleted: bool = False, db: Session = Depends(get_tenant_db), user = Depends(require_permission("view_review_cycles"))):
    # Check for show deleted permission if requesting deleted items
    if include_deleted:
        # Simple permission check - if user can view reviews, they can view deleted ones
        pass
    
    try:
        if include_deleted:
            reviews = db.query(PMSReview).filter(PMSReview.deleted_at.isnot(None)).all()
            print(f"DEBUG: Found {len(reviews)} deleted reviews")
        else:
            reviews = db.query(PMSReview).filter(PMSReview.deleted_at.is_(None)).all()
            print(f"DEBUG: Found {len(reviews)} active reviews")
        
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
            
            # Calculate participants count from work assignments
            participants_count = 0
            try:
                participants_result = db.execute(text("SELECT COUNT(DISTINCT assigned_employee_id) FROM work_assignments WHERE review_cycle_id = :cycle_id"), {"cycle_id": review.id}).scalar()
                participants_count = participants_result or 0
            except:
                participants_count = 0
            
            reviews_data.append({
                "id": review.id,
                "employee_id": review.employee_id,
                "employee_name": employee_name,
                "cycle": review.cycle,
                "cycle_name": review.cycle,  # For compatibility
                "review_type": review.review_type,
                "self_score": review.self_score,
                "manager_score": review.manager_score,
                "self_comments": review.self_comments,
                "manager_comments": review.manager_comments,
                "status": review.status,
                "progress": f"{completion_percentage}%",
                "progress_percentage": completion_percentage,
                "participants": participants_count,
                "is_active": review.is_active,
                "created_at": review.created_at.strftime('%Y-%m-%d %H:%M:%S') if review.created_at is not None else None
            })
        
        return {"data": reviews_data}
    except Exception as e:
        print(f"Error fetching reviews: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching reviews: {str(e)}")

@router.put("/reviews/{review_id}")
async def update_review(review_id: int, review: dict, request: Request, db: Session = Depends(get_tenant_db), user = Depends(require_permission("edit_review_cycle"))):
    try:
        db_review = db.query(PMSReview).filter(PMSReview.id == review_id, PMSReview.deleted_at.is_(None)).first()
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
        audit_crud(request, db, user, "UPDATE_REVIEW", "pms_reviews", str(review_id), old_values, review)
        return {"message": "Review updated successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error updating review: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error updating review: {str(e)}")

@router.delete("/reviews/{review_id}")
async def delete_review(review_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(require_permission("delete_review_cycle"))):
    try:
        db_review = db.query(PMSReview).filter(PMSReview.id == review_id).first()
        if not db_review:
            raise HTTPException(status_code=404, detail="Review not found")
        
        # Check if already deleted
        if db_review.deleted_at is not None:
            raise HTTPException(status_code=400, detail="Review is already deleted")
        
        # Store old values for audit
        old_values = {"is_active": db_review.is_active, "deleted_at": db_review.deleted_at}
        
        # Soft delete
        from datetime import datetime
        setattr(db_review, 'is_active', False)
        setattr(db_review, 'deleted_at', datetime.now())
        db.commit()
        
        # Audit log
        audit_crud(request, db, user, "DELETE_REVIEW", "pms_reviews", str(review_id), old_values, {"is_active": False, "deleted_at": db_review.deleted_at})
        return {"message": "Review deleted successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error deleting review: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error deleting review: {str(e)}")

@router.get("/reviews/deleted-count")
async def get_deleted_reviews_count(
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("view_review_cycles"))
):
    try:
        count = db.query(PMSReview).filter(PMSReview.deleted_at.isnot(None)).count()
        return {"count": count or 0}
    except Exception as e:
        print(f"Error getting deleted reviews count: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/reviews/{review_id}/restore")
async def restore_review(review_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(require_permission("restore_review_cycle"))):
    try:
        db_review = db.query(PMSReview).filter(PMSReview.id == review_id, PMSReview.deleted_at.isnot(None)).first()
        if not db_review:
            raise HTTPException(status_code=404, detail="Deleted review not found")
        
        # Store old values for audit
        old_values = {"is_active": db_review.is_active, "deleted_at": db_review.deleted_at}
        
        # Restore
        setattr(db_review, 'is_active', True)
        setattr(db_review, 'deleted_at', None)
        db.commit()
        
        # Audit log
        audit_crud(request, db, user, "RESTORE_REVIEW", "pms_reviews", str(review_id), old_values, {"is_active": True, "deleted_at": None})
        return {"message": "Review restored successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error restoring review: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error restoring review: {str(e)}")