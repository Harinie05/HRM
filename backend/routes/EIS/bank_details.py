from fastapi import APIRouter, HTTPException, Depends, Form, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_tenant_engine, logger
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user
from typing import Optional
from utils.permission import require_permission, check_permission

router = APIRouter(prefix="/bank-details", tags=["Bank Details"])

# ------------------------------
# GET BANK DETAILS 🔒 Protected
# ------------------------------
@router.get("/{employee_id}")
def get_bank_details(
    employee_id: str,
    user = Depends(get_current_user)
):
    try:
        # Extract numeric ID from employee_id (handles both "16" and "user_16" formats)
        if isinstance(employee_id, str) and employee_id.startswith('user_'):
            emp_id = int(employee_id.replace('user_', ''))
        else:
            emp_id = int(employee_id)
        
        logger.info(f"Fetching bank details for employee {emp_id}")
        tenant = user.get('tenant_db')
        engine = get_tenant_engine(tenant)
        
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT * FROM employee_bank_details 
                WHERE employee_id = :employee_id
            """), {"employee_id": emp_id}).fetchone()
            
            if result:
                return dict(result._mapping)
            return {}
            
    except Exception as e:
        logger.error(f"Error fetching bank details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ------------------------------
# SAVE BANK DETAILS 🔒 Protected
# ------------------------------
from pydantic import BaseModel

class BankDetailsRequest(BaseModel):
    employee_id: str
    account_holder_name: str = ""
    bank_name: str = ""
    account_number: str = ""
    ifsc_code: str = ""
    branch_name: str = ""
    account_type: str = "Savings"

@router.post("/test")
def test_endpoint():
    return {"message": "Test works"}

@router.post("/add")
def add_bank_details(data: BankDetailsRequest, user = Depends(get_current_user)):
    logger.info(f"Bank details endpoint called with employee_id: {data.employee_id}")
    logger.info(f"User: {user}")
    
    # Extract numeric ID
    if data.employee_id.startswith('user_'):
        emp_id = int(data.employee_id.replace('user_', ''))
    else:
        emp_id = int(data.employee_id)
    
    tenant = user.get('tenant_db')
    engine = get_tenant_engine(tenant)
    
    with engine.connect() as conn:
        # Create table if not exists
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS employee_bank_details (
                id INT AUTO_INCREMENT PRIMARY KEY,
                employee_id INT NOT NULL,
                account_holder_name VARCHAR(255),
                bank_name VARCHAR(255),
                account_number VARCHAR(50),
                ifsc_code VARCHAR(20),
                branch_name VARCHAR(255),
                account_type VARCHAR(50) DEFAULT 'Savings',
                verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
                verified_by INT NULL,
                verified_at TIMESTAMP NULL,
                verification_remarks TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """))
        
        # Insert or update
        conn.execute(text("""
            INSERT INTO employee_bank_details 
            (employee_id, account_holder_name, bank_name, account_number, ifsc_code, branch_name, account_type)
            VALUES (:emp_id, :name, :bank, :account, :ifsc, :branch, :type)
            ON DUPLICATE KEY UPDATE
            account_holder_name = VALUES(account_holder_name),
            bank_name = VALUES(bank_name),
            account_number = VALUES(account_number),
            ifsc_code = VALUES(ifsc_code),
            branch_name = VALUES(branch_name),
            account_type = VALUES(account_type)
        """), {
            "emp_id": emp_id,
            "name": data.account_holder_name,
            "bank": data.bank_name,
            "account": data.account_number,
            "ifsc": data.ifsc_code,
            "branch": data.branch_name,
            "type": data.account_type
        })
        conn.commit()
        
    return {"message": "Bank details saved successfully"}

@router.post("/debug")
def debug_endpoint():
    logger.info("Debug endpoint called")
    return {"message": "Debug endpoint works"}

# ------------------------------
# SAVE BANK DETAILS 🔒 Protected
# ------------------------------
@router.post("/{employee_id}")
def save_bank_details(
    employee_id: str,
    request: Request,
    account_holder_name: str = Form(""),
    bank_name: str = Form(""),
    account_number: str = Form(""),
    ifsc_code: str = Form(""),
    branch_name: str = Form(""),
    account_type: str = Form("Savings"),
    swift_code: Optional[str] = Form(""),
    bank_address: Optional[str] = Form(""),
    bank_document: Optional[str] = Form(""),
    document_name: Optional[str] = Form(""),
    user = Depends(get_current_user)
):
    try:
        # Extract numeric ID from employee_id (handles both "16" and "user_16" formats)
        if isinstance(employee_id, str) and employee_id.startswith('user_'):
            emp_id = int(employee_id.replace('user_', ''))
        else:
            emp_id = int(employee_id)
        
        logger.info(f"Saving bank details for employee {emp_id}")
        tenant = user.get('tenant_db')
        engine = get_tenant_engine(tenant)
        
        with engine.connect() as conn:
            # Check if record exists
            existing = conn.execute(text("""
                SELECT id FROM employee_bank_details 
                WHERE employee_id = :employee_id
            """), {"employee_id": emp_id}).fetchone()
            
            if existing:
                # Update existing record
                conn.execute(text("""
                    UPDATE employee_bank_details SET
                        account_holder_name = :account_holder_name,
                        bank_name = :bank_name,
                        account_number = :account_number,
                        ifsc_code = :ifsc_code,
                        branch_name = :branch_name,
                        account_type = :account_type,
                        swift_code = :swift_code,
                        bank_address = :bank_address,
                        bank_document = :bank_document,
                        document_name = :document_name,
                        verification_status = 'pending',
                        verified_by = NULL,
                        verified_at = NULL,
                        verification_remarks = NULL,
                        updated_at = NOW()
                    WHERE employee_id = :employee_id
                """), {
                    "employee_id": emp_id,
                    "account_holder_name": account_holder_name,
                    "bank_name": bank_name,
                    "account_number": account_number,
                    "ifsc_code": ifsc_code,
                    "branch_name": branch_name,
                    "account_type": account_type,
                    "swift_code": swift_code,
                    "bank_address": bank_address,
                    "bank_document": bank_document,
                    "document_name": document_name
                })
            else:
                # Insert new record
                conn.execute(text("""
                    INSERT INTO employee_bank_details (
                        employee_id, account_holder_name, bank_name, account_number,
                        ifsc_code, branch_name, account_type, swift_code, bank_address,
                        bank_document, document_name
                    ) VALUES (
                        :employee_id, :account_holder_name, :bank_name, :account_number,
                        :ifsc_code, :branch_name, :account_type, :swift_code, :bank_address,
                        :bank_document, :document_name
                    )
                """), {
                    "employee_id": emp_id,
                    "account_holder_name": account_holder_name,
                    "bank_name": bank_name,
                    "account_number": account_number,
                    "ifsc_code": ifsc_code,
                    "branch_name": branch_name,
                    "account_type": account_type,
                    "swift_code": swift_code,
                    "bank_address": bank_address,
                    "bank_document": bank_document,
                    "document_name": document_name
                })
            
            conn.commit()
            audit_crud(request, user.get("tenant_db"), user, "UPDATE" if existing else "CREATE", "employee_bank_details", str(emp_id), {}, {
                "account_holder_name": account_holder_name,
                "bank_name": bank_name,
                "account_number": account_number
            })
            
        return {"message": "Bank details saved successfully"}
        
    except Exception as e:
        logger.error(f"Error saving bank details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ------------------------------
# VERIFY BANK DETAILS 🔒 Protected
# ------------------------------
@router.put("/verify/{employee_id}")
def verify_bank_details(
    employee_id: str,
    verification_status: str = Form(...),  # 'verified' or 'rejected'
    verification_remarks: str = Form(""),
    user = Depends(get_current_user)
):
    try:
        # Check permission
        if not check_permission(user, "verify_bank_details"):
            raise HTTPException(status_code=403, detail="You don't have permission to verify bank details")
        
        # Extract numeric ID
        if isinstance(employee_id, str) and employee_id.startswith('user_'):
            emp_id = int(employee_id.replace('user_', ''))
        else:
            emp_id = int(employee_id)
        
        logger.info(f"Verifying bank details for employee {emp_id}")
        tenant = user.get('tenant_db')
        engine = get_tenant_engine(tenant)
        
        with engine.connect() as conn:
            # Update verification status
            result = conn.execute(text("""
                UPDATE employee_bank_details SET
                    verification_status = :status,
                    verified_by = :verified_by,
                    verified_at = NOW(),
                    verification_remarks = :remarks
                WHERE employee_id = :employee_id
            """), {
                "employee_id": emp_id,
                "status": verification_status,
                "verified_by": user.get('id'),
                "remarks": verification_remarks
            })
            
            if result.rowcount == 0:
                raise HTTPException(status_code=404, detail="Bank details not found")
            
            conn.commit()
            
        return {"message": f"Bank details {verification_status} successfully"}
        
    except Exception as e:
        logger.error(f"Error verifying bank details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))