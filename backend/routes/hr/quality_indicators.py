from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_tenant_db
from models.models_tenant import QualityIndicator, KPIRecord, Department
from pydantic import BaseModel
from typing import Optional, List
from datetime import date

router = APIRouter()

# Get all departments for dropdown
@router.get("/departments")
async def get_departments(db: Session = Depends(get_tenant_db)):
    try:
        departments = db.query(Department).filter(Department.is_active == True).all()
        print(f"Found {len(departments)} departments")
        for dept in departments:
            print(f"Department: {dept.id} - {dept.name}")
        return [{"id": dept.id, "name": dept.name} for dept in departments]
    except Exception as e:
        print(f"Error fetching departments: {e}")
        return []

# Create sample departments for testing
@router.post("/departments/seed")
async def seed_departments(db: Session = Depends(get_tenant_db)):
    sample_departments = [
        {"name": "IT Department", "description": "Information Technology"},
        {"name": "HR Department", "description": "Human Resources"},
        {"name": "Finance Department", "description": "Finance and Accounting"},
        {"name": "Operations Department", "description": "Operations Management"},
        {"name": "Marketing Department", "description": "Marketing and Sales"}
    ]
    
    created_count = 0
    for dept_data in sample_departments:
        existing = db.query(Department).filter(Department.name == dept_data["name"]).first()
        if not existing:
            dept = Department(**dept_data)
            db.add(dept)
            created_count += 1
    
    db.commit()
    return {"message": f"Created {created_count} departments"}

# Pydantic Models
class QualityIndicatorCreate(BaseModel):
    kpi_name: str
    kpi_category: str
    description: Optional[str] = None
    target_value: float
    unit_of_measure: str
    frequency: str = "Monthly"
    department_id: Optional[int] = None

class KPIRecordCreate(BaseModel):
    quality_indicator_id: int
    recorded_date: date
    actual_value: float
    remarks: Optional[str] = None
    recorded_by: str

# Quality Indicators CRUD
@router.post("/quality-indicators")
async def create_quality_indicator(
    indicator: QualityIndicatorCreate,
    db: Session = Depends(get_tenant_db)
):
    db_indicator = QualityIndicator(**indicator.dict())
    db.add(db_indicator)
    db.commit()
    db.refresh(db_indicator)
    return {"message": "Quality indicator created successfully", "id": db_indicator.id}

@router.get("/quality-indicators")
async def get_quality_indicators(db: Session = Depends(get_tenant_db)):
    indicators = db.query(QualityIndicator).filter(QualityIndicator.is_active == True).all()
    
    result = []
    for indicator in indicators:
        dept_name = "All Departments"
        if indicator.department_id:
            dept = db.query(Department).filter(Department.id == indicator.department_id).first()
            if dept:
                dept_name = dept.name
        
        result.append({
            "id": indicator.id,
            "kpi_name": indicator.kpi_name,
            "kpi_category": indicator.kpi_category,
            "description": indicator.description,
            "target_value": indicator.target_value,
            "unit_of_measure": indicator.unit_of_measure,
            "frequency": indicator.frequency,
            "department_name": dept_name,
            "department_id": indicator.department_id,
            "is_active": indicator.is_active
        })
    
    return result

@router.put("/quality-indicators/{indicator_id}")
async def update_quality_indicator(
    indicator_id: int,
    indicator: QualityIndicatorCreate,
    db: Session = Depends(get_tenant_db)
):
    db_indicator = db.query(QualityIndicator).filter(QualityIndicator.id == indicator_id).first()
    if not db_indicator:
        raise HTTPException(status_code=404, detail="Quality indicator not found")
    
    for key, value in indicator.dict().items():
        setattr(db_indicator, key, value)
    
    db.commit()
    return {"message": "Quality indicator updated successfully"}

@router.delete("/quality-indicators/{indicator_id}")
async def delete_quality_indicator(
    indicator_id: int,
    db: Session = Depends(get_tenant_db)
):
    db_indicator = db.query(QualityIndicator).filter(QualityIndicator.id == indicator_id).first()
    if not db_indicator:
        raise HTTPException(status_code=404, detail="Quality indicator not found")
    
    db_indicator.is_active = False
    db.commit()
    return {"message": "Quality indicator deleted successfully"}

# KPI Records CRUD
@router.post("/kpi-records")
async def create_kpi_record(
    record: KPIRecordCreate,
    db: Session = Depends(get_tenant_db)
):
    # Get target value from quality indicator
    indicator = db.query(QualityIndicator).filter(QualityIndicator.id == record.quality_indicator_id).first()
    if not indicator:
        raise HTTPException(status_code=404, detail="Quality indicator not found")
    
    # Calculate variance and status
    target_value = indicator.target_value
    variance = record.actual_value - target_value
    variance_percentage = (variance / target_value) * 100 if target_value != 0 else 0
    
    if record.actual_value >= target_value:
        status = "On Track" if record.actual_value == target_value else "Above Target"
    else:
        status = "Below Target"
    
    db_record = KPIRecord(
        quality_indicator_id=record.quality_indicator_id,
        recorded_date=record.recorded_date,
        actual_value=record.actual_value,
        target_value=target_value,
        variance=variance,
        variance_percentage=variance_percentage,
        status=status,
        remarks=record.remarks,
        recorded_by=record.recorded_by
    )
    
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return {"message": "KPI record created successfully", "id": db_record.id}

@router.get("/kpi-records")
async def get_kpi_records(db: Session = Depends(get_tenant_db)):
    records = db.query(KPIRecord).all()
    
    result = []
    for record in records:
        # Get the quality indicator separately
        indicator = db.query(QualityIndicator).filter(QualityIndicator.id == record.quality_indicator_id).first()
        
        result.append({
            "id": record.id,
            "kpi_name": indicator.kpi_name if indicator else "Unknown",
            "kpi_category": indicator.kpi_category if indicator else "Unknown",
            "recorded_date": record.recorded_date.strftime("%Y-%m-%d"),
            "actual_value": record.actual_value,
            "target_value": record.target_value,
            "variance": record.variance,
            "variance_percentage": round(record.variance_percentage, 2) if record.variance_percentage else 0,
            "status": record.status,
            "unit_of_measure": indicator.unit_of_measure if indicator else "Unknown",
            "remarks": record.remarks,
            "recorded_by": record.recorded_by
        })
    
    return result

@router.put("/kpi-records/{record_id}")
async def update_kpi_record(
    record_id: int,
    record: KPIRecordCreate,
    db: Session = Depends(get_tenant_db)
):
    db_record = db.query(KPIRecord).filter(KPIRecord.id == record_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="KPI record not found")
    
    # Get target value from quality indicator
    indicator = db.query(QualityIndicator).filter(QualityIndicator.id == record.quality_indicator_id).first()
    target_value = indicator.target_value
    
    # Recalculate variance and status
    variance = record.actual_value - target_value
    variance_percentage = (variance / target_value) * 100 if target_value != 0 else 0
    
    if record.actual_value >= target_value:
        status = "On Track" if record.actual_value == target_value else "Above Target"
    else:
        status = "Below Target"
    
    db_record.quality_indicator_id = record.quality_indicator_id
    db_record.recorded_date = record.recorded_date
    db_record.actual_value = record.actual_value
    db_record.target_value = target_value
    db_record.variance = variance
    db_record.variance_percentage = variance_percentage
    db_record.status = status
    db_record.remarks = record.remarks
    db_record.recorded_by = record.recorded_by
    
    db.commit()
    return {"message": "KPI record updated successfully"}

@router.delete("/kpi-records/{record_id}")
async def delete_kpi_record(
    record_id: int,
    db: Session = Depends(get_tenant_db)
):
    db_record = db.query(KPIRecord).filter(KPIRecord.id == record_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="KPI record not found")
    
    db.delete(db_record)
    db.commit()
    return {"message": "KPI record deleted successfully"}