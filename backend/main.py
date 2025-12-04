from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Master DB engine
from database import master_engine

# Models for master DB
import models.models_master as models_master
import schemas.schemas_master as schemas_master



# Routers
from routes.hospital import router as hospital_router
from routes.department import router as department_router
from routes.roles import router as roles_router
from routes.users import router as users_router
from routes.organization.company_profile import router as company_profile_router
from routes.organization.branch import router as branch_router
from routes.organization.shifts import router as shift_router

# ============================================================
#  FASTAPI APP
# ============================================================
app = FastAPI(title="Nutryah HRM - Multi Tenant Backend")


# ============================================================
#  CORS (Frontend Access)
# ============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],   # later change to domain for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
#  Startup: Create Master DB Tables
# ============================================================
@app.on_event("startup")
def create_master_tables():
    print("🔵 Creating master database tables...")
    models_master.MasterBase.metadata.create_all(bind=master_engine)
    print("✅ Master tables ready.")


# ============================================================
#  ROUTERS
# ============================================================

# 1. Hospital Master functions (register, login, tenant create)
app.include_router(
    hospital_router,
    prefix="/auth",
    tags=["Hospitals"]
)

# 2. Department CRUD (Tenant DB)
app.include_router(
    department_router,
    prefix="/hospitals",
    tags=["Departments"]
)

# 3. Role & Permission CRUD (Tenant DB)
app.include_router(
    roles_router,
    prefix="/hospitals",
    tags=["Roles"]
)

app.include_router(
    users_router,
    prefix="/hospitals",
    tags=["Users"]
)
app.include_router(company_profile_router)
app.include_router(branch_router)
app.include_router(shift_router)
# ============================================================
#  ROOT ROUTE
# ============================================================
@app.get("/")
def root():
    return {"message": "Nutryah HRM Backend Running 🚀"}
