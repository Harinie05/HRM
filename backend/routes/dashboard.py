from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
import database
from database import logger
from models.models_master import Hospital
from models.models_tenant import AuditLog
from routes.hospital import get_current_user
from utils.audit_logger import audit_crud
from utils.permission import check_permission

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def get_hospital_by_db(db: Session, tenant_db: str):
    hospital = db.query(Hospital).filter(Hospital.db_name == tenant_db).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospital

@router.get("/stats")
def get_dashboard_stats(
    request: Request,
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

@router.get("/id-doc-alerts")
def get_id_document_alerts(
    request: Request,
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)
):
    """Get ID document expiry alerts"""
    try:
        # Check permission
        if not check_permission(user, "view_documents_alerts"):
            raise HTTPException(status_code=403, detail="Permission denied")
            
        tenant_db = user.get("tenant_db")
        hospital = get_hospital_by_db(db, tenant_db)
        engine = database.get_tenant_engine(str(hospital.db_name))
        
        from datetime import date
        today = date.today()
        
        with engine.connect() as conn:
            # First check all documents and users separately for debugging
            all_docs = conn.execute(text("""
                SELECT id, employee_id, document_type, file_name, expiry_date 
                FROM employee_id_docs
            """)).fetchall()
            
            all_users = conn.execute(text("""
                SELECT id, name, employee_code, email
                FROM users
            """)).fetchall()
            
            logger.info(f"=== DEBUGGING EMPLOYEE-DOCUMENT MISMATCH ===")
            logger.info(f"Total documents: {len(all_docs)}")
            for row in all_docs:
                logger.info(f"Doc ID: {row[0]}, Employee ID: {row[1]}, Type: {row[2]}, Expiry: {row[4]}")
            
            logger.info(f"Total users: {len(all_users)}")
            for row in all_users:
                logger.info(f"User ID: {row[0]}, Name: {row[1]}, Code: {row[2]}, Email: {row[3]}")
            
            # Get documents with employee details
            result = conn.execute(text("""
                SELECT 
                    d.employee_id, 
                    d.document_type, 
                    d.file_name, 
                    d.expiry_date,
                    u.name as employee_name,
                    u.employee_code,
                    u.email
                FROM employee_id_docs d
                LEFT JOIN users u ON d.employee_id = u.id
                WHERE d.expiry_date IS NOT NULL
            """)).fetchall()
            
            logger.info(f"=== JOIN RESULTS ===")
            logger.info(f"Found {len(result)} documents with expiry dates after JOIN")
            for row in result:
                logger.info(f"Employee ID: {row[0]}, Name: {row[4]}, Code: {row[5]}, Email: {row[6]}, Document: {row[1]}, Expiry: {row[3]}")
            
            alerts = []
            for row in result:
                if row[3]:  # expiry_date
                    days_until_expiry = (row[3] - today).days
                    alert_level = "critical" if days_until_expiry <= 0 else "warning"
                    
                    alert_data = {
                        "employee_id": row[0],
                        "employee_name": row[4] or f"Employee {row[0]}",
                        "employee_code": row[5] or "",
                        "document_type": row[1],
                        "file_name": row[2],
                        "expiry_date": row[3].isoformat(),
                        "days_until_expiry": days_until_expiry,
                        "alert_level": alert_level
                    }
                    logger.info(f"Creating alert: {alert_data}")
                    alerts.append(alert_data)
        
        return {"alerts": alerts}
        
    except Exception as e:
        logger.error(f"Error fetching ID document alerts: {str(e)}")
        return {"alerts": []}

@router.get("/audit-summary")
def get_audit_summary(
    request: Request,
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)
):
    """Get audit log summary for dashboard"""
    try:
        # Check permission
        if not check_permission(user, "view_audit_log"):
            raise HTTPException(status_code=403, detail="Permission denied")
            
        tenant_db = user.get("tenant_db")
        hospital = get_hospital_by_db(db, tenant_db)
        engine = database.get_tenant_engine(str(hospital.db_name))
        
        with engine.connect() as conn:
            # Get total audit logs count
            total_logs = conn.execute(text("""
                SELECT COUNT(*) FROM audit_logs
            """)).scalar() or 0
            
            # Get recent activity (last 7 days)
            recent_activity = conn.execute(text("""
                SELECT COUNT(*) FROM audit_logs 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            """)).scalar() or 0
            
            # Get top actions
            top_actions = conn.execute(text("""
                SELECT action, COUNT(*) as count
                FROM audit_logs
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY action
                ORDER BY count DESC
                LIMIT 5
            """)).fetchall()
            
            # Get active users (users who performed actions in last 24 hours)
            active_users = conn.execute(text("""
                SELECT COUNT(DISTINCT employee_name) FROM audit_logs 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
                AND employee_name IS NOT NULL
            """)).scalar() or 0
        
        return {
            "total_logs": total_logs,
            "recent_activity": recent_activity,
            "active_users_24h": active_users,
            "top_actions": [{"action": row[0], "count": row[1]} for row in top_actions]
        }
        
    except Exception as e:
        logger.error(f"Error fetching audit summary: {str(e)}")
        return {
            "total_logs": 0,
            "recent_activity": 0,
            "active_users_24h": 0,
            "top_actions": []
        }