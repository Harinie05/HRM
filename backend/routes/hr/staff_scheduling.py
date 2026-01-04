from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel
from database import get_tenant_db
from models.models_tenant import PatientLoad, StaffAllocation, StaffScheduleRecommendation, User
from routes.hospital import require_permission

router = APIRouter()

class PatientLoadCreate(BaseModel):
    department_id: int
    date: str
    shift: str
    total_patients: int = 0
    critical_patients: int = 0
    icu_patients: int = 0
    opd_patients: int = 0
    emergency_patients: int = 0
    custom_department: str = ""

class StaffAllocationCreate(BaseModel):
    department_id: int
    date: str
    shift: str
    required_nurses: int = 0
    required_doctors: int = 0
    required_support_staff: int = 0
    allocated_nurses: int = 0
    allocated_doctors: int = 0
    allocated_support_staff: int = 0
    created_by: int
    custom_department: str = ""

@router.get("/patient-loads")
async def get_patient_loads(
    department_id: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_tenant_db),
    _: dict = Depends(require_permission("view_staff_schedules"))
):
    query = db.query(PatientLoad)
    
    if department_id:
        query = query.filter(PatientLoad.department_id == department_id)
    if date_from:
        query = query.filter(PatientLoad.date >= date_from)
    if date_to:
        query = query.filter(PatientLoad.date <= date_to)
    
    patient_loads = query.order_by(PatientLoad.date.desc()).all()
    return {"patient_loads": patient_loads}

@router.post("/patient-loads")
async def create_patient_load(
    payload: PatientLoadCreate,
    db: Session = Depends(get_tenant_db),
    _: dict = Depends(require_permission("add_staff_schedule"))
):
    # Calculate patient acuity score (weighted)
    acuity_score = (payload.critical_patients * 3.0) + (payload.icu_patients * 2.5) + (payload.emergency_patients * 2.0) + (payload.opd_patients * 1.0)
    
    patient_load = PatientLoad(
        department_id=payload.department_id,
        date=payload.date,
        shift=payload.shift,
        total_patients=payload.total_patients,
        critical_patients=payload.critical_patients,
        icu_patients=payload.icu_patients,
        opd_patients=payload.opd_patients,
        emergency_patients=payload.emergency_patients,
        patient_acuity_score=acuity_score
    )
    
    db.add(patient_load)
    db.commit()
    db.refresh(patient_load)
    
    # Auto-generate staff recommendations
    await generate_staff_recommendations(patient_load.id, db)
    
    return {"message": "Patient load recorded successfully", "patient_load": patient_load}

@router.get("/staff-allocations")
async def get_staff_allocations(
    department_id: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_tenant_db)
):
    query = db.query(StaffAllocation)
    
    if department_id:
        query = query.filter(StaffAllocation.department_id == department_id)
    if date_from:
        query = query.filter(StaffAllocation.date >= date_from)
    if date_to:
        query = query.filter(StaffAllocation.date <= date_to)
    
    allocations = query.order_by(StaffAllocation.date.desc()).all()
    return {"staff_allocations": allocations}

@router.post("/staff-allocations")
async def create_staff_allocation(
    payload: StaffAllocationCreate,
    db: Session = Depends(get_tenant_db)
):
    # Calculate patient to nurse ratio
    patient_load = db.query(PatientLoad).filter(
        and_(
            PatientLoad.department_id == payload.department_id,
            PatientLoad.date == payload.date,
            PatientLoad.shift == payload.shift
        )
    ).first()
    
    ratio = 0.0
    if patient_load and payload.allocated_nurses > 0:
        ratio = patient_load.total_patients / payload.allocated_nurses
    
    # Determine allocation status
    status = "Adequate"
    if payload.allocated_nurses < payload.required_nurses or payload.allocated_doctors < payload.required_doctors:
        status = "Understaffed"
    elif payload.allocated_nurses > payload.required_nurses * 1.2 or payload.allocated_doctors > payload.required_doctors * 1.2:
        status = "Overstaffed"
    
    allocation = StaffAllocation(
        department_id=payload.department_id,
        date=payload.date,
        shift=payload.shift,
        required_nurses=payload.required_nurses,
        required_doctors=payload.required_doctors,
        required_support_staff=payload.required_support_staff,
        allocated_nurses=payload.allocated_nurses,
        allocated_doctors=payload.allocated_doctors,
        allocated_support_staff=payload.allocated_support_staff,
        patient_to_nurse_ratio=ratio,
        allocation_status=status,
        created_by=payload.created_by
    )
    
    db.add(allocation)
    db.commit()
    db.refresh(allocation)
    
    return {"message": "Staff allocation created successfully", "allocation": allocation}

@router.get("/recommendations")
async def get_staff_recommendations(
    department_id: Optional[int] = None,
    priority_level: Optional[str] = None,
    db: Session = Depends(get_tenant_db)
):
    query = db.query(StaffScheduleRecommendation)
    
    if department_id:
        query = query.filter(StaffScheduleRecommendation.department_id == department_id)
    if priority_level:
        query = query.filter(StaffScheduleRecommendation.priority_level == priority_level)
    
    recommendations = query.order_by(StaffScheduleRecommendation.created_at.desc()).all()
    return {"recommendations": recommendations}

@router.get("/dashboard-stats")
async def get_dashboard_stats(db: Session = Depends(get_tenant_db)):
    today = date.today()
    
    # Get today's patient loads
    patient_loads = db.query(PatientLoad).filter(PatientLoad.date == today).all()
    total_patients = sum(pl.total_patients for pl in patient_loads)
    critical_patients = sum(pl.critical_patients for pl in patient_loads)
    
    # Get today's staff allocations
    allocations = db.query(StaffAllocation).filter(StaffAllocation.date == today).all()
    understaffed_depts = len([a for a in allocations if a.allocation_status == "Understaffed"])
    
    # Get high priority recommendations
    high_priority_recs = db.query(StaffScheduleRecommendation).filter(
        StaffScheduleRecommendation.priority_level == "High"
    ).count()
    
    return {
        "total_patients_today": total_patients,
        "critical_patients_today": critical_patients,
        "understaffed_departments": understaffed_depts,
        "high_priority_recommendations": high_priority_recs
    }

async def generate_staff_recommendations(patient_load_id: int, db: Session):
    patient_load = db.query(PatientLoad).filter(PatientLoad.id == patient_load_id).first()
    if not patient_load:
        return
    
    # Basic staffing ratios (can be made configurable)
    nurse_ratio = 4  # 1 nurse per 4 patients
    doctor_ratio = 15  # 1 doctor per 15 patients
    support_ratio = 10  # 1 support staff per 10 patients
    
    # Adjust for patient acuity
    acuity_multiplier = 1.0
    if patient_load.patient_acuity_score > 50:
        acuity_multiplier = 1.5
        priority = "High"
    elif patient_load.patient_acuity_score > 25:
        acuity_multiplier = 1.2
        priority = "Normal"
    else:
        priority = "Low"
    
    recommended_nurses = max(1, int((patient_load.total_patients / nurse_ratio) * acuity_multiplier))
    recommended_doctors = max(1, int((patient_load.total_patients / doctor_ratio) * acuity_multiplier))
    recommended_support = max(1, int((patient_load.total_patients / support_ratio) * acuity_multiplier))
    
    reason = f"Based on {patient_load.total_patients} patients with acuity score {patient_load.patient_acuity_score:.1f}"
    
    recommendation = StaffScheduleRecommendation(
        patient_load_id=patient_load_id,
        department_id=patient_load.department_id,
        recommended_nurses=recommended_nurses,
        recommended_doctors=recommended_doctors,
        recommended_support_staff=recommended_support,
        priority_level=priority,
        recommendation_reason=reason,
        auto_generated=True
    )
    
    db.add(recommendation)
    db.commit()

# DELETE endpoints
@router.delete("/patient-loads/{load_id}")
async def delete_patient_load(
    load_id: int,
    db: Session = Depends(get_tenant_db)
):
    patient_load = db.query(PatientLoad).filter(PatientLoad.id == load_id).first()
    if not patient_load:
        raise HTTPException(status_code=404, detail="Patient load not found")
    
    db.delete(patient_load)
    db.commit()
    return {"message": "Patient load deleted successfully"}

@router.delete("/staff-allocations/{allocation_id}")
async def delete_staff_allocation(
    allocation_id: int,
    db: Session = Depends(get_tenant_db)
):
    allocation = db.query(StaffAllocation).filter(StaffAllocation.id == allocation_id).first()
    if not allocation:
        raise HTTPException(status_code=404, detail="Staff allocation not found")
    
    db.delete(allocation)
    db.commit()
    return {"message": "Staff allocation deleted successfully"}

# UPDATE endpoints
@router.put("/patient-loads/{load_id}")
async def update_patient_load(
    load_id: int,
    payload: PatientLoadCreate,
    db: Session = Depends(get_tenant_db)
):
    patient_load = db.query(PatientLoad).filter(PatientLoad.id == load_id).first()
    if not patient_load:
        raise HTTPException(status_code=404, detail="Patient load not found")
    
    # Update fields
    patient_load.department_id = payload.department_id
    patient_load.date = payload.date
    patient_load.shift = payload.shift
    patient_load.total_patients = payload.total_patients
    patient_load.critical_patients = payload.critical_patients
    patient_load.icu_patients = payload.icu_patients
    patient_load.opd_patients = payload.opd_patients
    patient_load.emergency_patients = payload.emergency_patients
    
    # Recalculate acuity score
    patient_load.patient_acuity_score = (payload.critical_patients * 3.0) + (payload.icu_patients * 2.5) + (payload.emergency_patients * 2.0) + (payload.opd_patients * 1.0)
    
    db.commit()
    db.refresh(patient_load)
    return {"message": "Patient load updated successfully", "patient_load": patient_load}

@router.put("/staff-allocations/{allocation_id}")
async def update_staff_allocation(
    allocation_id: int,
    payload: StaffAllocationCreate,
    db: Session = Depends(get_tenant_db)
):
    allocation = db.query(StaffAllocation).filter(StaffAllocation.id == allocation_id).first()
    if not allocation:
        raise HTTPException(status_code=404, detail="Staff allocation not found")
    
    # Update fields
    allocation.department_id = payload.department_id
    allocation.date = payload.date
    allocation.shift = payload.shift
    allocation.required_nurses = payload.required_nurses
    allocation.required_doctors = payload.required_doctors
    allocation.required_support_staff = payload.required_support_staff
    allocation.allocated_nurses = payload.allocated_nurses
    allocation.allocated_doctors = payload.allocated_doctors
    allocation.allocated_support_staff = payload.allocated_support_staff
    
    # Recalculate ratio and status
    patient_load = db.query(PatientLoad).filter(
        and_(
            PatientLoad.department_id == payload.department_id,
            PatientLoad.date == payload.date,
            PatientLoad.shift == payload.shift
        )
    ).first()
    
    ratio = 0.0
    if patient_load and payload.allocated_nurses > 0:
        ratio = patient_load.total_patients / payload.allocated_nurses
    allocation.patient_to_nurse_ratio = ratio
    
    # Determine allocation status
    status = "Adequate"
    if payload.allocated_nurses < payload.required_nurses or payload.allocated_doctors < payload.required_doctors:
        status = "Understaffed"
    elif payload.allocated_nurses > payload.required_nurses * 1.2 or payload.allocated_doctors > payload.required_doctors * 1.2:
        status = "Overstaffed"
    allocation.allocation_status = status
    
    db.commit()
    db.refresh(allocation)
    return {"message": "Staff allocation updated successfully", "allocation": allocation}