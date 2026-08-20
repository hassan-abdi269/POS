# app.py
# ============================================================
# TIRSI POS API
# Production-ready Flask application
# Render + Aiven/MySQL + React frontend
# ============================================================

import os
import traceback
from datetime import datetime, timedelta

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
    request,
)

from flask_cors import CORS
from flask_session import Session

from flask_login import (
    login_required,
    current_user,
    LoginManager,
    login_user,
    logout_user,
)

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

# ============================================================
# APPLICATION IMPORTS
# ============================================================

from extensions import (
    db,
    migrate,
    login_manager,
    bcrypt,
)

from models.shop import Shop
from routes.auth import AdminUser


# ============================================================
# CONSTANTS
# ============================================================

DEFAULT_FRONTEND_URL = "https://pos-frontend-j0hd.onrender.com"

LOCAL_FRONTEND_URLS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def get_allowed_origins():
    """
    Get allowed frontend origins from CORS_ORIGINS.

    Example .env:

    CORS_ORIGINS=https://pos-frontend-j0hd.onrender.com,http://localhost:5173
    """

    configured_origins = os.getenv("CORS_ORIGINS", "").strip()

    if configured_origins:
        origins = [
            origin.strip().rstrip("/")
            for origin in configured_origins.split(",")
            if origin.strip()
        ]
    else:
        origins = [
            DEFAULT_FRONTEND_URL,
            *LOCAL_FRONTEND_URLS,
        ]

    # Remove duplicates while preserving order
    return list(dict.fromkeys(origins))


def get_request_origin():
    """
    Return normalized Origin header.
    """

    origin = request.headers.get("Origin")

    if not origin:
        return None

    return origin.rstrip("/")


def is_allowed_origin(origin):
    """
    Check whether the request origin is allowed.
    """

    if not origin:
        return False

    return origin.rstrip("/") in current_app_allowed_origins()


def current_app_allowed_origins():
    """
    Return current configured CORS origins.

    Kept as a function so routes can safely access
    the configuration after application creation.
    """

    from flask import current_app

    return current_app.config.get("CORS_ORIGINS", [])


def add_cors_headers(response):
    """
    Add CORS headers for the current request.

    Flask-CORS handles most of this automatically,
    but this helper ensures API responses are also
    correct for cookie-based authentication.
    """

    origin = get_request_origin()

    if origin and origin in current_app_allowed_origins():
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"

    response.headers["Vary"] = "Origin"

    return response


def cors_options_response():
    """
    Handle CORS preflight requests.

    Browser:

        OPTIONS /api/shop/login

    before:

        POST /api/shop/login
    """

    response = jsonify({
        "success": True,
        "message": "CORS preflight successful"
    })

    origin = get_request_origin()

    if origin and origin in current_app_allowed_origins():

        response.headers["Access-Control-Allow-Origin"] = origin

        response.headers["Access-Control-Allow-Credentials"] = "true"

        response.headers["Access-Control-Allow-Headers"] = (
            "Content-Type, "
            "Authorization, "
            "X-Shop-ID, "
            "X-Requested-With, "
            "Accept"
        )

        response.headers["Access-Control-Allow-Methods"] = (
            "GET, "
            "POST, "
            "PUT, "
            "PATCH, "
            "DELETE, "
            "OPTIONS"
        )

        response.headers["Access-Control-Max-Age"] = "86400"

    response.headers["Vary"] = "Origin"

    return response, 204


def serialize_shop(shop):
    """
    Convert Shop model into JSON-safe dictionary.
    """

    return {
        "id": shop.id,
        "name": getattr(shop, "name", None),
        "email": getattr(shop, "email", None),
        "phone": getattr(shop, "phone", None),
        "address": getattr(shop, "address", None),
        "owner": getattr(shop, "owner", None),
        "subscription": getattr(shop, "subscription", None),
        "status": getattr(shop, "status", None),
        "revenue": getattr(shop, "revenue", 0),
        "users": getattr(shop, "users_count", 0),

        "createdAt": (
            shop.created_at.strftime("%Y-%m-%d")
            if getattr(shop, "created_at", None)
            else None
        ),

        "lastActive": (
            shop.last_active.strftime("%Y-%m-%d %H:%M")
            if getattr(shop, "last_active", None)
            else None
        ),
    }


# ============================================================
# APPLICATION FACTORY
# ============================================================

def create_app(config_name="development"):

    app = Flask(__name__)

    # ========================================================
    # BASIC CONFIGURATION
    # ========================================================

    environment = os.getenv(
        "ENV",
        config_name or "development"
    )

    secret_key = os.getenv("SECRET_KEY")

    if not secret_key:
        if environment == "production":
            raise RuntimeError(
                "SECRET_KEY environment variable is required in production."
            )

        secret_key = "dev-secret-key-change-in-production"

    app.config["SECRET_KEY"] = secret_key

    app.config["ENV"] = environment

    app.config["DEBUG"] = (
        os.getenv("DEBUG", "False").lower() == "true"
    )

    # ========================================================
    # DATABASE CONFIGURATION
    # ========================================================

    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "3306")
    db_name = os.getenv("DB_NAME", "tirsi_pos_db")
    db_user = os.getenv("DB_USER", "tirsi_user")
    db_password = os.getenv("DB_PASSWORD", "tirsi123")

    # --------------------------------------------------------
    # Allow DATABASE_URL if supplied by Render/provider
    # --------------------------------------------------------

    database_url = os.getenv("DATABASE_URL")

    if database_url:

        # Render/provider may provide postgres://
        # while SQLAlchemy requires postgresql://

        if database_url.startswith("postgres://"):
            database_url = database_url.replace(
                "postgres://",
                "postgresql://",
                1
            )

        app.config["SQLALCHEMY_DATABASE_URI"] = database_url

    else:

        app.config["SQLALCHEMY_DATABASE_URI"] = (
            f"mysql+pymysql://"
            f"{db_user}:{db_password}@"
            f"{db_host}:{db_port}/"
            f"{db_name}"
            f"?charset=utf8mb4"
        )

    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # ========================================================
    # DATABASE ENGINE OPTIONS
    # ========================================================

    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_pre_ping": True,
        "pool_recycle": 280,
        "pool_timeout": 30,
        "max_overflow": 10,
        "connect_args": {
            "connect_timeout": 15,
        },
    }

    # --------------------------------------------------------
    # Optional Aiven SSL
    # --------------------------------------------------------

    aiven_ca = os.getenv("AIVEN_CA_PATH")

    if aiven_ca and os.path.exists(aiven_ca):

        app.config["SQLALCHEMY_ENGINE_OPTIONS"][
            "connect_args"
        ]["ssl"] = {
            "ca": aiven_ca
        }

    # ========================================================
    # CORS CONFIGURATION
    # ========================================================

    allowed_origins = get_allowed_origins()

    app.config["CORS_ORIGINS"] = allowed_origins

    # ========================================================
    # SESSION CONFIGURATION
    # ========================================================

    app.config["SESSION_TYPE"] = "filesystem"

    app.config["SESSION_PERMANENT"] = True

    app.config["SESSION_USE_SIGNER"] = True

    app.config["SESSION_KEY_PREFIX"] = "tirsi_"

    app.config["SESSION_COOKIE_NAME"] = "session"

    app.config["SESSION_COOKIE_HTTPONLY"] = True

    # --------------------------------------------------------
    # IMPORTANT FOR RENDER FRONTEND + RENDER BACKEND
    # --------------------------------------------------------

    app.config["SESSION_COOKIE_SAMESITE"] = "None"

    app.config["SESSION_COOKIE_SECURE"] = (
        environment == "production"
    )

    app.config["SESSION_REFRESH_EACH_REQUEST"] = True

    app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(
        days=1
    )

    # ========================================================
    # FLASK-LOGIN COOKIE CONFIGURATION
    # ========================================================

    app.config["REMEMBER_COOKIE_HTTPONLY"] = True

    app.config["REMEMBER_COOKIE_SAMESITE"] = "None"

    app.config["REMEMBER_COOKIE_SECURE"] = (
        environment == "production"
    )

    app.config["REMEMBER_COOKIE_DURATION"] = timedelta(
        days=30
    )

    # ========================================================
    # ADMIN CONFIGURATION
    # ========================================================

    app.config["ADMIN_EMAIL"] = os.getenv(
        "ADMIN_EMAIL",
        "superadmin@system.com"
    )

    # ========================================================
    # PRINT CONFIGURATION
    # ========================================================

    print("=" * 70)
    print("🚀 STARTING TIRSI POS API")
    print("=" * 70)

    print(f"Environment: {environment}")

    print(
        f"Debug: {app.config['DEBUG']}"
    )

    print(
        f"Database Host: {db_host}"
    )

    print(
        f"Database Port: {db_port}"
    )

    print(
        f"Database Name: {db_name}"
    )

    print(
        f"Database User: {db_user}"
    )

    print(
        f"Database Password: "
        f"{'SET' if db_password else 'NOT SET'}"
    )

    print(
        f"Database URL: "
        f"{'DATABASE_URL' if database_url else 'DB_* variables'}"
    )

    print(
        f"CORS Origins: {allowed_origins}"
    )

    print(
        f"Session SameSite: "
        f"{app.config['SESSION_COOKIE_SAMESITE']}"
    )

    print(
        f"Session Secure: "
        f"{app.config['SESSION_COOKIE_SECURE']}"
    )

    print("=" * 70)

    # ========================================================
    # INITIALIZE DATABASE
    # ========================================================

    db.init_app(app)

    print("✅ SQLAlchemy initialized")

    # ========================================================
    # INITIALIZE MIGRATIONS
    # ========================================================

    migrate.init_app(app, db)

    print("✅ Flask-Migrate initialized")

    # ========================================================
    # INITIALIZE CORS
    # ========================================================

    CORS(
        app,

        resources={
            r"/api/*": {
                "origins": allowed_origins
            }
        },

        supports_credentials=True,

        allow_headers=[
            "Content-Type",
            "Authorization",
            "X-Shop-ID",
            "X-Requested-With",
            "Accept",
            "Origin",
        ],

        expose_headers=[
            "Content-Type",
            "Authorization",
        ],

        methods=[
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],

        max_age=86400,
    )

    print("✅ CORS initialized")

    # ========================================================
    # INITIALIZE SESSION
    # ========================================================

    Session(app)

    print("✅ Flask-Session initialized")

    # ========================================================
    # INITIALIZE FLASK-LOGIN
    # ========================================================

    login_manager.init_app(app)

    login_manager.session_protection = "strong"

    print("✅ Flask-Login initialized")

    # ========================================================
    # INITIALIZE BCRYPT
    # ========================================================

    bcrypt.init_app(app)

    print("✅ Bcrypt initialized")

    # ========================================================
    # USER LOADER
    # ========================================================

    @login_manager.user_loader
    def load_user(user_id):

        try:

            if not user_id:
                return None

            # ------------------------------------------------
            # Super Admin
            # ------------------------------------------------

            if str(user_id).startswith("admin:"):

                return AdminUser(
                    app.config["ADMIN_EMAIL"]
                )

            # ------------------------------------------------
            # Backward compatibility for admin ID 1
            # ------------------------------------------------

            if str(user_id) == "1":

                return AdminUser(
                    app.config["ADMIN_EMAIL"]
                )

            # ------------------------------------------------
            # Shop
            # ------------------------------------------------

            try:
                shop_id = int(user_id)
            except (ValueError, TypeError):
                return None

            shop = db.session.get(
                Shop,
                shop_id
            )

            if shop:

                return shop

        except Exception as e:

            app.logger.exception(
                f"User loader error: {e}"
            )

        return None

    # ========================================================
    # UNAUTHORIZED HANDLER
    # ========================================================

    @login_manager.unauthorized_handler
    def unauthorized_handler():

        response = jsonify({
            "success": False,
            "authenticated": False,
            "error": "Authentication required"
        })

        response.status_code = 401

        return add_cors_headers(response)

    # ========================================================
    # REGISTER ROUTES
    # ========================================================

    register_routes(app)

    # ========================================================
    # GLOBAL ERROR HANDLERS
    # ========================================================

    @app.errorhandler(400)
    def bad_request(error):

        response = jsonify({
            "success": False,
            "error": "Bad request"
        })

        return add_cors_headers(response), 400

    @app.errorhandler(401)
    def unauthorized(error):

        response = jsonify({
            "success": False,
            "error": "Unauthorized"
        })

        return add_cors_headers(response), 401

    @app.errorhandler(403)
    def forbidden(error):

        response = jsonify({
            "success": False,
            "error": "Forbidden"
        })

        return add_cors_headers(response), 403

    @app.errorhandler(404)
    def not_found(error):

        response = jsonify({
            "success": False,
            "error": "Endpoint not found",
            "path": request.path
        })

        return add_cors_headers(response), 404

    @app.errorhandler(405)
    def method_not_allowed(error):

        response = jsonify({
            "success": False,
            "error": "Method not allowed",
            "method": request.method,
            "path": request.path
        })

        return add_cors_headers(response), 405

    @app.errorhandler(500)
    def server_error(error):

        app.logger.exception(
            "Unhandled server error"
        )

        response = jsonify({
            "success": False,
            "error": "Internal server error"
        })

        return add_cors_headers(response), 500

    # ========================================================
    # DATABASE TEST
    # ========================================================

    test_database_connection(app)

    print("=" * 70)
    print("✅ TIRSI POS API READY")
    print("=" * 70)

    return app


# ============================================================
# DATABASE CONNECTION TEST
# ============================================================

def test_database_connection(app):

    print("=" * 70)
    print("🔍 TESTING DATABASE CONNECTION")
    print("=" * 70)

    try:

        with app.app_context():

            result = db.session.execute(
                text("SELECT 1")
            )

            result.scalar()

            print(
                "✅ Database connected successfully"
            )

            database_name = db.session.execute(
                text("SELECT DATABASE()")
            ).scalar()

            print(
                f"✅ Connected database: "
                f"{database_name}"
            )

            version = db.session.execute(
                text("SELECT VERSION()")
            ).scalar()

            print(
                f"✅ MySQL version: {version}"
            )

    except Exception as e:

        print("=" * 70)
        print("❌ DATABASE CONNECTION FAILED")
        print("=" * 70)

        print(
            f"Error: {str(e)}"
        )

        print()
        print("Possible causes:")
        print("1. Incorrect DB_HOST")
        print("2. Incorrect DB_PORT")
        print("3. Incorrect DB_NAME")
        print("4. Incorrect DB_USER")
        print("5. Incorrect DB_PASSWORD")
        print("6. Aiven database unavailable")
        print("7. Aiven SSL configuration")
        print("8. Database user has insufficient permissions")
        print()

        traceback.print_exc()

        # ----------------------------------------------------
        # Do NOT crash the whole application here.
        # Health endpoint will report database status.
        # ----------------------------------------------------


# ============================================================
# ROUTES
# ============================================================

def register_routes(app):

    # ========================================================
    # SHOP LOGIN
    # ========================================================

    @app.route(
        "/api/shop/login",
        methods=["POST", "OPTIONS"]
    )
    def shop_login():

        # ----------------------------------------------------
        # CORS PREFLIGHT
        # ----------------------------------------------------

        if request.method == "OPTIONS":

            return cors_options_response()

        try:

            # ------------------------------------------------
            # Validate JSON
            # ------------------------------------------------

            if not request.is_json:

                response = jsonify({
                    "success": False,
                    "error": (
                        "Content-Type must be "
                        "application/json"
                    )
                })

                return add_cors_headers(response), 400

            data = request.get_json(
                silent=True
            )

            if not data:

                response = jsonify({
                    "success": False,
                    "error": "No data provided"
                })

                return add_cors_headers(response), 400

            # ------------------------------------------------
            # Credentials
            # ------------------------------------------------

            email = str(
                data.get("email", "")
            ).strip().lower()

            password = data.get("password")

            if not email or not password:

                response = jsonify({
                    "success": False,
                    "error": (
                        "Email and password "
                        "are required"
                    )
                })

                return add_cors_headers(response), 400

            # ------------------------------------------------
            # Find Shop
            # ------------------------------------------------

            shop = Shop.query.filter_by(
                email=email
            ).first()

            if not shop:

                response = jsonify({
                    "success": False,
                    "error": "Invalid email or password"
                })

                return add_cors_headers(response), 401

            # ------------------------------------------------
            # Shop status
            # ------------------------------------------------

            shop_status = getattr(
                shop,
                "status",
                "active"
            )

            if shop_status != "active":

                response = jsonify({
                    "success": False,
                    "error": "Shop account is inactive"
                })

                return add_cors_headers(response), 403

            # ------------------------------------------------
            # Password verification
            # ------------------------------------------------

            if not shop.check_password(password):

                response = jsonify({
                    "success": False,
                    "error": "Invalid email or password"
                })

                return add_cors_headers(response), 401

            # ------------------------------------------------
            # Update last active
            # ------------------------------------------------

            if hasattr(shop, "last_active"):

                shop.last_active = datetime.utcnow()

                db.session.commit()

            # ------------------------------------------------
            # Flask Login
            # ------------------------------------------------

            login_user(
                shop,
                remember=True
            )

            # ------------------------------------------------
            # Make session permanent
            # ------------------------------------------------

            session.permanent = True

            # ------------------------------------------------
            # Prepare response
            # ------------------------------------------------

            shop_data = serialize_shop(
                shop
            )

            response = jsonify({

                "success": True,

                "authenticated": True,

                "message": "Login successful",

                "shop": shop_data,

                "user": {
                    "id": shop.id,
                    "email": shop.email,
                    "name": getattr(
                        shop,
                        "name",
                        None
                    ),
                    "owner": getattr(
                        shop,
                        "owner",
                        None
                    ),
                    "is_admin": False,
                    "role": "shop_owner"
                }
            })

            response = add_cors_headers(
                response
            )

            return response, 200

        except SQLAlchemyError as e:

            db.session.rollback()

            app.logger.exception(
                "Database error during shop login"
            )

            response = jsonify({
                "success": False,
                "error": (
                    "Database error while "
                    "processing login"
                )
            })

            return add_cors_headers(
                response
            ), 500

        except Exception as e:

            db.session.rollback()

            app.logger.exception(
                f"Shop login error: {e}"
            )

            response = jsonify({
                "success": False,
                "error": (
                    "Login failed. "
                    "Please try again."
                )
            })

            return add_cors_headers(
                response
            ), 500

    # ========================================================
    # AUTH LOGIN ALIAS
    # ========================================================

    @app.route(
        "/api/auth/login",
        methods=["POST", "OPTIONS"]
    )
    def auth_login():

        """
        Compatibility endpoint.

        The main POS login endpoint is:

            /api/shop/login

        This alias prevents older frontend builds
        from failing with 404/CORS errors.
        """

        if request.method == "OPTIONS":

            return cors_options_response()

        return shop_login()

    # ========================================================
    # SHOP LOGOUT
    # ========================================================

    @app.route(
        "/api/shop/logout",
        methods=["POST", "OPTIONS"]
    )
    @login_required
    def shop_logout():

        if request.method == "OPTIONS":

            return cors_options_response()

        try:

            logout_user()

            session.clear()

            response = jsonify({
                "success": True,
                "message": "Logged out successfully",
                "authenticated": False
            })

            return add_cors_headers(
                response
            ), 200

        except Exception as e:

            app.logger.exception(
                f"Logout error: {e}"
            )

            response = jsonify({
                "success": False,
                "error": "Logout failed"
            })

            return add_cors_headers(
                response
            ), 500

    # ========================================================
    # CURRENT SHOP PROFILE
    # ========================================================

    @app.route(
        "/api/shop/me",
        methods=["GET", "OPTIONS"]
    )
    @login_required
    def get_shop_profile():

        if request.method == "OPTIONS":

            return cors_options_response()

        try:

            shop = db.session.get(
                Shop,
                current_user.id
            )

            if not shop:

                response = jsonify({
                    "success": False,
                    "error": "Shop not found"
                })

                return add_cors_headers(
                    response
                ), 404

            response = jsonify({

                "success": True,

                "authenticated": True,

                "shop": serialize_shop(
                    shop
                )
            })

            return add_cors_headers(
                response
            ), 200

        except Exception as e:

            app.logger.exception(
                f"Profile error: {e}"
            )

            response = jsonify({
                "success": False,
                "error": "Failed to load profile"
            })

            return add_cors_headers(
                response
            ), 500

    # ========================================================
    # AUTH STATUS
    # ========================================================

    @app.route(
        "/api/auth/me",
        methods=["GET", "OPTIONS"]
    )
    def auth_me():

        if request.method == "OPTIONS":

            return cors_options_response()

        try:

            if not current_user.is_authenticated:

                response = jsonify({
                    "success": True,
                    "authenticated": False,
                    "user": None
                })

                return add_cors_headers(
                    response
                ), 200

            if isinstance(current_user, Shop):

                response = jsonify({

                    "success": True,

                    "authenticated": True,

                    "user": {
                        "id": current_user.id,
                        "email": current_user.email,
                        "name": getattr(
                            current_user,
                            "name",
                            None
                        ),
                        "owner": getattr(
                            current_user,
                            "owner",
                            None
                        ),
                        "role": "shop_owner",
                        "is_admin": False
                    },

                    "shop": serialize_shop(
                        current_user
                    )
                })

                return add_cors_headers(
                    response
                ), 200

            response = jsonify({

                "success": True,

                "authenticated": True,

                "user": {
                    "email": app.config[
                        "ADMIN_EMAIL"
                    ],
                    "role": "super_admin",
                    "is_admin": True
                }
            })

            return add_cors_headers(
                response
            ), 200

        except Exception as e:

            app.logger.exception(
                f"Auth status error: {e}"
            )

            response = jsonify({
                "success": False,
                "authenticated": False,
                "error": "Failed to check authentication"
            })

            return add_cors_headers(
                response
            ), 500

    # ========================================================
    # AUTH LOGOUT
    # ========================================================

    @app.route(
        "/api/auth/logout",
        methods=["POST", "OPTIONS"]
    )
    def auth_logout():

        if request.method == "OPTIONS":

            return cors_options_response()

        try:

            logout_user()

            session.clear()

            response = jsonify({
                "success": True,
                "authenticated": False,
                "message": "Logout successful"
            })

            return add_cors_headers(
                response
            ), 200

        except Exception as e:

            app.logger.exception(
                f"Auth logout error: {e}"
            )

            response = jsonify({
                "success": False,
                "error": "Logout failed"
            })

            return add_cors_headers(
                response
            ), 500

    # ========================================================
    # API TEST
    # ========================================================

    @app.route(
        "/api/test",
        methods=["GET", "OPTIONS"]
    )
    def test():

        if request.method == "OPTIONS":

            return cors_options_response()

        response = jsonify({

            "success": True,

            "message": "Tirsi POS API is working",

            "timestamp": datetime.utcnow().isoformat(),

            "environment": app.config["ENV"],

            "cors": True
        })

        return add_cors_headers(
            response
        ), 200

    # ========================================================
    # HEALTH CHECK
    # ========================================================

    @app.route(
        "/health",
        methods=["GET"]
    )
    def health():

        try:

            with db.engine.connect() as connection:

                connection.execute(
                    text("SELECT 1")
                )

            response = jsonify({

                "status": "healthy",

                "database": "connected",

                "environment": app.config[
                    "ENV"
                ],

                "timestamp": datetime.utcnow().isoformat()
            })

            return response, 200

        except Exception as e:

            app.logger.exception(
                f"Health check database error: {e}"
            )

            response = jsonify({

                "status": "unhealthy",

                "database": "disconnected",

                "environment": app.config[
                    "ENV"
                ],

                "error": str(e)
            })

            return response, 500

    # ========================================================
    # ROOT
    # ========================================================

    @app.route(
        "/",
        methods=["GET"]
    )
    def index():

        return jsonify({

            "name": "Tirsi POS API",

            "version": "1.0.0",

            "status": "running",

            "environment": app.config[
                "ENV"
            ],

            "endpoints": {

                "health": "/health",

                "test": "/api/test",

                "shop_login": "/api/shop/login",

                "shop_logout": "/api/shop/logout",

                "shop_me": "/api/shop/me",

                "auth_login": "/api/auth/login",

                "auth_me": "/api/auth/me",

                "auth_logout": "/api/auth/logout"
            }
        }), 200


# ============================================================
# CREATE APPLICATION
# ============================================================

app = create_app(
    os.getenv(
        "ENV",
        "development"
    )
)


# ============================================================
# DEVELOPMENT SERVER
# ============================================================

if __name__ == "__main__":

    port = int(
        os.getenv(
            "PORT",
            "5000"
        )
    )

    debug = (
        os.getenv(
            "DEBUG",
            "False"
        ).lower() == "true"
    )

    app.run(
        host="0.0.0.0",
        port=port,
        debug=debug
    )