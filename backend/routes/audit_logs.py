from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import text, desc
from database import get_tenant_db
from models.models_tenant import AuditLog, ErrorLog
from routes.hospital import get_current_user
from utils.audit_logger import audit_crud
from typing import Optional
from datetime import datetime, date

router = APIRouter(prefix="/audit", tags=["Audit Logs"])

@router.get("/logs")
async def get_audit_logs(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=1000),
    action: Optional[str] = Query(None),
    table_name: Optional[str] = Query(None),
    employee_name: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    """Get audit logs with filtering and pagination"""
    try:
        # Build query
        query = db.query(AuditLog)
        
        # Apply filters
        if action:
            query = query.filter(AuditLog.action.ilike(f"%{action}%"))
        if table_name:
            query = query.filter(AuditLog.table_name.ilike(f"%{table_name}%"))
        if employee_name:
            query = query.filter(AuditLog.employee_name.ilike(f"%{employee_name}%"))
        if start_date:
            query = query.filter(AuditLog.created_at >= start_date)
        if end_date:
            query = query.filter(AuditLog.created_at <= end_date)
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering
        offset = (page - 1) * limit
        logs = query.order_by(desc(AuditLog.created_at)).offset(offset).limit(limit).all()
        
        # Format response
        audit_logs = []
        for log in logs:
            audit_logs.append({
                "id": log.id,
                "user_id": log.user_id,
                "employee_name": log.employee_name,
                "employee_code": log.employee_code,
                "employee_id_onboarding": log.employee_id_onboarding,
                "action": log.action,
                "table_name": log.table_name,
                "record_id": log.record_id,
                "old_values": log.old_values,
                "new_values": log.new_values,
                "ip_address": log.ip_address,
                "user_agent": log.user_agent,
                "created_at": log.created_at.isoformat() if log.created_at is not None else None
            })
        
        return {
            "data": audit_logs,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching audit logs: {str(e)}")

@router.get("/logs/{log_id}")
async def get_audit_log_detail(
    log_id: int,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    """Get detailed audit log by ID"""
    try:
        log = db.query(AuditLog).filter(AuditLog.id == log_id).first()
        if not log:
            raise HTTPException(status_code=404, detail="Audit log not found")
        
        return {
            "id": log.id,
            "user_id": log.user_id,
            "employee_name": log.employee_name,
            "employee_code": log.employee_code,
            "employee_id_onboarding": log.employee_id_onboarding,
            "action": log.action,
            "table_name": log.table_name,
            "record_id": log.record_id,
            "old_values": log.old_values,
            "new_values": log.new_values,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "created_at": log.created_at.isoformat() if log.created_at is not None else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching audit log: {str(e)}")

@router.get("/stats")
async def get_audit_stats(
    request: Request,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    """Get audit log statistics"""
    try:
        # Base query
        base_query = db.query(AuditLog)
        
        # Apply date filters
        if start_date:
            base_query = base_query.filter(AuditLog.created_at >= start_date)
        if end_date:
            base_query = base_query.filter(AuditLog.created_at <= end_date)
        
        # Get total logs
        total_logs = base_query.count()
        
        # Get logs by action
        action_stats = db.execute(text("""
            SELECT action, COUNT(*) as count
            FROM audit_logs
            WHERE (:start_date IS NULL OR created_at >= :start_date)
            AND (:end_date IS NULL OR created_at <= :end_date)
            GROUP BY action
            ORDER BY count DESC
            LIMIT 10
        """), {
            "start_date": start_date,
            "end_date": end_date
        }).fetchall()
        
        # Get logs by table
        table_stats = db.execute(text("""
            SELECT table_name, COUNT(*) as count
            FROM audit_logs
            WHERE (:start_date IS NULL OR created_at >= :start_date)
            AND (:end_date IS NULL OR created_at <= :end_date)
            GROUP BY table_name
            ORDER BY count DESC
            LIMIT 10
        """), {
            "start_date": start_date,
            "end_date": end_date
        }).fetchall()
        
        # Get logs by employee
        employee_stats = db.execute(text("""
            SELECT employee_name, COUNT(*) as count
            FROM audit_logs
            WHERE employee_name IS NOT NULL
            AND (:start_date IS NULL OR created_at >= :start_date)
            AND (:end_date IS NULL OR created_at <= :end_date)
            GROUP BY employee_name
            ORDER BY count DESC
            LIMIT 10
        """), {
            "start_date": start_date,
            "end_date": end_date
        }).fetchall()
        
        return {
            "total_logs": total_logs,
            "action_stats": [{"action": row[0], "count": row[1]} for row in action_stats],
            "table_stats": [{"table_name": row[0], "count": row[1]} for row in table_stats],
            "employee_stats": [{"employee_name": row[0], "count": row[1]} for row in employee_stats]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching audit stats: {str(e)}")

@router.get("/error-logs")
async def get_error_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=1000),
    error_type: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    """Get error logs with filtering and pagination"""
    try:
        # Build query
        query = db.query(ErrorLog)
        
        # Apply filters
        if error_type:
            query = query.filter(ErrorLog.error_type.ilike(f"%{error_type}%"))
        if start_date:
            query = query.filter(ErrorLog.created_at >= start_date)
        if end_date:
            query = query.filter(ErrorLog.created_at <= end_date)
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering
        offset = (page - 1) * limit
        logs = query.order_by(desc(ErrorLog.created_at)).offset(offset).limit(limit).all()
        
        # Format response
        error_logs = []
        for log in logs:
            error_logs.append({
                "id": log.id,
                "user_id": log.user_id,
                "employee_name": log.employee_name,
                "employee_code": log.employee_code,
                "error_type": log.error_type,
                "error_message": log.error_message,
                "stack_trace": log.stack_trace,
                "request_url": log.request_url,
                "request_method": log.request_method,
                "request_data": log.request_data,
                "ip_address": log.ip_address,
                "created_at": log.created_at.isoformat() if log.created_at is not None else None
            })
        
        return {
            "data": error_logs,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching error logs: {str(e)}")

@router.delete("/logs/cleanup")
async def cleanup_old_logs(
    request: Request,
    days: int = Query(90, ge=1, le=365),
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    """Clean up audit logs older than specified days"""
    try:
        # Calculate cutoff date
        cutoff_date = datetime.now().date()
        cutoff_date = cutoff_date.replace(day=cutoff_date.day - days)
        
        # Delete old audit logs
        audit_result = db.execute(text("""
            DELETE FROM audit_logs 
            WHERE created_at < :cutoff_date
        """), {"cutoff_date": cutoff_date})
        audit_deleted = getattr(audit_result, 'rowcount', 0)
        
        # Delete old error logs
        error_result = db.execute(text("""
            DELETE FROM error_logs 
            WHERE created_at < :cutoff_date
        """), {"cutoff_date": cutoff_date})
        error_deleted = getattr(error_result, 'rowcount', 0)
        
        db.commit()
        
        return {
            "message": f"Cleanup completed successfully",
            "audit_logs_deleted": audit_deleted,
            "error_logs_deleted": error_deleted,
            "cutoff_date": cutoff_date.isoformat()
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error during cleanup: {str(e)}")