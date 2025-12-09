from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import master_engine, logger   # ⬅ import logger here

import models.models_master as models_master

from routes.hospital import router as hospital_router
from routes.department import router as department_router
from routes.roles import router as roles_router
from routes.users import router as users_router
from routes.organization.company_profile import router as company_profile_router
from routes.organization.branch import router as branch_router
from routes.organization.shifts import router as shift_router
from routes.organization.grades import router as grade_router
from routes.organization.holiday import router as holiday_router 
from routes.organization.policy import router as policy_router # ⬅ import holiday router here


app = FastAPI(title="Nutryah HRM - Multi Tenant Backend")

logger.info("🚀 FastAPI HRM Backend started")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://192.168.1.11:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("CORS Configured")


@app.on_event("startup")
def create_master_tables():
    logger.info("Creating master database tables...")
    models_master.MasterBase.metadata.create_all(bind=master_engine)
    logger.info("Master tables created.")


app.include_router(hospital_router, prefix="/auth", tags=["Hospitals"])
app.include_router(department_router, prefix="/hospitals", tags=["Departments"])
app.include_router(roles_router, prefix="/hospitals", tags=["Roles"])
app.include_router(users_router, prefix="/hospitals", tags=["Users"])
app.include_router(company_profile_router)
app.include_router(branch_router)
app.include_router(shift_router)
app.include_router(grade_router) 
app.include_router(holiday_router) 
app.include_router(policy_router)
logger.info("All routers loaded successfully")


@app.get("/")
def root():
    logger.info("Root endpoint hit")
    return {"message": "Nutryah HRM Backend Running 🚀"}
