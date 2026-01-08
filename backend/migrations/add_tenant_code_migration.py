"""
Migration Script: Add tenant_code to master_users table
This script safely adds the tenant_code column without losing existing data
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text, MetaData, Table, Column, String
from sqlalchemy.exc import OperationalError
import database
from models.models_master import Hospital, MasterUser
from sqlalchemy.orm import Session

def run_migration():
    """
    Add tenant_code column to master_users table and populate with hospital tenant_id
    """
    print("Starting tenant_code migration...")
    
    try:
        # Get master database engine
        from database import master_engine
        
        with master_engine.connect() as conn:
            # Check if tenant_code column already exists
            try:
                result = conn.execute(text("DESCRIBE master_users"))
                columns = [row[0] for row in result.fetchall()]
                
                if 'tenant_code' in columns:
                    print("tenant_code column already exists. Migration not needed.")
                    return
                    
            except Exception as e:
                print(f"Error checking existing columns: {e}")
                return
            
            print("Adding tenant_code column to master_users table...")
            
            # Add the tenant_code column
            conn.execute(text("""
                ALTER TABLE master_users 
                ADD COLUMN tenant_code VARCHAR(50) NOT NULL DEFAULT 'TEMP_CODE'
            """))
            conn.commit()
            
            print("tenant_code column added successfully")
            
        # Now populate the tenant_code with actual values
        print("Populating tenant_code values...")
        
        db = Session(bind=master_engine)
        try:
            # Get all users and their associated hospitals
            users = db.query(MasterUser).all()
            
            for user in users:
                hospital = db.query(Hospital).filter(Hospital.id == user.hospital_id).first()
                if hospital:
                    user.tenant_code = hospital.tenant_id
                    print(f"   Updated user {user.email} with tenant_code: {hospital.tenant_id}")
                else:
                    print(f"   Warning: No hospital found for user {user.email}")
            
            db.commit()
            print("All tenant_code values populated successfully")
            
        except Exception as e:
            db.rollback()
            print(f"Error populating tenant_code values: {e}")
            raise
        finally:
            db.close()
            
        # Remove the default constraint
        with master_engine.connect() as conn:
            print("Removing default constraint...")
            conn.execute(text("""
                ALTER TABLE master_users 
                ALTER COLUMN tenant_code DROP DEFAULT
            """))
            conn.commit()
            print("Default constraint removed")
            
        print("Migration completed successfully!")
        print("Summary:")
        print("   - Added tenant_code column to master_users table")
        print("   - Populated existing records with hospital tenant_id values")
        print("   - Removed temporary default constraint")
        print("   - All existing data preserved")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        raise

def rollback_migration():
    """
    Rollback the migration by removing the tenant_code column
    """
    print("Rolling back tenant_code migration...")
    
    try:
        from database import master_engine
        
        with master_engine.connect() as conn:
            # Check if tenant_code column exists
            try:
                result = conn.execute(text("DESCRIBE master_users"))
                columns = [row[0] for row in result.fetchall()]
                
                if 'tenant_code' not in columns:
                    print("tenant_code column doesn't exist. Rollback not needed.")
                    return
                    
            except Exception as e:
                print(f"Error checking existing columns: {e}")
                return
            
            print("Removing tenant_code column from master_users table...")
            
            # Remove the tenant_code column
            conn.execute(text("ALTER TABLE master_users DROP COLUMN tenant_code"))
            conn.commit()
            
            print("tenant_code column removed successfully")
            print("Rollback completed successfully!")
            
    except Exception as e:
        print(f"Rollback failed: {e}")
        raise

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Tenant Code Migration Script')
    parser.add_argument('--rollback', action='store_true', help='Rollback the migration')
    
    args = parser.parse_args()
    
    if args.rollback:
        rollback_migration()
    else:
        run_migration()