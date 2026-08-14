# app.py
import os
import traceback
from dotenv import load_dotenv

# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv(override=True)

# ============================================================
# FLASK IMPORTS
# ============================================================

from flask import (
    Flask,
    jsonify,
    send_from_directory,
    session,
    request
)
from flask_cors import CORS
from flask_session import Session
from flask_login import login_required, current_user
from sqlalchemy import text

# ============================================================
# APPLICATION IMPORTS
# ============================================================

from extensions import db, migrate, login_manager, bcrypt
from config import config
from routes import init_routes
from routes.auth import AdminUser
from models.shop import Shop

# ============================================================
# APPLICATION FACTORY
# ============================================================

def create_app(config_name="development"):
    app = Flask(__name__)
    
    # ========================================================
    # VALIDATE CONFIGURATION NAME
    # ========================================================
    
    if config_name not in config:
        config_name = "default"
    
    # ========================================================
    # LOAD SELECTED CONFIGURATION
    # ========================================================
    
    try:
        app.config.from_object(config[config_name])
    except Exception as e:
        print("❌ Failed to load Flask configuration")
        traceback.print_exc()
        raise e
    
    # ========================================================
    # OVERRIDE WITH ENVIRONMENT VARIABLES
    # ========================================================
    
    # Database
    app.config["DB_HOST"] = os.getenv("DB_HOST", "localhost")
    app.config["DB_PORT"] = int(os.getenv("DB_PORT", 3306))
    app.config["DB_NAME"] = os.getenv("DB_NAME", "tirsi_pos_db")
    app.config["DB_USER"] = os.getenv("DB_USER", "tirsi_user")
    app.config["DB_PASSWORD"] = os.getenv("DB_PASSWORD", "tirsi123")
    
    # CORS - CRITICAL FIX
    cors_origins = os.getenv("CORS_ORIGINS", "")
    if cors_origins:
        app.config["CORS_ORIGINS"] = [
            origin.strip().rstrip('/')
            for origin in cors_origins.split(",")
            if origin.strip()
        ]
    else:
        app.config["CORS_ORIGINS"] = [
            "https://pos-frontend-j0hd.onrender.com",
            "http://localhost:5173",
            "http://localhost:3000"
        ]
    
    # Admin
    app.config["ADMIN_EMAIL"] = os.getenv("ADMIN_EMAIL", "superadmin@system.com")
    app.config["ADMIN_PASSWORD_HASH"] = os.getenv("ADMIN_PASSWORD_HASH", "")
    
    # Session
    app.config["SESSION_COOKIE_SECURE"] = os.getenv("SESSION_COOKIE_SECURE", "False").lower() == "true"
    app.config["SESSION_COOKIE_HTTPONLY"] = os.getenv("SESSION_COOKIE_HTTPONLY", "True").lower() == "true"
    app.config["SESSION_COOKIE_SAMESITE"] = os.getenv("SESSION_COOKIE_SAMESITE", "Lax")
    app.config["PERMANENT_SESSION_LIFETIME"] = int(os.getenv("PERMANENT_SESSION_LIFETIME", 86400))
    
    # App
    app.config["APP_NAME"] = os.getenv("APP_NAME", "Tirsi POS")
    app.config["API_PREFIX"] = os.getenv("API_PREFIX", "/api")
    
    # ========================================================
    # DISPLAY BASIC CONFIGURATION
    # ========================================================
    
    print("=" * 60)
    print("🚀 Starting Tirsi POS")
    print("=" * 60)
    print(f"Environment: {app.config.get('ENV')}")
    print(f"Debug: {app.config.get('DEBUG')}")
    print(f"Database Host: {app.config.get('DB_HOST')}")
    print(f"Database Port: {app.config.get('DB_PORT')}")
    print(f"Database Name: {app.config.get('DB_NAME')}")
    print(f"Database User: {app.config.get('DB_USER')}")
    print(f"Database Password: {'SET' if app.config.get('DB_PASSWORD') else 'NOT SET'}")
    
    # ========================================================
    # SESSION CONFIGURATION
    # ========================================================
    
    app.config["SESSION_TYPE"] = "filesystem"
    app.config["SESSION_PERMANENT"] = True
    app.config["SESSION_USE_SIGNER"] = True
    app.config["SESSION_KEY_PREFIX"] = "tirsi_"
    app.config["SESSION_COOKIE_NAME"] = "session"
    app.config["SESSION_COOKIE_DOMAIN"] = None
    app.config["SESSION_COOKIE_PATH"] = "/"
    app.config["SESSION_COOKIE_HTTPONLY"] = app.config["SESSION_COOKIE_HTTPONLY"]
    app.config["SESSION_REFRESH_EACH_REQUEST"] = True
    
    # ========================================================
    # PRODUCTION SESSION SETTINGS
    # ========================================================
    
    if config_name == "production":
        app.config["SESSION_COOKIE_SECURE"] = True
        app.config["SESSION_COOKIE_SAMESITE"] = "None"
    else:
        app.config["SESSION_COOKIE_SECURE"] = False
        app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    
    # ========================================================
    # EXTENSIONS
    # ========================================================
    
    initialize_extensions(app)
    
    # ========================================================
    # FLASK LOGIN
    # ========================================================
    
    setup_login_manager(app)
    
    # ========================================================
    # APPLICATION ROUTES
    # ========================================================
    
    try:
        init_routes(app)
    except Exception as e:
        print("❌ Failed to register application routes")
        traceback.print_exc()
        raise e
    
    # ========================================================
    # CORE ROUTES
    # ========================================================
    
    register_core_routes(app)
    
    # ========================================================
    # ERROR HANDLERS
    # ========================================================
    
    register_error_handlers(app)
    
    print("=" * 60)
    print("✅ Tirsi POS application initialized")
    print("=" * 60)
    
    return app


# ============================================================
# EXTENSION INITIALIZATION WITH CORS FIX
# ============================================================

def initialize_extensions(app):
    """Initialize all Flask extensions with proper CORS handling"""
    
    # Database
    try:
        db.init_app(app)
        print("✅ SQLAlchemy initialized")
    except Exception as e:
        print("❌ SQLAlchemy initialization failed")
        traceback.print_exc()
        raise e
    
    # Migrations
    try:
        migrate.init_app(app, db)
        print("✅ Flask-Migrate initialized")
    except Exception as e:
        print("❌ Flask-Migrate initialization failed")
        traceback.print_exc()
        raise e
    
    # ========================================================
    # CORS - COMPLETE FIX
    # ========================================================
    
    # Get allowed origins from config (already parsed from env)
    allowed_origins = app.config.get("CORS_ORIGINS", [])
    
    # Ensure production frontend is always included
    PRODUCTION_FRONTEND = "https://pos-frontend-j0hd.onrender.com"
    if PRODUCTION_FRONTEND not in allowed_origins:
        allowed_origins.append(PRODUCTION_FRONTEND)
    
    # Add local development origins
    LOCAL_ORIGINS = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:5174",
        "http://localhost:5175"
    ]
    
    for local_origin in LOCAL_ORIGINS:
        if local_origin not in allowed_origins:
            allowed_origins.append(local_origin)
    
    # Remove duplicates
    allowed_origins = list(dict.fromkeys(allowed_origins))
    
    print("=" * 60)
    print("🌐 CORS ALLOWED ORIGINS")
    print("=" * 60)
    for origin in allowed_origins:
        print(f"   ✅ {origin}")
    print("=" * 60)
    
    # ========================================================
    # INITIALIZE CORS
    # ========================================================
    
    try:
        CORS(
            app,
            origins=allowed_origins,
            supports_credentials=True,
            allow_headers=[
                "Content-Type",
                "Authorization",
                "X-Shop-ID",
                "X-Requested-With",
                "Accept",
                "Origin",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers",
                "Cookie",
                "X-CSRFToken"
            ],
            expose_headers=[
                "Content-Type",
                "Authorization",
                "X-Requested-With"
            ],
            methods=[
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
            ],
            max_age=86400
        )
        print("✅ CORS initialized successfully")
        
    except Exception as e:
        print("❌ CORS initialization failed")
        traceback.print_exc()
        raise e
    
    # Server-side session
    try:
        Session(app)
        print("✅ Flask-Session initialized")
    except Exception as e:
        print("❌ Flask-Session initialization failed")
        traceback.print_exc()
        raise e
    
    # Flask Login
    try:
        login_manager.init_app(app)
        print("✅ Flask-Login initialized")
    except Exception as e:
        print("❌ Flask-Login initialization failed")
        traceback.print_exc()
        raise e
    
    # Bcrypt
    try:
        bcrypt.init_app(app)
        print("✅ Bcrypt initialized")
    except Exception as e:
        print("❌ Bcrypt initialization failed")
        traceback.print_exc()
        raise e
    
    # Database connection test
    test_database_connection(app)


# ============================================================
# DATABASE CONNECTION TEST
# ============================================================

def test_database_connection(app):
    """Test database connection and log results"""
    print("=" * 60)
    print("🔍 Testing MySQL database connection...")
    print("=" * 60)
    
    try:
        with app.app_context():
            result = db.session.execute(text("SELECT 1"))
            result.scalar()
            
            database_result = db.session.execute(text("SELECT DATABASE()"))
            database_name = database_result.scalar()
            
            version_result = db.session.execute(text("SELECT VERSION()"))
            mysql_version = version_result.scalar()
            
            print("✅ MySQL database connected successfully")
            print(f"✅ Active database: {database_name}")
            print(f"✅ MySQL version: {mysql_version}")
            
    except Exception as e:
        print("=" * 60)
        print("❌ DATABASE CONNECTION FAILED")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print("=" * 60)
        traceback.print_exc()
        print("=" * 60)
        
        try:
            db.session.rollback()
        except Exception:
            pass


# ============================================================
# FLASK LOGIN SETUP
# ============================================================

def setup_login_manager(app):
    """Configure Flask-Login with user loader and unauthorized handler"""
    
    login_manager.session_protection = "strong"
    
    @login_manager.user_loader
    def load_user(user_id):
        try:
            if str(user_id) == "1":
                return AdminUser(app.config["ADMIN_EMAIL"])
            
            shop_id = int(user_id)
            shop = Shop.query.get(shop_id)
            if shop:
                return shop
                
        except Exception as e:
            app.logger.error(f"User loading error: {e}")
            app.logger.exception("Full user loading traceback:")
        
        return None
    
    @login_manager.unauthorized_handler
    def unauthorized_handler():
        return jsonify({
            "error": "Unauthorized",
            "message": "Please log in to access this resource"
        }), 401


# ============================================================
# CORE ROUTES
# ============================================================

def register_core_routes(app):
    """Register core application routes"""
    
    @app.route("/health", methods=["GET"])
    def health():
        try:
            with db.engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            database = "connected"
            database_error = None
        except Exception as e:
            database = "disconnected"
            database_error = str(e)
        
        response = {
            "status": "healthy",
            "database": database,
            "environment": app.config.get("ENV"),
            "application": app.config.get("APP_NAME")
        }
        
        if database_error:
            response["database_error"] = database_error
        
        return jsonify(response), 200
    
    @app.route("/", methods=["GET"])
    def index():
        return jsonify({
            "name": app.config.get("APP_NAME", "Tirsi POS"),
            "status": "running",
            "version": "1.0.0",
            "environment": app.config.get("ENV", "development")
        }), 200
    
    @app.route("/uploads/<path:filename>", methods=["GET"])
    def uploads(filename):
        upload_folder = os.path.join(app.root_path, "uploads")
        return send_from_directory(upload_folder, filename)
    
    @app.route("/api/auth/session-check", methods=["GET"])
    def session_check():
        try:
            app.logger.debug(f"Session check - Authenticated: {current_user.is_authenticated}")
            
            if session:
                app.logger.debug(f"Session keys: {list(session.keys())}")
            
            app.logger.debug(f"Cookies received: {list(request.cookies.keys())}")
            
            if current_user.is_authenticated:
                user_data = {
                    "id": current_user.get_id(),
                    "email": getattr(current_user, "email", None),
                    "username": getattr(current_user, "username", None),
                    "is_admin": getattr(current_user, "is_admin", False)
                }
                
                return jsonify({
                    "authenticated": True,
                    "user": user_data
                }), 200
            
            return jsonify({
                "authenticated": False
            }), 401
            
        except Exception as e:
            app.logger.exception("Session check failed")
            return jsonify({
                "authenticated": False,
                "error": "Session check failed"
            }), 500
    
    @app.route("/api/test-auth", methods=["GET"])
    @login_required
    def test_auth():
        return jsonify({
            "authenticated": current_user.is_authenticated,
            "id": current_user.get_id(),
            "is_admin": getattr(current_user, "is_admin", False)
        }), 200


# ============================================================
# ERROR HANDLERS
# ============================================================

def register_error_handlers(app):
    """Register global error handlers"""
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({
            "error": "Unauthorized",
            "message": "Authentication required"
        }), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({
            "error": "Forbidden",
            "message": "You don't have permission to access this resource"
        }), 403
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "error": "Not found",
            "message": "The requested resource was not found"
        }), 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            "error": "Method not allowed",
            "message": "The HTTP method is not allowed for this endpoint"
        }), 405
    
    @app.errorhandler(500)
    def server_error(error):
        app.logger.exception("Internal server error")
        return jsonify({
            "error": "Server error",
            "message": "An internal server error occurred"
        }), 500


# ============================================================
# CREATE APPLICATION
# ============================================================

app = create_app(os.getenv("ENV", "development"))

# ============================================================
# LOCAL DEVELOPMENT
# ============================================================

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", 5000)),
        debug=app.config.get("DEBUG", False)
    )