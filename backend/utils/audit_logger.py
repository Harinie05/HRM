from sqlalchemy.orm import Session
from models.models_tenant import AuditLog, ErrorLog
from database import get_tenant_db
import json
import traceback
from datetime import datetime
from fastapi import Request
from utils.token import verify_token
import os

from sqlalchemy import text

def get_employee_details(db: Session, user: dict):
    """Get employee details from JWT token"""
    try:
        # Get actual user information from JWT token
        name = user.get('user_name') or user.get('name') or user.get('email', 'Unknown User')
        user_id = user.get('user_id') or user.get('sub') or 'Unknown ID'
        
        # Format display name with actual user info
        display_name = f"{name} (ID: {user_id})"
        
        return {
            "employee_name": display_name,
            "employee_code": None,
            "employee_id_onboarding": None
        }
        
    except Exception as e:
        print(f"Error getting employee details: {str(e)}")
        return {
            "employee_name": "Unknown User",
            "employee_code": None,
            "employee_id_onboarding": None
        }

def log_audit(
    db: Session,
    user: dict = None,
    action: str = "",
    table_name: str = "",
    record_id: str | None = None,
    old_values: dict | None = None,
    new_values: dict | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None
):
    """Log audit trail to tenant database"""
    try:
        employee_details = get_employee_details(db, user) if user else {
            "employee_name": "Unknown",
            "employee_code": None,
            "employee_id_onboarding": None
        }
        
        audit_log = AuditLog(
            user_id=user.get('user_id') if user else None,
            employee_name=employee_details["employee_name"],
            employee_code=employee_details["employee_code"],
            employee_id_onboarding=employee_details["employee_id_onboarding"],
            action=action,
            table_name=table_name,
            record_id=str(record_id) if record_id else None,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.add(audit_log)
        db.commit()
    except Exception as e:
        print(f"Audit logging failed: {str(e)}")
        db.rollback()

def audit_crud(request: Request, db: Session, user: dict, action: str, table_name: str, record_id: str = None, old_values: dict = None, new_values: dict = None):
    """Simple audit function for CRUD operations - add this to any route"""
    try:
        log_audit(
            db=db,
            user=user,
            action=action,
            table_name=table_name,
            record_id=record_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
    except Exception as e:
        print(f"DEBUG: audit_crud failed: {str(e)}")

def log_error(
    db: Session,
    error_type: str = "",
    error_message: str = "",
    stack_trace: str | None = None,
    request_url: str | None = None,
    request_method: str | None = None,
    request_data: dict | None = None,
    user: dict | None = None,
    ip_address: str | None = None
):
    """Log errors to tenant database"""
    try:
        employee_details = get_employee_details(db, user) if user else {
            "employee_name": "Unknown",
            "employee_code": None
        }
        
        error_log = ErrorLog(
            user_id=user.get('user_id') if user else None,
            employee_name=employee_details["employee_name"],
            employee_code=employee_details["employee_code"],
            error_type=error_type,
            error_message=error_message,
            stack_trace=stack_trace or traceback.format_exc(),
            request_url=request_url,
            request_method=request_method,
            request_data=request_data,
            ip_address=ip_address
        )
        
        db.add(error_log)
        db.commit()
    except Exception as e:
        print(f"Error logging failed: {str(e)}")
        db.rollback()

# USAGE EXAMPLES:
# CREATE: audit_crud(request, db, user, "CREATE_USER", "users", new_user.id, None, {"name": payload.name})
# UPDATE: audit_crud(request, db, user, "UPDATE_USER", "users", user_id, old_data, new_data)
# DELETE: audit_crud(request, db, user, "DELETE_USER", "users", user_id, old_data, None)
# VIEW: audit_crud(request, db, user, "VIEW_USERS", "users")