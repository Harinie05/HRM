from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_tenant_engine, logger
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user

router = APIRouter(prefix="/reporting", tags=["Reporting Structure"])

# ------------------------------
# GET REPORTING LEVELS 🔒 Protected
# ------------------------------
@router.get("/levels")
def get_reporting_levels(user = Depends(get_current_user)):
    try:
        tenant = user.get('tenant_db')
        engine = get_tenant_engine(tenant)
        
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT * FROM reporting_levels 
                WHERE is_active = 1 
                ORDER BY level_order ASC
            """)).fetchall()
            
            return [dict(row._mapping) for row in result]
            
    except Exception as e:
        logger.error(f"Error fetching reporting levels: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------
# CREATE REPORTING LEVEL 🔒 Protected
# ------------------------------
@router.post("/levels")
def create_reporting_level(
    payload: dict,
    request: Request,
    user = Depends(get_current_user)
):
    try:
        tenant = user.get('tenant_db')
        engine = get_tenant_engine(tenant)
        
        with engine.connect() as conn:
            conn.execute(text("""
                INSERT INTO reporting_levels (
                    level_name, level_order, description, is_active
                ) VALUES (
                    :level_name, :level_order, :description, :is_active
                )
            """), {
                "level_name": payload.get("level_name"),
                "level_order": payload.get("level_order"),
                "description": payload.get("description", ""),
                "is_active": payload.get("is_active", True)
            })
            conn.commit()
            audit_crud(request, user.get("tenant_db"), user, "CREATE", "reporting_levels", None, None, payload)
            
        return {"message": "Reporting level created successfully"}
        
    except Exception as e:
        logger.error(f"Error creating reporting level: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------
# GET HIERARCHY 🔒 Protected
# ------------------------------
@router.get("/hierarchy")
def get_reporting_hierarchy(user = Depends(get_current_user)):
    try:
        tenant = user.get('tenant_db')
        engine = get_tenant_engine(tenant)
        
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT 
                    h.*,
                    p.level_name as parent_level_name,
                    c.level_name as child_level_name,
                    d.name as department_name
                FROM reporting_hierarchy h
                LEFT JOIN reporting_levels p ON h.parent_level_id = p.id
                LEFT JOIN reporting_levels c ON h.child_level_id = c.id
                LEFT JOIN departments d ON h.department_id = d.id
                WHERE h.is_active = 1
                ORDER BY c.level_order ASC
            """)).fetchall()
            
            return [dict(row._mapping) for row in result]
            
    except Exception as e:
        logger.error(f"Error fetching hierarchy: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------
# CREATE HIERARCHY RULE 🔒 Protected
# ------------------------------
@router.post("/hierarchy")
def create_hierarchy_rule(
    payload: dict,
    request: Request,
    user = Depends(get_current_user)
):
    try:
        tenant = user.get('tenant_db')
        engine = get_tenant_engine(tenant)
        
        with engine.connect() as conn:
            conn.execute(text("""
                INSERT INTO reporting_hierarchy (
                    parent_level_id, child_level_id, department_id, is_active
                ) VALUES (
                    :parent_level_id, :child_level_id, :department_id, :is_active
                )
            """), {
                "parent_level_id": payload.get("parent_level_id"),
                "child_level_id": payload.get("child_level_id"),
                "department_id": payload.get("department_id"),
                "is_active": payload.get("is_active", True)
            })
            conn.commit()
            audit_crud(request, user.get("tenant_db"), user, "CREATE", "reporting_hierarchy", None, None, payload)
            
        return {"message": "Hierarchy rule created successfully"}
        
    except Exception as e:
        logger.error(f"Error creating hierarchy rule: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------
# GET EMPLOYEE REPORTING 🔒 Protected
# ------------------------------
@router.get("/employees/{employee_id}")
def get_employee_reporting(
    employee_id: int,
    user = Depends(get_current_user)
):
    try:
        tenant = user.get('tenant_db')
        engine = get_tenant_engine(tenant)
        
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT 
                    er.*,
                    rl.level_name,
                    e.name as reporting_to_name,
                    alt.name as alternate_supervisor_name,
                    d.name as department_name
                FROM employee_reporting er
                LEFT JOIN reporting_levels rl ON er.level_id = rl.id
                LEFT JOIN employees e ON er.reporting_to_id = e.id
                LEFT JOIN employees alt ON er.alternate_supervisor_id = alt.id
                LEFT JOIN departments d ON er.department_id = d.id
                WHERE er.employee_id = :employee_id AND er.is_active = 1
            """), {"employee_id": employee_id}).fetchone()
            
            if result:
                return dict(result._mapping)
            return {}
            
    except Exception as e:
        logger.error(f"Error fetching employee reporting: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------
# ASSIGN EMPLOYEE REPORTING 🔒 Protected
# ------------------------------
@router.post("/employees/{employee_id}")
def assign_employee_reporting(
    employee_id: int,
    payload: dict,
    request: Request,
    user = Depends(get_current_user)
):
    try:
        tenant = user.get('tenant_db')
        engine = get_tenant_engine(tenant)
        
        with engine.connect() as conn:
            # Deactivate existing reporting
            conn.execute(text("""
                UPDATE employee_reporting 
                SET is_active = 0, effective_to = CURDATE()
                WHERE employee_id = :employee_id AND is_active = 1
            """), {"employee_id": employee_id})
            
            # Insert new reporting
            conn.execute(text("""
                INSERT INTO employee_reporting (
                    employee_id, reporting_to_id, alternate_supervisor_id, level_id, department_id, 
                    effective_from, is_active
                ) VALUES (
                    :employee_id, :reporting_to_id, :alternate_supervisor_id, :level_id, :department_id,
                    :effective_from, 1
                )
            """), {
                "employee_id": employee_id,
                "reporting_to_id": payload.get("reporting_to_id"),
                "alternate_supervisor_id": payload.get("alternate_supervisor_id"),
                "level_id": payload.get("level_id"),
                "department_id": payload.get("department_id"),
                "effective_from": payload.get("effective_from")
            })
            
            conn.commit()
            audit_crud(request, user.get("tenant_db"), user, "UPDATE", "employee_reporting", employee_id, None, payload)
            
        return {"message": "Employee reporting assigned successfully"}
        
    except Exception as e:
        logger.error(f"Error assigning employee reporting: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))