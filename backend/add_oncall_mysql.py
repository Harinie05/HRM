#!/usr/bin/env python3

"""
Database Migration Script: Add On-Call Duty Tables
Adds on_call_duties and emergency_call_logs tables to support emergency duty tracking
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from models.models_master import Hospital
from database import get_master_db, get_tenant_engine

def add_oncall_tables():
    """Add on-call duty and emergency call log tables to all tenant databases"""
    
    # SQL to create on_call_duties table
    create_oncall_table = """
    CREATE TABLE IF NOT EXISTS on_call_duties (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        date DATE NOT NULL,
        from_time TIME NOT NULL,
        to_time TIME NOT NULL,
        duty_type VARCHAR(50) DEFAULT 'On-Call',
        department_id INT,
        priority_level VARCHAR(20) DEFAULT 'Normal',
        contact_number VARCHAR(20),
        status VARCHAR(50) DEFAULT 'Scheduled',
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES users (id),
        FOREIGN KEY (department_id) REFERENCES departments (id)
    );
    """
    
    # SQL to create emergency_call_logs table
    create_emergency_table = """
    CREATE TABLE IF NOT EXISTS emergency_call_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        on_call_duty_id INT NOT NULL,
        employee_id INT NOT NULL,
        call_time DATETIME NOT NULL,
        response_time DATETIME,
        call_type VARCHAR(50) NOT NULL,
        caller_details VARCHAR(200),
        issue_description TEXT,
        resolution_notes TEXT,
        call_duration INT,
        status VARCHAR(50) DEFAULT 'Received',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (on_call_duty_id) REFERENCES on_call_duties (id),
        FOREIGN KEY (employee_id) REFERENCES users (id)
    );
    """
    
    try:
        # Get master database session
        master_db = next(get_master_db())
        
        # Get all hospitals (tenants)
        hospitals = master_db.query(Hospital).all()
        
        print("Found {} tenant databases to update...".format(len(hospitals)))
        
        for hospital in hospitals:
            try:
                print("Updating database: {}".format(hospital.db_name))
                
                # Create engine for tenant database
                engine = get_tenant_engine(hospital.db_name)
                
                with engine.connect() as conn:
                    # Create on_call_duties table
                    conn.execute(text(create_oncall_table))
                    print("  Created on_call_duties table")
                    
                    # Create emergency_call_logs table
                    conn.execute(text(create_emergency_table))
                    print("  Created emergency_call_logs table")
                    
                    conn.commit()
                    
                print("Successfully updated {}".format(hospital.db_name))
                
            except Exception as e:
                print("Error updating {}: {}".format(hospital.db_name, str(e)))
                continue
        
        print("\n Migration completed successfully!")
        
    except Exception as e:
        print("Migration failed: {}".format(str(e)))
        return False
    
    finally:
        master_db.close()
    
    return True

if __name__ == "__main__":
    print("Starting On-Call Duty Tables Migration...")
    success = add_oncall_tables()
    
    if success:
        print("Migration completed successfully!")
    else:
        print("Migration failed!")
        sys.exit(1)