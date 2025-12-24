from fastapi import APIRouter, Depends, HTTPException, Request, Form, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_tenant_db
from utils.audit_logger import audit_crud
from pydantic import BaseModel
from typing import Optional
import uuid
import os
from datetime import datetime

router = APIRouter(prefix="/recruitment/referral", tags=["Recruitment - Referral"])

class ReferralLinkCreate(BaseModel):
    job_id: int
    referrer_employee_id: int
    referrer_name: str

class ReferralApplication(BaseModel):
    job_id: int
    referral_code: str
    candidate_name: str
    candidate_email: str
    candidate_phone: str
    resume_path: Optional[str] = None

@router.get("/validate-employee/{employee_code}")
def validate_employee(
    employee_code: str,
    db: Session = Depends(get_tenant_db)
):
    """Validate if employee exists in organization"""
    try:
        query = text("""
            SELECT u.id, u.name, u.employee_code, d.name as department, r.name as role
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE (u.employee_code = :emp_code OR u.id = :emp_code) 
            AND u.status = 'active'
        """)
        
        employee = db.execute(query, {"emp_code": employee_code}).fetchone()
        
        if employee:
            return {
                "exists": True,
                "id": employee.id,
                "name": employee.name,
                "employee_code": employee.employee_code,
                "department": employee.department or "N/A",
                "role": employee.role or "N/A"
            }
        else:
            return {"exists": False}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to validate employee: {str(e)}")

@router.post("/generate-link")
def generate_referral_link(
    data: ReferralLinkCreate,
    request: Request,
    db: Session = Depends(get_tenant_db)
):
    """Generate referral link for employees to share"""
    try:
        # Create referral_links table if not exists
        create_table_query = text("""
            CREATE TABLE IF NOT EXISTS referral_links (
                id INT AUTO_INCREMENT PRIMARY KEY,
                job_id INT NOT NULL,
                referrer_employee_id INT NOT NULL,
                referrer_name VARCHAR(255) NOT NULL,
                referral_code VARCHAR(50) UNIQUE NOT NULL,
                referral_url TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) DEFAULT 'Active'
            )
        """)
        db.execute(create_table_query)
        db.commit()
        
        # Generate unique referral code
        referral_code = f"REF_{data.job_id}_{uuid.uuid4().hex[:8].upper()}"
        referral_url = f"http://localhost:3000/apply/{data.job_id}?ref={referral_code}"
        
        # Insert referral link
        insert_query = text("""
            INSERT INTO referral_links (job_id, referrer_employee_id, referrer_name, referral_code, referral_url)
            VALUES (:job_id, :referrer_id, :referrer_name, :referral_code, :referral_url)
        """)
        
        db.execute(insert_query, {
            "job_id": data.job_id,
            "referrer_id": data.referrer_employee_id,
            "referrer_name": data.referrer_name,
            "referral_code": referral_code,
            "referral_url": referral_url
        })
        db.commit()
        
        # Audit log
        audit_crud(request, "nutryah", {"id": data.referrer_employee_id}, "CREATE_REFERRAL_LINK", "referral_links", referral_code, {}, data.dict())
        
        return {
            "referral_code": referral_code,
            "referral_url": referral_url,
            "message": "Referral link generated successfully"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to generate referral link: {str(e)}")

@router.get("/applications/{job_id}")
def get_job_applications(
    job_id: int,
    db: Session = Depends(get_tenant_db)
):
    """Get all applications for a job with referral information"""
    try:
        query = text("""
            SELECT 
                id, job_id, candidate_name, candidate_email, candidate_phone,
                application_type, referral_code, referrer_name, status, applied_at
            FROM job_applications 
            WHERE job_id = :job_id 
            ORDER BY applied_at DESC
        """)
        
        applications = db.execute(query, {"job_id": job_id}).fetchall()
        
        result = []
        for app in applications:
            result.append({
                "id": app.id,
                "job_id": app.job_id,
                "candidate_name": app.candidate_name,
                "candidate_email": app.candidate_email,
                "candidate_phone": app.candidate_phone,
                "application_type": app.application_type,
                "referral_code": app.referral_code,
                "referrer_name": app.referrer_name,
                "status": app.status,
                "applied_at": app.applied_at,
                "is_referral": app.application_type == "Referral"
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch applications: {str(e)}")

@router.get("/dashboard-stats")
def get_referral_dashboard_stats(db: Session = Depends(get_tenant_db)):
    """Get referral statistics for dashboard"""
    try:
        stats_query = text("""
            SELECT 
                COUNT(DISTINCT rl.id) as total_referral_links,
                COUNT(DISTINCT ja.id) as total_referral_applications,
                COUNT(DISTINCT rl.referrer_employee_id) as active_referrers,
                COUNT(CASE WHEN ja.status = 'Hired' THEN 1 END) as successful_referrals
            FROM referral_links rl
            LEFT JOIN job_applications ja ON rl.referral_code = ja.referral_code
        """)
        
        stats = db.execute(stats_query).fetchone()
        
        return {
            "total_referral_links": stats.total_referral_links or 0,
            "total_referral_applications": stats.total_referral_applications or 0,
            "active_referrers": stats.active_referrers or 0,
            "successful_referrals": stats.successful_referrals or 0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")