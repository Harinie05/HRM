# tenant_seed.py

from sqlalchemy.orm import sessionmaker

# Import models
from models.models_tenant import (
    MasterBase,
    Role,
    Permission,
    RolePermission,
    Department,
    User,
    CompanyProfile,
    Branch,
    Shift,
    Grade,
)

import database


# -------------------------------------------------------------
# DEFAULT PERMISSIONS  (ONLY PERMISSIONS — NO DEFAULT ROLES)
# -------------------------------------------------------------
DEFAULT_PERMISSIONS = [
    # Departments
    {"name": "view_departments", "description": "Can view departments"},
    {"name": "add_department", "description": "Can add department"},
    {"name": "edit_department", "description": "Can edit department"},
    {"name": "delete_department", "description": "Can delete department"},

    # Roles
    {"name": "view_roles", "description": "Can view roles"},
    {"name": "add_role", "description": "Can add role"},
    {"name": "edit_role", "description": "Can edit role"},
    {"name": "delete_role", "description": "Can delete role"},

    # Users
     {"name": "view_users", "description": "Can view users"},
    {"name": "add_user", "description": "Can add users"},
    {"name": "edit_user", "description": "Can edit users"},
    {"name": "delete_user", "description": "Can delete users"},
]


# -------------------------------------------------------------
# SEED TENANT DATABASE AFTER CREATION (ONLY PERMISSIONS)
# -------------------------------------------------------------
def seed_tenant(tenant_db: str):
    print(f"\n🌱 Seeding tenant database: {tenant_db}")

    try:
        # Tenant engine
        engine = database.get_tenant_engine(tenant_db)

        # Session factory
        SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

        # Create all tenant tables
        MasterBase.metadata.create_all(bind=engine)
        print("✓ Tenant tables created")

        with SessionLocal() as db:
            # -----------------------------------------------------
            # Seed ONLY Permissions (NO Default Roles)
            # -----------------------------------------------------
            added_count = 0
            for perm in DEFAULT_PERMISSIONS:
                exists = db.query(Permission).filter_by(name=perm["name"]).first()
                if not exists:
                    new_perm = Permission(**perm)
                    db.add(new_perm)
                    added_count += 1
                    print(f"  + Adding permission: {perm['name']}")
                else:
                    print(f"  - Permission already exists: {perm['name']}")

            db.commit()
            print(f"✓ {added_count} new permissions seeded")

            # Verify permissions were added
            total_perms = db.query(Permission).count()
            print(f"✓ Total permissions in database: {total_perms}")

            # Clean up any unwanted records that might have been created
            unwanted_names = ['app apollo', 'apollo', 'test app', 'dummy']
            
            # Clean up any tables that might have unwanted records
            try:
                from models.models_tenant import LeaveType, Role, Department
                
                # Remove unwanted leave types
                for name in unwanted_names:
                    unwanted_leave = db.query(LeaveType).filter(LeaveType.name.ilike(f"%{name}%")).all()
                    for leave in unwanted_leave:
                        db.delete(leave)
                        print(f"  - Removed unwanted leave type: {leave.name}")
                
                # Remove unwanted roles
                for name in unwanted_names:
                    unwanted_roles = db.query(Role).filter(Role.name.ilike(f"%{name}%")).all()
                    for role in unwanted_roles:
                        db.delete(role)
                        print(f"  - Removed unwanted role: {role.name}")
                
                # Remove unwanted departments
                for name in unwanted_names:
                    unwanted_depts = db.query(Department).filter(Department.name.ilike(f"%{name}%")).all()
                    for dept in unwanted_depts:
                        db.delete(dept)
                        print(f"  - Removed unwanted department: {dept.name}")
                
                db.commit()
                print("✓ Cleanup completed")
            except Exception as cleanup_error:
                print(f"⚠️ Cleanup warning: {str(cleanup_error)}")

        print(f"🌱 Tenant seeding completed for: {tenant_db}\n")
    except Exception as e:
        print(f"❌ Error seeding tenant {tenant_db}: {str(e)}")
        raise e
