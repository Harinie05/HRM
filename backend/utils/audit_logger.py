from sqlalchemy.orm import Session
from models.models_master import AuditLog, ErrorLog
from database import get_master_db
import json
import traceback
from datetime import datetime
from fastapi import Request
from utils.token import verify_token
import os

def get_tenant_name_from_request(request: Request) -> str:
    """Extract tenant name from request Authorization header or use default"""
    try:
        # Try to get from Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header:
            token = auth_header.split(" ")[1] if " " in auth_header else auth_header
            payload = verify_token(token)
            if payload and "tenant_db" in payload:
                return payload["tenant_db"]
        
        # Fallback to default tenant
        return os.getenv("DEFAULT_TENANT_DB", "nutryah")
    except Exception:
        return os.getenv("DEFAULT_TENANT_DB", "nutryah")

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

def audit_crud(request: Request, tenant_db: str, user: dict, action: str, table_name: str, record_id: str = None, old_values: dict = None, new_values: dict = None):
    """Simple audit function for CRUD operations - add this to any route"""
    # Extract actual tenant name if "tenant" is passed
    actual_tenant = get_tenant_name_from_request(request) if tenant_db == "tenant" else tenant_db
    
    log_audit(
        tenant_id=actual_tenant,
        user_id=user.get('id'),
        action=action,
        table_name=table_name,
        record_id=record_id,
        old_values=old_values,
        new_values=new_values,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )

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

# USAGE EXAMPLES:
# CREATE: audit_crud(request, tenant_db, user, "CREATE_USER", "users", new_user.id, None, {"name": payload.name})
# UPDATE: audit_crud(request, tenant_db, user, "UPDATE_USER", "users", user_id, old_data, new_data)
# DELETE: audit_crud(request, tenant_db, user, "DELETE_USER", "users", user_id, old_data, None)
# VIEW: audit_crud(request, tenant_db, user, "VIEW_USERS", "users")