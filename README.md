# MMM (Monthly Money Management) | Secure Salary & Investment Manager

A premium, all-in-one financial management web application built with **Flask**, **SQLAlchemy**, and **AES-256 Encryption**. Designed for mobile and desktop with a security-first approach.

## 🌟 Features

- **Zero-Knowledge Security**: Your financial data (accounts, amounts, categories) is encrypted with your **Special Key** before hitting the database.
- **📊 Visual Analytics**: Daily and monthly expenditure breakdowns via **Chart.js** integrated directly into the dashboard.
- **🛣️ Advanced Loan Tracking**: Monitor "Paid vs Pending" principal and tenure with beautiful progress bars linked to specific transactions.
- **📅 Financial Cycles**: Custom **Salary Date** awareness shifts your dashboard to align with your personal income flow (e.g., 25th of month).
- **🛡️ Strict Safety**: Enforces a non-negative balance rule to prevent accidental overdraft entries.
- **Deduction Alerts**: Notifications for EMIs and individually scheduled future transactions due tomorrow.
- **📤 Bulk CSV Portability**: Import entire bank statements in seconds via a simple CSV mapper.
- **High-End UI**: Responsive Navy & Emerald theme with glassmorphism and mobile bottom-nav.
- **Data Portability**: Download your full history as JSON or wipe all your data permanently with one click.

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
pip install flask-sqlalchemy cryptography flask-mail python-dotenv flask-migrate
```

### 2. Configure Environment
1. Copy `.env.example` to `.env`.
2. Fill in your `SECRET_KEY` and `PYN_PASSWORD` (for the recovery email feature).
3. Set your `MAIL_SERVER` if not using the default.

### 3. Initialize Database
```bash
python init_db.py
```

### 4. Run the Application
```bash
python app.py
```
Visit `http://127.0.0.1:5000` to start.

## 🔒 Security Model

- **Email + Special Key**: This combination is your only way in. We do not store your Special Key; it is held only in your current session to decrypt data as you browse.
- **Encryption Engine**: Uses `PBKDF2HMAC` for key derivation and `AES (Fernet)` for block encryption.

## 📱 Mobile Experience
The application is optimized for mobile with a bottom-navigation bar, touch-friendly inputs, and a simplified dashboard view.

---
Built with ❤️ by Pynfinity - Santoshtvk
