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
    # LOAD CONFIGURATION
    # ========================================================
    
    if config_name not in config:
        config_name = "default"
    
    try:
        app.config.from_object(config[config_name])
    except Exception as e:
        print("❌ Failed to load Flask configuration")
        traceback.print_exc()
        raise e
    
    # ========================================================
    # OVERRIDE WITH ENVIRONMENT VARIABLES
    # ========================================================
    
    # Database configuration
    app.config["SQLALCHEMY_DATABASE_URI"] = (
        f"mysql+pymysql://{os.getenv('DB_USER', 'tirsi_user')}:"
        f"{os.getenv('DB_PASSWORD', 'tirsi123')}@"
        f"{os.getenv('DB_HOST', 'localhost')}:"
        f"{os.getenv('DB_PORT', '3306')}/"
        f"{os.getenv('DB_NAME', 'tirsi_pos_db')}"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_size": 10,
        "pool_recycle": 3600,
        "pool_pre_ping": True,
    }
    
    # CORS - Get from environment
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
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    
    # Session
    app.config["SESSION_TYPE"] = "filesystem"
    app.config["SESSION_PERMANENT"] = True
    app.config["SESSION_USE_SIGNER"] = True
    app.config["SESSION_KEY_PREFIX"] = "tirsi_"
    app.config["SESSION_COOKIE_NAME"] = "session"
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    app.config["SESSION_COOKIE_SECURE"] = False
    app.config["SESSION_REFRESH_EACH_REQUEST"] = True
    
    # ========================================================
    # DISPLAY CONFIGURATION
    # ========================================================
    
    print("=" * 60)
    print("🚀 Starting Tirsi POS")
    print("=" * 60)
    print(f"Environment: {app.config.get('ENV', 'development')}")
    print(f"Debug: {app.config.get('DEBUG', True)}")
    print(f"Database: {app.config.get('DB_NAME', 'tirsi_pos_db')}")
    print(f"CORS Origins: {app.config.get('CORS_ORIGINS', [])}")
    print("=" * 60)
    
    # ========================================================
    # INITIALIZE EXTENSIONS
    # ========================================================
    
    # Database
    db.init_app(app)
    print("✅ SQLAlchemy initialized")
    
    # Migrations
    migrate.init_app(app, db)
    print("✅ Flask-Migrate initialized")
    
    # CORS
    CORS(
        app,
        origins=app.config.get("CORS_ORIGINS", []),
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
            "Cookie"
        ],
        expose_headers=[
            "Content-Type",
            "Authorization"
        ],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        max_age=86400
    )
    print("✅ CORS initialized")
    
    # Session
    Session(app)
    print("✅ Flask-Session initialized")
    
    # Login Manager
    login_manager.init_app(app)
    login_manager.session_protection = "strong"
    print("✅ Flask-Login initialized")
    
    # Bcrypt
    bcrypt.init_app(app)
    print("✅ Bcrypt initialized")
    
    # ========================================================
    # USER LOADER
    # ========================================================
    
    @login_manager.user_loader
    def load_user(user_id):
        try:
            if str(user_id) == "1":
                return AdminUser(app.config["ADMIN_EMAIL"])
            
            shop = Shop.query.get(int(user_id))
            if shop:
                return shop
        except Exception as e:
            app.logger.error(f"User loading error: {e}")
        return None
    
    @login_manager.unauthorized_handler
    def unauthorized_handler():
        return jsonify({"error": "Unauthorized"}), 401
    
    # ========================================================
    # REGISTER ROUTES
    # ========================================================
    
    try:
        init_routes(app)
        print("✅ Routes initialized")
    except Exception as e:
        print(f"❌ Routes initialization failed: {e}")
        traceback.print_exc()
        raise e
    
    # ========================================================
    # CORE ROUTES
    # ========================================================
    
    @app.route("/health", methods=["GET"])
    def health():
        try:
            with db.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return jsonify({"status": "healthy", "database": "connected"}), 200
        except Exception as e:
            return jsonify({"status": "unhealthy", "database": "disconnected", "error": str(e)}), 500
    
    @app.route("/", methods=["GET"])
    def index():
        return jsonify({
            "name": "Tirsi POS",
            "status": "running",
            "version": "1.0.0"
        }), 200
    
    # ========================================================
    # ERROR HANDLERS
    # ========================================================
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not found"}), 404
    
    @app.errorhandler(500)
    def server_error(error):
        app.logger.error(f"Server error: {error}")
        return jsonify({"error": "Internal server error"}), 500
    
    print("=" * 60)
    print("✅ Tirsi POS application initialized")
    print("=" * 60)
    
    return app


# ============================================================
# CREATE APPLICATION
# ============================================================

app = create_app(os.getenv("ENV", "development"))

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", 5000)),
        debug=os.getenv("DEBUG", "True").lower() == "true"
    )