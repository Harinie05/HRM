# routes/roles.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.models_master import Hospital
from models.models_tenant import Role, Permission, RolePermission
from .tenant_seed import seed_tenant

import database

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
# CREATE ROLE  (Frontend sends permission NAMES)
# ---------------------------------------------------
@router.post("/roles/{tenant_db}/create")
def create_role(
    tenant_db: str,
    payload: dict,     # <-- accepts { name, description, permissions[] }
    db: Session = Depends(database.get_master_db)
):
    try:
        print(f"DEBUG: Received payload: {payload}")
        
        # Validate required fields
        if "name" not in payload or not payload["name"]:
            print("DEBUG: Role name is missing")
            raise HTTPException(400, "Role name is required")

        print(f"DEBUG: Creating role '{payload['name']}' for tenant '{tenant_db}'")
        
        hospital = get_hospital_by_db(db, tenant_db)
        print(f"DEBUG: Found hospital: {hospital.name}")
        
        engine = database.get_tenant_engine(str(hospital.db_name))
        tdb = Session(bind=engine)

        with tdb:
            # 1. Check duplicate role
            existing = tdb.query(Role).filter(Role.name == payload["name"]).first()
            if existing:
                print(f"DEBUG: Role '{payload['name']}' already exists")
                raise HTTPException(400, "Role already exists")

            # 2. Create role
            new_role = Role(
                name=payload["name"],
                description=payload.get("description")
            )
            print(f"DEBUG: Adding role to database")
            tdb.add(new_role)
            tdb.commit()
            tdb.refresh(new_role)
            print(f"DEBUG: Role created with ID: {new_role.id}")

            # 3. Convert permission names → IDs
            permission_names = payload.get("permissions", [])
            print(f"DEBUG: Processing {len(permission_names)} permissions")

            for perm_name in permission_names:
                perm = tdb.query(Permission).filter(Permission.name == perm_name).first()
                if perm:
                    tdb.add(RolePermission(role_id=new_role.id, permission_id=perm.id))
                    print(f"DEBUG: Added permission '{perm_name}'")
                else:
                    print(f"WARNING: Permission '{perm_name}' not found")

            tdb.commit()
            print(f"DEBUG: Role creation completed successfully")

            return {"detail": "Role created", "role_id": new_role.id}
    except HTTPException as he:
        print(f"DEBUG: HTTPException: {he.detail}")
        raise
    except Exception as e:
        print(f"DEBUG: Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Error creating role: {str(e)}")


# ---------------------------------------------------
# LIST ROLES (Return permission NAMES)
# ---------------------------------------------------
@router.get("/roles/{tenant_db}/list")
def list_roles(
    tenant_db: str,
    db: Session = Depends(database.get_master_db)
):

    hospital = get_hospital_by_db(db, tenant_db)
    engine = database.get_tenant_engine(str(hospital.db_name))

    tdb = Session(bind=engine)

    with tdb:
        roles = tdb.query(Role).all()
        result = []

        for role in roles:

            # find permission ids assigned to this role
            perm_ids = (
                tdb.query(RolePermission.permission_id)
                .filter(RolePermission.role_id == role.id)
                .all()
            )
            perm_ids = [p[0] for p in perm_ids]

            # get permission NAMES
            perm_names = (
                tdb.query(Permission.name)
                .filter(Permission.id.in_(perm_ids))
                .all()
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
# DELETE ROLE
# ---------------------------------------------------
@router.delete("/roles/{tenant_db}/delete/{role_id}")
def delete_role(
    tenant_db: str,
    role_id: int,
    db: Session = Depends(database.get_master_db)
):

    hospital = get_hospital_by_db(db, tenant_db)
    engine = database.get_tenant_engine(str(hospital.db_name))

    tdb = Session(bind=engine)

    with tdb:
        role = tdb.query(Role).filter(Role.id == role_id).first()

        if not role:
            raise HTTPException(404, "Role not found")

        # Delete permissions first
        tdb.query(RolePermission).filter(RolePermission.role_id == role_id).delete()

        # Delete role
        tdb.delete(role)
        tdb.commit()

        return {"detail": "Role deleted"}


# ---------------------------------------------------
# UPDATE ROLE
# ---------------------------------------------------
@router.put("/roles/{tenant_db}/update/{role_id}")
def update_role(
    tenant_db: str,
    role_id: int,
    payload: dict,     # {name, permissions[]}
    db: Session = Depends(database.get_master_db)
):

    hospital = get_hospital_by_db(db, tenant_db)
    engine = database.get_tenant_engine(str(hospital.db_name))

    tdb = Session(bind=engine)

    with tdb:
        role = tdb.query(Role).filter(Role.id == role_id).first()
        if not role:
            raise HTTPException(404, "Role not found")

        # Update name
        role.name = payload["name"]
        tdb.commit()

        # Remove old permissions
        tdb.query(RolePermission).filter(RolePermission.role_id == role_id).delete()
        tdb.commit()

        # Add new permissions
        for perm_name in payload.get("permissions", []):
            perm = tdb.query(Permission).filter(Permission.name == perm_name).first()
            if perm:
                tdb.add(RolePermission(role_id=role.id, permission_id=perm.id))

        tdb.commit()

        return {"detail": "Role updated"}

@router.get("/roles/{tenant_db}/debug_permissions")
def debug_permissions(tenant_db: str, db: Session = Depends(database.get_master_db)):
    hospital = db.query(Hospital).filter(Hospital.db_name == tenant_db).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    engine = database.get_tenant_engine(str(hospital.db_name))
    tdb = Session(bind=engine)
    with tdb:
        perms = tdb.query(Permission).all()
        return {"count": len(perms), "permissions": [p.name for p in perms]}

@router.post("/roles/{tenant_db}/debug_create")
def debug_create_role(tenant_db: str, payload: dict, db: Session = Depends(database.get_master_db)):
    return {"received_payload": payload, "tenant_db": tenant_db, "payload_type": str(type(payload))}

@router.get("/roles/{tenant_db}/permissions")
def get_permissions(tenant_db: str, db: Session = Depends(database.get_master_db)):
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
