from fastapi import Depends, HTTPException, Header
from utils.token import verify_token
import logging

logger = logging.getLogger("HRM")

def get_current_user(Authorization: str = Header(None)):
    """JWT token validation - moved here to avoid circular imports"""
    logger.info("Validating JWT token...")

    if not Authorization:
        logger.warning("Authorization header missing")
        raise HTTPException(401, "Token required")

    try:
        token = Authorization.split(" ")[1]
    except:
        logger.warning("Malformed Authorization header")
        raise HTTPException(401, "Invalid token format")

    payload = verify_token(token)
    if not payload:
        logger.warning("Token expired or invalid")
        raise HTTPException(401, "Token expired/invalid")

    logger.info(f"Token validated for user {payload.get('email')}")
    return payload

def require_permission(permission_name: str):
    """
    Permission enforcement decorator that reuses existing JWT-based permission logic.
    Maintains admin bypass and current token structure.
    """
    def checker(user = Depends(get_current_user)):
        # Admin has all permissions (existing bypass logic)
        if user.get('role') == 'admin':
            return user
        
        # Read permissions from JWT payload (existing structure)
        user_permissions = user.get('permissions', [])
        if permission_name not in user_permissions:
            logger.warning(f"User {user.get('email')} lacks permission: {permission_name}")
            raise HTTPException(403, f"Permission denied: {permission_name} required")
        
        return user
    return checker