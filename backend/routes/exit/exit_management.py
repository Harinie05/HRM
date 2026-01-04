from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from routes.hospital import get_current_user
from utils.permission import require_permission
from models.models_tenant import User, EmployeeExit, ExitClearance
from schemas.schemas_tenant import ExitCreate, ExitOut, ExitClearanceOut
from typing import List
from datetime import datetime, date
from utils.audit_logger import audit_crud

router = APIRouter(prefix="/exit", tags=["Exit Management"])

# =====================================================
# 1. RESIGNATION & NOTICE TRACKING
# =====================================================

@router.get("/resignations", response_model=List[ExitOut])
def get_all_resignations(request: Request, user=Depends(require_permission("view_resignations")), db: Session = Depends(get_tenant_db)):
    """Get all resignation requests"""
    exits = db.query(EmployeeExit).join(User, EmployeeExit.employee_id == User.id).all()
    return exits

@router.post("/resignation/apply", response_model=ExitOut)
def apply_resignation(data: ExitCreate, request: Request, user=Depends(require_permission("apply_resignation")), db: Session = Depends(get_tenant_db)):
    """Employee applies for resignation"""
    # Check if employee already has an active resignation
    existing = db.query(EmployeeExit).filter(
        EmployeeExit.employee_id == data.employee_id,
        EmployeeExit.overall_status.in_(["Initiated", "Approved", "In Progress"])
    ).first()
    
    if existing:
        raise HTTPException(400, "Employee already has an active resignation request")
    
    exit_record = EmployeeExit(**data.dict())
    exit_record.overall_status = "Initiated"
    
    db.add(exit_record)
    db.commit()
    db.refresh(exit_record)
    
    audit_crud(request, db, user, "CREATE_RESIGNATION", "employee_exits", str(exit_record.id), {}, data.dict())
    
    return exit_record

@router.put("/resignation/{exit_id}/approve")
def approve_resignation(exit_id: int, request: Request, user=Depends(require_permission("approve_resignation")), db: Session = Depends(get_tenant_db)):
    """HR approves resignation request"""
    exit_record = db.query(EmployeeExit).filter(EmployeeExit.id == exit_id).first()
    if not exit_record:
        raise HTTPException(404, "Resignation request not found")
    
    old_status = exit_record.overall_status
    exit_record.overall_status = "Approved"
    exit_record.notice_served = True
    
    db.commit()
    
    audit_crud(request, db, user, "APPROVE_RESIGNATION", "employee_exits", str(exit_id), {"status": old_status}, {"status": "Approved"})
    
    return {"message": "Resignation approved successfully"}

@router.put("/resignation/{exit_id}/reject")
def reject_resignation(exit_id: int, reason: str, request: Request, user=Depends(require_permission("approve_resignation")), db: Session = Depends(get_tenant_db)):
    """HR rejects resignation request"""
    exit_record = db.query(EmployeeExit).filter(EmployeeExit.id == exit_id).first()
    if not exit_record:
        raise HTTPException(404, "Resignation request not found")
    
    old_status = exit_record.overall_status
    setattr(exit_record, 'overall_status', "Rejected")
    setattr(exit_record, 'notes', f"Rejected: {reason}")
    
    db.commit()
    
    audit_crud(request, db, user, "REJECT_RESIGNATION", "employee_exits", str(exit_id), {"status": old_status}, {"status": "Rejected", "reason": reason})
    
    return {"message": "Resignation rejected"}

# =====================================================
# 2. CLEARANCE & EXIT WORKFLOW
# =====================================================

@router.get("/clearance/{exit_id}", response_model=List[ExitClearanceOut])
def get_clearance_status(exit_id: int, user=Depends(require_permission("view_resignations")), db: Session = Depends(get_tenant_db)):
    """Get clearance status for an exit"""
    clearances = db.query(ExitClearance).filter(ExitClearance.exit_id == exit_id).all()
    return clearances

@router.post("/clearance/{exit_id}/create")
def create_clearance_items(exit_id: int, user=Depends(require_permission("manage_clearance")), db: Session = Depends(get_tenant_db)):
    """Create default clearance items for an exit"""
    
    # Check if exit exists
    exit_record = db.query(EmployeeExit).filter(EmployeeExit.id == exit_id).first()
    if not exit_record:
        raise HTTPException(404, "Exit record not found")
    
    # Default clearance departments
    departments = [
        {"department": "HR", "description": "Final paperwork, policy compliance, handover documentation"},
        {"department": "IT", "description": "Return laptop, access cards, disable accounts, data backup"},
        {"department": "Finance", "description": "Final settlement calculation, expense claims, tax clearance"},
        {"department": "Admin", "description": "Return ID cards, keys, facility access, locker clearance"}
    ]
    
    created_clearances = []
    for dept in departments:
        # Check if clearance already exists
        existing = db.query(ExitClearance).filter(
            ExitClearance.exit_id == exit_id,
            ExitClearance.department == dept["department"]
        ).first()
        
        if not existing:
            clearance = ExitClearance(
                exit_id=exit_id,
                department=dept["department"],
                description=dept["description"],
                status="Pending"
            )
            db.add(clearance)
            created_clearances.append(clearance)
    
    db.commit()
    return {"message": f"Created {len(created_clearances)} clearance items", "clearances": created_clearances}

@router.put("/clearance/{clearance_id}/approve")
def approve_clearance(clearance_id: int, request: Request, user=Depends(get_current_user), db: Session = Depends(get_tenant_db)):
    """Approve a clearance item"""
    
    clearance = db.query(ExitClearance).filter(ExitClearance.id == clearance_id).first()
    if not clearance:
        raise HTTPException(404, "Clearance not found")
    
    # Check department-specific permissions
    department = clearance.department.lower()
    required_permission = f"{department}_clearance"
    
    # Verify user has permission for this department's clearance
    user_permissions = user.get('permissions', [])
    if user.get('role') != 'admin' and required_permission not in user_permissions:
        raise HTTPException(403, f"You don't have permission to approve {department.upper()} clearance")
    
    clearance.status = "Completed"
    clearance.completed_by = user.get("user_id")
    clearance.completed_at = datetime.now()
    
    # Check if all clearances are completed
    all_clearances = db.query(ExitClearance).filter(ExitClearance.exit_id == clearance.exit_id).all()
    all_completed = all(c.status == "Completed" for c in all_clearances)
    
    if all_completed:
        exit_record = db.query(EmployeeExit).filter(EmployeeExit.id == clearance.exit_id).first()
        if exit_record:
            exit_record.overall_status = "Completed"
            exit_record.clearance_status = "Completed"
    
    db.commit()
    audit_crud(request, db, user, "APPROVE_CLEARANCE", "exit_clearances", str(clearance_id), {"status": "Pending"}, {"status": "Completed"})
    
    return {"message": "Clearance approved successfully"}

# =====================================================
# 3. F&F SETTLEMENT & RELIEVING DOCUMENTS (DISABLED - Models not available)
# =====================================================

# Additional Exit Management Endpoints
@router.get("/clearance/my-pending")
def get_my_pending_clearances(request: Request, user=Depends(get_current_user), db: Session = Depends(get_tenant_db)):
    """Get clearances pending for current user's department"""
    user_id = user.get("user_id")
    
    # Get user's department-specific clearance permissions
    clearance_permissions = []
    user_permissions = user.get('permissions', [])
    
    if user.get('role') == 'admin' or "hr_clearance" in user_permissions:
        clearance_permissions.append("HR")
    if user.get('role') == 'admin' or "it_clearance" in user_permissions:
        clearance_permissions.append("IT")
    if user.get('role') == 'admin' or "finance_clearance" in user_permissions:
        clearance_permissions.append("Finance")
    if user.get('role') == 'admin' or "admin_clearance" in user_permissions:
        clearance_permissions.append("Admin")
    
    if not clearance_permissions:
        return []
    
    # Get pending clearances for user's departments
    pending_clearances = db.query(ExitClearance).filter(
        ExitClearance.department.in_(clearance_permissions),
        ExitClearance.status == "Pending"
    ).all()
    
    return pending_clearances

@router.put("/clearance/{clearance_id}/reject")
def reject_clearance(clearance_id: int, reason: str, request: Request, user=Depends(get_current_user), db: Session = Depends(get_tenant_db)):
    """Reject a clearance item"""
    
    clearance = db.query(ExitClearance).filter(ExitClearance.id == clearance_id).first()
    if not clearance:
        raise HTTPException(404, "Clearance not found")
    
    # Check department-specific permissions
    department = clearance.department.lower()
    required_permission = f"{department}_clearance"
    
    # Verify user has permission for this department's clearance
    user_permissions = user.get('permissions', [])
    if user.get('role') != 'admin' and required_permission not in user_permissions:
        raise HTTPException(403, f"You don't have permission to reject {department.upper()} clearance")
    
    clearance.status = "Rejected"
    clearance.completed_by = user.get("user_id")
    clearance.completed_at = datetime.now()
    clearance.notes = f"Rejected: {reason}"
    
    db.commit()
    audit_crud(request, db, user, "REJECT_CLEARANCE", "exit_clearances", str(clearance_id), {"status": "Pending"}, {"status": "Rejected", "reason": reason})
    
    return {"message": "Clearance rejected successfully"}

@router.get("/exit-interviews")
def get_exit_interviews(request: Request, user=Depends(require_permission("view_exit_interviews")), db: Session = Depends(get_tenant_db)):
    """Get all exit interviews"""
    # This would need an ExitInterview model - placeholder for now
    return {"message": "Exit interviews endpoint - model not implemented yet"}

@router.post("/exit-interview/{exit_id}")
def conduct_exit_interview(exit_id: int, interview_data: dict, request: Request, user=Depends(require_permission("conduct_exit_interview")), db: Session = Depends(get_tenant_db)):
    """Conduct exit interview"""
    # This would need an ExitInterview model - placeholder for now
    return {"message": "Exit interview conducted - model not implemented yet"}

# =====================================================
# 4. KNOWLEDGE TRANSFER MANAGEMENT
# =====================================================

from models.models_tenant import ExitKnowledgeTransfer, ExitKTItem

@router.get("/knowledge-transfer/exit/{exit_id}")
def get_kt_by_exit(exit_id: int, request: Request, user=Depends(require_permission("view_kt_plans")), db: Session = Depends(get_tenant_db)):
    """Get knowledge transfer plan for specific exit"""
    # Check if exit exists
    exit_record = db.query(EmployeeExit).filter(EmployeeExit.id == exit_id).first()
    if not exit_record:
        raise HTTPException(404, "Exit record not found")
    
    # Get KT plan from database
    kt_plan = db.query(ExitKnowledgeTransfer).filter(ExitKnowledgeTransfer.exit_id == exit_id).first()
    
    if not kt_plan:
        return None
    
    # Get KT items
    kt_items = db.query(ExitKTItem).filter(ExitKTItem.kt_id == kt_plan.id).all()
    
    return {
        "id": kt_plan.id,
        "exit_id": kt_plan.exit_id,
        "start_date": kt_plan.start_date.isoformat() if kt_plan.start_date else None,
        "end_date": kt_plan.end_date.isoformat() if kt_plan.end_date else None,
        "remarks": kt_plan.remarks,
        "overall_status": kt_plan.overall_status,
        "manager_approved": kt_plan.manager_approved,
        "hr_approved": kt_plan.hr_approved,
        "kt_items": [
            {
                "id": item.id,
                "knowledge_area": item.knowledge_area,
                "description": item.description,
                "to_employee_id": item.to_employee_id,
                "status": item.status,
                "acknowledged_at": item.acknowledged_at.isoformat() if item.acknowledged_at else None
            } for item in kt_items
        ]
    }

@router.post("/knowledge-transfer/")
def create_kt_for_exit(exit_id: int, kt_data: dict, request: Request, user=Depends(require_permission("create_kt_plan")), db: Session = Depends(get_tenant_db)):
    """Create knowledge transfer plan for exit"""
    from datetime import datetime
    
    # Check if exit exists
    exit_record = db.query(EmployeeExit).filter(EmployeeExit.id == exit_id).first()
    if not exit_record:
        raise HTTPException(404, "Exit record not found")
    
    # Create KT plan
    kt_plan = ExitKnowledgeTransfer(
        exit_id=exit_id,
        employee_id=exit_record.employee_id,
        start_date=datetime.strptime(kt_data.get("start_date"), "%Y-%m-%d").date(),
        end_date=datetime.strptime(kt_data.get("end_date"), "%Y-%m-%d").date(),
        remarks=kt_data.get("remarks", ""),
        overall_status="Pending",
        manager_approved=False,
        hr_approved=False
    )
    
    db.add(kt_plan)
    db.flush()  # Get the ID
    
    # Create KT items
    kt_items_data = []
    for item_data in kt_data.get("kt_items", []):
        kt_item = ExitKTItem(
            kt_id=kt_plan.id,
            knowledge_area=item_data.get("knowledge_area"),
            description=item_data.get("description"),
            from_employee_id=exit_record.employee_id,
            to_employee_id=item_data.get("to_employee_id"),
            status="Pending"
        )
        db.add(kt_item)
        kt_items_data.append({
            "id": kt_item.id,
            "knowledge_area": kt_item.knowledge_area,
            "description": kt_item.description,
            "to_employee_id": kt_item.to_employee_id,
            "status": kt_item.status,
            "acknowledged_at": None
        })
    
    db.commit()
    
    return {
        "id": kt_plan.id,
        "exit_id": kt_plan.exit_id,
        "start_date": kt_plan.start_date.isoformat(),
        "end_date": kt_plan.end_date.isoformat(),
        "remarks": kt_plan.remarks,
        "overall_status": kt_plan.overall_status,
        "manager_approved": kt_plan.manager_approved,
        "hr_approved": kt_plan.hr_approved,
        "kt_items": kt_items_data
    }

@router.get("/knowledge-transfer/knowledge-areas")
def get_knowledge_areas(request: Request, user=Depends(require_permission("view_kt_plans")), db: Session = Depends(get_tenant_db)):
    """Get available knowledge areas"""
    default_areas = [
        "Technical Documentation",
        "Process Knowledge",
        "Client Relationships",
        "System Access",
        "Project Handover",
        "Team Responsibilities"
    ]
    return {"knowledge_areas": default_areas}

@router.put("/knowledge-transfer/item/{item_id}/acknowledge")
def acknowledge_kt_item(item_id: int, request: Request, user=Depends(require_permission("complete_kt_items")), db: Session = Depends(get_tenant_db)):
    """Acknowledge knowledge transfer item completion"""
    kt_item = db.query(ExitKTItem).filter(ExitKTItem.id == item_id).first()
    if not kt_item:
        raise HTTPException(404, "KT item not found")
    
    kt_item.status = "Completed"
    kt_item.acknowledged_at = datetime.now()
    kt_item.acknowledged_by = user.get("user_id")
    
    db.commit()
    return {"message": "KT item acknowledged successfully"}

@router.put("/knowledge-transfer/{kt_id}/approve")
def approve_kt_plan(kt_id: int, approval_type: str, request: Request, user=Depends(get_current_user), db: Session = Depends(get_tenant_db)):
    """Approve knowledge transfer plan (manager or hr)"""
    user_permissions = user.get('permissions', [])
    
    if approval_type == "manager" and user.get('role') != 'admin' and "manager_approve_kt" not in user_permissions:
        raise HTTPException(403, "You don't have permission to approve as manager")
    
    if approval_type == "hr" and user.get('role') != 'admin' and "hr_approve_kt" not in user_permissions:
        raise HTTPException(403, "You don't have permission to approve as HR")
    
    kt_plan = db.query(ExitKnowledgeTransfer).filter(ExitKnowledgeTransfer.id == kt_id).first()
    if not kt_plan:
        raise HTTPException(404, "KT plan not found")
    
    if approval_type == "manager":
        kt_plan.manager_approved = True
    elif approval_type == "hr":
        kt_plan.hr_approved = True
    
    # Update overall status if both approvals are done
    if kt_plan.manager_approved and kt_plan.hr_approved:
        kt_plan.overall_status = "Completed"
    
    db.commit()
    return {"message": f"Knowledge transfer plan approved by {approval_type}"}

@router.get("/dashboard")
def exit_dashboard(request: Request, user=Depends(require_permission("view_resignations")), db: Session = Depends(get_tenant_db)):
    """Get exit management dashboard data"""
    total_exits = db.query(EmployeeExit).count()
    pending_approvals = db.query(EmployeeExit).filter(EmployeeExit.overall_status == "Initiated").count()
    in_progress = db.query(EmployeeExit).filter(EmployeeExit.overall_status == "In Progress").count()
    completed = db.query(EmployeeExit).filter(EmployeeExit.overall_status == "Completed").count()
    
    return {
        "total_exits": total_exits,
        "pending_approvals": pending_approvals,
        "in_progress": in_progress,
        "completed": completed
    }