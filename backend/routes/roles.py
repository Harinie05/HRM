# routes/roles.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.models_master import Hospital
from models.models_tenant import Role, Permission, RolePermission
from .tenant_seed import seed_tenant

import database

# 🔐 Added import for token protection
from routes.hospital import get_current_user

router = APIRouter()


# ---------------------------------------------------
# GET HOSPITAL BY TENANT DB
# ---------------------------------------------------
def get_hospital_by_db(db: Session, tenant_db: str):
    hospital = db.query(Hospital).filter(Hospital.db_name == tenant_db).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospital


# ---------------------------------------------------
# CREATE ROLE  🔒 Protected
# ---------------------------------------------------
@router.post("/roles/{tenant_db}/create")
def create_role(
    tenant_db: str,
    payload: dict,
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)   # 🔐 Token required
):
    try:
        print(f"DEBUG: Authenticated user: {user}")
        print(f"DEBUG: User email: {user.get('email')}")
        print(f"DEBUG: User role: {user.get('role')}")
        print(f"DEBUG: Received payload: {payload}")
        
        if "name" not in payload or not payload["name"]:
            raise HTTPException(400, "Role name is required")
        
        hospital = get_hospital_by_db(db, tenant_db)
        engine = database.get_tenant_engine(str(hospital.db_name))
        tdb = Session(bind=engine)

        with tdb:
            existing = tdb.query(Role).filter(Role.name == payload["name"]).first()
            if existing:
                raise HTTPException(400, "Role already exists")

            new_role = Role(
                name=payload["name"],
                description=payload.get("description")
            )
            tdb.add(new_role)
            tdb.commit()
            tdb.refresh(new_role)

            permission_names = payload.get("permissions", [])
            for perm_name in permission_names:
                perm = tdb.query(Permission).filter(Permission.name == perm_name).first()
                if perm:
                    tdb.add(RolePermission(role_id=new_role.id, permission_id=perm.id))

            tdb.commit()
            return {"detail": "Role created", "role_id": new_role.id}
    except HTTPException as he:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error creating role: {str(e)}")


# ---------------------------------------------------
# LIST ROLES  🔒 Protected
# ---------------------------------------------------
@router.get("/roles/{tenant_db}/list")
def list_roles(
    tenant_db: str,
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)   # 🔐 Token required
):
    print(f"DEBUG: User {user.get('email')} listing roles for tenant {tenant_db}")

    hospital = get_hospital_by_db(db, tenant_db)
    engine = database.get_tenant_engine(str(hospital.db_name))
    tdb = Session(bind=engine)

    with tdb:
        roles = tdb.query(Role).all()
        result = []

        for role in roles:
            perm_ids = (
                tdb.query(RolePermission.permission_id)
                .filter(RolePermission.role_id == role.id).all()
            )
            perm_ids = [p[0] for p in perm_ids]

            perm_names = (
                tdb.query(Permission.name)
                .filter(Permission.id.in_(perm_ids)).all()
            )
            perm_names = [p[0] for p in perm_names]

            result.append({
                "id": role.id,
                "name": role.name,
                "description": role.description,
                "permissions": perm_names
            })

        return {"roles": result}


# ---------------------------------------------------
# DELETE ROLE  🔒 Protected
# ---------------------------------------------------
@router.delete("/roles/{tenant_db}/delete/{role_id}")
def delete_role(
    tenant_db: str,
    role_id: int,
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)   # 🔐 Token required
):
    print(f"DEBUG: User {user.get('email')} deleting role {role_id} from tenant {tenant_db}")

    hospital = get_hospital_by_db(db, tenant_db)
    engine = database.get_tenant_engine(str(hospital.db_name))
    tdb = Session(bind=engine)

    with tdb:
        role = tdb.query(Role).filter(Role.id == role_id).first()
        if not role:
            raise HTTPException(404, "Role not found")

        tdb.query(RolePermission).filter(RolePermission.role_id == role_id).delete()
        tdb.delete(role)
        tdb.commit()

        return {"detail": "Role deleted"}


# ---------------------------------------------------
# UPDATE ROLE  🔒 Protected
# ---------------------------------------------------
@router.put("/roles/{tenant_db}/update/{role_id}")
def update_role(
    tenant_db: str,
    role_id: int,
    payload: dict,
    db: Session = Depends(database.get_master_db),
    user = Depends(get_current_user)   # 🔐 Token required
):
    print(f"DEBUG: User {user.get('email')} updating role {role_id} in tenant {tenant_db}")

    hospital = get_hospital_by_db(db, tenant_db)
    engine = database.get_tenant_engine(str(hospital.db_name))
    tdb = Session(bind=engine)

    with tdb:
        role = tdb.query(Role).filter(Role.id == role_id).first()
        if not role:
            raise HTTPException(404, "Role not found")

        role.name = payload["name"]
        tdb.commit()

        tdb.query(RolePermission).filter(RolePermission.role_id == role_id).delete()
        tdb.commit()

        for perm_name in payload.get("permissions", []):
            perm = tdb.query(Permission).filter(Permission.name == perm_name).first()
            if perm:
                tdb.add(RolePermission(role_id=role.id, permission_id=perm.id))

        tdb.commit()

        return {"detail": "Role updated"}


# ---------------------------------------------------
# DEBUG ROUTES 🔒 (optional protect)
# ---------------------------------------------------
@router.get("/roles/{tenant_db}/debug_permissions")
def debug_permissions(tenant_db: str, db: Session = Depends(database.get_master_db), user = Depends(get_current_user)):
    print(f"DEBUG: User {user.get('email')} accessing debug permissions for tenant {tenant_db}")
    hospital = db.query(Hospital).filter(Hospital.db_name == tenant_db).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    engine = database.get_tenant_engine(str(hospital.db_name))
    tdb = Session(bind=engine)
    with tdb:
        perms = tdb.query(Permission).all()
        return {"count": len(perms), "permissions": [p.name for p in perms]}

@router.post("/roles/{tenant_db}/debug_create")
def debug_create_role(tenant_db: str, payload: dict, db: Session = Depends(database.get_master_db), user = Depends(get_current_user)):
    print(f"DEBUG: User {user.get('email')} testing debug create for tenant {tenant_db}")
    return {"received_payload": payload, "tenant_db": tenant_db, "payload_type": str(type(payload))}

@router.get("/roles/{tenant_db}/permissions")
def get_permissions(tenant_db: str, db: Session = Depends(database.get_master_db), user = Depends(get_current_user)):
    print(f"DEBUG: User {user.get('email')} getting permissions list for tenant {tenant_db}")
    hospital = get_hospital_by_db(db, tenant_db)
    engine = database.get_tenant_engine(str(hospital.db_name))
    tdb = Session(bind=engine)
    
    with tdb:
        perms = tdb.query(Permission).all()
        permissions_list = [{
            "name": p.name,
            "description": p.description
        } for p in perms]
        
        return {"permissions": permissions_list}
