# routes/department.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

import database
from models.models_master import Hospital
from schemas.schemas_tenant import DepartmentBase

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
# CREATE DEPARTMENT
# --------------------------------------------------------
@router.post("/departments/{tenant_db}/create")
def create_department(
    tenant_db: str,
    payload: DepartmentBase,
    db: Session = Depends(database.get_master_db)
):

    hospital = get_hospital_by_db(db, tenant_db)
    engine = database.get_tenant_engine(str(hospital.db_name))

    sql = text("""
        INSERT INTO departments (name, description)
        VALUES (:name, :description)
    """)

    with engine.connect() as conn:
        conn.execute(sql, {
            "name": payload.name,
            "description": payload.description
        })
        conn.commit()

    return {"detail": "Department added successfully"}


# --------------------------------------------------------
# LIST DEPARTMENTS
# --------------------------------------------------------
@router.get("/departments/{tenant_db}/list")
def list_departments(
    tenant_db: str,
    db: Session = Depends(database.get_master_db)
):

    hospital = get_hospital_by_db(db, tenant_db)
    engine = database.get_tenant_engine(str(hospital.db_name))

    with engine.connect() as conn:
        rows = conn.execute(text("SELECT * FROM departments")).fetchall()

    return {"departments": [dict(r._mapping) for r in rows]}


# --------------------------------------------------------
# UPDATE DEPARTMENT
# --------------------------------------------------------
@router.put("/departments/{tenant_db}/update/{dept_id}")
def update_department(
    tenant_db: str,
    dept_id: int,
    payload: DepartmentBase,
    db: Session = Depends(database.get_master_db)
):

    hospital = get_hospital_by_db(db, tenant_db)
    engine = database.get_tenant_engine(str(hospital.db_name))

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

    return {"detail": "Department updated successfully"}


# --------------------------------------------------------
# DELETE DEPARTMENT
# --------------------------------------------------------
@router.delete("/departments/{tenant_db}/delete/{dept_id}")
def delete_department(
    tenant_db: str,
    dept_id: int,
    db: Session = Depends(database.get_master_db)
):

    hospital = get_hospital_by_db(db, tenant_db)
    engine = database.get_tenant_engine(str(hospital.db_name))

    sql = text("DELETE FROM departments WHERE id = :id")

    with engine.connect() as conn:
        conn.execute(sql, {"id": dept_id})
        conn.commit()

    return {"detail": "Department deleted successfully"}
