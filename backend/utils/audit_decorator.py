from functools import wraps
from fastapi import Request
from utils.audit_logger import log_audit
import json

def audit_log(action: str, table_name: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            request = None
            old_values = None
            
            # Find request object in args
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            # Get record for update/delete operations
            if action in ["UPDATE", "DELETE"] and "id" in kwargs:
                try:
                    # This would need to be customized per route
                    pass
                except:
                    pass
            
            result = await func(*args, **kwargs)
            
            # Log the action
            if request:
                tenant_id = getattr(request.state, 'tenant_id', None) or "unknown"
                log_audit(
                    tenant_id=tenant_id,
                    user_id=getattr(request.state, 'user_id', None),
                    action=action,
                    table_name=table_name,
                    record_id=str(getattr(result, 'id', None)) if hasattr(result, 'id') and getattr(result, 'id') else None,
                    old_values=old_values,
                    new_values=result.dict() if hasattr(result, 'dict') else None,
                    ip_address=getattr(request.state, 'ip_address', None),
                    user_agent=getattr(request.state, 'user_agent', None)
                )
            
            return result
        return wrapper
    return decorator