from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
import database
from database import logger
from models.models_master import Hospital
from routes.hospital import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def get_hospital_by_db(db: Session, tenant_db: str):
    hospital = db.query(Hospital).filter(Hospital.db_name == tenant_db).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospital

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)
):
    """Get dashboard statistics for the current tenant"""
    try:
        tenant_db = user.get("tenant_db")
        logger.info(f"Fetching dashboard stats for tenant {tenant_db}")
        
        hospital = get_hospital_by_db(db, tenant_db)
        engine = database.get_tenant_engine(str(hospital.db_name))
        
        with engine.connect() as conn:
            # Get total employees
            employees_result = conn.execute(text("SELECT COUNT(*) FROM users")).fetchone()
            total_employees = employees_result[0] if employees_result else 0
            
            # Get total departments
            departments_result = conn.execute(text("SELECT COUNT(*) FROM departments")).fetchone()
            total_departments = departments_result[0] if departments_result else 0
            
            # Get total roles
            roles_result = conn.execute(text("SELECT COUNT(*) FROM roles")).fetchone()
            total_roles = roles_result[0] if roles_result else 0
        
        return {
            "totalEmployees": total_employees,
            "totalDepartments": total_departments,
            "totalRoles": total_roles,
            "tenant": tenant_db
        }
        
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard stats: {str(e)}")