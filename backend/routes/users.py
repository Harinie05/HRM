from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.models_master import Hospital
from models.models_tenant import User, Role, Department
import schemas.schemas_tenant as schemas_tenant
import database
from database import logger
from passlib.context import CryptContext

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


# ============================================================
# CREATE USER 🔒 Protected
# ============================================================
@router.post("/users/{tenant_db}/create")
def create_user(
    tenant_db: str,
    payload: schemas_tenant.UserCreate,
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)    # 🔐 Token required
):
    try:
        logger.info(f"Creating user {payload.email} for tenant {tenant_db} by {user.get('email')}")
        
        hospital = get_hospital_by_db(db, tenant_db)
        engine = database.get_tenant_engine(str(hospital.db_name))
        tdb = Session(bind=engine)

        with tdb:
            if tdb.query(User).filter(User.email == payload.email).first():
                raise HTTPException(400, "Email already exists")

            role = tdb.query(Role).filter(Role.id == payload.role_id).first()
            if not role:
                raise HTTPException(400, f"Role with id {payload.role_id} not found")

            dept = tdb.query(Department).filter(Department.id == payload.department_id).first()
            if not dept:
                raise HTTPException(400, f"Department with id {payload.department_id} not found")

            hashed_pwd = pwd_context.hash(payload.password)

            new_user = User(
                name=payload.name,
                email=payload.email,
                password=hashed_pwd,
                role_id=payload.role_id,
                department_id=payload.department_id
            )

            tdb.add(new_user)
            tdb.commit()
            tdb.refresh(new_user)
            logger.info(f"User {payload.email} created successfully with ID {new_user.id}")
            return {"detail": "User created", "user_id": new_user.id}
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
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)    # 🔐 Token required
):
    logger.info(f"Listing users for tenant {tenant_db} by user {user.get('email')}")

    hospital = get_hospital_by_db(db, tenant_db)
    engine = database.get_tenant_engine(str(hospital.db_name))
    tdb = Session(bind=engine)

    with tdb:
        users = tdb.query(User).all()

        output = []
        for u in users:
            role_name = u.role.name if u.role else "No Role"
            dept_name = u.department.name if u.department else "No Department"
            
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
                "employee_code": getattr(u, 'employee_code', None),
                "employee_type": getattr(u, 'employee_type', None),
                "designation": getattr(u, 'designation', None),
                "joining_date": str(getattr(u, 'joining_date', None)) if getattr(u, 'joining_date', None) else None,
                "status": getattr(u, 'status', 'Active'),
                "is_employee": bool(getattr(u, 'employee_code', None)),
                "created_at": str(u.created_at)
            })

        return {"users": output}


# ============================================================
# LIST USERS (hospitals endpoint) 🔒 Protected
# ============================================================
@router.get("/hospitals/users/{tenant_db}/list")
def list_users_hospitals(
    tenant_db: str,
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)    # 🔐 Token required
):
    return list_users(tenant_db, db, user)


# ============================================================
# UPDATE USER 🔒 Protected
# ============================================================
@router.put("/users/{tenant_db}/update/{user_id}")
def update_user(
    tenant_db: str,
    user_id: int,
    payload: schemas_tenant.UserUpdate,
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

        # Update fields if provided
        if payload.name is not None:
            existing_user.name = payload.name
        if payload.email is not None:
            existing_user.email = payload.email
        if payload.role_id is not None:
            existing_user.role_id = payload.role_id
        if payload.department_id is not None:
            existing_user.department_id = payload.department_id
        if payload.password is not None:
            existing_user.password = pwd_context.hash(payload.password)

        tdb.commit()
        logger.info(f"User {user_id} updated successfully")
        return {"detail": "User updated"}


# ============================================================
# DELETE USER 🔒 Protected
# ============================================================
@router.delete("/users/{tenant_db}/delete/{user_id}")
def delete_user(
    tenant_db: str,
    user_id: int,
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)    # 🔐 Token required
):
    logger.info(f"Deleting user {user_id} from tenant {tenant_db} by user {user.get('email')}")

    hospital = get_hospital_by_db(db, tenant_db)
    engine = database.get_tenant_engine(str(hospital.db_name))
    tdb = Session(bind=engine)

    with tdb:
        user = tdb.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(404, "User not found")

        tdb.delete(user)
        tdb.commit()

        return {"detail": "User deleted"}
