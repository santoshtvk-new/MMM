import os
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail
from flask_migrate import Migrate
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Basic Config
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default-dev-secret-key-change-it')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///mmm_secure.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Mail Config (as requested by USER)
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.pynfinity.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True') == 'True'
app.config['MAIL_USERNAME'] = 'santoshtvk@pynfinity.com'
app.config['MAIL_PASSWORD'] = os.getenv('PYN_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = 'santoshtvk@pynfinity.com'

# Initialize Extensions
db = SQLAlchemy(app)
mail = Mail(app)
migrate = Migrate(app, db)

# Import routes after app and db creation
from routes import *

if __name__ == '__main__':
    app.run(debug=True)
