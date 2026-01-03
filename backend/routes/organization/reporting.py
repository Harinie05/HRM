from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_tenant_engine, logger
from utils.audit_logger import audit_crud
from utils.permission import require_permission

router = APIRouter(prefix="/reporting", tags=["Reporting Structure"])

# ------------------------------
# GET REPORTING LEVELS 🔒 Protected
# ------------------------------
@router.get("/levels")
def get_reporting_levels(status: str = "active", user = Depends(require_permission("view_reporting_levels"))):
    try:
        tenant = user.get('tenant_db')
        engine = get_tenant_engine(tenant)
        
        with engine.connect() as conn:
            if status == "active":
                query = "SELECT * FROM reporting_levels WHERE is_active = 1 ORDER BY level_order ASC"
            elif status == "inactive":
                query = "SELECT * FROM reporting_levels WHERE is_active = 0 ORDER BY level_order ASC"
            else:  # all
                query = "SELECT * FROM reporting_levels ORDER BY level_order ASC"
                
            result = conn.execute(text(query)).fetchall()
            
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
    user = Depends(require_permission("add_reporting_level"))
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
            
        # Audit log with proper database session
        db = Session(bind=engine)
        with db:
            audit_crud(request, db, user, "CREATE_REPORTING_LEVEL", "reporting_levels", "new_level", {}, payload)
            
        return {"message": "Reporting level created successfully"}
        
    except Exception as e:
        logger.error(f"Error creating reporting level: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ------------------------------
# UPDATE REPORTING LEVEL 🔒 Protected
# ------------------------------
@router.put("/levels/{level_id}")
def update_reporting_level(
    level_id: int,
    payload: dict,
    request: Request,
    user = Depends(require_permission("edit_reporting_level"))
):
    try:
        tenant = user.get('tenant_db')
        engine = get_tenant_engine(tenant)
        
        with engine.connect() as conn:
            # Get old values for audit
            old_result = conn.execute(text("""
                SELECT * FROM reporting_levels WHERE id = :level_id
            """), {"level_id": level_id}).fetchone()
            
            if not old_result:
                raise HTTPException(status_code=404, detail="Reporting level not found")
            
            old_values = dict(old_result._mapping)
            
            # Update the level
            conn.execute(text("""
                UPDATE reporting_levels SET
                    level_name = :level_name,
                    level_order = :level_order,
                    description = :description,
                    is_active = :is_active
                WHERE id = :level_id
            """), {
                "level_id": level_id,
                "level_name": payload.get("level_name"),
                "level_order": payload.get("level_order"),
                "description": payload.get("description", ""),
                "is_active": payload.get("is_active", True)
            })
            conn.commit()
            
        # Audit log with proper database session
        db = Session(bind=engine)
        with db:
            audit_crud(request, db, user, "UPDATE_REPORTING_LEVEL", "reporting_levels", str(level_id), old_values, payload)
            
        return {"message": "Reporting level updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating reporting level: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ------------------------------
# DELETE REPORTING LEVEL 🔒 Protected
# ------------------------------
@router.delete("/levels/{level_id}")
def delete_reporting_level(
    level_id: int,
    request: Request,
    user = Depends(require_permission("delete_reporting_level"))
):
    try:
        tenant = user.get('tenant_db')
        engine = get_tenant_engine(tenant)
        
        with engine.connect() as conn:
            # Get old values for audit
            old_result = conn.execute(text("""
                SELECT * FROM reporting_levels WHERE id = :level_id
            """), {"level_id": level_id}).fetchone()
            
            if not old_result:
                raise HTTPException(status_code=404, detail="Reporting level not found")
            
            old_values = dict(old_result._mapping)
            
            # Soft delete the level
            conn.execute(text("""
                UPDATE reporting_levels SET is_active = 0 WHERE id = :level_id
            """), {"level_id": level_id})
            conn.commit()
            
        # Audit log with proper database session
        db = Session(bind=engine)
        with db:
            audit_crud(request, db, user, "DELETE_REPORTING_LEVEL", "reporting_levels", str(level_id), old_values, {})
            
        return {"message": "Reporting level deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting reporting level: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/hierarchy")
def get_reporting_hierarchy(status: str = "active", user = Depends(require_permission("view_hierarchy_rules"))):
    try:
        tenant = user.get('tenant_db')
        engine = get_tenant_engine(tenant)
        
        with engine.connect() as conn:
            base_query = """
                SELECT 
                    h.*,
                    p.level_name as parent_level_name,
                    c.level_name as child_level_name,
                    d.name as department_name
                FROM reporting_hierarchy h
                LEFT JOIN reporting_levels p ON h.parent_level_id = p.id
                LEFT JOIN reporting_levels c ON h.child_level_id = c.id
                LEFT JOIN departments d ON h.department_id = d.id
            """
            
            if status == "active":
                query = base_query + " WHERE h.is_active = 1 ORDER BY c.level_order ASC"
            elif status == "inactive":
                query = base_query + " WHERE h.is_active = 0 ORDER BY c.level_order ASC"
            else:  # all
                query = base_query + " ORDER BY c.level_order ASC"
                
            result = conn.execute(text(query)).fetchall()
            
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
    user = Depends(require_permission("add_hierarchy_rule"))
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
            
        # Audit log with proper database session
        db = Session(bind=engine)
        with db:
            audit_crud(request, db, user, "CREATE_HIERARCHY_RULE", "reporting_hierarchy", "new_rule", {}, payload)
            
        return {"message": "Hierarchy rule created successfully"}
        
    except Exception as e:
        logger.error(f"Error creating hierarchy rule: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ------------------------------
# UPDATE HIERARCHY RULE 🔒 Protected
# ------------------------------
@router.put("/hierarchy/{hierarchy_id}")
def update_hierarchy_rule(
    hierarchy_id: int,
    payload: dict,
    request: Request,
    user = Depends(require_permission("edit_hierarchy_rule"))
):
    try:
        tenant = user.get('tenant_db')
        engine = get_tenant_engine(tenant)
        
        with engine.connect() as conn:
            # Get old values for audit
            old_result = conn.execute(text("""
                SELECT * FROM reporting_hierarchy WHERE id = :hierarchy_id
            """), {"hierarchy_id": hierarchy_id}).fetchone()
            
            if not old_result:
                raise HTTPException(status_code=404, detail="Hierarchy rule not found")
            
            old_values = dict(old_result._mapping)
            
            # Update the hierarchy rule
            conn.execute(text("""
                UPDATE reporting_hierarchy SET
                    parent_level_id = :parent_level_id,
                    child_level_id = :child_level_id,
                    department_id = :department_id,
                    is_active = :is_active
                WHERE id = :hierarchy_id
            """), {
                "hierarchy_id": hierarchy_id,
                "parent_level_id": payload.get("parent_level_id"),
                "child_level_id": payload.get("child_level_id"),
                "department_id": payload.get("department_id"),
                "is_active": payload.get("is_active", True)
            })
            conn.commit()
            
        # Audit log with proper database session
        db = Session(bind=engine)
        with db:
            audit_crud(request, db, user, "UPDATE_HIERARCHY_RULE", "reporting_hierarchy", str(hierarchy_id), old_values, payload)
            
        return {"message": "Hierarchy rule updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating hierarchy rule: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ------------------------------
# DELETE HIERARCHY RULE 🔒 Protected
# ------------------------------
@router.delete("/hierarchy/{hierarchy_id}")
def delete_hierarchy_rule(
    hierarchy_id: int,
    request: Request,
    user = Depends(require_permission("delete_hierarchy_rule"))
):
    try:
        tenant = user.get('tenant_db')
        engine = get_tenant_engine(tenant)
        
        with engine.connect() as conn:
            # Get old values for audit
            old_result = conn.execute(text("""
                SELECT * FROM reporting_hierarchy WHERE id = :hierarchy_id
            """), {"hierarchy_id": hierarchy_id}).fetchone()
            
            if not old_result:
                raise HTTPException(status_code=404, detail="Hierarchy rule not found")
            
            old_values = dict(old_result._mapping)
            
            # Soft delete the hierarchy rule
            conn.execute(text("""
                UPDATE reporting_hierarchy SET is_active = 0 WHERE id = :hierarchy_id
            """), {"hierarchy_id": hierarchy_id})
            conn.commit()
            
        # Audit log with proper database session
        db = Session(bind=engine)
        with db:
            audit_crud(request, db, user, "DELETE_HIERARCHY_RULE", "reporting_hierarchy", str(hierarchy_id), old_values, {})
            
        return {"message": "Hierarchy rule deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting hierarchy rule: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ------------------------------
# GET HIERARCHY 🔒 Protected
# ------------------------------
@router.get("/employees/{employee_id}")
def get_employee_reporting(
    employee_id: int,
    user = Depends(require_permission("view_hierarchy_rules"))
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
    user = Depends(require_permission("edit_hierarchy_rule"))
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
            
        # Audit log with proper database session
        db = Session(bind=engine)
        with db:
            audit_crud(request, db, user, "UPDATE_EMPLOYEE_REPORTING", "employee_reporting", str(employee_id), {}, payload)
            
        return {"message": "Employee reporting assigned successfully"}
        
    except Exception as e:
        logger.error(f"Error assigning employee reporting: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))