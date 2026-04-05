import sqlite3
import os

db_path = 'instance/mmm_secure.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # Check User table for salary_date
    cur.execute("PRAGMA table_info(user)")
    cols = [c[1] for c in cur.fetchall()]
    if 'salary_date' not in cols:
        print("Adding salary_date to user table...")
        cur.execute("ALTER TABLE user ADD COLUMN salary_date INTEGER DEFAULT 1")
    else:
        print("salary_date already exists in user table.")

    # Check Transaction table for emi_id
    cur.execute('PRAGMA table_info("transaction")')
    cols = [c[1] for c in cur.fetchall()]
    if 'emi_id' not in cols:
        print("Adding emi_id to transaction table...")
        cur.execute('ALTER TABLE "transaction" ADD COLUMN emi_id INTEGER')
    else:
        print("emi_id already exists in transaction table.")
        
    conn.commit()
    conn.close()
    print("Migration complete.")
else:
    print(f"Database not found at {db_path}")
