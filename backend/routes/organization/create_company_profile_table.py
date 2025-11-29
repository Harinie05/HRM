from database import get_tenant_engine
from models.models_tenant import MasterBase,Branch

tenant = "nutryah"

engine = get_tenant_engine(tenant)

print(f"🔧 Creating tables in tenant DB: {tenant}...")
MasterBase.metadata.create_all(bind=engine)
print("✅ Done. Tables created.")
