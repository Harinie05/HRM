from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
from datetime import datetime

from database import get_tenant_db
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user, require_permission
from models.models_tenant import AssetAssignment
from utils.email import send_email

logger = logging.getLogger("HRM")

router = APIRouter(prefix="/hr/assets", tags=["HR Assets"])

@router.post("/pending")
async def create_pending_asset(asset_data: dict, request: Request, db: Session = Depends(get_tenant_db), _: dict = Depends(require_permission("add_asset"))):
    """Create a pending asset assignment request"""
    try:
        # Find user by employee_code
        from models.models_tenant import User
        employee_code = asset_data.get('employeeId')
        user = db.query(User).filter(User.employee_code == employee_code).first()
        
        if not user:
            logger.warning(f"User not found for employee code: {employee_code}, using fallback")
            employee_id = 1  # Fallback to first user
        else:
            employee_id = user.id
        
        # Safely convert cost to float
        cost_value = asset_data.get('cost')
        cost = None
        if cost_value is not None and cost_value != '' and str(cost_value).strip() != '':
            try:
                cost = float(cost_value)
            except (ValueError, TypeError):
                cost = None
        
        # Safely parse assigned date
        assigned_date_value = asset_data.get('assignedDate')
        issue_date = datetime.now().date()
        if assigned_date_value is not None and assigned_date_value != '' and str(assigned_date_value).strip() != '':
            try:
                issue_date = datetime.strptime(assigned_date_value, '%Y-%m-%d').date()
            except (ValueError, TypeError):
                issue_date = datetime.now().date()
        
        asset_assignment = AssetAssignment(
            employee_id=employee_id,
            asset_type=asset_data.get('assetType'),
            asset_name=asset_data.get('assetName'),
            asset_id=asset_data.get('assetId'),
            brand=asset_data.get('brand'),
            model=asset_data.get('model'),
            serial_number=asset_data.get('serialNumber'),
            condition=asset_data.get('condition'),
            location=asset_data.get('location'),
            cost=cost,
            issue_date=issue_date,
            terms=asset_data.get('remarks'),
            status='Pending'
        )
        
        db.add(asset_assignment)
        db.commit()
        db.refresh(asset_assignment)
        audit_crud(request, db, {"email": "system"}, "CREATE", "asset_assignments", str(asset_assignment.id), {}, asset_assignment.__dict__)
        
        logger.info(f"✅ Pending asset created with ID: {asset_assignment.id}")
        return {"message": "Pending asset created successfully", "data": {
            "id": asset_assignment.id,
            "asset_name": asset_assignment.asset_name,
            "status": asset_assignment.status
        }}
    except Exception as e:
        logger.error(f"❌ Error creating pending asset: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pending")
async def get_pending_assets(db: Session = Depends(get_tenant_db)):
    """Get all pending asset assignments"""
    try:
        from models.models_tenant import User
        
        assets = db.query(AssetAssignment).filter(
            AssetAssignment.status == 'Pending'
        ).all()
        
        result = []
        for asset in assets:
            # Get employee details
            user = db.query(User).filter(User.id == asset.employee_id).first()
            
            if user:
                employee_name = user.name
                employee_code = user.employee_code
            else:
                # Try to find by employee_code if stored as string
                user_by_code = db.query(User).filter(User.employee_code == str(asset.employee_id)).first()
                if user_by_code:
                    employee_name = user_by_code.name
                    employee_code = user_by_code.employee_code
                else:
                    employee_name = f"Employee {asset.employee_id}"
                    employee_code = str(asset.employee_id)
            
            logger.info(f"Asset {asset.id}: employee_id={asset.employee_id}, name={employee_name}, code={employee_code}")
            
            result.append({
                "id": asset.id,
                "employeeId": str(asset.employee_id),
                "employee": employee_code,
                "name": employee_name,
                "assetName": asset.asset_name,
                "assetType": asset.asset_type,
                "assetId": asset.asset_id,
                "brand": asset.brand or "",
                "model": asset.model or "",
                "serialNumber": asset.serial_number,
                "condition": asset.condition,
                "location": asset.location,
                "cost": asset.cost,
                "assignedDate": str(asset.issue_date) if asset.issue_date is not None else None,
                "requestDate": str(asset.created_at.date()) if asset.created_at is not None else None,
                "status": asset.status
            })
        
        return result
    except Exception as e:
        logger.error(f"❌ Error fetching pending assets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/approve")
async def approve_asset(approval_data: dict, request: Request, db: Session = Depends(get_tenant_db), _: dict = Depends(require_permission("approve_asset"))):
    """Approve or reject asset assignment"""
    try:
        from models.models_tenant import User
        
        asset_id = approval_data.get('assetId')
        approved = approval_data.get('approved')
        
        if not asset_id or approved is None:
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        logger.info(f"🔍 Looking for asset ID: {asset_id}")
        
        # Find the asset in database
        asset = db.query(AssetAssignment).filter(
            AssetAssignment.id == asset_id,
            AssetAssignment.status == 'Pending'
        ).first()
        
        if not asset:
            logger.error(f"❌ Asset with ID {asset_id} not found")
            raise HTTPException(status_code=404, detail="Asset not found")
        
        # Get employee details for logging
        user = db.query(User).filter(User.id == asset.employee_id).first()
        employee_name = user.name if user else f"Employee {asset.employee_id}"
        
        logger.info(f"✅ Found asset: {asset.asset_name} for employee {employee_name}")
        
        # Update status
        if approved:
            setattr(asset, "status", "Approved")
            logger.info(f"✅ Asset approved: {asset.asset_name} for {employee_name}")
        else:
            setattr(asset, "status", "Rejected")
            logger.info(f"❌ Asset rejected: {asset.asset_name} for {employee_name}")
        
        db.commit()
        audit_crud(request, db, {"email": "system"}, "UPDATE", "asset_assignments", str(asset_id), {}, {"status": asset.status})
        
        status = "approved" if approved else "rejected"
        return {"message": f"Asset {status} successfully"}
        
    except Exception as e:
        logger.error(f"❌ Error processing asset approval: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_approved_assets(db: Session = Depends(get_tenant_db), _: dict = Depends(require_permission("view_assets"))):
    """Get all approved assets"""
    try:
        from models.models_tenant import User
        
        assets = db.query(AssetAssignment).filter(
            AssetAssignment.status.in_(['Approved', 'Active', 'Assigned', 'Rejected'])
        ).all()
        
        result = []
        for asset in assets:
            # Get employee details
            user = db.query(User).filter(User.id == asset.employee_id).first()
            
            result.append({
                "id": asset.id,
                "employee": user.employee_code if user else str(asset.employee_id),
                "name": user.name if user else f"Employee {asset.employee_id}",
                "asset": asset.asset_name,
                "assetName": asset.asset_name,
                "assetType": asset.asset_type,
                "assetId": asset.asset_id,
                "brand": asset.brand or "",
                "model": asset.model or "",
                "serial": asset.serial_number,
                "serialNumber": asset.serial_number,
                "condition": asset.condition,
                "location": asset.location,
                "cost": asset.cost,
                "assignedDate": str(asset.issue_date) if asset.issue_date is not None else None,
                "status": asset.status
            })
        
        return {"data": result}
    except Exception as e:
        logger.error(f"❌ Error fetching approved assets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_asset(asset_data: dict, request: Request, db: Session = Depends(get_tenant_db)):
    """Create asset directly (legacy endpoint)"""
    try:
        # Safely convert cost to float
        cost_value = asset_data.get('cost')
        cost = None
        if cost_value is not None and cost_value != '' and str(cost_value).strip() != '':
            try:
                cost = float(cost_value)
            except (ValueError, TypeError):
                cost = None
        
        # Safely parse assigned date
        assigned_date_value = asset_data.get('assignedDate')
        issue_date = datetime.now().date()
        if assigned_date_value is not None and assigned_date_value != '' and str(assigned_date_value).strip() != '':
            try:
                issue_date = datetime.strptime(assigned_date_value, '%Y-%m-%d').date()
            except (ValueError, TypeError):
                issue_date = datetime.now().date()
        
        # Safely convert employee_id to int
        employee_id_value = asset_data.get('employeeId')
        employee_id = None
        if employee_id_value is not None and employee_id_value != '' and str(employee_id_value).strip() != '':
            try:
                employee_id = int(employee_id_value)
            except (ValueError, TypeError):
                employee_id = None
        
        asset_assignment = AssetAssignment(
            employee_id=employee_id,
            asset_type=asset_data.get('assetType'),
            asset_name=asset_data.get('assetName'),
            asset_id=asset_data.get('assetId'),
            brand=asset_data.get('brand'),
            model=asset_data.get('model'),
            serial_number=asset_data.get('serialNumber'),
            condition=asset_data.get('condition'),
            location=asset_data.get('location'),
            cost=cost,
            issue_date=issue_date,
            terms=asset_data.get('remarks'),
            status='Assigned'
        )
        
        db.add(asset_assignment)
        db.commit()
        db.refresh(asset_assignment)
        audit_crud(request, db, {"email": "system"}, "CREATE", "asset_assignments", str(asset_assignment.id), {}, asset_assignment.__dict__)
        
        logger.info(f"✅ Asset created directly: {asset_assignment.asset_name}")
        return {"message": "Asset created successfully", "data": {
            "id": asset_assignment.id,
            "asset_name": asset_assignment.asset_name,
            "status": asset_assignment.status
        }}
    except Exception as e:
        logger.error(f"❌ Error creating asset: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))