from fastapi import APIRouter, HTTPException, Depends, Form, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_tenant_engine, logger
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user
from typing import Optional

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
@router.post("/{employee_id}")
def save_bank_details(
    employee_id: str,
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
    request: Request = None,
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
            if request:
                audit_crud(request, user.get("tenant_db"), user, "UPDATE" if existing else "CREATE", "employee_bank_details", emp_id, None, {
                    "account_holder_name": account_holder_name,
                    "bank_name": bank_name,
                    "account_number": account_number
                })
            
        return {"message": "Bank details saved successfully"}
        
    except Exception as e:
        logger.error(f"Error saving bank details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))