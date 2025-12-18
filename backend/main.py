from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from database import master_engine, logger

import models.models_master as models_master
import models.models_tenant as models_tenant

# ---------------- CORE ROUTERS ----------------
from routes.hospital import router as hospital_router
from routes.department import router as department_router
from routes.roles import router as roles_router
from routes.users import router as users_router

# ---------------- ORGANIZATION ----------------
from routes.organization.company_profile import router as company_profile_router
from routes.organization.branch import router as branch_router
from routes.organization.shifts import router as shift_router
from routes.organization.grades import router as grade_router
from routes.organization.holiday import router as holiday_router
from routes.organization.policy import router as policy_router

# ---------------- RECRUITMENT ----------------
from routes.recruitment.recruitment import router as recruitment_router
from routes.recruitment.recruitment_import import router as recruitment_import_router
from routes.recruitment.ats import router as ats_router
from routes.recruitment.offer import router as offer_router
from routes.recruitment.onboarding import router as onboarding_router
from routes.recruitment.recruitment_public import router as public_router
from routes.recruitment.screening import router as screening_router
from routes.recruitment.dashboard import router as dashboard_router

# ======================= 🔥 EIS ROUTERS =======================
from routes.EIS.employee import router as employee_router
from routes.EIS.family import router as family_router
from routes.EIS.education import router as education_router
from routes.EIS.experience import router as experience_router
from routes.EIS.skills import router as skills_router
from routes.EIS.certification import router as certifications_router
from routes.EIS.id_docs import router as id_docs_router
from routes.EIS.medical import router as medical_router
from routes.EIS.salary import router as salary_router
from routes.EIS.documents import router as documents_router
from routes.EIS.exit import router as exit_router
from routes.EIS.bank_details import router as bank_details_router

# ======================= 🔥 ATTENDANCE ROUTERS =======================
from routes.attendance.roster import router as roster_router
from routes.attendance.punch_logs import router as attendance_punch_router
from routes.attendance.regularization import router as attendance_regularization_router
from routes.attendance.rules import router as attendance_rules_router
from routes.attendance.locations import router as attendance_locations_router
from routes.attendance.reports import router as attendance_reports_router

# ======================= 🔥 LEAVE ROUTERS =======================
from routes.leave.leave_types import router as leave_types_router
from routes.leave.leave_rules import router as leave_rules_router
from routes.leave.leave_applications import router as leave_applications_router
from routes.leave.leave_balances import router as leave_balances_router
from routes.leave.leave_reports import router as leave_reports_router

# ======================= 🔥 ORGANIZATION ROUTERS =======================
from routes.organization.reporting import router as reporting_router
# ============================================================

app = FastAPI(title="Nutryah HRM - Multi Tenant Backend")

logger.info("🚀 FastAPI HRM Backend started")

# ---------------- DIRECTORIES ----------------
Path("uploads/policies").mkdir(parents=True, exist_ok=True)
Path("uploads/resumes").mkdir(parents=True, exist_ok=True)

# ---------------- STATIC FILES ----------------
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("CORS Configured")

# ---------------- STARTUP ----------------
@app.on_event("startup")
def create_tables():
    logger.info("Creating master database tables...")
    models_master.MasterBase.metadata.create_all(bind=master_engine)
    logger.info("Master tables created.")
    
    try:
        from database import create_tenant_database, get_tenant_engine, get_master_db
        
        master_db = next(get_master_db())
        hospitals = master_db.query(models_master.Hospital).all()
        
        for hospital in hospitals:
            try:
                logger.info(f"Ensuring tenant database exists: {hospital.db_name}")
                create_tenant_database(hospital.db_name)
                
                tenant_engine = get_tenant_engine(hospital.db_name)
                models_tenant.MasterBase.metadata.create_all(bind=tenant_engine)
                logger.info(f"Tenant tables created/verified for {hospital.db_name}")
            except Exception as e:
                logger.error(f"Error creating tenant DB {hospital.db_name}: {str(e)}")
        
        master_db.close()
    except Exception as e:
        logger.error(f"Error during tenant database setup: {str(e)}")

# ---------------- REGISTER ROUTERS ----------------
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

# ---------------- RECRUITMENT ----------------
app.include_router(recruitment_router)
app.include_router(recruitment_import_router)
app.include_router(ats_router, prefix="/recruitment")
app.include_router(offer_router, prefix="/recruitment")
app.include_router(onboarding_router, prefix="/recruitment")
app.include_router(public_router)
app.include_router(screening_router)
app.include_router(dashboard_router)

# ======================= 🔥 EIS MODULE =======================
app.include_router(employee_router)
app.include_router(family_router)
app.include_router(education_router)
app.include_router(experience_router)
app.include_router(skills_router)
app.include_router(certifications_router)
app.include_router(id_docs_router)
app.include_router(medical_router)
app.include_router(salary_router)
app.include_router(documents_router)
app.include_router(exit_router)
app.include_router(bank_details_router)
app.include_router(reporting_router)

# ======================= 🔥 ATTENDANCE MODULE =======================
app.include_router(roster_router, prefix="/api")
app.include_router(attendance_punch_router, prefix="/api")
app.include_router(attendance_regularization_router, prefix="/api")
app.include_router(attendance_rules_router, prefix="/api")
app.include_router(attendance_locations_router, prefix="/api")
app.include_router(attendance_reports_router, prefix="/api")

# ======================= 🔥 LEAVE MODULE =======================
app.include_router(leave_types_router, prefix="/api")
app.include_router(leave_rules_router, prefix="/api")
app.include_router(leave_applications_router, prefix="/api")
app.include_router(leave_balances_router, prefix="/api")
app.include_router(leave_reports_router, prefix="/api")
# ============================================================

logger.info("All routers loaded successfully")

# ---------------- ROOT ----------------
@app.get("/")
def root():
    logger.info("Root endpoint hit")
    return {"message": "Nutryah HRM Backend Running 🚀"}
