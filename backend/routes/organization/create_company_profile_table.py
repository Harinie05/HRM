from database import get_tenant_engine, logger
from models.models_tenant import (
    MasterBase,
    CompanyProfile,
    Branch,
    Shift,
    Holiday,
    Grade,
    Role,
    Permission,
    RolePermission,
    Department,
    User
)

tenant = "nutryah"  # Change this to your tenant database name

logger.info(f"Creating tables in tenant DB: {tenant}...")
print(f"Creating tables in tenant DB: {tenant}...")

engine = get_tenant_engine(tenant)
MasterBase.metadata.create_all(bind=engine)

logger.info("Done. All tables created successfully.")
print("Done. All tables created successfully.")
print("\nTables created:")
print("  - roles")
print("  - permissions")
print("  - role_permissions")
print("  - departments")
print("  - users")
print("  - company_profile")
print("  - branches")
print("  - shifts")
print("  - grades")
print("  - holidays")
