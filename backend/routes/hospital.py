# routes/hospital.py

from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie, Header
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from passlib.context import CryptContext

# ------------------- MODELS -------------------
from models.models_tenant import (
    User as TenantUser,
    RolePermission,
    Permission,
    MasterBase,
    User,
    Permission,
    RolePermission
)
from models.models_master import Hospital, MasterUser

from .tenant_seed import seed_tenant

# ------------------- SCHEMAS -------------------
from schemas.schemas_master import HospitalRegister, HospitalOut, AdminAuth
from schemas.schemas_tenant import (
    CreateTablePayload,
    InsertRowPayload,
    RowOut,
    ColumnDef,
    AddColumnPayload,
)

# ------------------- DB & TOKEN -------------------
import database
from utils.token import create_access_token, create_refresh_token, verify_token

router = APIRouter()

# =================================================================
# 🔐 JWT AUTH — MUST COME FIRST BEFORE ANY ROUTE USES IT
# =================================================================
def get_current_user(Authorization: str = Header(None)):
    
    if not Authorization:
        raise HTTPException(401, "Token required")

    token = Authorization.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(401, "Token expired/invalid")

    return payload


# ---------------------------------------------------------
# PASSWORD HASH/VERIFY
# ---------------------------------------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)



# =================================================================
# 1. REGISTER HOSPITAL + AUTO CREATE TENANT DB + ADMIN USER
# =================================================================
@router.post("/register", response_model=HospitalOut, status_code=status.HTTP_201_CREATED)
def register_hospital(payload: HospitalRegister, db: Session = Depends(database.get_master_db)):

    if db.query(Hospital).filter(Hospital.tenant_id == payload.tenant_id).first():
        raise HTTPException(400, "tenant_id already exists")

    if db.query(Hospital).filter(Hospital.db_name == payload.tenant_db).first():
        raise HTTPException(400, "tenant_db exists")

    if db.query(Hospital).filter(Hospital.email == payload.email).first():
        raise HTTPException(400, "email already registered")

    # CREATE TENANT DATABASE
    try:
        database.create_tenant_database(payload.tenant_db)
    except Exception as e:
        raise HTTPException(500, f"Tenant DB creation failed: {e}")

    # CREATE TABLES INSIDE TENANT DB
    try:
        engine = database.get_tenant_engine(payload.tenant_db)
        MasterBase.metadata.create_all(bind=engine)
        seed_tenant(payload.tenant_db)  # permissions auto-seed
    except Exception as e:
        raise HTTPException(500, f"tenant table creation failed: {e}")

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
        raise HTTPException(500, "hospital save failed")

    # ADMIN USER CREATION
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
        raise HTTPException(500, "admin create failed")

    return hospital



# =================================================================
# AUTHENTICATE MASTER ADMIN
# =================================================================
def authenticate_admin(db: Session, tenant_id: str, email: str, password: str):
    hospital = db.query(Hospital).filter(Hospital.tenant_id == tenant_id).first()
    if not hospital:
        raise HTTPException(404, "Hospital not found")

    admin = db.query(MasterUser).filter(
        MasterUser.hospital_id == hospital.id,
        MasterUser.email == email,
        MasterUser.is_admin == True
    ).first()

    if not admin or not verify_password(password, str(admin.hashed_password)):
        raise HTTPException(401, "Invalid admin credentials")

    return hospital



# =================================================================
# 2. CREATE TABLE  🔒 PROTECTED
# =================================================================
@router.post("/{tenant_id}/create_table")
def create_dynamic_table(
    tenant_id: str,
    payload: CreateTablePayload,
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)  # 🔐 added
):
    hospital = authenticate_admin(db, tenant_id, payload.admin.email, payload.admin.password)

    table_name = payload.table_name
    columns = payload.columns

    col_sql = []
    for col in columns:
        part = f"`{col.name}` {col.type}"
        if col.auto_increment:
            if not col.type.upper().startswith(("INT","INTEGER","TINYINT")):
                raise HTTPException(400,"AUTO_INCREMENT only for int")
            part+=" AUTO_INCREMENT"
        if not col.nullable: part+=" NOT NULL"
        if col.default!=None: part+=f" DEFAULT '{col.default}'"
        if col.primary_key: part+=" PRIMARY KEY"
        col_sql.append(part)

    full_sql = f"CREATE TABLE IF NOT EXISTS `{table_name}` ({', '.join(col_sql)});"
    engine = database.get_tenant_engine(str(hospital.db_name))

    with engine.connect() as conn:
        conn.execute(text(full_sql))
        conn.commit()

    return {"detail":"Table created","table":table_name}



# =================================================================
# 3. ADD COLUMN 🔒 PROTECTED
# =================================================================
@router.post("/{tenant_id}/add_column/{table_name}")
def add_column(
    tenant_id:str,
    table_name:str,
    payload:AddColumnPayload,
    db:Session=Depends(database.get_master_db),
    user = Depends(get_current_user)  # 🔐 added
):
    hospital = authenticate_admin(db,tenant_id,payload.admin.email,payload.admin.password)
    col = payload.column

    part=f"`{col.name}` {col.type}"
    if col.auto_increment:
        if not col.type.upper().startswith(("INT","INTEGER","TINYINT")):
            raise HTTPException(400,"AUTO_INCREMENT only for int")
        part+=" AUTO_INCREMENT"
    if not col.nullable: part+=" NOT NULL"
    if col.default!=None: part+=f" DEFAULT '{col.default}'"

    alter_sql=f"ALTER TABLE `{table_name}` ADD COLUMN {part};"
    engine=database.get_tenant_engine(str(hospital.db_name))

    with engine.connect() as conn:
        insp=inspect(engine)
        if not insp.has_table(table_name):
            raise HTTPException(404,"table missing")
        conn.execute(text(alter_sql))
        conn.commit()
    return {"detail":"Column added","column":col.name}



# =================================================================
# 4. INSERT ROW 🔒 PROTECTED
# =================================================================
@router.post("/{tenant_id}/insert/{table_name}")
def insert_row(
    tenant_id:str, 
    table_name:str, 
    payload:InsertRowPayload, 
    db:Session=Depends(database.get_master_db),
    user = Depends(get_current_user)  # 🔐 added
):
    hospital=authenticate_admin(db, tenant_id, payload.admin.email, payload.admin.password)
    data=payload.row
    engine=database.get_tenant_engine(str(hospital.db_name))

    with engine.connect() as conn:
        insp=inspect(engine)
        if not insp.has_table(table_name):
            raise HTTPException(404,"table missing")

        valid_cols={c["name"] for c in insp.get_columns(table_name)}
        filtered={k:v for k,v in data.items() if k in valid_cols}

        if not filtered: raise HTTPException(400,"invalid columns")

        cols=", ".join(f"`{k}`" for k in filtered)
        vals=", ".join(f":{k}" for k in filtered)

        sql=text(f"INSERT INTO `{table_name}` ({cols}) VALUES ({vals})")
        conn.execute(sql,filtered)
        conn.commit()

    return {"detail":"Row inserted"}



# =================================================================
# 5. LIST ROWS 🔒 PROTECTED
# =================================================================
@router.post("/{tenant_id}/rows/{table_name}", response_model=RowOut)
def list_rows(
    tenant_id:str, 
    table_name:str, 
    auth:AdminAuth, 
    db:Session=Depends(database.get_master_db),
    user = Depends(get_current_user)  # 🔐 added
):
    hospital=authenticate_admin(db, tenant_id, auth.email, auth.password)
    engine=database.get_tenant_engine(str(hospital.db_name))

    with engine.connect() as conn:
        rows=conn.execute(text(f"SELECT * FROM `{table_name}`")).fetchall()

    return {"rows":[dict(r._mapping) for r in rows]}



# =================================================================
# 6. LOGIN → RETURNS JWT TOKENS
# =================================================================
@router.post("/login")
def login(response:Response, payload:AdminAuth, db:Session=Depends(database.get_master_db)):

    # ----------------- ADMIN LOGIN -----------------
    admin=db.query(MasterUser).filter(MasterUser.email==payload.email).first()

    if admin and verify_password(payload.password, str(admin.hashed_password)):

        hospital=db.query(Hospital).filter(Hospital.id==admin.hospital_id).first()
        if not hospital:
            raise HTTPException(status_code=500, detail="Hospital record not found")

        access=create_access_token({"email":payload.email,"role":"admin","tenant_db":str(hospital.db_name)})
        refresh=create_refresh_token({"email":payload.email,"role":"admin","tenant_db":str(hospital.db_name)})

        response.set_cookie("refresh_token",refresh,httponly=True,samesite="strict",secure=False)

        return {
            "message":"Login successful",
            "login_type":"admin",
            "access_token":access,
            "tenant_id":str(hospital.tenant_id),
            "tenant_db":str(hospital.db_name),
            "email": payload.email,
            "user_name": payload.email.split("@")[0],
            "role_name": "Admin",
            "permissions":[]
        }

    # ----------------- USER LOGIN (TENANT DB) -----------------
    hospitals=db.query(Hospital).all()
    for hosp in hospitals:
        engine=database.get_tenant_engine(str(hosp.db_name))
        tdb=Session(bind=engine)

        try:
            user=tdb.query(TenantUser).filter(TenantUser.email==payload.email).first()
            if user and verify_password(payload.password, str(user.password)):

                from models.models_tenant import Role,Department
                role=tdb.query(Role).filter(Role.id==user.role_id).first()
                role_name=role.name if role else "No Role"

                perm_ids=[p[0] for p in tdb.query(RolePermission.permission_id)
                          .filter(RolePermission.role_id==user.role_id).all()]
                perm_names = []
                if perm_ids:
                    perm_names=[p[0] for p in tdb.query(Permission.name)
                               .filter(Permission.id.in_(perm_ids)).all()]

                access=create_access_token({"email":user.email,"role":role_name,"tenant_db":str(hosp.db_name)})
                refresh=create_refresh_token({"email":user.email,"role":role_name,"tenant_db":str(hosp.db_name)})

                response.set_cookie("refresh_token",refresh,httponly=True,samesite="strict",secure=False)

                return {
                    "message":"Login successful",
                    "login_type":"user",
                    "access_token":access,
                    "tenant_db":str(hosp.db_name),
                    "email":user.email,
                    "user_name":user.name,
                    "role_name":role_name,
                    "user_id":user.id,
                    "permissions":perm_names
                }
        finally:
            tdb.close()
            engine.dispose()

    raise HTTPException(400,"Invalid email/password")



# =================================================================
#  🔄 7. REFRESH TOKEN GENERATOR
# =================================================================
@router.post("/refresh")
def refresh_token(response:Response, refresh_token:str|None=Cookie(None)):

    if not refresh_token:
        raise HTTPException(401,"Refresh missing")

    payload=verify_token(refresh_token)
    if not payload:
        raise HTTPException(401,"Expired — login again")

    new_access=create_access_token(payload)
    new_refresh=create_refresh_token(payload)

    response.set_cookie("refresh_token",new_refresh,httponly=True,samesite="strict",secure=False)

    return {"access_token":new_access}



# =================================================================
# 8. SEED TENANT PERMISSIONS  🔒 PROTECTED
# =================================================================
@router.get("/seed/{tenant_db}")
def seed_permissions(
    tenant_db:str,
    user = Depends(get_current_user)  # 🔐 added
):
    try:
        seed_tenant(tenant_db)
        return {"message":f"Tenant '{tenant_db}' seeded"}
    except Exception as e:
        return{"error":str(e)}


# =================================================================
# 9. LOGOUT 
# =================================================================
@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}
