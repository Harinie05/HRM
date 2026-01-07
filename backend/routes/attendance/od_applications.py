from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_tenant_db
from utils.audit_logger import audit_crud
from utils.permission import require_permission
from routes.hospital import get_current_user
from typing import List, Optional, Optional
from datetime import date
from pydantic import BaseModel

router = APIRouter(prefix="/attendance/od-applications", tags=["OD Applications"])

class ODApplicationCreate(BaseModel):
    employee_id: int
    od_date: date
    purpose: str
    from_time: str = "09:00"
    to_time: str = "18:00"
    location: str = ""

class ODApplicationOut(BaseModel):
    id: int
    employee_id: int
    od_date: date
    purpose: str
    from_time: str
    to_time: str
    location: str
    status: str
    created_at: str

@router.post("/", response_model=ODApplicationOut)
def create_od_application(data: ODApplicationCreate, request: Request, db: Session = Depends(get_tenant_db), user = Depends(require_permission("apply_od"))):
    try:
        # Check if user has view_self permission and restrict to own employee_id
        user_permissions = user.get('permissions', [])
        if 'view_self' in user_permissions:
            current_user_id = user.get('user_id')
            if current_user_id and data.employee_id != current_user_id:
                raise HTTPException(status_code=403, detail="You can only create OD applications for yourself")
        
        query = text("""
            INSERT INTO od_applications (employee_id, od_date, purpose, from_time, to_time, location, status, created_at)
            VALUES (:employee_id, :od_date, :purpose, :from_time, :to_time, :location, 'pending', NOW())
        """)
        
        result = db.execute(query, {
            'employee_id': data.employee_id,
            'od_date': data.od_date,
            'purpose': data.purpose,
            'from_time': data.from_time,
            'to_time': data.to_time,
            'location': data.location
        })
        db.commit()
        
        # Get the created record
        get_query = text("SELECT * FROM od_applications WHERE id = LAST_INSERT_ID()")
        od_app = db.execute(get_query).fetchone()
        
        if not od_app:
            raise HTTPException(status_code=500, detail="Failed to retrieve created OD application")
        
        # Audit log
        audit_crud(request, db, user, "CREATE_OD_APPLICATION", "od_applications", str(od_app.id), {}, data.dict())
        
        return ODApplicationOut(
            id=od_app.id,
            employee_id=od_app.employee_id,
            od_date=od_app.od_date,
            purpose=od_app.purpose,
            from_time=od_app.from_time,
            to_time=od_app.to_time,
            location=od_app.location,
            status=od_app.status,
            created_at=str(od_app.created_at)
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create OD application: {str(e)}")

@router.get("/", response_model=List[ODApplicationOut])
def get_od_applications(employee_id: Optional[int] = None, status: Optional[str] = None, db: Session = Depends(get_tenant_db), user = Depends(require_permission("view_od_applications"))):
    try:
        query = "SELECT * FROM od_applications WHERE 1=1"
        params = {}
        
        # Check if user has view_self permission (can only view own records)
        user_permissions = user.get('permissions', [])
        if 'view_self' in user_permissions:
            # User can only view their own records
            current_user_id = user.get('user_id')
            if current_user_id:
                query += " AND employee_id = :current_user_id"
                params['current_user_id'] = current_user_id
        elif employee_id:
            query += " AND employee_id = :employee_id"
            params['employee_id'] = employee_id
            
        if status:
            query += " AND status = :status"
            params['status'] = status
            
        query += " ORDER BY created_at DESC"
        
        results = db.execute(text(query), params).fetchall()
        
        return [ODApplicationOut(
            id=row.id,
            employee_id=row.employee_id,
            od_date=row.od_date,
            purpose=row.purpose,
            from_time=row.from_time,
            to_time=row.to_time,
            location=row.location,
            status=row.status,
            created_at=str(row.created_at)
        ) for row in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch OD applications: {str(e)}")

@router.patch("/{od_id}/approve")
def approve_od_application(od_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(require_permission("approve_od"))):
    try:
        # Get OD application details
        od_query = text("SELECT employee_id, od_date, from_time, to_time FROM od_applications WHERE id = :od_id")
        od_app = db.execute(od_query, {'od_id': od_id}).fetchone()
        
        if not od_app:
            raise HTTPException(status_code=404, detail="OD application not found")
        
        # Update OD status to approved
        update_query = text("UPDATE od_applications SET status = 'approved' WHERE id = :od_id")
        db.execute(update_query, {'od_id': od_id})
        
        # Check if attendance record already exists for this date
        attendance_check = text("""
            SELECT id FROM attendance_punches 
            WHERE employee_id = :employee_id AND date = :od_date
        """)
        existing_attendance = db.execute(attendance_check, {
            'employee_id': od_app.employee_id,
            'od_date': od_app.od_date
        }).fetchone()
        
        # Create or update attendance record
        if existing_attendance and existing_attendance.id:
            # Update existing record to mark as present
            update_attendance = text("""
                UPDATE attendance_punches 
                SET status = 'Present', in_time = :from_time, out_time = :to_time
                WHERE id = :attendance_id
            """)
            db.execute(update_attendance, {
                'from_time': od_app.from_time,
                'to_time': od_app.to_time,
                'attendance_id': existing_attendance.id if existing_attendance.id is not None else 0
            })
        else:
            # Create new attendance record
            create_attendance = text("""
                INSERT INTO attendance_punches (employee_id, date, in_time, out_time, status, source, created_at)
                VALUES (:employee_id, :od_date, :from_time, :to_time, 'Present', 'OD_APPROVED', NOW())
            """)
            db.execute(create_attendance, {
                'employee_id': od_app.employee_id,
                'od_date': od_app.od_date,
                'from_time': od_app.from_time,
                'to_time': od_app.to_time
            })
        
        db.commit()
        
        # Audit log
        audit_crud(request, db, user, "APPROVE_OD_APPLICATION", "od_applications", str(od_id), {"status": "pending"}, {"status": "approved", "employee_id": od_app.employee_id})
        
        return {"message": "OD application approved and attendance marked as present"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to approve OD application: {str(e)}")

@router.patch("/{od_id}/reject")
def reject_od_application(od_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(require_permission("reject_od"))):
    try:
        # Check if OD application exists first
        check_query = text("SELECT id FROM od_applications WHERE id = :od_id")
        existing = db.execute(check_query, {'od_id': od_id}).fetchone()
        
        if not existing:
            raise HTTPException(status_code=404, detail="OD application not found")
        
        # Update the status
        query = text("UPDATE od_applications SET status = 'rejected' WHERE id = :od_id")
        db.execute(query, {'od_id': od_id})
        db.commit()
        
        # Audit log
        audit_crud(request, db, user, "REJECT_OD_APPLICATION", "od_applications", str(od_id), {"status": "pending"}, {"status": "rejected"})
            
        return {"message": "OD application rejected successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to reject OD application: {str(e)}")