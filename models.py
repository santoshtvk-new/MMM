from datetime import datetime
import json
import base64
import os
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.fernet import Fernet
from app import db
from flask import session

class EncryptionService:
    @staticmethod
    def derive_key(special_key, salt):
        """Derive a 32-byte key from a special key and salt for Fernet"""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        return base64.urlsafe_b64encode(kdf.derive(special_key.encode()))

    @staticmethod
    def encrypt(data, key):
        if data is None: return None
        f = Fernet(key)
        return f.encrypt(str(data).encode()).decode()

    @staticmethod
    def decrypt(token, key):
        if token is None: return None
        try:
            f = Fernet(key)
            return f.decrypt(token.encode()).decode()
        except Exception:
            return "[Decryption Error]"

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email_hash = db.Column(db.String(128), unique=True, nullable=False) # For lookup
    salt = db.Column(db.LargeBinary(16), nullable=False) # For key derivation
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    accounts = db.relationship('Account', backref='user', lazy=True, cascade="all, delete-orphan")

class Account(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Encrypted fields
    name_enc = db.Column(db.Text, nullable=False)
    bank_name_enc = db.Column(db.Text, nullable=False)
    account_type_enc = db.Column(db.Text, nullable=False)
    balance_enc = db.Column(db.Text, nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    transactions = db.relationship('Transaction', backref='account', lazy=True, cascade="all, delete-orphan")
    emis = db.relationship('EMI', backref='account', lazy=True, cascade="all, delete-orphan")
    expenses = db.relationship('Expense', backref='account', lazy=True, cascade="all, delete-orphan")

    def decrypt_all(self, key):
        self.name = EncryptionService.decrypt(self.name_enc, key)
        self.bank_name = EncryptionService.decrypt(self.bank_name_enc, key)
        self.account_type = EncryptionService.decrypt(self.account_type_enc, key)
        self.balance = float(EncryptionService.decrypt(self.balance_enc, key))
        return self

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('account.id'), nullable=False)
    
    # Encrypted fields
    amount_enc = db.Column(db.Text, nullable=False)
    type_enc = db.Column(db.Text, nullable=False) # credit, debit
    description_enc = db.Column(db.Text, nullable=False)
    category_enc = db.Column(db.Text, nullable=True)
    transfer_to_account_id = db.Column(db.Integer, nullable=True) # Non-encrypted for logic
    is_transfer = db.Column(db.Boolean, default=False)
    
    date = db.Column(db.DateTime, default=datetime.utcnow)

    def decrypt_all(self, key):
        self.amount = float(EncryptionService.decrypt(self.amount_enc, key))
        self.type = EncryptionService.decrypt(self.type_enc, key)
        self.description = EncryptionService.decrypt(self.description_enc, key)
        self.category = EncryptionService.decrypt(self.category_enc, key)
        return self

class EMI(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('account.id'), nullable=False)
    
    # Encrypted fields
    name_enc = db.Column(db.Text, nullable=False)
    amount_enc = db.Column(db.Text, nullable=False)
    due_date_enc = db.Column(db.Text, nullable=False) # Day of month
    type_enc = db.Column(db.Text, nullable=False) # loan, credit_card, mf
    remaining_months_enc = db.Column(db.Text, nullable=True)
    
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def decrypt_all(self, key):
        self.name = EncryptionService.decrypt(self.name_enc, key)
        self.amount = float(EncryptionService.decrypt(self.amount_enc, key))
        self.due_date = int(EncryptionService.decrypt(self.due_date_enc, key))
        self.type = EncryptionService.decrypt(self.type_enc, key)
        rem = EncryptionService.decrypt(self.remaining_months_enc, key)
        self.remaining_months = int(rem) if rem and rem != '[Decryption Error]' else None
        return self

class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('account.id'), nullable=False)
    
    # Encrypted fields
    name_enc = db.Column(db.Text, nullable=False)
    amount_enc = db.Column(db.Text, nullable=False)
    type_enc = db.Column(db.Text, nullable=False) # rent, grocery, transport, etc.
    due_date_enc = db.Column(db.Text, nullable=True)
    
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def decrypt_all(self, key):
        self.name = EncryptionService.decrypt(self.name_enc, key)
        self.amount = float(EncryptionService.decrypt(self.amount_enc, key))
        self.type = EncryptionService.decrypt(self.type_enc, key)
        due = EncryptionService.decrypt(self.due_date_enc, key)
        self.due_date = int(due) if due and due != '[Decryption Error]' else None
        return self
