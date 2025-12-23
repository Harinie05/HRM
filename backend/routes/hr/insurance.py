from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
from datetime import datetime, date, timedelta

from database import get_tenant_db
from utils.audit_logger import audit_crud
from models.models_tenant import EmployeeInsurance

logger = logging.getLogger("HRM")

router = APIRouter(prefix="/hr/insurance", tags=["HR Insurance"])

@router.post("/")
async def create_insurance_policy(policy_data: dict, request: Request, db: Session = Depends(get_tenant_db)):
    """Create a new insurance policy"""
    try:
        # Find user by employee_code
        from models.models_tenant import User
        employee_code = policy_data.get('employeeId')
        user = db.query(User).filter(User.employee_code == employee_code).first()
        
        if not user:
            logger.warning(f"User not found for employee code: {employee_code}, using fallback ID")
            employee_id_value = 1  # Use fallback ID
        else:
            employee_id_value = user.id
        
        insurance = EmployeeInsurance(
            employee_id=employee_id_value,
            policy_type=policy_data.get('policyType'),
            policy_number=policy_data.get('policyNumber'),
            provider=policy_data.get('provider'),
            coverage_amount=float(policy_data.get('coverageAmount', 0)) if policy_data.get('coverageAmount') else 0,
            start_date=datetime.strptime(policy_data.get('startDate'), '%Y-%m-%d').date() if policy_data.get('startDate') else None,
            expiry_date=datetime.strptime(policy_data.get('expiryDate'), '%Y-%m-%d').date() if policy_data.get('expiryDate') else None,
            status='Active'
        )
        
        db.add(insurance)
        db.commit()
        db.refresh(insurance)
        audit_crud(request, "tenant_db", {"email": "system"}, "CREATE", "employee_insurance", insurance.id, None, insurance.__dict__)
        
        logger.info(f"✅ Insurance policy created with ID: {insurance.id}")
        return {"message": "Insurance policy created successfully", "data": {
            "id": insurance.id,
            "policy_type": insurance.policy_type,
            "status": insurance.status
        }}
    except Exception as e:
        logger.error(f"❌ Error creating insurance policy: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_insurance_stats(db: Session = Depends(get_tenant_db)):
    """Get insurance statistics"""
    try:
        today = date.today()
        thirty_days = today + timedelta(days=30)
        
        total = db.query(EmployeeInsurance).count()
        active = db.query(EmployeeInsurance).filter(EmployeeInsurance.status == 'Active').count()
        
        # Expiring soon (within 30 days)
        expiring_soon = db.query(EmployeeInsurance).filter(
            EmployeeInsurance.expiry_date.between(today, thirty_days),
            EmployeeInsurance.status == 'Active'
        ).count()
        
        # Expired (past expiry date)
        expired = db.query(EmployeeInsurance).filter(
            EmployeeInsurance.expiry_date < today,
            EmployeeInsurance.status == 'Active'
        ).count()
        
        return {
            "total": total,
            "active": active,
            "expiring_soon": expiring_soon,
            "expired": expired
        }
    except Exception as e:
        logger.error(f"❌ Error fetching insurance stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_insurance_policies(db: Session = Depends(get_tenant_db)):
    """Get all insurance policies"""
    try:
        from models.models_tenant import User
        
        policies = db.query(EmployeeInsurance).all()
        
        result = []
        for policy in policies:
            # Get employee details
            user = db.query(User).filter(User.id == policy.employee_id).first()
            
            result.append({
                "id": policy.id,
                "employee": user.employee_code if user else str(policy.employee_id),
                "name": user.name if user else f"Employee {policy.employee_id}",
                "policyType": policy.policy_type,
                "policyNumber": policy.policy_number,
                "provider": policy.provider,
                "coverageAmount": policy.coverage_amount,
                "startDate": str(policy.start_date) if policy.start_date else None,
                "expiryDate": str(policy.expiry_date) if policy.expiry_date else None,
                "status": policy.status
            })
        
        return {"data": result}
    except Exception as e:
        logger.error(f"❌ Error fetching insurance policies: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{policy_id}")
async def delete_insurance_policy(policy_id: int, request: Request, db: Session = Depends(get_tenant_db)):
    """Delete an insurance policy"""
    try:
        policy = db.query(EmployeeInsurance).filter(EmployeeInsurance.id == policy_id).first()
        
        if not policy:
            raise HTTPException(status_code=404, detail="Policy not found")
        
        old_values = policy.__dict__.copy()
        db.delete(policy)
        db.commit()
        audit_crud(request, "tenant_db", {"email": "system"}, "DELETE", "employee_insurance", policy_id, old_values, None)
        
        return {"message": "Insurance policy deleted successfully"}
    except Exception as e:
        logger.error(f"❌ Error deleting insurance policy: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
