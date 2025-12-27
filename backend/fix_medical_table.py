import pymysql

try:
    # Connect to database
    conn = pymysql.connect(
        host='localhost',
        user='root', 
        password='',
        database='nutryah',
        charset='utf8mb4'
    )
    cursor = conn.cursor()
    
    print("Adding missing columns to employee_medical table...")
    
    # Add missing columns
    columns_to_add = [
        ('medical_council_registration_number', 'VARCHAR(100)'),
        ('medical_council_name', 'VARCHAR(200)'),
        ('medical_council_expiry_date', 'DATE'),
        ('vaccination_records', 'JSON'),
        ('professional_licenses', 'JSON'),
        ('license_alert_enabled', 'BOOLEAN DEFAULT TRUE'),
        ('license_alert_days', 'INT DEFAULT 30')
    ]
    
    for col_name, col_type in columns_to_add:
        try:
            sql = f'ALTER TABLE employee_medical ADD COLUMN {col_name} {col_type}'
            cursor.execute(sql)
            print(f'✓ Added {col_name}')
        except Exception as e:
            if 'Duplicate column name' in str(e):
                print(f'- {col_name} already exists')
            else:
                print(f'✗ {col_name}: {e}')
    
    # Commit changes
    conn.commit()
    
    # Verify table structure
    cursor.execute('SHOW COLUMNS FROM employee_medical')
    columns = cursor.fetchall()
    print(f'\nEmployee medical table now has {len(columns)} columns')
    
    # Check if all required columns exist
    required_columns = [col[0] for col in columns_to_add]
    existing_columns = [col[0] for col in columns]
    
    missing = [col for col in required_columns if col not in existing_columns]
    if missing:
        print(f'Still missing: {missing}')
    else:
        print('All required columns are present!')
    
    conn.close()
    print('\nMigration completed successfully!')
    
except Exception as e:
    print(f'Database connection error: {e}')