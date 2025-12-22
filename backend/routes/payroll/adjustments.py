from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from sqlalchemy import text

router = APIRouter(
    prefix="/payroll",
    tags=["Payroll - Adjustments"]
)

@router.post("/adjustments")
async def add_adjustment(
    request: Request,
    db: Session = Depends(get_tenant_db)
):
    try:
        data = await request.json()
        print(f"Raw adjustment data: {data}")
        
        # Create table if not exists
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS payroll_adjustments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                employee_id INT NOT NULL,
                month VARCHAR(50) NOT NULL,
                adjustment_type VARCHAR(50) NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                description TEXT,
                status VARCHAR(50) DEFAULT 'Active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # Add status column if it doesn't exist
        try:
            db.execute(text("ALTER TABLE payroll_adjustments ADD COLUMN status VARCHAR(50) DEFAULT 'Active'"))
        except:
            pass  # Column already exists
            
        db.commit()
        
        # Insert adjustment
        db.execute(text("""
            INSERT INTO payroll_adjustments (employee_id, month, adjustment_type, amount, description, status)
            VALUES (:employee_id, :month, :adjustment_type, :amount, :description, :status)
        """), {
            "employee_id": int(data.get('employee_id')),
            "month": str(data.get('month')),
            "adjustment_type": str(data.get('adjustment_type')),
            "amount": float(data.get('amount')),
            "description": str(data.get('description', '')),
            "status": "Active"
        })
        
        db.commit()
        print("Adjustment created successfully")
        return {"message": "Adjustment created successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error creating adjustment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating adjustment: {str(e)}")

@router.get("/adjustments")
def list_adjustments(
    db: Session = Depends(get_tenant_db)
):
    try:
        # Create table if not exists
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS payroll_adjustments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                employee_id INT NOT NULL,
                month VARCHAR(50) NOT NULL,
                adjustment_type VARCHAR(50) NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                description TEXT,
                status VARCHAR(50) DEFAULT 'Active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # Add status column if it doesn't exist
        try:
            db.execute(text("ALTER TABLE payroll_adjustments ADD COLUMN status VARCHAR(50) DEFAULT 'Active'"))
            db.commit()
        except:
            pass  # Column already exists
        
        query = text("SELECT id, employee_id, month, adjustment_type, amount, description, COALESCE(status, 'Active') as status, created_at FROM payroll_adjustments ORDER BY created_at DESC")
        result = db.execute(query)
        adjustments = []
        for row in result:
            adjustments.append({
                "id": row.id,
                "employee_id": row.employee_id,
                "month": row.month,
                "adjustment_type": row.adjustment_type,
                "amount": float(row.amount) if row.amount else 0,
                "description": row.description,
                "status": row.status,
                "created_at": row.created_at
            })
        print(f"Fetched {len(adjustments)} adjustments")
        return adjustments
    except Exception as e:
        print(f"Error fetching adjustments: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching adjustments: {str(e)}")

@router.put("/adjustments/{adjustment_id}")
async def update_adjustment(
    adjustment_id: int,
    request: Request,
    db: Session = Depends(get_tenant_db)
):
    try:
        data = await request.json()
        
        db.execute(text("""
            UPDATE payroll_adjustments 
            SET employee_id = :employee_id, month = :month, adjustment_type = :adjustment_type, 
                amount = :amount, description = :description
            WHERE id = :id
        """), {
            "id": adjustment_id,
            "employee_id": int(data.get('employee_id')),
            "month": str(data.get('month')),
            "adjustment_type": str(data.get('adjustment_type')),
            "amount": float(data.get('amount')),
            "description": str(data.get('description', ''))
        })
        
        db.commit()
        return {"message": "Adjustment updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating adjustment: {str(e)}")

@router.delete("/adjustments/{adjustment_id}")
def delete_adjustment(
    adjustment_id: int,
    db: Session = Depends(get_tenant_db)
):
    try:
        db.execute(text("DELETE FROM payroll_adjustments WHERE id = :id"), {"id": adjustment_id})
        db.commit()
        return {"message": "Adjustment deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting adjustment: {str(e)}")