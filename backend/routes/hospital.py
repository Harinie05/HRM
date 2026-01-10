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
    Holiday,

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
from utils.audit_logger import log_error
from utils.permission import require_permission, get_current_user

router = APIRouter()

# =================================================================
# 🔐 JWT AUTH — MOVED TO utils/permission.py
# =================================================================

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
@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_hospital(payload: HospitalRegister, db: Session = Depends(database.get_master_db)):

    logger.info(f"Starting registration for tenant_id={payload.tenant_id}")

    try:
        if db.query(Hospital).filter(Hospital.tenant_id == payload.tenant_id).first():
            logger.warning("tenant_id already exists")
            raise HTTPException(400, detail={
                "message": "tenant_id already exists",
                "toast": {
                    "type": "error",
                    "message": "Tenant ID already exists. Please choose a different one."
                }
            })

        if db.query(Hospital).filter(Hospital.db_name == payload.tenant_db).first():
            logger.warning("tenant_db already exists")
            raise HTTPException(400, detail={
                "message": "tenant_db exists",
                "toast": {
                    "type": "error",
                    "message": "Database name already exists. Please choose a different one."
                }
            })

        if db.query(Hospital).filter(Hospital.email == payload.email).first():
            logger.warning("email already registered")
            raise HTTPException(400, detail={
                "message": "email already registered",
                "toast": {
                    "type": "error",
                    "message": "Email already registered. Please use a different email."
                }
            })

        logger.info(f"Creating tenant database: {payload.tenant_db}")
        database.create_tenant_database(payload.tenant_db)

        engine = database.get_tenant_engine(payload.tenant_db)
        MasterBase.metadata.create_all(bind=engine)
        logger.info("Tenant DB tables created")

        seed_tenant(payload.tenant_db)
        logger.info("Tenant DB seeded successfully")
        
        # Add admin user to tenant database
        engine = database.get_tenant_engine(payload.tenant_db)
        tdb = Session(bind=engine)
        
        try:
            from models.models_tenant import User as TenantUser, Role, Department
            import random
            import string
            
            # Generate unique login code
            def generate_login_code():
                while True:
                    code = ''.join(random.choices(string.digits, k=6))
                    if not tdb.query(TenantUser).filter(TenantUser.login_code == code).first():
                        return code
            
            # Get or create Admin role
            admin_role = tdb.query(Role).filter(Role.name == "Admin").first()
            if not admin_role:
                admin_role = Role(name="Admin", description="System Administrator")
                tdb.add(admin_role)
                tdb.commit()
                tdb.refresh(admin_role)
            
            # Get or create HR department
            hr_dept = tdb.query(Department).filter(Department.name == "HR").first()
            if not hr_dept:
                hr_dept = Department(name="HR", description="Human Resources")
                tdb.add(hr_dept)
                tdb.commit()
                tdb.refresh(hr_dept)
            
            # Create admin user in tenant database
            admin_user = TenantUser(
                name=payload.contact_person or "Admin",
                email=payload.email,
                password=hash_password(payload.password),
                role_id=admin_role.id,
                department_id=hr_dept.id,
                login_code=generate_login_code(),
                two_factor_enabled=False,
                status="Active"
            )
            
            tdb.add(admin_user)
            tdb.commit()
            logger.info(f"Admin user added to tenant DB with login code: {admin_user.login_code}")
            
        finally:
            tdb.close()

        # Calculate license end date based on subscription plan
        from datetime import datetime, timedelta
        start_date = datetime.now().date()
        
        if payload.subscription_plan == "Basic":
            end_date = start_date + timedelta(days=30)
        elif payload.subscription_plan == "Standard":
            end_date = start_date + timedelta(days=180)  # 6 months
        elif payload.subscription_plan == "Premium":
            end_date = start_date + timedelta(days=365)  # 1 year
        else:
            end_date = start_date + timedelta(days=180)  # Default to Standard

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
            subscription_plan=payload.subscription_plan,
            license_start_date=start_date,
            license_end_date=end_date,
        )

        db.add(hospital)
        db.commit()
        db.refresh(hospital)
        logger.info(f"Hospital added to master DB with ID={hospital.id}")

        admin = MasterUser(
            hospital_id=hospital.id,
            tenant_code=payload.tenant_code,
            email=payload.email,
            hashed_password=hash_password(payload.password),
            is_admin=True,
        )

        db.add(admin)
        db.commit()
        logger.info(f"Master admin created for hospital={hospital.id}")

        return {
            "id": hospital.id,
            "tenant_id": hospital.tenant_id,
            "db_name": hospital.db_name,
            "name": hospital.name,
            "email": str(hospital.email),
            "subscription_plan": hospital.subscription_plan,
            "license_start_date": hospital.license_start_date,
            "license_end_date": hospital.license_end_date,
            "toast": {
                "type": "success",
                "message": "Hospital registered successfully!"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Hospital registration failed: {str(e)}")
        log_error(
            db=db,
            error_type=type(e).__name__,
            error_message=str(e),
            request_url="/auth/register",
            request_method="POST",
            request_data=payload.model_dump(exclude={"password"})
        )
        raise HTTPException(500, detail={
            "message": f"Registration failed: {str(e)}",
            "toast": {
                "type": "error",
                "message": "Registration failed. Please try again."
            }
        })

# =================================================================
# ADMIN AUTH CHECK
# =================================================================
def authenticate_admin(db: Session, tenant_id: str, tenant_code: str, email: str, password: str):
    logger.info(f"Authenticating admin for tenant_id={tenant_id}, tenant_code={tenant_code}")

    hospital = db.query(Hospital).filter(Hospital.tenant_id == tenant_id).first()
    if not hospital:
        logger.error("Hospital not found")
        raise HTTPException(404, "Hospital not found")

    admin = db.query(MasterUser).filter(
        MasterUser.hospital_id == hospital.id,
        MasterUser.tenant_code == tenant_code,
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

    if not payload.admin.email:
        raise HTTPException(400, "Email is required for admin authentication")
    hospital = authenticate_admin(db=db, tenant_id=tenant_id, tenant_code=payload.admin.tenant_code, email=str(payload.admin.email), password=payload.admin.password)

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

    if not payload.admin.email:
        raise HTTPException(400, "Email is required for admin authentication")
    hospital = authenticate_admin(db=db, tenant_id=tenant_id, tenant_code=payload.admin.tenant_code, email=str(payload.admin.email), password=payload.admin.password)

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

    if not payload.admin.email:
        raise HTTPException(400, "Email is required for admin authentication")
    hospital = authenticate_admin(db=db, tenant_id=tenant_id, tenant_code=payload.admin.tenant_code, email=str(payload.admin.email), password=payload.admin.password)

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

    if not auth.email:
        raise HTTPException(400, "Email is required for admin authentication")
    hospital = authenticate_admin(db=db, tenant_id=tenant_id, tenant_code=auth.tenant_code, email=str(auth.email), password=auth.password)
    engine = database.get_tenant_engine(str(hospital.db_name))

    with engine.connect() as conn:
        rows = conn.execute(text(f"SELECT * FROM `{table_name}`")).fetchall()

    logger.info(f"{len(rows)} rows fetched from {table_name}")
    return {"rows": [dict(r._mapping) for r in rows]}

# =================================================================
# 6. LOGIN → SEND OTP FIRST, THEN VERIFY
# =================================================================
@router.post("/login")
def login(response: Response, payload: AdminAuth, db: Session = Depends(database.get_master_db)):

    logger.info(f"Login attempt with tenant_code {payload.tenant_code}")
    
    # Validate that either email or login_code is provided
    if not payload.email and not payload.login_code:
        raise HTTPException(400, "Either email or login_code must be provided")

    # ADMIN LOGIN - Check master_users table first (only supports email)
    if payload.email:
        admin = db.query(MasterUser).filter(
            MasterUser.email == payload.email,
            MasterUser.tenant_code == payload.tenant_code
        ).first()

        if admin and verify_password(payload.password, str(admin.hashed_password)):
            logger.info("Admin credentials verified")

            hospital = db.query(Hospital).filter(Hospital.id == admin.hospital_id).first()
            if not hospital:
                logger.error("Hospital not found for admin")
                raise HTTPException(400, "Hospital not found")

            # Check if admin has 2FA enabled (check in tenant database)
            engine = database.get_tenant_engine(str(hospital.db_name))
            tdb = Session(bind=engine)
            
            try:
                # Check if admin user exists in tenant database with 2FA enabled
                tenant_admin = tdb.query(TenantUser).filter(TenantUser.email == payload.email).first()
                
                if tenant_admin and getattr(tenant_admin, 'two_factor_enabled', False):
                    # Send OTP for admin
                    from utils.otp import send_login_otp
                    otp_sent = send_login_otp(tdb, str(payload.email), payload.tenant_code, "Admin")
                    if not otp_sent:
                        raise HTTPException(500, "Failed to send OTP")
                    
                    return {
                        "message": "OTP sent to your email",
                        "otp_required": True,
                        "email": payload.email,
                        "tenant_code": payload.tenant_code,
                        "login_type": "admin",
                        "toast": {
                            "type": "success",
                            "message": "OTP sent to your email successfully"
                        }
                    }
                else:
                    # Direct login without OTP
                    access = create_access_token({
                        "email": str(payload.email),
                        "role": "admin",
                        "tenant_db": str(hospital.db_name),
                        "tenant_code": payload.tenant_code
                    })

                    refresh = create_refresh_token({
                        "email": str(payload.email),
                        "role": "admin",
                        "tenant_db": str(hospital.db_name),
                        "tenant_code": payload.tenant_code
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
                        "tenant_code": payload.tenant_code,
                        "email": str(payload.email),
                        "role_name": "Admin",
                        "permissions": [],
                        "otp_required": False,
                        "toast": {
                            "type": "success",
                            "message": "Login successful"
                        }
                    }
            finally:
                tdb.close()

    # TENANT USER LOGIN - Check all tenant databases
    hospitals = db.query(Hospital).all()

    for hosp in hospitals:
        logger.info(f"Checking tenant DB {hosp.db_name} for user {payload.email}")

        engine = database.get_tenant_engine(str(hosp.db_name))
        tdb = Session(bind=engine)

        try:
            user = None
            
            # Check if payload has login_code (new login method)
            if payload.login_code:
                logger.info(f"Attempting login with login_code: {payload.login_code}")
                user = tdb.query(TenantUser).filter(TenantUser.login_code == payload.login_code).first()
            elif payload.email:
                # Traditional email login
                user = tdb.query(TenantUser).filter(TenantUser.email == payload.email).first()
            else:
                continue  # Skip if neither email nor login_code provided

            if user and verify_password(payload.password, str(user.password)):
                # Verify tenant_code matches hospital's tenant_id
                if payload.tenant_code != hosp.tenant_id:
                    logger.warning(f"Tenant code mismatch for user {payload.email}")
                    continue
                    
                logger.info(f"Tenant user credentials verified for {user.email} in DB {hosp.db_name}")

                # Check if two-factor authentication is enabled
                if getattr(user, 'two_factor_enabled', False):
                    # Send OTP for tenant user
                    from utils.otp import send_login_otp
                    otp_sent = send_login_otp(tdb, str(user.email), payload.tenant_code, str(user.name))
                    if not otp_sent:
                        raise HTTPException(500, "Failed to send OTP")
                    
                    return {
                        "message": "OTP sent to your email",
                        "otp_required": True,
                        "email": user.email,
                        "tenant_code": payload.tenant_code,
                        "login_type": "user",
                        "toast": {
                            "type": "success",
                            "message": "OTP sent to your email successfully"
                        }
                    }
                else:
                    # Direct login without OTP
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
                        "user_id": user.id,
                        "role_id": user.role_id,
                        "tenant_db": str(hosp.db_name),
                        "tenant_code": payload.tenant_code,
                        "permissions": permissions
                    })

                    refresh = create_refresh_token({
                        "email": user.email,
                        "role": "user",
                        "user_id": user.id,
                        "role_id": user.role_id,
                        "tenant_db": str(hosp.db_name),
                        "tenant_code": payload.tenant_code,
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
                        "tenant_code": payload.tenant_code,
                        "email": user.email,
                        "user_name": user.name,
                        "user_id": user.id,
                        "role_id": user.role_id,
                        "department_id": user.department_id,
                        "role_name": user.role.name if user.role else "User",
                        "permissions": permissions,
                        "otp_required": False,
                        "toast": {
                            "type": "success",
                            "message": "Login successful"
                        }
                    }

        finally:
            tdb.close()

    logger.warning("Invalid login attempt")
    raise HTTPException(400, detail={
        "message": "Invalid tenant code, credentials or password",
        "toast": {
            "type": "error",
            "message": "Invalid credentials. Please check your details and try again."
        }
    })

# =================================================================
# 6.1 VERIFY OTP AND COMPLETE LOGIN
# =================================================================
@router.post("/verify-otp")
def verify_otp_and_login(response: Response, payload: dict, db: Session = Depends(database.get_master_db)):
    
    email = payload.get("email")
    tenant_code = payload.get("tenant_code")
    otp_code = payload.get("otp_code")
    login_type = payload.get("login_type")
    
    if not all([email, tenant_code, otp_code, login_type]):
        raise HTTPException(400, "Missing required fields")
    
    logger.info(f"OTP verification attempt by {email} with tenant_code {tenant_code}")
    
    if login_type == "admin":
        # Admin OTP verification
        admin = db.query(MasterUser).filter(
            MasterUser.email == email,
            MasterUser.tenant_code == tenant_code
        ).first()
        
        if not admin:
            raise HTTPException(400, "Admin not found")
            
        hospital = db.query(Hospital).filter(Hospital.id == admin.hospital_id).first()
        if not hospital:
            raise HTTPException(400, "Hospital not found")
            
        # Verify OTP
        engine = database.get_tenant_engine(str(hospital.db_name))
        tdb = Session(bind=engine)
        
        try:
            from utils.otp import verify_login_otp
            if not verify_login_otp(tdb, str(email), str(tenant_code), str(otp_code)):
                raise HTTPException(400, "Invalid or expired OTP")
            
            # Generate tokens
            access = create_access_token({
                "email": email,
                "role": "admin",
                "tenant_db": str(hospital.db_name),
                "tenant_code": tenant_code
            })

            refresh = create_refresh_token({
                "email": email,
                "role": "admin",
                "tenant_db": str(hospital.db_name),
                "tenant_code": tenant_code
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
                "tenant_code": tenant_code,
                "email": email,
                "role_name": "Admin",
                "permissions": [],
                "toast": {
                    "type": "success",
                    "message": "Login successful"
                }
            }
        finally:
            tdb.close()
    
    elif login_type == "user":
        # Tenant user OTP verification
        hospitals = db.query(Hospital).all()
        
        for hosp in hospitals:
            if tenant_code != hosp.tenant_id:
                continue
                
            engine = database.get_tenant_engine(str(hosp.db_name))
            tdb = Session(bind=engine)
            
            try:
                user = tdb.query(TenantUser).filter(TenantUser.email == email).first()
                if not user:
                    continue
                    
                # Verify OTP
                from utils.otp import verify_login_otp
                if not verify_login_otp(tdb, str(email), str(tenant_code), str(otp_code)):
                    raise HTTPException(400, "Invalid or expired OTP")
                
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
                    "user_id": user.id,
                    "role_id": user.role_id,
                    "tenant_db": str(hosp.db_name),
                    "tenant_code": tenant_code,
                    "permissions": permissions
                })

                refresh = create_refresh_token({
                    "email": user.email,
                    "role": "user",
                    "user_id": user.id,
                    "role_id": user.role_id,
                    "tenant_db": str(hosp.db_name),
                    "tenant_code": tenant_code,
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
                    "tenant_code": tenant_code,
                    "email": user.email,
                    "user_name": user.name,
                    "user_id": user.id,
                    "role_id": user.role_id,
                    "department_id": user.department_id,
                    "role_name": user.role.name if user.role else "User",
                    "permissions": permissions,
                    "toast": {
                        "type": "success",
                        "message": "Login successful"
                    }
                }
            finally:
                tdb.close()
    
    raise HTTPException(400, detail={
        "message": "Invalid OTP or user not found",
        "toast": {
            "type": "error",
            "message": "Invalid OTP. Please try again."
        }
    })
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
# 7. REFRESH TOKEN
# =================================================================
@router.get("/seed/{tenant_db}")
def seed_permissions(tenant_db: str, user = Depends(get_current_user)):
    logger.info(f"Seeding tenant DB: {tenant_db}")
    seed_tenant(tenant_db)
    return {"message": f"Tenant '{tenant_db}' seeded"}

# =================================================================
# GET ORGANIZATION BRANDING COLORS
# =================================================================
@router.get("/branding/{tenant_code}")
def get_organization_branding(tenant_code: str, db: Session = Depends(database.get_master_db)):
    
    # Find hospital by tenant_code
    hospital = db.query(Hospital).filter(Hospital.tenant_id == tenant_code).first()
    if not hospital:
        return {
            "primary_color": "#2862e9",
            "secondary_color": "#474e71"
        }
    
    # Get tenant database
    engine = database.get_tenant_engine(str(hospital.db_name))
    tdb = Session(bind=engine)
    
    try:
        from models.models_tenant import OrganizationBranding
        branding = tdb.query(OrganizationBranding).first()
        
        if branding:
            return {
                "primary_color": branding.primary_color or "#2862e9",
                "secondary_color": branding.secondary_color or "#474e71"
            }
        else:
            return {
                "primary_color": "#2862e9",
                "secondary_color": "#474e71"
            }
    finally:
        tdb.close()

# =================================================================
# 8. SEED PERMISSIONS 🔒 PROTECTED
# =================================================================
@router.post("/logout")
def logout(response: Response):
    logger.info("Logout request received")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}
