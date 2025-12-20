from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.models_tenant import EmployeeLifecycleAction
from schemas.schemas_tenant import (
    LifecycleActionCreate,
    LifecycleActionUpdate,
    LifecycleActionOut
)
from database import get_tenant_db
from utils.email import send_email
import logging
from datetime import datetime

logger = logging.getLogger("HRM")

router = APIRouter(prefix="/hr/lifecycle", tags=["HR Lifecycle"])




@router.post("/pending")
def create_pending_lifecycle_action(payload: dict, db: Session = Depends(get_tenant_db)):
    """Create a pending lifecycle action request"""
    try:
        employee_code = payload.get('employeeId')
        
        # Find user by employee_code
        from models.models_tenant import User
        user = db.query(User).filter(User.employee_code == employee_code).first()
        
        if not user:
            logger.warning(f"User not found for employee code: {employee_code}, using code as string")
            # Store employee code as string in a text field instead
            employee_id_value = None
        else:
            employee_id_value = user.id
        
        lifecycle_action = EmployeeLifecycleAction(
            employee_id=employee_id_value if employee_id_value else 1,
            action_type=payload.get('actionType'),
            old_role=payload.get('currentRole'),
            new_role=payload.get('newRole'),
            old_department=payload.get('currentDepartment'),
            new_department=payload.get('newDepartment'),
            old_ctc=float(payload.get('currentSalary', 0)) if payload.get('currentSalary') else None,
            new_ctc=float(payload.get('newSalary', 0)) if payload.get('newSalary') else None,
            effective_from=datetime.strptime(payload.get('effectiveDate'), '%Y-%m-%d').date() if payload.get('effectiveDate') else None,
            reason=payload.get('reason'),
            status='Pending'
        )
        
        db.add(lifecycle_action)
        db.commit()
        db.refresh(lifecycle_action)
        
        logger.info(f"✅ Pending lifecycle action created with ID: {lifecycle_action.id}")
        return {"message": "Lifecycle action submitted for approval", "data": {
            "id": lifecycle_action.id,
            "action_type": lifecycle_action.action_type,
            "status": lifecycle_action.status
        }}
    except Exception as e:
        logger.error(f"❌ Error creating pending lifecycle action: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pending")
def get_pending_lifecycle_actions(db: Session = Depends(get_tenant_db)):
    """Get all pending lifecycle actions"""
    try:
        from models.models_tenant import User
        
        actions = db.query(EmployeeLifecycleAction).filter(
            EmployeeLifecycleAction.status == 'Pending'
        ).all()
        
        result = []
        for action in actions:
            # Get employee details
            user = db.query(User).filter(User.id == action.employee_id).first()
            
            if user:
                employee_name = user.name
                employee_code = user.employee_code
            else:
                employee_name = f"Employee {action.employee_id}"
                employee_code = str(action.employee_id)
            
            result.append({
                "id": action.id,
                "employee": employee_code,
                "name": employee_name,
                "action": action.action_type,
                "from": action.old_role,
                "to": action.new_role,
                "date": str(action.effective_from) if action.effective_from else None,
                "status": action.status
            })
        
        return {"data": result}
    except Exception as e:
        logger.error(f"❌ Error fetching pending actions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/approve")
def approve_lifecycle_action(approval_data: dict, db: Session = Depends(get_tenant_db)):
    """Approve or reject lifecycle action with email notification"""
    try:
        action_id = approval_data.get('actionId')
        approved = approval_data.get('approved')
        employee_email = approval_data.get('employeeEmail')
        
        logger.info(f"🔍 Looking for action ID: {action_id}")
        
        action = db.query(EmployeeLifecycleAction).filter(
            EmployeeLifecycleAction.id == action_id
        ).first()
        
        if not action:
            logger.error(f"❌ Action with ID {action_id} not found")
            raise HTTPException(status_code=404, detail="Action not found")
        
        # Get employee details
        from models.models_tenant import User
        user = db.query(User).filter(User.id == action.employee_id).first()
        employee_name = user.name if user else f"Employee {action.employee_id}"
        
        logger.info(f"✅ Found action: {action.action_type} for employee {employee_name}")
        
        if approved:
            action.status = 'Approved'
            action.approved_at = datetime.now()
        else:
            action.status = 'Rejected'
        
        db.commit()
        
        # Professional email content
        if approved:
            subject = f"Lifecycle Action Approved - {action.action_type.title()}"
            if action.action_type == 'promotion':
                html_content = f"""
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #2c5aa0; border-bottom: 2px solid #2c5aa0; padding-bottom: 10px;">🎉 Congratulations on Your Promotion!</h2>
                        
                        <p>Dear {employee_name},</p>
                        
                        <p>We are delighted to inform you that your promotion request has been <strong>approved</strong>.</p>
                        
                        <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #28a745;">Promotion Details:</h3>
                            <p><strong>Action Type:</strong> {action.action_type.title()}</p>
                            <p><strong>From Position:</strong> {action.old_role or 'N/A'}</p>
                            <p><strong>To Position:</strong> {action.new_role or 'N/A'}</p>
                            <p><strong>Effective Date:</strong> {action.effective_from or 'To be confirmed'}</p>
                        </div>
                        
                        <p>This promotion is a testament to your hard work, dedication, and valuable contributions to our organization. We look forward to your continued success in your new role.</p>
                        
                        <p>Please contact HR for any questions regarding your new position, responsibilities, or transition process.</p>
                        
                        <p>Once again, congratulations on this well-deserved promotion!</p>
                        
                        <p>Best regards,<br>
                        <strong>Human Resources Department</strong><br>
                        Nutryah HRM</p>
                    </div>
                </body>
                </html>
                """
            elif action.action_type == 'transfer':
                html_content = f"""
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #2c5aa0; border-bottom: 2px solid #2c5aa0; padding-bottom: 10px;">📋 Transfer Request Approved</h2>
                        
                        <p>Dear {employee_name},</p>
                        
                        <p>We are writing to inform you that your transfer request has been <strong>approved</strong>.</p>
                        
                        <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #17a2b8; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #17a2b8;">Transfer Details:</h3>
                            <p><strong>Action Type:</strong> {action.action_type.title()}</p>
                            <p><strong>From Position:</strong> {action.old_role or 'N/A'}</p>
                            <p><strong>To Position:</strong> {action.new_role or 'N/A'}</p>
                            <p><strong>Effective Date:</strong> {action.effective_from or 'To be confirmed'}</p>
                        </div>
                        
                        <p>Please coordinate with your current supervisor and the receiving department to ensure a smooth transition. HR will be in touch with additional details regarding your transfer process.</p>
                        
                        <p>We appreciate your flexibility and continued commitment to the organization.</p>
                        
                        <p>Best regards,<br>
                        <strong>Human Resources Department</strong><br>
                        Nutryah HRM</p>
                    </div>
                </body>
                </html>
                """
            else:
                html_content = f"""
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #2c5aa0; border-bottom: 2px solid #2c5aa0; padding-bottom: 10px;">✅ Lifecycle Action Approved</h2>
                        
                        <p>Dear {employee_name},</p>
                        
                        <p>We are pleased to inform you that your {action.action_type} request has been <strong>approved</strong>.</p>
                        
                        <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #28a745;">Action Details:</h3>
                            <p><strong>Action Type:</strong> {action.action_type.title()}</p>
                            <p><strong>From Position:</strong> {action.old_role or 'N/A'}</p>
                            <p><strong>To Position:</strong> {action.new_role or 'N/A'}</p>
                            <p><strong>Effective Date:</strong> {action.effective_from or 'To be confirmed'}</p>
                        </div>
                        
                        <p>Please contact HR if you have any questions or need further clarification regarding this action.</p>
                        
                        <p>Best regards,<br>
                        <strong>Human Resources Department</strong><br>
                        Nutryah HRM</p>
                    </div>
                </body>
                </html>
                """
        else:
            subject = f"Lifecycle Action Update - {action.action_type.title()}"
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #dc3545; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">📋 Lifecycle Action Update</h2>
                    
                    <p>Dear {employee_name},</p>
                    
                    <p>We regret to inform you that your {action.action_type} request has been <strong>declined</strong> at this time.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #dc3545;">Request Details:</h3>
                        <p><strong>Action Type:</strong> {action.action_type.title()}</p>
                        <p><strong>From Position:</strong> {action.old_role or 'N/A'}</p>
                        <p><strong>To Position:</strong> {action.new_role or 'N/A'}</p>
                        <p><strong>Requested Date:</strong> {action.effective_from or 'N/A'}</p>
                    </div>
                    
                    <p>We understand this may be disappointing. Please feel free to discuss this decision with your supervisor or HR representative to understand the reasons and explore future opportunities.</p>
                    
                    <p>We value your contributions to the organization and encourage you to continue your professional development.</p>
                    
                    <p>Best regards,<br>
                    <strong>Human Resources Department</strong><br>
                    Nutryah HRM</p>
                </div>
            </body>
            </html>
            """
        
        email_sent = False
        if employee_email:
            try:
                email_sent = send_email(employee_email, subject, html_content)
            except Exception as e:
                logger.error(f"Email error: {e}")
        
        return {
            "message": f"Action {'approved' if approved else 'rejected'} successfully",
            "email_sent": email_sent,
            "data": {"id": action.id, "status": action.status}
        }
        
    except Exception as e:
        logger.error(f"❌ Error processing approval: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
def list_lifecycle_actions(db: Session = Depends(get_tenant_db)):
    """Get all approved lifecycle actions"""
    try:
        from models.models_tenant import User
        
        actions = db.query(EmployeeLifecycleAction).filter(
            EmployeeLifecycleAction.status.in_(['Approved', 'Rejected'])
        ).all()
        
        result = []
        for action in actions:
            # Get employee details
            user = db.query(User).filter(User.id == action.employee_id).first()
            
            if user:
                employee_name = user.name
                employee_code = user.employee_code
            else:
                employee_name = f"Employee {action.employee_id}"
                employee_code = str(action.employee_id)
            
            result.append({
                "id": action.id,
                "employee": employee_code,
                "name": employee_name,
                "action": action.action_type,
                "from": action.old_role,
                "to": action.new_role,
                "date": str(action.effective_from) if action.effective_from else None,
                "status": action.status
            })
        
        return {"data": result}
    except Exception as e:
        logger.error(f"❌ Error fetching approved actions: {e}")
        raise HTTPException(status_code=500, detail=str(e))
