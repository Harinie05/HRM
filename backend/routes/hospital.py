# routes/hospital.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from passlib.context import CryptContext
from models.models_tenant import User as TenantUser, RolePermission, Permission
from models.models_master import Hospital, MasterUser
from .tenant_seed import seed_tenant


from schemas.schemas_master import (
    HospitalRegister,
    HospitalOut,
    AdminAuth
)

from schemas.schemas_tenant import (
    CreateTablePayload,
    InsertRowPayload,
    RowOut,
    ColumnDef,
    AddColumnPayload,
)

import database

# NEW: Import MasterBase to create tenant tables
from models.models_tenant import MasterBase, User, Permission, RolePermission

router = APIRouter()

# -------------------------
# Password Helpers
# -------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ============================================================
# 1. REGISTER HOSPITAL (Create Tenant DB + Admin)
# ============================================================
@router.post("/register", response_model=HospitalOut, status_code=status.HTTP_201_CREATED)
def register_hospital(payload: HospitalRegister, db: Session = Depends(database.get_master_db)):

    # Validate unique fields
    if db.query(Hospital).filter(Hospital.tenant_id == payload.tenant_id).first():
        raise HTTPException(status_code=400, detail="tenant_id already exists")

    if db.query(Hospital).filter(Hospital.db_name == payload.tenant_db).first():
        raise HTTPException(status_code=400, detail="tenant_db already exists")

    if db.query(Hospital).filter(Hospital.email == payload.email).first():
        raise HTTPException(status_code=400, detail="email already registered")

    # Create tenant database
    try:
        database.create_tenant_database(payload.tenant_db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tenant DB creation failed: {e}")

    # ⭐⭐⭐ NEW: Create all tables inside tenant DB ⭐⭐⭐
    try:
        engine = database.get_tenant_engine(payload.tenant_db)
        MasterBase.metadata.create_all(bind=engine)
        # Seed permissions
        seed_tenant(payload.tenant_db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create tenant tables: {e}")

    # Save hospital in master db
    hospital = Hospital(
        tenant_id=payload.tenant_id,
        db_name=payload.tenant_db,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        license_number=payload.license_number,
        contact_person=payload.contact_person,
        logo=payload.logo,
        pincode=payload.pincode,
    )

    db.add(hospital)
    try:
        db.commit()
        db.refresh(hospital)
    except:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to save hospital details")

    # Create admin user (MASTER DB)
    admin = MasterUser(
        hospital_id=hospital.id,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        is_admin=True,
    )

    db.add(admin)
    try:
        db.commit()
    except:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create admin user")

    return hospital


# ============================================================
# Helper: Authenticate Admin User
# ============================================================
def authenticate_admin(db: Session, tenant_id: str, email: str, password: str):
    hospital = db.query(Hospital).filter(Hospital.tenant_id == tenant_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    admin = db.query(MasterUser).filter(
        MasterUser.hospital_id == hospital.id,
        MasterUser.email == email,
        MasterUser.is_admin == True
    ).first()

    if not admin or not verify_password(password, str(admin.hashed_password)):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    return hospital


# ============================================================
# 2. CREATE TABLE  (Tenant DB)
# ============================================================
@router.post("/{tenant_id}/create_table")
def create_dynamic_table(
    tenant_id: str,
    payload: CreateTablePayload,
    db: Session = Depends(database.get_master_db),
):

    hospital = authenticate_admin(db, tenant_id, payload.admin.email, payload.admin.password)

    table_name = payload.table_name
    columns = payload.columns

    col_sql = []
    for col in columns:
        part = f"`{col.name}` {col.type}"

        if col.auto_increment:
            if not col.type.upper().startswith(("INT", "INTEGER", "TINYINT")):
                raise HTTPException(400, "AUTO_INCREMENT allowed only for integer fields")
            part += " AUTO_INCREMENT"

        if not col.nullable:
            part += " NOT NULL"

        if col.default is not None:
            part += f" DEFAULT '{col.default}'"

        if col.primary_key:
            part += " PRIMARY KEY"

        col_sql.append(part)

    full_sql = f"CREATE TABLE IF NOT EXISTS `{table_name}` ({', '.join(col_sql)});"

    engine = database.get_tenant_engine(str(hospital.db_name))

    with engine.connect() as conn:
        conn.execute(text(full_sql))
        conn.commit()

    return {"detail": "Table created", "table": table_name}


# ============================================================
# 3. ADD COLUMN
# ============================================================
@router.post("/{tenant_id}/add_column/{table_name}")
def add_column(
    tenant_id: str,
    table_name: str,
    payload: AddColumnPayload,
    db: Session = Depends(database.get_master_db),
):

    hospital = authenticate_admin(db, tenant_id, payload.admin.email, payload.admin.password)
    col = payload.column

    part = f"`{col.name}` {col.type}"

    if col.auto_increment:
        if not col.type.upper().startswith(("INT", "INTEGER", "TINYINT")):
            raise HTTPException(400, "AUTO_INCREMENT only for integers")
        part += " AUTO_INCREMENT"

    if not col.nullable:
        part += " NOT NULL"

    if col.default is not None:
        part += f" DEFAULT '{col.default}'"

    alter_sql = f"ALTER TABLE `{table_name}` ADD COLUMN {part};"

    engine = database.get_tenant_engine(str(hospital.db_name))

    with engine.connect() as conn:
        insp = inspect(engine)
        if not insp.has_table(table_name):
            raise HTTPException(404, "Table not found")

        conn.execute(text(alter_sql))
        conn.commit()

    return {"detail": "Column added", "column": col.name}


# ============================================================
# 4. INSERT ROW
# ============================================================
@router.post("/{tenant_id}/insert/{table_name}")
def insert_row(
    tenant_id: str,
    table_name: str,
    payload: InsertRowPayload,
    db: Session = Depends(database.get_master_db),
):

    hospital = authenticate_admin(db, tenant_id, payload.admin.email, payload.admin.password)
    data = payload.row

    engine = database.get_tenant_engine(str(hospital.db_name))

    with engine.connect() as conn:
        insp = inspect(engine)
        if not insp.has_table(table_name):
            raise HTTPException(404, "Table not found")

        valid_cols = {c["name"] for c in insp.get_columns(table_name)}
        filtered = {k: v for k, v in data.items() if k in valid_cols}

        if not filtered:
            raise HTTPException(400, "No valid columns provided")

        cols = ", ".join(f"`{k}`" for k in filtered)
        vals = ", ".join(f":{k}" for k in filtered)

        sql = text(f"INSERT INTO `{table_name}` ({cols}) VALUES ({vals})")
        conn.execute(sql, filtered)
        conn.commit()

    return {"detail": "Row inserted"}


# ============================================================
# 5. LIST ROWS
# ============================================================
@router.post("/{tenant_id}/rows/{table_name}", response_model=RowOut)
def list_rows(
    tenant_id: str,
    table_name: str,
    auth: AdminAuth,
    db: Session = Depends(database.get_master_db)
):

    hospital = authenticate_admin(db, tenant_id, auth.email, auth.password)
    engine = database.get_tenant_engine(str(hospital.db_name))

    with engine.connect() as conn:
        rows = conn.execute(text(f"SELECT * FROM `{table_name}`")).fetchall()

    return {"rows": [dict(r._mapping) for r in rows]}



# ============================================================
# 6. LOGIN (Admin OR Tenant User)
# ============================================================
@router.post("/login")
def login(payload: AdminAuth, db: Session = Depends(database.get_master_db)):
    # 1) try master/admin login
    admin = db.query(MasterUser).filter(
        MasterUser.email == payload.email,
        MasterUser.is_admin == True
    ).first()

    if admin and verify_password(payload.password, str(admin.hashed_password)):
        hospital = db.query(Hospital).filter(Hospital.id == admin.hospital_id).first()
        if not hospital:
            raise HTTPException(status_code=500, detail="Hospital record not found")

        return {
            "message": "Login successful",
            "login_type": "admin",
            "tenant_id": hospital.tenant_id,
            "tenant_db": hospital.db_name,
            "email": payload.email,
            # admin gets all permissions on frontend; backend can still return empty or all perms
            "permissions": []  
        }

    # 2) try tenant user (users are stored in tenant DB)
    # first find hospital by email mapping in master (or by tenant info)
    # we need to search tenant DBs — but simpler: master has hospital records, we loop to find tenant where user exists.
    hospitals = db.query(Hospital).all()
    for hosp in hospitals:
        engine = database.get_tenant_engine(str(hosp.db_name))
        tdb = Session(bind=engine)
        try:
            user = tdb.query(TenantUser).filter(TenantUser.email == payload.email).first()
            if user and verify_password(payload.password, str(user.password)):
                # fetch role id
                role_id = user.role_id
                department_id = user.department_id

                # fetch role name
                from models.models_tenant import Role, Department
                role = tdb.query(Role).filter(Role.id == role_id).first()
                role_name = role.name if role else "No Role"

                # fetch permissions attached to role (permission names)
                perm_ids = (
                    tdb.query(RolePermission.permission_id)
                    .filter(RolePermission.role_id == role_id)
                    .all()
                )
                perm_ids = [p[0] for p in perm_ids]
                perm_names = []
                if perm_ids:
                    perm_names = [p[0] for p in tdb.query(Permission.name).filter(Permission.id.in_(perm_ids)).all()]

                return {
                    "message": "Login successful",
                    "login_type": "user",
                    "tenant_db": hosp.db_name,
                    "email": user.email,
                    "user_name": user.name,
                    "role_name": role_name,
                    "user_id": user.id,
                    "role_id": role_id,
                    "department_id": department_id,
                    "permissions": perm_names
                }
        finally:
            tdb.close()
            engine.dispose()

    # nothing matched
    raise HTTPException(status_code=400, detail="Invalid email or password")

# ============================================================
# 7. SEED TENANT (RUN PERMISSIONS AGAIN)
# ============================================================
@router.get("/seed/{tenant_db}")
def seed_permissions(tenant_db: str):
    try:
        seed_tenant(tenant_db)
        return {"message": f"Tenant '{tenant_db}' permissions seeded successfully"}
    except Exception as e:
        return {"error": str(e)}
