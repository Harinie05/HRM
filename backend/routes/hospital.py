# routes/hospital.py

from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie, Header
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from passlib.context import CryptContext
import logging

# Create logger
logger = logging.getLogger("HRM")

# ------------------- MODELS -------------------
# ========================= TENANT MODELS =========================
from models.models_tenant import (
    MasterBase,

    # Core HR
    User as TenantUser,
    Role,
    Permission,
    RolePermission,
    Department,
    CompanyProfile,
    Branch,
    Shift,
    Grade,
    Holiday,
    HRPolicy,
    LeavePolicy,
    AttendancePolicy,
    OTPolicy,

    # Recruitment + ATS
    JobRequisition,
    Candidate,
    ApplicationStageHistory,
    InterviewSchedule,
    OfferLetter,
    BGV,

    # Onboarding
    OnboardingCandidate,
    DocumentUpload,

    # Employee Information System
    Employee,
    EmployeeFamily,
    EmployeeEducation,
    EmployeeExperience,
    EmployeeMedical,
    EmployeeIDDocs,
    EmployeeSkills,
    EmployeeCertifications,
    EmployeeSalary,
    EmployeeDocuments,
    EmployeeExit
)


from models.models_master import Hospital, MasterUser

from .tenant_seed import seed_tenant

# ------------------- SCHEMAS -------------------
from schemas.schemas_master import HospitalRegister, HospitalOut, AdminAuth
from schemas.schemas_tenant import (
    CreateTablePayload,
    InsertRowPayload,
    RowOut,
    AddColumnPayload,
)

# ------------------- DB & TOKEN -------------------
import database
from utils.token import create_access_token, create_refresh_token, verify_token

router = APIRouter()


# =================================================================
# 🔐 JWT AUTH — MUST COME FIRST
# =================================================================
def get_current_user(Authorization: str = Header(None)):
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

def check_permission(required_permission: str):
    def permission_checker(user = Depends(get_current_user)):
        # Admin has all permissions
        if user.get('role') == 'admin':
            return user
        
        user_permissions = user.get('permissions', [])
        if required_permission not in user_permissions:
            logger.warning(f"User {user.get('email')} lacks permission: {required_permission}")
            raise HTTPException(403, f"Permission denied: {required_permission} required")
        
        return user
    return permission_checker


# ---------------------------------------------------------
# PASSWORD HASH/VERIFY
# ---------------------------------------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    logger.info("Hashing password")
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    logger.info("Verifying password")
    return pwd_context.verify(plain, hashed)



# =================================================================
# 1. REGISTER HOSPITAL + AUTO CREATE TENANT DB + ADMIN USER
# =================================================================
@router.post("/register", response_model=HospitalOut, status_code=status.HTTP_201_CREATED)
def register_hospital(payload: HospitalRegister, db: Session = Depends(database.get_master_db)):

    logger.info(f"Starting registration for tenant_id={payload.tenant_id}")

    if db.query(Hospital).filter(Hospital.tenant_id == payload.tenant_id).first():
        logger.warning("tenant_id already exists")
        raise HTTPException(400, "tenant_id already exists")

    if db.query(Hospital).filter(Hospital.db_name == payload.tenant_db).first():
        logger.warning("tenant_db already exists")
        raise HTTPException(400, "tenant_db exists")

    if db.query(Hospital).filter(Hospital.email == payload.email).first():
        logger.warning("email already registered")
        raise HTTPException(400, "email already registered")

    logger.info(f"Creating tenant database: {payload.tenant_db}")
    database.create_tenant_database(payload.tenant_db)

    engine = database.get_tenant_engine(payload.tenant_db)
    MasterBase.metadata.create_all(bind=engine)
    logger.info("Tenant DB tables created")

    seed_tenant(payload.tenant_db)
    logger.info("Tenant DB seeded successfully")

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
    db.commit()
    db.refresh(hospital)
    logger.info(f"Hospital added to master DB with ID={hospital.id}")

    admin = MasterUser(
        hospital_id=hospital.id,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        is_admin=True,
    )

    db.add(admin)
    db.commit()
    logger.info(f"Master admin created for hospital={hospital.id}")

    return hospital



# =================================================================
# ADMIN AUTH CHECK
# =================================================================
def authenticate_admin(db: Session, tenant_id: str, email: str, password: str):
    logger.info(f"Authenticating admin for tenant_id={tenant_id}")

    hospital = db.query(Hospital).filter(Hospital.tenant_id == tenant_id).first()
    if not hospital:
        logger.error("Hospital not found")
        raise HTTPException(404, "Hospital not found")

    admin = db.query(MasterUser).filter(
        MasterUser.hospital_id == hospital.id,
        MasterUser.email == email,
        MasterUser.is_admin == True
    ).first()

    if not admin:
        logger.warning("Admin record not found")
        raise HTTPException(401, "Invalid admin credentials")

    if not verify_password(password, str(admin.hashed_password)):
        logger.warning("Admin password mismatch")
        raise HTTPException(401, "Invalid admin credentials")

    logger.info("Admin authenticated successfully")
    return hospital



# =================================================================
# 2. CREATE TABLE  🔒 PROTECTED
# =================================================================
@router.post("/{tenant_id}/create_table")
def create_dynamic_table(
    tenant_id: str,
    payload: CreateTablePayload,
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)
):
    logger.info(f"User {user.get('email')} creating table '{payload.table_name}' in tenant {tenant_id}")

    hospital = authenticate_admin(db, tenant_id, payload.admin.email, payload.admin.password)

    table_name = payload.table_name
    columns = payload.columns

    col_sql = []
    for col in columns:
        part = f"`{col.name}` {col.type}"
        if col.auto_increment:
            part += " AUTO_INCREMENT"
        if not col.nullable:
            part += " NOT NULL"
        if col.default is not None:
            part += f" DEFAULT '{col.default}'"
        if col.primary_key:
            part += " PRIMARY KEY"
        col_sql.append(part)

    full_sql = f"CREATE TABLE IF NOT EXISTS `{table_name}` ({', '.join(col_sql)});"
    logger.info(f"Executing SQL: {full_sql}")

    engine = database.get_tenant_engine(str(hospital.db_name))
    with engine.connect() as conn:
        conn.execute(text(full_sql))
        conn.commit()

    logger.info(f"Table '{table_name}' created successfully")
    return {"detail": "Table created", "table": table_name}



# =================================================================
# 3. ADD COLUMN 🔒 PROTECTED
# =================================================================
@router.post("/{tenant_id}/add_column/{table_name}")
def add_column(
    tenant_id: str,
    table_name: str,
    payload: AddColumnPayload,
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)
):
    logger.info(f"User {user.get('email')} adding column to '{table_name}' in tenant {tenant_id}")

    hospital = authenticate_admin(db, tenant_id, payload.admin.email, payload.admin.password)

    col = payload.column
    part = f"`{col.name}` {col.type}"
    if not col.nullable:
        part += " NOT NULL"
    if col.default is not None:
        part += f" DEFAULT '{col.default}'"

    alter_sql = f"ALTER TABLE `{table_name}` ADD COLUMN {part};"
    logger.info(f"Executing SQL: {alter_sql}")

    engine = database.get_tenant_engine(str(hospital.db_name))
    with engine.connect() as conn:
        conn.execute(text(alter_sql))
        conn.commit()

    logger.info(f"Column '{col.name}' added to '{table_name}'")
    return {"detail": "Column added", "column": col.name}



# =================================================================
# 4. INSERT ROW 🔒 PROTECTED
# =================================================================
@router.post("/{tenant_id}/insert/{table_name}")
def insert_row(
    tenant_id: str,
    table_name: str,
    payload: InsertRowPayload,
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)
):
    logger.info(f"User {user.get('email')} inserting row into '{table_name}'")

    hospital = authenticate_admin(db, tenant_id, payload.admin.email, payload.admin.password)

    data = payload.row
    engine = database.get_tenant_engine(str(hospital.db_name))

    with engine.connect() as conn:
        valid_cols = {c["name"] for c in inspect(engine).get_columns(table_name)}
        filtered = {k: v for k, v in data.items() if k in valid_cols}

        logger.info(f"Filtered data for insert: {filtered}")

        cols = ", ".join(f"`{k}`" for k in filtered)
        vals = ", ".join(f":{k}" for k in filtered)

        sql = text(f"INSERT INTO `{table_name}` ({cols}) VALUES ({vals})")
        conn.execute(sql, filtered)
        conn.commit()

    logger.info("Row inserted successfully")
    return {"detail": "Row inserted"}



# =================================================================
# 5. LIST ROWS 🔒 PROTECTED
# =================================================================
@router.post("/{tenant_id}/rows/{table_name}", response_model=RowOut)
def list_rows(
    tenant_id: str,
    table_name: str,
    auth: AdminAuth,
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)
):
    logger.info(f"User {user.get('email')} listing rows from '{table_name}'")

    hospital = authenticate_admin(db, tenant_id, auth.email, auth.password)
    engine = database.get_tenant_engine(str(hospital.db_name))

    with engine.connect() as conn:
        rows = conn.execute(text(f"SELECT * FROM `{table_name}`")).fetchall()

    logger.info(f"{len(rows)} rows fetched from {table_name}")
    return {"rows": [dict(r._mapping) for r in rows]}



# =================================================================
# 6. LOGIN → RETURN ACCESS + REFRESH TOKEN
# =================================================================
@router.post("/login")
def login(response: Response, payload: AdminAuth, db: Session = Depends(database.get_master_db)):

    logger.info(f"Login attempt by {payload.email}")

    admin = db.query(MasterUser).filter(MasterUser.email == payload.email).first()

    if admin and verify_password(payload.password, str(admin.hashed_password)):
        logger.info("Admin login successful")

        hospital = db.query(Hospital).filter(Hospital.id == admin.hospital_id).first()
        if not hospital:
            logger.error("Hospital not found for admin")
            raise HTTPException(400, "Hospital not found")

        access = create_access_token({
            "email": payload.email,
            "role": "admin",
            "tenant_db": str(hospital.db_name)
        })

        refresh = create_refresh_token({
            "email": payload.email,
            "role": "admin",
            "tenant_db": str(hospital.db_name)
        })

        response.set_cookie(
            key="refresh_token",
            value=refresh,
            httponly=True,
            samesite="none",
            secure=False
        )

        return {
            "message": "Login successful",
            "login_type": "admin",
            "access_token": access,
            "tenant_id": str(hospital.tenant_id),
            "tenant_db": str(hospital.db_name),
            "email": payload.email,
            "role_name": "Admin",
            "permissions": []
        }

    # TENANT USER LOGIN
    hospitals = db.query(Hospital).all()

    for hosp in hospitals:
        logger.info(f"Checking tenant DB {hosp.db_name} for user {payload.email}")

        engine = database.get_tenant_engine(str(hosp.db_name))
        tdb = Session(bind=engine)

        try:
            user = tdb.query(TenantUser).filter(TenantUser.email == payload.email).first()

            if user and verify_password(payload.password, str(user.password)):
                logger.info(f"Tenant user login successful for {payload.email} in DB {hosp.db_name}")

                # Get user permissions
                role_permissions = tdb.query(RolePermission).filter(RolePermission.role_id == user.role_id).all()
                permissions = []
                for rp in role_permissions:
                    perm = tdb.query(Permission).filter(Permission.id == rp.permission_id).first()
                    if perm:
                        permissions.append(str(perm.name))

                access = create_access_token({
                    "email": user.email,
                    "role": "user",
                    "role_id": user.role_id,
                    "tenant_db": str(hosp.db_name),
                    "permissions": permissions
                })

                refresh = create_refresh_token({
                    "email": user.email,
                    "role": "user",
                    "role_id": user.role_id,
                    "tenant_db": str(hosp.db_name),
                    "permissions": permissions
                })

                response.set_cookie(
                    key="refresh_token",
                    value=refresh,
                    httponly=True,
                    samesite="none",
                    secure=False
                )

                return {
                    "message": "Login successful",
                    "login_type": "user",
                    "access_token": access,
                    "tenant_db": str(hosp.db_name),
                    "email": user.email,
                    "user_name": user.name,
                    "role_name": "User",
                    "permissions": permissions
                }

        finally:
            tdb.close()

    logger.warning("Invalid login attempt")
    raise HTTPException(400, "Invalid email/password")



# =================================================================
# 7. REFRESH TOKEN
# =================================================================
@router.post("/refresh")
def refresh_token(response: Response, refresh_token: str | None = Cookie(None)):

    logger.info("Refresh token request received")

    if not refresh_token:
        logger.warning("Refresh token missing")
        raise HTTPException(401, "Refresh missing")

    payload = verify_token(refresh_token)
    if not payload:
        logger.warning("Refresh token expired or invalid")
        raise HTTPException(401, "Expired — login again")

    new_access = create_access_token(payload)
    new_refresh = create_refresh_token(payload)

    response.set_cookie(
        key="refresh_token",
        value=new_refresh,
        httponly=True,
        samesite="none",
        secure=False
    )

    logger.info("Refresh token regenerated successfully")
    return {"access_token": new_access}



# =================================================================
# 8. SEED PERMISSIONS 🔒 PROTECTED
# =================================================================
@router.get("/seed/{tenant_db}")
def seed_permissions(tenant_db: str, user = Depends(get_current_user)):
    logger.info(f"Seeding tenant DB: {tenant_db}")
    seed_tenant(tenant_db)
    return {"message": f"Tenant '{tenant_db}' seeded"}



# =================================================================
# 9. LOGOUT
# =================================================================
@router.post("/logout")
def logout(response: Response):
    logger.info("Logout request received")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}
