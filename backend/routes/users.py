from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.models_master import Hospital
from models.models_tenant import User, Role, Department
import schemas.schemas_tenant as schemas_tenant
import database
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
        print(f"DEBUG: Authenticated user: {user.get('email')} (Role: {user.get('role')})")
        print(f"DEBUG: Creating user for tenant '{tenant_db}'")
        print(f"DEBUG: Payload: {payload}")
        
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
    print(f"DEBUG: User {user.get('email')} listing users for tenant {tenant_db}")

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
                "role": role_name,
                "department": dept_name,
                "created_at": str(u.created_at)
            })

        return {"users": output}


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
    print(f"DEBUG: User {user.get('email')} deleting user {user_id} from tenant {tenant_db}")

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
