# ============================================================
# TIRSI POS API
# APPLICATION FACTORY
#
# app.py responsibilities:
#
#   - Create Flask application
#   - Configure environment
#   - Configure database
#   - Configure CORS
#   - Configure Flask-Session
#   - Configure Flask-Login
#   - Configure Bcrypt
#   - Configure Flask-Migrate
#   - Configure user loader
#   - Register auth routes
#   - Register shop routes
#   - Health check
#   - API test
#   - Root API information
#   - Error handlers
#
# IMPORTANT:
#
# Authentication routes belong to:
#       routes/auth.py
#
# Shop routes belong to:
#       routes/shop.py
#
# DO NOT duplicate those routes here.
#
# Frontend:
#   https://pos-frontend-j0hd.onrender.com
#
# Backend:
#   https://pos-api4.onrender.com
# ============================================================


# ============================================================
# STANDARD LIBRARY
# ============================================================

import os
import traceback
from datetime import datetime, timedelta


# ============================================================
# ENVIRONMENT
# ============================================================

from dotenv import load_dotenv

load_dotenv(override=True)


# ============================================================
# FLASK
# ============================================================

from flask import (
    Flask,
    jsonify,
    request,
    current_app,
)


# ============================================================
# FLASK EXTENSIONS
# ============================================================

from flask_cors import CORS
from flask_session import Session
from flask_login import LoginManager


# ============================================================
# DATABASE
# ============================================================

from sqlalchemy import text


# ============================================================
# APPLICATION EXTENSIONS
# ============================================================

from extensions import (
    db,
    migrate,
    bcrypt,
)


# ============================================================
# MODELS
# ============================================================

from models.shop import Shop


# ============================================================
# ROUTES
# ============================================================

from routes.auth import (
    init_auth_routes,
    AdminUser,
)

from routes.shop import (
    init_shop_routes,
)


# ============================================================
# FLASK-LOGIN MANAGER
# ============================================================

login_manager = LoginManager()

# API application should return JSON instead
# of redirecting to an HTML login page.
login_manager.login_view = None


# ============================================================
# FRONTEND
# ============================================================

DEFAULT_FRONTEND_URL = (
    "https://pos-frontend-j0hd.onrender.com"
)


LOCAL_FRONTEND_URLS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


# ============================================================
# ALLOWED CORS ORIGINS
# ============================================================

def get_allowed_origins():
    """
    Get allowed frontend origins from CORS_ORIGINS.

    Example Render environment variable:

        CORS_ORIGINS=https://pos-frontend-j0hd.onrender.com

    Multiple origins can be separated by commas.
    """

    configured = os.getenv(
        "CORS_ORIGINS",
        ""
    ).strip()

    if configured:

        origins = [
            origin.strip().rstrip("/")
            for origin in configured.split(",")
            if origin.strip()
        ]

    else:

        origins = [
            DEFAULT_FRONTEND_URL,
            *LOCAL_FRONTEND_URLS,
        ]

    # Remove duplicates while preserving order.
    return list(
        dict.fromkeys(origins)
    )


# ============================================================
# REQUEST ORIGIN
# ============================================================

def get_request_origin():
    """
    Return normalized Origin header.
    """

    origin = request.headers.get(
        "Origin"
    )

    if not origin:
        return None

    return origin.rstrip("/")


# ============================================================
# CHECK ALLOWED ORIGIN
# ============================================================

def is_allowed_origin(origin):
    """
    Check whether an origin is allowed.
    """

    if not origin:
        return False

    allowed_origins = current_app.config.get(
        "CORS_ORIGINS",
        []
    )

    return (
        origin.rstrip("/")
        in allowed_origins
    )


# ============================================================
# ADD CORS HEADERS
# ============================================================

def add_cors_headers(response):
    """
    Add CORS headers to JSON responses.

    This is useful for custom error responses
    and Flask-Login unauthorized responses.
    """

    origin = get_request_origin()

    if (
        origin
        and is_allowed_origin(origin)
    ):

        response.headers[
            "Access-Control-Allow-Origin"
        ] = origin

        response.headers[
            "Access-Control-Allow-Credentials"
        ] = "true"

    response.headers[
        "Vary"
    ] = "Origin"

    return response


# ============================================================
# CORS PREFLIGHT RESPONSE
# ============================================================

def cors_options_response():
    """
    Handle manual OPTIONS requests.

    Flask-CORS handles normal preflight requests,
    but this function is available for API routes
    that explicitly need an OPTIONS response.
    """

    response = jsonify({
        "success": True,
        "message": "CORS preflight successful",
    })

    origin = get_request_origin()

    if (
        origin
        and is_allowed_origin(origin)
    ):

        response.headers[
            "Access-Control-Allow-Origin"
        ] = origin

        response.headers[
            "Access-Control-Allow-Credentials"
        ] = "true"

        response.headers[
            "Access-Control-Allow-Headers"
        ] = (
            "Content-Type, "
            "Authorization, "
            "X-Shop-ID, "
            "X-Requested-With, "
            "Accept, "
            "Origin, "
            "Cookie"
        )

        response.headers[
            "Access-Control-Allow-Methods"
        ] = (
            "GET, "
            "POST, "
            "PUT, "
            "PATCH, "
            "DELETE, "
            "OPTIONS"
        )

        response.headers[
            "Access-Control-Max-Age"
        ] = "86400"

    response.headers[
        "Vary"
    ] = "Origin"

    return response, 204


# ============================================================
# APPLICATION FACTORY
# ============================================================

def create_app(config_name="development"):

    # ========================================================
    # CREATE FLASK APPLICATION
    # ========================================================

    app = Flask(__name__)


    # ========================================================
    # ENVIRONMENT
    # ========================================================

    environment = os.getenv(
        "ENV",
        config_name
    ).strip().lower()

    app.config[
        "ENV"
    ] = environment


    # ========================================================
    # DEBUG
    # ========================================================

    app.config[
        "DEBUG"
    ] = (
        os.getenv(
            "DEBUG",
            "False"
        ).strip().lower()
        == "true"
    )


    # ========================================================
    # SECRET KEY
    # ========================================================

    secret_key = os.getenv(
        "SECRET_KEY"
    )

    if not secret_key:

        if environment == "production":

            raise RuntimeError(
                "SECRET_KEY environment variable "
                "is required in production."
            )

        secret_key = (
            "development-secret-key-change-me"
        )

    app.config[
        "SECRET_KEY"
    ] = secret_key


    # ========================================================
    # ADMIN CONFIGURATION
    #
    # Used by routes/auth.py
    # ========================================================

    app.config[
        "ADMIN_EMAIL"
    ] = os.getenv(
        "ADMIN_EMAIL",
        "superadmin@system.com"
    ).strip().lower()


    app.config[
        "ADMIN_PASSWORD_HASH"
    ] = os.getenv(
        "ADMIN_PASSWORD_HASH",
        ""
    ).strip()


    # ========================================================
    # DATABASE ENVIRONMENT VARIABLES
    # ========================================================

    db_host = os.getenv(
        "DB_HOST",
        "localhost"
    )

    db_port = os.getenv(
        "DB_PORT",
        "3306"
    )

    db_name = os.getenv(
        "DB_NAME",
        "tirsi_pos_db"
    )

    db_user = os.getenv(
        "DB_USER",
        "tirsi_user"
    )

    db_password = os.getenv(
        "DB_PASSWORD",
        "tirsi123"
    )


    # ========================================================
    # DATABASE URL
    #
    # Prefer DATABASE_URL when available.
    #
    # Otherwise build MySQL URL from DB_* variables.
    # ========================================================

    database_url = os.getenv(
        "DATABASE_URL"
    )

    if database_url:

        # Render / PostgreSQL compatibility.
        if database_url.startswith(
            "postgres://"
        ):

            database_url = database_url.replace(
                "postgres://",
                "postgresql://",
                1
            )

        app.config[
            "SQLALCHEMY_DATABASE_URI"
        ] = database_url

    else:

        app.config[
            "SQLALCHEMY_DATABASE_URI"
        ] = (
            "mysql+pymysql://"
            f"{db_user}:"
            f"{db_password}@"
            f"{db_host}:"
            f"{db_port}/"
            f"{db_name}"
            "?charset=utf8mb4"
        )


    # ========================================================
    # SQLALCHEMY
    # ========================================================

    app.config[
        "SQLALCHEMY_TRACK_MODIFICATIONS"
    ] = False


    app.config[
        "SQLALCHEMY_ENGINE_OPTIONS"
    ] = {

        # Automatically verify connections
        # before using them.
        "pool_pre_ping": True,

        # Prevent stale MySQL connections.
        "pool_recycle": 280,

        # Connection wait timeout.
        "pool_timeout": 30,

        # Additional connections.
        "max_overflow": 10,

        "connect_args": {
            "connect_timeout": 15
        },
    }


    # ========================================================
    # AIVEN SSL
    #
    # Optional.
    #
    # If AIVEN_CA_PATH is supplied and the file exists,
    # use that CA certificate.
    # ========================================================

    aiven_ca = os.getenv(
        "AIVEN_CA_PATH"
    )

    if (
        aiven_ca
        and os.path.exists(aiven_ca)
    ):

        app.config[
            "SQLALCHEMY_ENGINE_OPTIONS"
        ][
            "connect_args"
        ][
            "ssl"
        ] = {
            "ca": aiven_ca
        }


    # ========================================================
    # CORS
    # ========================================================

    allowed_origins = get_allowed_origins()

    app.config[
        "CORS_ORIGINS"
    ] = allowed_origins


    # ========================================================
    # FLASK SESSION
    #
    # Frontend and backend are on different Render domains.
    #
    # Therefore:
    #
    #   SameSite=None
    #   Secure=True in production
    #
    # is required for cross-site cookies.
    # ========================================================

    app.config[
        "SESSION_TYPE"
    ] = "filesystem"


    app.config[
        "SESSION_PERMANENT"
    ] = True


    app.config[
        "SESSION_USE_SIGNER"
    ] = True


    app.config[
        "SESSION_KEY_PREFIX"
    ] = "tirsi_"


    app.config[
        "SESSION_COOKIE_NAME"
    ] = "tirsi_session"


    app.config[
        "SESSION_COOKIE_HTTPONLY"
    ] = True


    app.config[
        "SESSION_COOKIE_SAMESITE"
    ] = "None"


    app.config[
        "SESSION_COOKIE_SECURE"
    ] = (
        environment == "production"
    )


    app.config[
        "SESSION_REFRESH_EACH_REQUEST"
    ] = True


    app.config[
        "PERMANENT_SESSION_LIFETIME"
    ] = timedelta(
        days=1
    )


    # ========================================================
    # FLASK-LOGIN REMEMBER COOKIE
    # ========================================================

    app.config[
        "REMEMBER_COOKIE_HTTPONLY"
    ] = True


    app.config[
        "REMEMBER_COOKIE_SAMESITE"
    ] = "None"


    app.config[
        "REMEMBER_COOKIE_SECURE"
    ] = (
        environment == "production"
    )


    app.config[
        "REMEMBER_COOKIE_DURATION"
    ] = timedelta(
        days=1
    )


    # ========================================================
    # STARTUP INFORMATION
    # ========================================================

    print()
    print("=" * 70)
    print("🚀 STARTING TIRSI POS API")
    print("=" * 70)

    print(
        f"Environment: {environment}"
    )

    print(
        f"Debug: {app.config['DEBUG']}"
    )

    print(
        f"Admin email: "
        f"{app.config['ADMIN_EMAIL']}"
    )

    print(
        "Admin password hash: "
        f"{'SET' if app.config['ADMIN_PASSWORD_HASH'] else 'NOT SET'}"
    )

    print(
        f"Database host: {db_host}"
    )

    print(
        f"Database port: {db_port}"
    )

    print(
        f"Database name: {db_name}"
    )

    print(
        f"Database user: {db_user}"
    )

    print(
        "Database source: "
        f"{'DATABASE_URL' if database_url else 'DB_* variables'}"
    )

    print(
        f"CORS origins: {allowed_origins}"
    )

    print("=" * 70)


    # ========================================================
    # INITIALIZE SQLALCHEMY
    # ========================================================

    db.init_app(app)

    print(
        "✅ SQLAlchemy initialized"
    )


    # ========================================================
    # INITIALIZE FLASK-MIGRATE
    # ========================================================

    migrate.init_app(
        app,
        db
    )

    print(
        "✅ Flask-Migrate initialized"
    )


    # ========================================================
    # INITIALIZE BCRYPT
    # ========================================================

    bcrypt.init_app(app)

    print(
        "✅ Bcrypt initialized"
    )


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
            "Cookie",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers",
        ],

        methods=[
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],

        expose_headers=[
            "Content-Type"
        ],

        max_age=86400,
    )

    print(
        "✅ CORS initialized"
    )


    # ========================================================
    # INITIALIZE FLASK SESSION
    # ========================================================

    Session(app)

    print(
        "✅ Flask-Session initialized"
    )


    # ========================================================
    # INITIALIZE FLASK-LOGIN
    # ========================================================

    login_manager.init_app(app)

    login_manager.login_view = None

    # Strong protection can sometimes invalidate sessions
    # when client information changes.
    #
    # Keep it as requested for now.
    login_manager.session_protection = "strong"

    print(
        "✅ Flask-Login initialized"
    )


    # ========================================================
    # FLASK-LOGIN USER LOADER
    #
    # IMPORTANT:
    #
    # auth.py owns admin authentication.
    # shop.py owns shop authentication.
    #
    # This function ONLY tells Flask-Login how to restore
    # a logged-in user from the session.
    # ========================================================

    @login_manager.user_loader
    def load_user(user_id):

        try:

            if not user_id:
                return None

            user_id = str(
                user_id
            )


            # =================================================
            # ADMIN USER
            #
            # auth.py should call login_user() with:
            #
            #     AdminUser(...)
            #
            # whose get_id() returns:
            #
            #     admin:1
            #
            # =================================================

            if user_id == "admin:1":

                return AdminUser(
                    app.config[
                        "ADMIN_EMAIL"
                    ]
                )


            # =================================================
            # SHOP USER
            # =================================================

            try:

                shop_id = int(
                    user_id
                )

            except (
                ValueError,
                TypeError,
            ):

                return None


            shop = db.session.get(
                Shop,
                shop_id
            )

            return shop


        except Exception as e:

            app.logger.exception(
                f"User loader error: {e}"
            )

            return None


    # ========================================================
    # FLASK-LOGIN UNAUTHORIZED HANDLER
    # ========================================================

    @login_manager.unauthorized_handler
    def unauthorized():

        response = jsonify({

            "success": False,

            "authenticated": False,

            "error":
                "Authentication required"
        })

        return add_cors_headers(
            response
        ), 401


    # ========================================================
    # REGISTER AUTH ROUTES
    #
    # ALL authentication routes remain in auth.py.
    #
    # app.py does NOT define:
    #
    #   /api/auth/login
    #   /api/auth/logout
    #   /api/auth/check
    #   /api/auth/me
    #   /api/auth/session-status
    #   /api/auth/debug
    #
    # Those belong to routes/auth.py.
    # ========================================================

    init_auth_routes(
        app
    )

    print(
        "✅ Authentication routes registered"
    )


    # ========================================================
    # REGISTER SHOP ROUTES
    #
    # ALL shop routes remain in shop.py.
    #
    # app.py does NOT define:
    #
    #   /api/shop/login
    #   /api/shop/logout
    #   /api/shop/me
    #   /api/shops
    #   /api/shops/stats
    #
    # Those belong to routes/shop.py.
    # ========================================================

    init_shop_routes(
        app
    )

    print(
        "✅ Shop routes registered"
    )


    # ========================================================
    # API TEST
    #
    # This is intentionally kept in app.py because it is
    # an application-level health/test endpoint.
    # ========================================================

    @app.route(
        "/api/test",
        methods=[
            "GET",
            "OPTIONS"
        ]
    )
    def api_test():

        if request.method == "OPTIONS":

            return cors_options_response()


        response = jsonify({

            "success": True,

            "message":
                "Tirsi POS API is working",

            "timestamp":
                datetime.utcnow().isoformat(),

            "environment":
                app.config["ENV"]
        })

        return add_cors_headers(
            response
        ), 200


    # ========================================================
    # ROOT API
    # ========================================================

    @app.route(
        "/",
        methods=["GET"]
    )
    def index():

        return jsonify({

            "name":
                "Tirsi POS API",

            "version":
                "1.0.0",

            "status":
                "running",

            "environment":
                app.config["ENV"],

            "routes": {

                "health":
                    "/health",

                "api_test":
                    "/api/test",

                "authentication":
                    "/api/auth/*",

                "shop_authentication":
                    "/api/shop/*",

                "shops":
                    "/api/shops",

                "shop_stats":
                    "/api/shops/stats",
            }
        }), 200


    # ========================================================
    # HEALTH CHECK
    #
    # This is also used by Render to verify that the API
    # process is alive.
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


            return jsonify({

                "status":
                    "healthy",

                "database":
                    "connected",

                "environment":
                    app.config["ENV"],

                "timestamp":
                    datetime.utcnow().isoformat()

            }), 200


        except Exception as e:

            app.logger.exception(
                f"Health check error: {e}"
            )

            return jsonify({

                "status":
                    "unhealthy",

                "database":
                    "disconnected",

                "environment":
                    app.config["ENV"],

                "error":
                    str(e)

            }), 500


    # ========================================================
    # 400 ERROR
    # ========================================================

    @app.errorhandler(400)
    def handle_400(error):

        response = jsonify({

            "success": False,

            "error":
                "Bad request"
        })

        return add_cors_headers(
            response
        ), 400


    # ========================================================
    # 401 ERROR
    # ========================================================

    @app.errorhandler(401)
    def handle_401(error):

        response = jsonify({

            "success": False,

            "authenticated": False,

            "error":
                "Unauthorized"
        })

        return add_cors_headers(
            response
        ), 401


    # ========================================================
    # 403 ERROR
    # ========================================================

    @app.errorhandler(403)
    def handle_403(error):

        response = jsonify({

            "success": False,

            "error":
                "Forbidden"
        })

        return add_cors_headers(
            response
        ), 403


    # ========================================================
    # 404 ERROR
    # ========================================================

    @app.errorhandler(404)
    def handle_404(error):

        response = jsonify({

            "success": False,

            "error":
                "Endpoint not found",

            "path":
                request.path
        })

        return add_cors_headers(
            response
        ), 404


    # ========================================================
    # 405 ERROR
    # ========================================================

    @app.errorhandler(405)
    def handle_405(error):

        response = jsonify({

            "success": False,

            "error":
                "Method not allowed",

            "method":
                request.method,

            "path":
                request.path
        })

        return add_cors_headers(
            response
        ), 405


    # ========================================================
    # 500 ERROR
    # ========================================================

    @app.errorhandler(500)
    def handle_500(error):

        app.logger.exception(
            "Unhandled server error"
        )

        response = jsonify({

            "success": False,

            "error":
                "Internal server error"
        })

        return add_cors_headers(
            response
        ), 500


    # ========================================================
    # DATABASE STARTUP TEST
    # ========================================================

    test_database_connection(
        app
    )


    # ========================================================
    # APPLICATION READY
    # ========================================================

    print("=" * 70)
    print("✅ TIRSI POS API READY")
    print("=" * 70)
    print()

    return app


# ============================================================
# DATABASE CONNECTION TEST
# ============================================================

def test_database_connection(app):

    print()
    print("=" * 70)
    print("🔍 TESTING DATABASE CONNECTION")
    print("=" * 70)

    try:

        with app.app_context():

            # ------------------------------------------------
            # BASIC CONNECTION
            # ------------------------------------------------

            result = db.session.execute(
                text("SELECT 1")
            )

            result.scalar()

            print(
                "✅ Database connected successfully"
            )


            # ------------------------------------------------
            # DATABASE NAME
            # ------------------------------------------------

            try:

                database_name = (
                    db.session.execute(
                        text("SELECT DATABASE()")
                    ).scalar()
                )

                print(
                    f"✅ Connected database: "
                    f"{database_name}"
                )

            except Exception as e:

                print(
                    "⚠️ Could not determine "
                    f"database name: {e}"
                )


            # ------------------------------------------------
            # DATABASE VERSION
            # ------------------------------------------------

            try:

                version = (
                    db.session.execute(
                        text("SELECT VERSION()")
                    ).scalar()
                )

                print(
                    f"✅ Database version: "
                    f"{version}"
                )

            except Exception as e:

                print(
                    "⚠️ Could not determine "
                    f"database version: {e}"
                )


    except Exception as e:

        print(
            "❌ DATABASE CONNECTION FAILED"
        )

        print(
            f"Error: {str(e)}"
        )

        print()
        print(
            "Check the following:"
        )

        print(
            "1. DB_HOST"
        )

        print(
            "2. DB_PORT"
        )

        print(
            "3. DB_NAME"
        )

        print(
            "4. DB_USER"
        )

        print(
            "5. DB_PASSWORD"
        )

        print(
            "6. Aiven SSL configuration"
        )

        traceback.print_exc()

    finally:

        print("=" * 70)


# ============================================================
# CREATE APPLICATION
# ============================================================
#
# Gunicorn imports this object using:
#
#     app:app
#
# ============================================================

app = create_app(
    os.getenv(
        "ENV",
        "production"
    )
)


# ============================================================
# LOCAL DEVELOPMENT SERVER
# ============================================================
#
# This section is NOT used by Gunicorn on Render.
#
# Render uses Gunicorn.
#
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
        ).strip().lower()
        == "true"
    )

    app.run(

        host="0.0.0.0",

        port=port,

        debug=debug
    )