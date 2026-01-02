# routes/department.py

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import text
from sqlalchemy.orm import Session

import database
from database import logger
from models.models_master import Hospital
from schemas.schemas_tenant import DepartmentBase
from utils.audit_logger import audit_crud

# 🔥 added for token protection
from routes.hospital import get_current_user, check_permission

router = APIRouter()


# --------------------------------------------------------
# Helper: find hospital by tenant database
# --------------------------------------------------------
def get_hospital_by_db(db: Session, tenant_db: str):
    hospital = db.query(Hospital).filter(Hospital.db_name == tenant_db).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospital


# --------------------------------------------------------
# CREATE DEPARTMENT  🔒 Protected
# --------------------------------------------------------
@router.post("/departments/{tenant_db}/create")
def create_department(
    tenant_db: str,
    payload: DepartmentBase,
    request: Request,
    db: Session = Depends(database.get_master_db),
    user = Depends(check_permission("add_department"))
):
    try:
        logger.info(f"Creating department '{payload.name}' in tenant {tenant_db} by user {user.get('email')}")

        hospital = get_hospital_by_db(db, tenant_db)
        engine = database.get_tenant_engine(str(hospital.db_name))
        
        # Check if department already exists
        with engine.connect() as conn:
            existing = conn.execute(text("SELECT id, name FROM departments WHERE LOWER(name) = LOWER(:name)"), {"name": payload.name}).fetchone()
            if existing:
                logger.warning(f"Department creation failed - '{payload.name}' already exists as '{existing.name}' (ID: {existing.id})")
                raise HTTPException(400, f"Department '{existing.name}' already exists")

        sql = text("""
            INSERT INTO departments (name, description)
            VALUES (:name, :description)
        """)

        with engine.connect() as conn:
            result = conn.execute(sql, {
                "name": payload.name,
                "description": payload.description
            })
            conn.commit()
            
            # Get tenant database session for audit logging
            tdb = Session(bind=engine)
            with tdb:
                audit_crud(request, tdb, user, "CREATE_DEPARTMENT", "departments", "", {}, {"name": payload.name, "description": payload.description})
            
        logger.info(f"Department '{payload.name}' created successfully")
        return {"detail": "Department added successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating department: {str(e)}")
        raise HTTPException(500, f"Error creating department: {str(e)}")


# --------------------------------------------------------
# LIST DEPARTMENTS  🔒 Protected
# --------------------------------------------------------
@router.get("/departments/{tenant_db}/list")
def list_departments(
    tenant_db: str,
    db: Session = Depends(database.get_master_db),
    user = Depends(check_permission("view_departments"))
):
    logger.info(f"Listing departments for tenant {tenant_db} by user {user.get('email')}")

    hospital = get_hospital_by_db(db, tenant_db)
    engine = database.get_tenant_engine(str(hospital.db_name))

    with engine.connect() as conn:
        rows = conn.execute(text("SELECT * FROM departments")).fetchall()

    return {"departments": [dict(r._mapping) for r in rows]}


# --------------------------------------------------------
# UPDATE DEPARTMENT 🔒 Protected
# --------------------------------------------------------
@router.put("/departments/{tenant_db}/update/{dept_id}")
def update_department(
    tenant_db: str,
    dept_id: int,
    payload: DepartmentBase,
    request: Request,
    db: Session = Depends(database.get_master_db),
    user = Depends(check_permission("edit_department"))
):
    logger.info(f"Updating department {dept_id} in tenant {tenant_db} by user {user.get('email')}")

    hospital = get_hospital_by_db(db, tenant_db)
    engine = database.get_tenant_engine(str(hospital.db_name))

    # Get old values for audit
    with engine.connect() as conn:
        old_dept = conn.execute(text("SELECT name, description FROM departments WHERE id = :id"), {"id": dept_id}).fetchone()
        old_values = dict(old_dept._mapping) if old_dept else None

    sql = text("""
        UPDATE departments
        SET name = :name, description = :description
        WHERE id = :id
    """)

    with engine.connect() as conn:
        conn.execute(sql, {
            "name": payload.name,
            "description": payload.description,
            "id": dept_id
        })
        conn.commit()
        
        # Audit log
        tdb = Session(bind=engine)
        with tdb:
            audit_crud(request, tdb, user, "UPDATE_DEPARTMENT", "departments", str(dept_id), old_values or {}, {"name": payload.name, "description": payload.description})

    return {"detail": "Department updated successfully"}


# --------------------------------------------------------
# DELETE DEPARTMENT 🔒 Protected
# --------------------------------------------------------
@router.delete("/departments/{tenant_db}/delete/{dept_id}")
def delete_department(
    tenant_db: str,
    dept_id: int,
    request: Request,
    db: Session = Depends(database.get_master_db),
    user = Depends(check_permission("delete_department"))
):
    logger.info(f"Deleting department {dept_id} from tenant {tenant_db} by user {user.get('email')}")

    hospital = get_hospital_by_db(db, tenant_db)
    engine = database.get_tenant_engine(str(hospital.db_name))

    # Get old values for audit
    with engine.connect() as conn:
        old_dept = conn.execute(text("SELECT name, description FROM departments WHERE id = :id"), {"id": dept_id}).fetchone()
        old_values = dict(old_dept._mapping) if old_dept else None

    sql = text("DELETE FROM departments WHERE id = :id")

    with engine.connect() as conn:
        conn.execute(sql, {"id": dept_id})
        conn.commit()
        
        # Audit log
        tdb = Session(bind=engine)
        with tdb:
            audit_crud(request, tdb, user, "DELETE_DEPARTMENT", "departments", str(dept_id), old_values or {}, {})

    return {"detail": "Department deleted successfully"}
