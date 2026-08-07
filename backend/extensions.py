# extensions.py

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_session import Session
from flask_login import LoginManager
from flask_bcrypt import Bcrypt


# Database
db = SQLAlchemy()


# Migration
migrate = Migrate()


# CORS
cors = CORS()


# Server-side sessions
session = Session()


# Flask-Login
login_manager = LoginManager()


# Password hashing
bcrypt = Bcrypt()



# Flask-Login configuration

login_manager.login_view = None

login_manager.login_message = (
    "Please log in to access this page."
)

login_manager.login_message_category = (
    "error"
)