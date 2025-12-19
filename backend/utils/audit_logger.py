from sqlalchemy.orm import Session
from models.models_master import AuditLog, ErrorLog
from database import get_master_db
import json
import traceback
from datetime import datetime

def log_audit(
    tenant_id: str,
    user_id: int | None = None,
    action: str = "",
    table_name: str = "",
    record_id: str | None = None,
    old_values: dict | None = None,
    new_values: dict | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None
):
    """Log audit trail to master database"""
    try:
        master_db = next(get_master_db())
        
        audit_log = AuditLog(
            tenant_id=tenant_id,
            user_id=user_id,
            action=action,
            table_name=table_name,
            record_id=str(record_id) if record_id else None,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        master_db.add(audit_log)
        master_db.commit()
    except Exception as e:
        print(f"Audit logging failed: {str(e)}")

def log_error(
    tenant_id: str | None = None,
    error_type: str = "",
    error_message: str = "",
    stack_trace: str | None = None,
    request_url: str | None = None,
    request_method: str | None = None,
    request_data: dict | None = None,
    user_id: int | None = None,
    ip_address: str | None = None
):
    """Log errors to master database"""
    try:
        master_db = next(get_master_db())
        
        error_log = ErrorLog(
            tenant_id=tenant_id,
            error_type=error_type,
            error_message=error_message,
            stack_trace=stack_trace or traceback.format_exc(),
            request_url=request_url,
            request_method=request_method,
            request_data=request_data,
            user_id=user_id,
            ip_address=ip_address
        )
        
        master_db.add(error_log)
        master_db.commit()
    except Exception as e:
        print(f"Error logging failed: {str(e)}")