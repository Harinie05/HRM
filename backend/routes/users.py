from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, text
from models.models_master import Hospital
from models.models_tenant import User, Role, Department, OnboardingCandidate, ReportingLevel, ReportingHierarchy
import schemas.schemas_tenant as schemas_tenant
import database
from database import logger
from passlib.context import CryptContext
from utils.permission import require_permission
from utils.audit_logger import audit_crud
import random
import string

# 🔐 added for token authentication
from routes.hospital import get_current_user

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --------- helper ---------
def get_hospital_by_db(db: Session, tenant_db: str):
    hospital = db.query(Hospital).filter(Hospital.db_name == tenant_db).first()
    if not hospital:
        raise HTTPException(404, "Hospital not found")
    return hospital

def generate_unique_login_code(tdb: Session) -> str:
    """Generate a unique 6-digit login code"""
    while True:
        # Generate 6-digit code
        code = ''.join(random.choices(string.digits, k=6))
        # Check if code already exists
        existing = tdb.query(User).filter(User.login_code == code).first()
        if not existing:
            return code

# ============================================================
# CREATE USER 🔒 Protected
# ============================================================
@router.post("/users/{tenant_db}/create")
def create_user(
    tenant_db: str,
    payload: schemas_tenant.UserCreate,
    request: Request,
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)    # 🔐 Token required
):
    try:
        logger.info(f"Creating user {payload.email} for tenant {tenant_db} by {user.get('email')}")
        print(f"DEBUG: Received payload - role_id: {payload.role_id}, department_id: {payload.department_id}")
        
        hospital = get_hospital_by_db(db, tenant_db)
        engine = database.get_tenant_engine(str(hospital.db_name))
        tdb = Session(bind=engine)

        with tdb:
            if tdb.query(User).filter(User.email == payload.email).first():
                raise HTTPException(400, "Email already exists")

            # Get available roles and departments for better error messages
            available_roles = tdb.query(Role).all()
            available_depts = tdb.query(Department).all()
            
            print(f"DEBUG: Available roles: {[(r.id, r.name) for r in available_roles]}")
            print(f"DEBUG: Available departments: {[(d.id, d.name) for d in available_depts]}")
            
            # Check if any roles exist
            if not available_roles:
                raise HTTPException(400, "No roles found in database. Please create roles first using the roles management section.")
            
            # Check if any departments exist
            if not available_depts:
                raise HTTPException(400, "No departments found in database. Please create departments first using the departments management section.")
            
            # Check if role_id and department_id are valid integers > 0
            if not isinstance(payload.role_id, int) or payload.role_id <= 0:
                role_list = ", ".join([f"{r.id}: {r.name}" for r in available_roles])
                raise HTTPException(400, f"Invalid role_id: {payload.role_id}. Available roles: {role_list}")
                
            if not isinstance(payload.department_id, int) or payload.department_id <= 0:
                dept_list = ", ".join([f"{d.id}: {d.name}" for d in available_depts])
                raise HTTPException(400, f"Invalid department_id: {payload.department_id}. Available departments: {dept_list}")

            role = tdb.query(Role).filter(Role.id == payload.role_id).first()
            if not role:
                role_list = ", ".join([f"{r.id}: {r.name}" for r in available_roles])
                raise HTTPException(400, f"Role with id {payload.role_id} not found. Available roles: {role_list}")

            dept = tdb.query(Department).filter(Department.id == payload.department_id).first()
            if not dept:
                dept_list = ", ".join([f"{d.id}: {d.name}" for d in available_depts])
                raise HTTPException(400, f"Department with id {payload.department_id} not found. Available departments: {dept_list}")

            hashed_pwd = pwd_context.hash(payload.password)
            
            # Generate unique login code
            login_code = generate_unique_login_code(tdb)
            
            # Check if email matches an existing employee in onboarding system
            employee_code = None
            onboarding_employee = None
            
            # First, try to find by name match
            onboarding_employee = tdb.query(OnboardingCandidate).filter(
                OnboardingCandidate.candidate_name.ilike(f"%{payload.name}%")
            ).first()
            
            # If no match by name, try to find by email in the candidates table
            if not onboarding_employee:
                try:
                    from models.models_tenant import Candidate
                    candidate = tdb.query(Candidate).filter(Candidate.email == payload.email).first()
                    if candidate:
                        onboarding_employee = tdb.query(OnboardingCandidate).filter(
                            OnboardingCandidate.application_id == candidate.id
                        ).first()
                except Exception as e:
                    print(f"Error searching candidates table: {e}")
            
            # If still no match, try direct email search in onboarding candidates
            if not onboarding_employee:
                try:
                    # Get all onboarding candidates and check their emails from candidate table
                    from models.models_tenant import Candidate
                    onboarding_candidates = tdb.query(OnboardingCandidate).all()
                    for oc in onboarding_candidates:
                        candidate = tdb.query(Candidate).filter(Candidate.id == oc.application_id).first()
                        if candidate and candidate.email and candidate.email.lower() == payload.email.lower():
                            onboarding_employee = oc
                            break
                except Exception as e:
                    print(f"Error in comprehensive email search: {e}")
            
            # Use employee_id from onboarding if found
            if onboarding_employee and onboarding_employee.employee_id:
                employee_code = onboarding_employee.employee_id
                print(f"Found existing employee code from EIS: {employee_code} for {payload.email} (matched with {onboarding_employee.candidate_name})")
            else:
                print(f"No existing employee code found in EIS for {payload.email}")

            new_user = User(
                name=payload.name,
                email=payload.email,
                password=hashed_pwd,
                role_id=payload.role_id,
                department_id=payload.department_id,
                login_code=login_code,
                employee_code=employee_code,  # Set employee code from EIS if found
                two_factor_enabled=payload.two_factor_enabled or False
            )

            tdb.add(new_user)
            tdb.commit()
            tdb.refresh(new_user)
            
            # Audit log
            audit_crud(request, tdb, user, "CREATE_USER", "users", str(new_user.id), {}, {"name": payload.name, "email": payload.email})
            
            logger.info(f"User {payload.email} created successfully with ID {new_user.id}")
            
            # Create appropriate success message
            if employee_code:
                message = f"User '{payload.name}' has been created successfully with login code: {login_code} and existing employee code: {employee_code}"
            else:
                message = f"User '{payload.name}' has been created successfully with login code: {login_code}"
            
            return {
                "detail": "User created successfully", 
                "message": message,
                "user_id": new_user.id,
                "login_code": login_code,
                "employee_code": employee_code,
                "success": True
            }
    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: Error creating user: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Error creating user: {str(e)}")

# ============================================================
# LIST USERS 🔒 Protected
# ============================================================
@router.get("/users/{tenant_db}/list")
def list_users(
    tenant_db: str,
    status: str = "active",
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)
):
    logger.info(f"Listing users for tenant {tenant_db} by user {user.get('email')}")
    
    # Admin users have full access
    if not (user.get('role') == 'admin' or user.get('is_admin') or user.get('login_type') == 'admin'):
        # Check if user has permission to view users, employees or view self
        user_permissions = user.get('permissions', [])
        logger.info(f"User permissions: {user_permissions}")
        if not ('view_users' in user_permissions or 'view_employees' in user_permissions or 'view_self' in user_permissions):
            raise HTTPException(403, "You do not have permission to view users")

    hospital = get_hospital_by_db(db, tenant_db)
    engine = database.get_tenant_engine(str(hospital.db_name))
    tdb = Session(bind=engine)

    with tdb:
        query = tdb.query(User)
        
        # Check permissions - view_self takes precedence over view_employees and view_users
        user_permissions = user.get('permissions', [])
        current_user_email = user.get('email')
        logger.info(f"Checking permissions for filtering: {user_permissions}")
        logger.info(f"Current user email: {current_user_email}")
        
        if 'view_self' in user_permissions:
            # view_self takes precedence - only show current user's record
            logger.info("Filtering to self only (view_self takes precedence)")
            # Filter by email since that's what we have in the JWT token
            query = query.filter(User.email == current_user_email)
        elif 'view_users' in user_permissions or 'view_employees' in user_permissions:
            # Show all users if they have view_users or view_employees but not view_self
            logger.info("Showing all users (view_users/view_employees permission)")
            # No additional filtering needed
        
        if status == "active":
            users = query.filter(User.status == "Active").all()
        elif status == "inactive":
            users = query.filter(User.status == "Inactive").all()
        else:  # all
            users = query.all()

        output = []
        for u in users:
            role_name = u.role.name if u.role else "No Role"
            dept_name = u.department.name if u.department else "No Department"
            
            # Get employee code from user table or onboarding table
            employee_code = getattr(u, 'employee_code', None)
            if not employee_code:
                # Check onboarding_candidates table for employee_id by name only
                onboarding = tdb.query(OnboardingCandidate).filter(
                    OnboardingCandidate.candidate_name == u.name
                ).first()
                if onboarding and getattr(onboarding, 'employee_id', None):
                    employee_code = onboarding.employee_id
            
            output.append({
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role_id": u.role_id,
                "role": role_name,
                "role_name": role_name,
                "department_id": u.department_id,
                "department": dept_name,
                "department_name": dept_name,
                "employee_code": employee_code,
                "employee_type": getattr(u, 'employee_type', None),
                "designation": getattr(u, 'designation', None),
                "joining_date": str(getattr(u, 'joining_date', None)) if getattr(u, 'joining_date', None) else None,
                "status": getattr(u, 'status', 'Active'),
                "login_code": getattr(u, 'login_code', None),
                "two_factor_enabled": getattr(u, 'two_factor_enabled', False),
                "is_employee": bool(employee_code),
                "created_at": str(u.created_at)
            })

        return {"users": output}

# ============================================================
# LIST USERS (hospitals endpoint) 🔒 Protected
# ============================================================
@router.get("/hospitals/users/{tenant_db}/list")
def list_users_hospitals(
    tenant_db: str,
    status: str = "active",
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)    # 🔐 Token required
):
    logger.info(f"Admin check - role: {user.get('role')}, is_admin: {user.get('is_admin')}, login_type: {user.get('login_type')}")
    
    # Admin users have full access
    if user.get('role') == 'admin' or user.get('is_admin') or user.get('login_type') == 'admin':
        logger.info("User is admin, bypassing permission check")
        return list_users(tenant_db, status, db, user)
    
    # Check if user has permission to view users, employees or view self
    user_permissions = user.get('permissions', [])
    logger.info(f"User permissions: {user_permissions}")
    if not ('view_users' in user_permissions or 'view_employees' in user_permissions or 'view_self' in user_permissions):
        raise HTTPException(403, "You do not have permission to view users")
    
    return list_users(tenant_db, status, db, user)

# ============================================================
# GET CURRENT USER INFO 🔒 Protected
# ============================================================
@router.get("/users/{tenant_db}/me")
def get_current_user_info(
    tenant_db: str,
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)    # 🔐 Token required
):
    try:
        logger.info(f"Getting current user info for tenant {tenant_db} by {user.get('email')}")
        
        hospital = get_hospital_by_db(db, tenant_db)
        engine = database.get_tenant_engine(str(hospital.db_name))
        tdb = Session(bind=engine)

        with tdb:
            current_user_email = user.get('email')
            current_user_db = tdb.query(User).filter(User.email == current_user_email).first()
            
            if not current_user_db:
                raise HTTPException(404, "User not found")
            
            # Get employee code from user table or onboarding table
            employee_code = getattr(current_user_db, 'employee_code', None)
            if not employee_code:
                # Check onboarding_candidates table for employee_id by name only
                onboarding = tdb.query(OnboardingCandidate).filter(
                    OnboardingCandidate.candidate_name == current_user_db.name
                ).first()
                if onboarding and getattr(onboarding, 'employee_id', None):
                    employee_code = onboarding.employee_id
            
            role_name = current_user_db.role.name if current_user_db.role else "No Role"
            dept_name = current_user_db.department.name if current_user_db.department else "No Department"
            
            return {
                "id": current_user_db.id,
                "name": current_user_db.name,
                "email": current_user_db.email,
                "role_id": current_user_db.role_id,
                "role": role_name,
                "role_name": role_name,
                "department_id": current_user_db.department_id,
                "department": dept_name,
                "department_name": dept_name,
                "employee_code": employee_code,
                "employee_type": getattr(current_user_db, 'employee_type', None),
                "designation": getattr(current_user_db, 'designation', None),
                "joining_date": str(getattr(current_user_db, 'joining_date', None)) if getattr(current_user_db, 'joining_date', None) else None,
                "status": getattr(current_user_db, 'status', 'Active'),
                "is_employee": bool(employee_code)
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting current user info: {str(e)}")
        raise HTTPException(500, f"Error getting user info: {str(e)}")

# ============================================================
# VERIFY EMPLOYEE CODE 🔒 Protected
# ============================================================
@router.get("/users/{tenant_db}/verify-employee-code/{user_id}")
def verify_employee_code(
    tenant_db: str,
    user_id: int,
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)
):
    """Verify and return the current employee code for a user"""
    try:
        hospital = get_hospital_by_db(db, tenant_db)
        engine = database.get_tenant_engine(str(hospital.db_name))
        tdb = Session(bind=engine)

        with tdb:
            target_user = tdb.query(User).filter(User.id == user_id).first()
            if not target_user:
                raise HTTPException(404, "User not found")
            
            return {
                "user_id": target_user.id,
                "name": target_user.name,
                "email": target_user.email,
                "employee_code": target_user.employee_code,
                "has_employee_code": bool(target_user.employee_code)
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error verifying employee code: {str(e)}")

# ============================================================
# UPDATE USER 🔒 Protected
# ============================================================
@router.put("/users/{tenant_db}/update/{user_id}")
def update_user(
    tenant_db: str,
    user_id: int,
    payload: schemas_tenant.UserUpdate,
    request: Request,
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)    # 🔐 Token required
):
    logger.info(f"Updating user {user_id} in tenant {tenant_db} by user {user.get('email')}")

    hospital = get_hospital_by_db(db, tenant_db)
    engine = database.get_tenant_engine(str(hospital.db_name))
    tdb = Session(bind=engine)

    with tdb:
        existing_user = tdb.query(User).filter(User.id == user_id).first()
        if not existing_user:
            raise HTTPException(404, "User not found")

        # Store old values for audit
        old_values = {"name": existing_user.name, "email": existing_user.email}

        # Update fields if provided
        if payload.name is not None:
            setattr(existing_user, 'name', payload.name)
        if payload.email is not None:
            setattr(existing_user, 'email', payload.email)
        if payload.role_id is not None:
            setattr(existing_user, 'role_id', payload.role_id)
        if payload.department_id is not None:
            setattr(existing_user, 'department_id', payload.department_id)
        if payload.password is not None:
            setattr(existing_user, 'password', pwd_context.hash(payload.password))
        if payload.two_factor_enabled is not None:
            setattr(existing_user, 'two_factor_enabled', payload.two_factor_enabled)

        tdb.commit()
        
        # Audit log
        audit_crud(request, tdb, user, "UPDATE_USER", "users", str(user_id), old_values, payload.dict(exclude_unset=True))
        
        logger.info(f"User {user_id} updated successfully")
        return {
            "detail": "User updated successfully", 
            "message": f"User '{existing_user.name}' has been updated successfully",
            "success": True
        }

# ============================================================
# UPDATE USER (Alternative endpoint) 🔒 Protected
# ============================================================
@router.put("/users/{tenant_db}/{user_id}")
def update_user_alt(
    tenant_db: str,
    user_id: int,
    payload: schemas_tenant.UserUpdate,
    request: Request,
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)
):
    return update_user(tenant_db, user_id, payload, request, db, user)

# ============================================================
# DELETE USER 🔒 Protected (Soft Delete)
# ============================================================
@router.delete("/users/{tenant_db}/delete/{user_id}")
def delete_user(
    tenant_db: str,
    user_id: int,
    request: Request,
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)    # 🔐 Token required
):
    logger.info(f"Soft deleting user {user_id} from tenant {tenant_db} by user {user.get('email')}")

    hospital = get_hospital_by_db(db, tenant_db)
    engine = database.get_tenant_engine(str(hospital.db_name))
    tdb = Session(bind=engine)

    with tdb:
        user_to_delete = tdb.query(User).filter(User.id == user_id).first()
        if not user_to_delete:
            raise HTTPException(404, "User not found")

        # Store old values for audit
        old_values = {"name": user_to_delete.name, "email": user_to_delete.email, "status": user_to_delete.status}

        # Soft delete by setting status to Inactive
        setattr(user_to_delete, 'status', "Inactive")
        tdb.commit()
        
        # Audit log
        audit_crud(request, tdb, user, "DELETE_USER", "users", str(user_id), old_values, {"status": "Inactive"})

        return {
            "detail": "User deleted successfully", 
            "message": f"User '{user_to_delete.name}' has been deactivated successfully",
            "success": True
        }

# ============================================================
# DELETE USER (hospitals endpoint) 🔒 Protected
# ============================================================
@router.delete("/hospitals/users/{tenant_db}/delete/{user_id}")
def delete_user_hospitals(
    tenant_db: str,
    user_id: int,
    request: Request,
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)
):
    return delete_user(tenant_db, user_id, request, db, user)

# ============================================================
# GET MANAGERS BY ROLE 🔒 Protected
# ============================================================
@router.get("/users/{tenant_db}/managers")
def get_managers_by_role(
    tenant_db: str,
    role_level: str = "Manager",
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)
):
    """Fetch users who can act as managers based on their role level"""
    logger.info(f"Fetching managers for tenant {tenant_db} with role level {role_level}")

    hospital = get_hospital_by_db(db, tenant_db)
    engine = database.get_tenant_engine(str(hospital.db_name))
    tdb = Session(bind=engine)

    with tdb:
        # Query users with manager-level roles
        # This assumes roles have names like "Manager", "Senior Manager", "Team Lead", etc.
        manager_roles = tdb.query(Role).filter(
            Role.name.ilike(f"%{role_level}%")
        ).all()
        
        if not manager_roles:
            # Fallback: get all active users if no specific manager roles found
            users = tdb.query(User).filter(User.status == "Active").all()
        else:
            role_ids = [role.id for role in manager_roles]
            users = tdb.query(User).filter(
                User.role_id.in_(role_ids),
                User.status == "Active"
            ).all()

        managers = []
        for u in users:
            role_name = u.role.name if u.role else "No Role"
            dept_name = u.department.name if u.department else "No Department"
            
            managers.append({
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role_name": role_name,
                "department_name": dept_name,
                "employee_code": getattr(u, 'employee_code', None)
            })

        return {"managers": managers}

# ============================================================
# GET REPORTING LEVELS 🔒 Protected
# ============================================================
@router.get("/users/{tenant_db}/reporting-levels")
def get_reporting_levels(
    tenant_db: str,
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)
):
    """Fetch available reporting levels for organizational assignment"""
    logger.info(f"Fetching reporting levels for tenant {tenant_db}")

    hospital = get_hospital_by_db(db, tenant_db)
    engine = database.get_tenant_engine(str(hospital.db_name))
    tdb = Session(bind=engine)

    with tdb:
        try:
            # Try to get from reporting_levels table if it exists
            levels = tdb.query(ReportingLevel).filter(
                ReportingLevel.is_active == True
            ).order_by(ReportingLevel.level_order).all()
            
            reporting_levels = [{
                "id": level.id,
                "level_name": level.level_name,
                "level_order": level.level_order,
                "description": level.description
            } for level in levels]
            
        except Exception:
            # Fallback: return common organizational levels
            reporting_levels = [
                {"id": 1, "level_name": "CEO", "level_order": 1, "description": "Chief Executive Officer"},
                {"id": 2, "level_name": "Manager", "level_order": 2, "description": "Department Manager"},
                {"id": 3, "level_name": "Team Lead", "level_order": 3, "description": "Team Leader"},
                {"id": 4, "level_name": "Employee", "level_order": 4, "description": "Employee Level"}
            ]

        return {"reporting_levels": reporting_levels}

# ============================================================
# GET HIERARCHY RULES 🔒 Protected
# ============================================================
@router.get("/users/{tenant_db}/hierarchy-rules")
def get_hierarchy_rules(
    tenant_db: str,
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)
):
    """Fetch hierarchy rules for reporting structure"""
    logger.info(f"Fetching hierarchy rules for tenant {tenant_db}")

    hospital = get_hospital_by_db(db, tenant_db)
    engine = database.get_tenant_engine(str(hospital.db_name))
    tdb = Session(bind=engine)

    with tdb:
        try:
            # Try to get from hierarchy table if it exists
            rules = tdb.query(ReportingHierarchy).filter(
                ReportingHierarchy.is_active == True
            ).all()
            
            hierarchy_rules = [{
                "id": rule.id,
                "parent_level_id": rule.parent_level_id,
                "child_level_id": rule.child_level_id,
                "parent_level_name": rule.parent_level.level_name if rule.parent_level else None,
                "child_level_name": rule.child_level.level_name if rule.child_level else None,
                "department_id": rule.department_id
            } for rule in rules]
            
        except Exception:
            # Fallback: return default hierarchy based on level order
            hierarchy_rules = [
                {"id": 1, "parent_level_id": 1, "child_level_id": 2, "parent_level_name": "CEO", "child_level_name": "Manager"},
                {"id": 2, "parent_level_id": 2, "child_level_id": 3, "parent_level_name": "Manager", "child_level_name": "Team Lead"},
                {"id": 3, "parent_level_id": 3, "child_level_id": 4, "parent_level_name": "Team Lead", "child_level_name": "Employee"}
            ]

        return {"hierarchy_rules": hierarchy_rules}

# ============================================================
# GET MANAGERS BY LEVEL 🔒 Protected
# ============================================================
@router.get("/users/{tenant_db}/managers-by-level")
def get_managers_by_level(
    tenant_db: str,
    level_id: int,
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)
):
    """Fetch managers based on hierarchy rules for a specific level"""
    logger.info(f"Fetching managers for level {level_id} in tenant {tenant_db}")

    hospital = get_hospital_by_db(db, tenant_db)
    engine = database.get_tenant_engine(str(hospital.db_name))
    tdb = Session(bind=engine)

    with tdb:
        managers = []
        
        try:
            # Query reporting_hierarchy table to get parent_level_id
            hierarchy_query = tdb.execute(
                text("SELECT parent_level_id FROM reporting_hierarchy WHERE child_level_id = :level_id AND is_active = 1"),
                {"level_id": level_id}
            ).fetchone()
            
            if hierarchy_query:
                parent_level_id = hierarchy_query[0]
                logger.info(f"Found parent_level_id from DB: {parent_level_id} for level_id: {level_id}")
                
                # Get the parent level name from reporting_levels table
                level_query = tdb.execute(
                    text("SELECT level_name FROM reporting_levels WHERE id = :parent_id AND is_active = 1"),
                    {"parent_id": parent_level_id}
                ).fetchone()
                
                if level_query:
                    parent_level_name = level_query[0]
                    logger.info(f"Found parent level name: {parent_level_name}")
                else:
                    parent_level_name = None
            else:
                parent_level_name = None
                logger.info(f"No hierarchy rule found for level_id: {level_id}")
            if parent_level_name:
                logger.info(f"Looking for roles containing: {parent_level_name}")
                
                # Find roles that contain the parent level name
                parent_roles = tdb.query(Role).filter(
                    Role.name.ilike(f"%{parent_level_name}%")
                ).all()
                
                logger.info(f"Found {len(parent_roles)} matching roles: {[r.name for r in parent_roles]}")
                
                if parent_roles:
                    role_ids = [role.id for role in parent_roles]
                    users = tdb.query(User).filter(
                        User.role_id.in_(role_ids),
                        User.status == "Active"
                    ).all()
                    logger.info(f"Found {len(users)} users with matching roles")
                else:
                    users = []
                    logger.info("No matching roles found, returning empty list")
            else:
                users = []  # Top level has no managers
                
        except Exception as e:
            logger.error(f"Error in hierarchy lookup: {e}")
            users = []

        for u in users:
            role_name = u.role.name if u.role else "No Role"
            dept_name = u.department.name if u.department else "No Department"
            
            managers.append({
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role_name": role_name,
                "department_name": dept_name,
                "employee_code": getattr(u, 'employee_code', None)
            })

        return {"managers": managers}

