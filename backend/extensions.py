from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_session import Session
from flask_login import LoginManager
from flask_bcrypt import Bcrypt


# ==========================================
# DATABASE
# ==========================================

db = SQLAlchemy()


# ==========================================
# DATABASE MIGRATIONS
# ==========================================

migrate = Migrate()


# ==========================================
# SERVER-SIDE SESSIONS
# ==========================================

session = Session()


# ==========================================
# FLASK-LOGIN
# ==========================================

login_manager = LoginManager()

login_manager.login_view = None

login_manager.login_message = (
    "Please log in to access this page."
)

login_manager.login_message_category = (
    "error"
)


# ==========================================
# PASSWORD HASHING
# ==========================================

bcrypt = Bcrypt()