from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_tenant_db
from typing import List
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
def create_od_application(data: ODApplicationCreate, db: Session = Depends(get_tenant_db)):
    try:
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
def get_od_applications(employee_id: int = None, status: str = None, db: Session = Depends(get_tenant_db)):
    try:
        query = "SELECT * FROM od_applications WHERE 1=1"
        params = {}
        
        if employee_id:
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
def approve_od_application(od_id: int, db: Session = Depends(get_tenant_db)):
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
        if existing_attendance:
            # Update existing record to mark as present
            update_attendance = text("""
                UPDATE attendance_punches 
                SET status = 'Present', in_time = :from_time, out_time = :to_time
                WHERE id = :attendance_id
            """)
            db.execute(update_attendance, {
                'from_time': od_app.from_time,
                'to_time': od_app.to_time,
                'attendance_id': existing_attendance.id
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
        return {"message": "OD application approved and attendance marked as present"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to approve OD application: {str(e)}")

@router.patch("/{od_id}/reject")
def reject_od_application(od_id: int, db: Session = Depends(get_tenant_db)):
    try:
        query = text("UPDATE od_applications SET status = 'rejected' WHERE id = :od_id")
        result = db.execute(query, {'od_id': od_id})
        db.commit()
        
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="OD application not found")
            
        return {"message": "OD application rejected successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to reject OD application: {str(e)}")