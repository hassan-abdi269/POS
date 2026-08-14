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
from flask_login import login_required, current_user, LoginManager
from sqlalchemy import text

# ============================================================
# APPLICATION IMPORTS
# ============================================================

from extensions import db, migrate, login_manager, bcrypt
from models.shop import Shop
from routes.auth import AdminUser

# ============================================================
# APPLICATION FACTORY
# ============================================================

def create_app(config_name="development"):
    app = Flask(__name__)
    
    # ========================================================
    # BASIC CONFIGURATION
    # ========================================================
    
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    app.config["ENV"] = os.getenv("ENV", "development")
    app.config["DEBUG"] = os.getenv("DEBUG", "True").lower() == "true"
    
    # ========================================================
    # DATABASE CONFIGURATION
    # ========================================================
    
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
    
    # ========================================================
    # CORS CONFIGURATION
    # ========================================================
    
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
            "http://localhost:3000",
            "http://127.0.0.1:5173"
        ]
    
    # ========================================================
    # SESSION CONFIGURATION
    # ========================================================
    
    app.config["SESSION_TYPE"] = "filesystem"
    app.config["SESSION_PERMANENT"] = True
    app.config["SESSION_USE_SIGNER"] = True
    app.config["SESSION_KEY_PREFIX"] = "tirsi_"
    app.config["SESSION_COOKIE_NAME"] = "session"
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    app.config["SESSION_COOKIE_SECURE"] = False
    app.config["SESSION_REFRESH_EACH_REQUEST"] = True
    app.config["PERMANENT_SESSION_LIFETIME"] = 86400
    
    # ========================================================
    # ADMIN CONFIGURATION
    # ========================================================
    
    app.config["ADMIN_EMAIL"] = os.getenv("ADMIN_EMAIL", "superadmin@system.com")
    app.config["ADMIN_PASSWORD_HASH"] = os.getenv("ADMIN_PASSWORD_HASH", "")
    
    # ========================================================
    # PRINT CONFIGURATION
    # ========================================================
    
    print("=" * 60)
    print("🚀 Starting Tirsi POS")
    print("=" * 60)
    print(f"Environment: {app.config['ENV']}")
    print(f"Debug: {app.config['DEBUG']}")
    print(f"Database: {os.getenv('DB_NAME', 'tirsi_pos_db')}")
    print(f"CORS Origins: {app.config['CORS_ORIGINS']}")
    print("=" * 60)
    
    # ========================================================
    # INITIALIZE EXTENSIONS
    # ========================================================
    
    # Database
    try:
        db.init_app(app)
        print("✅ SQLAlchemy initialized")
    except Exception as e:
        print(f"❌ SQLAlchemy initialization failed: {e}")
        traceback.print_exc()
        raise e
    
    # Migrations
    try:
        migrate.init_app(app, db)
        print("✅ Flask-Migrate initialized")
    except Exception as e:
        print(f"❌ Flask-Migrate initialization failed: {e}")
        traceback.print_exc()
        raise e
    
    # CORS
    try:
        CORS(
            app,
            origins=app.config["CORS_ORIGINS"],
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
            expose_headers=["Content-Type", "Authorization"],
            methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            max_age=86400
        )
        print("✅ CORS initialized")
    except Exception as e:
        print(f"❌ CORS initialization failed: {e}")
        traceback.print_exc()
        raise e
    
    # Session
    try:
        Session(app)
        print("✅ Flask-Session initialized")
    except Exception as e:
        print(f"❌ Flask-Session initialization failed: {e}")
        traceback.print_exc()
        raise e
    
    # Login Manager
    try:
        login_manager.init_app(app)
        login_manager.session_protection = "strong"
        print("✅ Flask-Login initialized")
    except Exception as e:
        print(f"❌ Flask-Login initialization failed: {e}")
        traceback.print_exc()
        raise e
    
    # Bcrypt
    try:
        bcrypt.init_app(app)
        print("✅ Bcrypt initialized")
    except Exception as e:
        print(f"❌ Bcrypt initialization failed: {e}")
        traceback.print_exc()
        raise e
    
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
            app.logger.exception("Full traceback:")
        return None
    
    @login_manager.unauthorized_handler
    def unauthorized_handler():
        return jsonify({"error": "Unauthorized"}), 401
    
    # ========================================================
    # REGISTER ROUTES
    # ========================================================
    
    register_routes(app)
    
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
    
    # ========================================================
    # DATABASE CONNECTION TEST
    # ========================================================
    
    test_database_connection(app)
    
    print("=" * 60)
    print("✅ Tirsi POS application initialized")
    print("=" * 60)
    
    return app


# ============================================================
# DATABASE CONNECTION TEST
# ============================================================

def test_database_connection(app):
    """Test database connection"""
    print("=" * 60)
    print("🔍 Testing database connection...")
    print("=" * 60)
    
    try:
        with app.app_context():
            result = db.session.execute(text("SELECT 1"))
            result.scalar()
            print("✅ Database connected successfully")
    except Exception as e:
        print("❌ Database connection failed!")
        print(f"Error: {str(e)}")
        traceback.print_exc()


# ============================================================
# REGISTER ROUTES
# ============================================================

def register_routes(app):
    """Register all routes"""
    
    # =====================================================
    # SHOP LOGIN - COMPLETE WORKING VERSION
    # =====================================================
    
    @app.route("/api/shop/login", methods=["POST", "OPTIONS"])
    def shop_login():
        """Shop login endpoint"""
        
        # Handle CORS preflight
        if request.method == "OPTIONS":
            response = jsonify({"success": True})
            origin = request.headers.get("Origin")
            if origin:
                allowed_origins = app.config["CORS_ORIGINS"]
                if origin.rstrip('/') in allowed_origins:
                    response.headers["Access-Control-Allow-Origin"] = origin
                    response.headers["Access-Control-Allow-Credentials"] = "true"
                    response.headers["Access-Control-Allow-Headers"] = (
                        "Content-Type, Authorization, X-Shop-ID, "
                        "X-Requested-With, Accept, Origin, Cookie"
                    )
                    response.headers["Access-Control-Allow-Methods"] = (
                        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
                    )
                    response.headers["Access-Control-Max-Age"] = "86400"
            return response, 200
        
        try:
            app.logger.info("=" * 50)
            app.logger.info("📤 LOGIN REQUEST RECEIVED")
            app.logger.info("=" * 50)
            
            # Log request details
            app.logger.info(f"Method: {request.method}")
            app.logger.info(f"Content-Type: {request.content_type}")
            app.logger.info(f"Origin: {request.headers.get('Origin')}")
            
            # Check Content-Type
            if not request.is_json:
                app.logger.error("❌ Not JSON request")
                return jsonify({
                    "success": False,
                    "error": "Content-Type must be application/json"
                }), 400
            
            # Get data
            data = request.get_json()
            app.logger.info(f"📝 Data received: {data}")
            
            if not data:
                app.logger.error("❌ No data provided")
                return jsonify({
                    "success": False,
                    "error": "No data provided"
                }), 400
            
            # Extract credentials
            email = data.get("email", "").lower().strip()
            password = data.get("password")
            
            app.logger.info(f"🔑 Login attempt for email: {email}")
            
            if not email:
                app.logger.error("❌ Email missing")
                return jsonify({
                    "success": False,
                    "error": "Email is required"
                }), 400
            
            if not password:
                app.logger.error("❌ Password missing")
                return jsonify({
                    "success": False,
                    "error": "Password is required"
                }), 400
            
            # Find shop
            app.logger.info("🔍 Looking up shop...")
            shop = Shop.query.filter_by(email=email).first()
            
            if not shop:
                app.logger.warning(f"❌ Shop not found: {email}")
                return jsonify({
                    "success": False,
                    "error": "Invalid email or password"
                }), 401
            
            app.logger.info(f"✅ Shop found: {shop.name} (ID: {shop.id})")
            app.logger.info(f"Shop status: {shop.status}")
            
            # Check status
            if shop.status != "active":
                app.logger.warning(f"❌ Shop is {shop.status}: {email}")
                return jsonify({
                    "success": False,
                    "error": "Shop account is inactive. Please contact support."
                }), 403
            
            # Check password
            app.logger.info("🔐 Verifying password...")
            if not shop.check_password(password):
                app.logger.warning(f"❌ Wrong password for: {email}")
                return jsonify({
                    "success": False,
                    "error": "Invalid email or password"
                }), 401
            
            app.logger.info("✅ Password verified successfully")
            
            # Update last active
            shop.last_active = datetime.utcnow()
            db.session.commit()
            
            # Login user
            login_user(shop, remember=True)
            
            app.logger.info(f"✅ Login successful: {email}")
            
            # Prepare response
            response_data = {
                "success": True,
                "message": "Login successful",
                "shop": {
                    "id": shop.id,
                    "name": shop.name,
                    "email": shop.email,
                    "phone": shop.phone,
                    "address": shop.address,
                    "owner": shop.owner,
                    "subscription": shop.subscription,
                    "status": shop.status,
                    "revenue": shop.revenue,
                    "users": shop.users_count,
                    "createdAt": shop.created_at.strftime("%Y-%m-%d") if shop.created_at else None,
                    "lastActive": shop.last_active.strftime("%Y-%m-%d %H:%M") if shop.last_active else None
                },
                "user": {
                    "id": shop.id,
                    "email": shop.email,
                    "name": shop.name,
                    "owner": shop.owner,
                    "is_admin": False,
                    "role": "shop_owner"
                }
            }
            
            response = jsonify(response_data), 200
            
            # Add CORS headers
            origin = request.headers.get("Origin")
            if origin:
                allowed_origins = app.config["CORS_ORIGINS"]
                if origin.rstrip('/') in allowed_origins:
                    response[0].headers["Access-Control-Allow-Origin"] = origin
                    response[0].headers["Access-Control-Allow-Credentials"] = "true"
            
            app.logger.info("=" * 50)
            app.logger.info("✅ LOGIN COMPLETED SUCCESSFULLY")
            app.logger.info("=" * 50)
            
            return response
            
        except Exception as e:
            app.logger.error("=" * 50)
            app.logger.error("❌ LOGIN ERROR")
            app.logger.error("=" * 50)
            app.logger.error(f"Error type: {type(e).__name__}")
            app.logger.error(f"Error message: {str(e)}")
            app.logger.exception("Full traceback:")
            app.logger.error("=" * 50)
            
            return jsonify({
                "success": False,
                "error": "Login failed. Please try again."
            }), 500
    
    # =====================================================
    # SHOP LOGOUT
    # =====================================================
    
    @app.route("/api/shop/logout", methods=["POST", "OPTIONS"])
    @login_required
    def shop_logout():
        if request.method == "OPTIONS":
            response = jsonify({"success": True})
            origin = request.headers.get("Origin")
            if origin:
                allowed_origins = app.config["CORS_ORIGINS"]
                if origin.rstrip('/') in allowed_origins:
                    response.headers["Access-Control-Allow-Origin"] = origin
                    response.headers["Access-Control-Allow-Credentials"] = "true"
            return response, 200
        
        try:
            logout_user()
            response = jsonify({
                "success": True,
                "message": "Logged out successfully"
            }), 200
            
            origin = request.headers.get("Origin")
            if origin:
                allowed_origins = app.config["CORS_ORIGINS"]
                if origin.rstrip('/') in allowed_origins:
                    response[0].headers["Access-Control-Allow-Origin"] = origin
                    response[0].headers["Access-Control-Allow-Credentials"] = "true"
            
            return response
        except Exception as e:
            app.logger.error(f"Logout error: {str(e)}")
            return jsonify({
                "success": False,
                "error": "Logout failed"
            }), 500
    
    # =====================================================
    # CURRENT SHOP PROFILE
    # =====================================================
    
    @app.route("/api/shop/me", methods=["GET", "OPTIONS"])
    @login_required
    def get_shop_profile():
        if request.method == "OPTIONS":
            response = jsonify({"success": True})
            origin = request.headers.get("Origin")
            if origin:
                allowed_origins = app.config["CORS_ORIGINS"]
                if origin.rstrip('/') in allowed_origins:
                    response.headers["Access-Control-Allow-Origin"] = origin
                    response.headers["Access-Control-Allow-Credentials"] = "true"
            return response, 200
        
        try:
            shop = Shop.query.get(current_user.id)
            if not shop:
                return jsonify({
                    "success": False,
                    "error": "Shop not found"
                }), 404
            
            response = jsonify({
                "success": True,
                "shop": {
                    "id": shop.id,
                    "name": shop.name,
                    "email": shop.email,
                    "phone": shop.phone,
                    "address": shop.address,
                    "owner": shop.owner,
                    "subscription": shop.subscription,
                    "status": shop.status,
                    "revenue": shop.revenue,
                    "users": shop.users_count,
                    "createdAt": shop.created_at.strftime("%Y-%m-%d") if shop.created_at else None,
                    "lastActive": shop.last_active.strftime("%Y-%m-%d %H:%M") if shop.last_active else None
                }
            }), 200
            
            origin = request.headers.get("Origin")
            if origin:
                allowed_origins = app.config["CORS_ORIGINS"]
                if origin.rstrip('/') in allowed_origins:
                    response[0].headers["Access-Control-Allow-Origin"] = origin
                    response[0].headers["Access-Control-Allow-Credentials"] = "true"
            
            return response
            
        except Exception as e:
            app.logger.error(f"Profile error: {str(e)}")
            return jsonify({
                "success": False,
                "error": "Failed to load profile"
            }), 500
    
    # =====================================================
    # HEALTH CHECK
    # =====================================================
    
    @app.route("/health", methods=["GET"])
    def health():
        try:
            with db.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return jsonify({
                "status": "healthy",
                "database": "connected",
                "environment": app.config["ENV"]
            }), 200
        except Exception as e:
            return jsonify({
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e)
            }), 500
    
    @app.route("/", methods=["GET"])
    def index():
        return jsonify({
            "name": "Tirsi POS API",
            "version": "1.0.0",
            "status": "running",
            "environment": app.config["ENV"]
        }), 200


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