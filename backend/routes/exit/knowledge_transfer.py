from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from database import get_tenant_db
from datetime import datetime

from models.models_tenant import ExitKnowledgeTransfer, ExitKTItem, EmployeeExit, User
from schemas.schemas_tenant import KnowledgeTransferCreate, KnowledgeTransferOut, KTItemOut

router = APIRouter(
    prefix="/exit/knowledge-transfer",
    tags=["Exit - Knowledge Transfer"]
)

# Predefined knowledge areas
KNOWLEDGE_AREAS = [
    "Project Knowledge",
    "Codebase / System Access", 
    "Client Handling",
    "Documentation",
    "Process / SOP",
    "Credentials / Tools",
    "Team Management",
    "Vendor Relations"
]

@router.get("/knowledge-areas")
def get_knowledge_areas():
    """Get predefined knowledge areas for KT"""
    return {"knowledge_areas": KNOWLEDGE_AREAS}

@router.post("/", response_model=KnowledgeTransferOut)
def create_knowledge_transfer(
    data: KnowledgeTransferCreate,
    exit_id: int = Query(...),
    db: Session = Depends(get_tenant_db)
):
    """Create Knowledge Transfer for an exit"""
    # Verify exit exists
    exit_record = db.query(EmployeeExit).filter(EmployeeExit.id == exit_id).first()
    if not exit_record:
        raise HTTPException(status_code=404, detail="Exit record not found")
    
    # Create KT record
    kt = ExitKnowledgeTransfer(
        exit_id=exit_id,
        employee_id=exit_record.employee_id,
        start_date=data.start_date,
        end_date=data.end_date,
        remarks=data.remarks
    )
    db.add(kt)
    db.flush()
    
    # Create KT items
    for item_data in data.kt_items:
        kt_item = ExitKTItem(
            kt_id=kt.id,
            knowledge_area=item_data.knowledge_area,
            description=item_data.description,
            from_employee_id=exit_record.employee_id,
            to_employee_id=item_data.to_employee_id,
            status=item_data.status
        )
        db.add(kt_item)
    
    db.commit()
    db.refresh(kt)
    
    return kt

@router.get("/{kt_id}", response_model=KnowledgeTransferOut)
def get_knowledge_transfer(kt_id: int, db: Session = Depends(get_tenant_db)):
    """Get Knowledge Transfer details"""
    kt = db.query(ExitKnowledgeTransfer).filter(ExitKnowledgeTransfer.id == kt_id).first()
    if not kt:
        raise HTTPException(status_code=404, detail="Knowledge Transfer not found")
    
    # Manually load KT items
    kt_items = db.query(ExitKTItem).filter(ExitKTItem.kt_id == kt.id).all()
    kt.kt_items = kt_items
    
    return kt

@router.get("/exit/{exit_id}", response_model=KnowledgeTransferOut)
def get_kt_by_exit(exit_id: int, db: Session = Depends(get_tenant_db)):
    """Get Knowledge Transfer by exit ID"""
    kt = db.query(ExitKnowledgeTransfer).filter(ExitKnowledgeTransfer.exit_id == exit_id).first()
    if not kt:
        raise HTTPException(status_code=404, detail="Knowledge Transfer not found for this exit")
    
    # Manually load KT items
    kt_items = db.query(ExitKTItem).filter(ExitKTItem.kt_id == kt.id).all()
    kt.kt_items = kt_items
    
    return kt

@router.put("/item/{item_id}/acknowledge")
def acknowledge_kt_item(
    item_id: int,
    db: Session = Depends(get_tenant_db),
    Authorization: str = Header(None)
):
    """Acknowledge a KT item"""
    from utils.token import verify_token
    
    kt_item = db.query(ExitKTItem).filter(ExitKTItem.id == item_id).first()
    if not kt_item:
        raise HTTPException(status_code=404, detail="KT Item not found")
    
    # Get current user ID from JWT token
    employee_id = None
    if Authorization:
        try:
            token = Authorization.split(" ")[1] if " " in Authorization else Authorization
            payload = verify_token(token)
            if payload and "user_id" in payload:
                employee_id = payload["user_id"]
        except:
            pass
    
    # Fallback to first user if token parsing fails
    if not employee_id:
        first_user = db.query(User).first()
        employee_id = first_user.id if first_user else 1
    
    kt_item.status = "Completed"
    kt_item.acknowledged_at = datetime.now()
    kt_item.acknowledged_by = employee_id
    
    # Check if all items are completed
    kt = db.query(ExitKnowledgeTransfer).filter(ExitKnowledgeTransfer.id == kt_item.kt_id).first()
    all_items = db.query(ExitKTItem).filter(ExitKTItem.kt_id == kt.id).all()
    
    if all(item.status == "Completed" for item in all_items):
        kt.overall_status = "Completed"
        
        # Update exit KT status if both approvals are also done
        if kt.manager_approved and kt.hr_approved:
            exit_record = db.query(EmployeeExit).filter(EmployeeExit.id == kt.exit_id).first()
            if exit_record:
                exit_record.kt_status = "Completed"
    
    db.commit()
    return {"message": "KT Item acknowledged successfully"}

@router.put("/{kt_id}/approve")
def approve_knowledge_transfer(
    kt_id: int,
    approval_type: str = Query(...),  # "manager" or "hr"
    db: Session = Depends(get_tenant_db)
):
    """Approve Knowledge Transfer (Manager/HR)"""
    kt = db.query(ExitKnowledgeTransfer).filter(ExitKnowledgeTransfer.id == kt_id).first()
    if not kt:
        raise HTTPException(status_code=404, detail="Knowledge Transfer not found")
    
    print(f"DEBUG: Before approval - Manager: {kt.manager_approved}, HR: {kt.hr_approved}")
    
    if approval_type == "manager":
        kt.manager_approved = True
    elif approval_type == "hr":
        kt.hr_approved = True
    else:
        raise HTTPException(status_code=400, detail="Invalid approval type")
    
    print(f"DEBUG: After {approval_type} approval - Manager: {kt.manager_approved}, HR: {kt.hr_approved}")
    
    # Check if both approvals are complete AND all KT items are completed
    if kt.manager_approved and kt.hr_approved:
        print(f"DEBUG: Both approvals complete, checking KT items status")
        
        # Check if all KT items are completed
        all_items = db.query(ExitKTItem).filter(ExitKTItem.kt_id == kt.id).all()
        all_items_completed = all(item.status == "Completed" for item in all_items)
        
        print(f"DEBUG: All KT items completed: {all_items_completed}")
        
        if all_items_completed:
            print(f"DEBUG: Updating exit kt_status for exit_id: {kt.exit_id}")
            # Update exit KT status to Completed
            exit_record = db.query(EmployeeExit).filter(EmployeeExit.id == kt.exit_id).first()
            if exit_record:
                print(f"DEBUG: Found exit record, updating kt_status from {exit_record.kt_status} to Completed")
                exit_record.kt_status = "Completed"
            else:
                print(f"DEBUG: Exit record not found for exit_id: {kt.exit_id}")
        else:
            print(f"DEBUG: Not all KT items are completed yet, keeping exit status as Pending")
    
    db.commit()
    print(f"DEBUG: Database committed")
    return {"message": f"{approval_type.title()} approval completed"}

@router.get("/")
def list_knowledge_transfers(db: Session = Depends(get_tenant_db)):
    """List all Knowledge Transfers"""
    kts = db.query(ExitKnowledgeTransfer).all()
    return kts