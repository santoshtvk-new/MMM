"""Clean database reset — drops all tables, recreates from models.py"""
import os, sys

# Ensure app context is available
sys.path.insert(0, os.path.dirname(__file__))

from app import app, db
import models  # noqa: registers all models

os.makedirs('instance', exist_ok=True)

with app.app_context():
    db.drop_all()
    db.create_all()
    print("✅ Database reset complete. All tables recreated with fresh schema.")
    print("   -> instance/mmm_secure.db is ready.")
