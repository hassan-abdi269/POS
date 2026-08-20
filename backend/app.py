# app.py
# ============================================================
# TIRSI POS API
# Production-ready Flask application
#
# Authentication:
#   Super Admin -> /api/auth/login
#   Shop Owner  -> /api/shop/login
#
# Authentication method:
#   Flask-Login + Cookies + Flask-Session
#
# Deployment:
#   Render + MySQL/Aiven
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
# FLASK
# ============================================================

from flask import (
    Flask,
    jsonify,
    request,
    session,
)

from flask_cors import CORS
from flask_session import Session

from flask_login import (
    current_user,
    login_manager,
)

# ============================================================
# DATABASE
# ============================================================

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

# ============================================================
# APPLICATION EXTENSIONS
# ============================================================

from extensions import (
    db,
    migrate,
    login_manager,
    bcrypt,
)

# ============================================================
# MODELS
# ============================================================

from models.shop import Shop

# ============================================================
# AUTH USER
# ============================================================

from routes.auth import AdminUser

# ============================================================
# ROUTE INITIALIZERS
# ============================================================

from routes.auth import init_auth_routes
from routes.shop import init_shop_routes


# ============================================================
# DEFAULT FRONTEND
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
# CORS ORIGINS
# ============================================================

def get_allowed_origins():
    """
    Read CORS_ORIGINS from .env.

    Example:

    CORS_ORIGINS=https://pos-frontend-j0hd.onrender.com,http://localhost:5173
    """

    configured_origins = os.getenv(
        "CORS_ORIGINS",
        ""
    ).strip()

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

    # Remove duplicates
    return list(dict.fromkeys(origins))


# ============================================================
# REQUEST ORIGIN
# ============================================================

def get_request_origin():
    """
    Return normalized request origin.
    """

    origin = request.headers.get("Origin")

    if not origin:
        return None

    return origin.rstrip("/")


# ============================================================
# CORS CHECK
# ============================================================

def is_allowed_origin(origin):
    """
    Check whether request origin is allowed.
    """

    if not origin:
        return False

    origin = origin.rstrip("/")

    return (
        origin
        in current_app_allowed_origins()
    )


# ============================================================
# CURRENT APP CORS ORIGINS
# ============================================================

def current_app_allowed_origins():
    """
    Get configured CORS origins.
    """

    return current_app.config.get(
        "CORS_ORIGINS",
        []
    )


# ============================================================
# CORS RESPONSE HEADERS
# ============================================================

def add_cors_headers(response):
    """
    Add CORS headers for cookie authentication.
    """

    origin = get_request_origin()

    if origin and is_allowed_origin(origin):

        response.headers[
            "Access-Control-Allow-Origin"
        ] = origin

        response.headers[
            "Access-Control-Allow-Credentials"
        ] = "true"

    response.headers["Vary"] = "Origin"

    return response


# ============================================================
# CORS PREFLIGHT
# ============================================================

def cors_options_response():
    """
    Handle OPTIONS requests.
    """

    response = jsonify({
        "success": True,
        "message": "CORS preflight successful"
    })

    origin = get_request_origin()

    if origin and is_allowed_origin(origin):

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
            "Origin"
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

    response.headers["Vary"] = "Origin"

    return response, 204


# ============================================================
# SHOP SERIALIZER
# ============================================================

def serialize_shop(shop):
    """
    Convert Shop object into JSON-safe dictionary.
    """

    return {
        "id": shop.id,

        "name": getattr(
            shop,
            "name",
            None
        ),

        "email": getattr(
            shop,
            "email",
            None
        ),

        "phone": getattr(
            shop,
            "phone",
            None
        ),

        "address": getattr(
            shop,
            "address",
            None
        ),

        "owner": getattr(
            shop,
            "owner",
            None
        ),

        "subscription": getattr(
            shop,
            "subscription",
            None
        ),

        "status": getattr(
            shop,
            "status",
            None
        ),

        "revenue": getattr(
            shop,
            "revenue",
            0
        ),

        "users": getattr(
            shop,
            "users_count",
            0
        ),

        "createdAt": (
            shop.created_at.strftime("%Y-%m-%d")
            if getattr(
                shop,
                "created_at",
                None
            )
            else None
        ),

        "lastActive": (
            shop.last_active.strftime(
                "%Y-%m-%d %H:%M"
            )
            if getattr(
                shop,
                "last_active",
                None
            )
            else None
        ),
    }


# ============================================================
# APPLICATION FACTORY
# ============================================================

def create_app(config_name="development"):

    app = Flask(__name__)

    # ========================================================
    # ENVIRONMENT
    # ========================================================

    environment = os.getenv(
        "ENV",
        config_name or "development"
    )

    environment = environment.lower().strip()

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
            "dev-secret-key-change-this"
        )

    app.config[
        "SECRET_KEY"
    ] = secret_key

    app.config[
        "ENV"
    ] = environment

    app.config[
        "DEBUG"
    ] = (
        os.getenv(
            "DEBUG",
            "False"
        ).lower()
        == "true"
    )

    # ========================================================
    # ADMIN CONFIGURATION
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
    # DATABASE
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
        ""
    )

    database_url = os.getenv(
        "DATABASE_URL",
        ""
    ).strip()

    # --------------------------------------------------------
    # DATABASE URL
    # --------------------------------------------------------

    if database_url:

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

    app.config[
        "SQLALCHEMY_TRACK_MODIFICATIONS"
    ] = False

    # ========================================================
    # DATABASE ENGINE
    # ========================================================

    app.config[
        "SQLALCHEMY_ENGINE_OPTIONS"
    ] = {

        "pool_pre_ping": True,

        "pool_recycle": 280,

        "pool_timeout": 30,

        "max_overflow": 10,

        "connect_args": {
            "connect_timeout": 15
        }
    }

    # ========================================================
    # AIVEN SSL
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

    allowed_origins = (
        get_allowed_origins()
    )

    app.config[
        "CORS_ORIGINS"
    ] = allowed_origins

    # ========================================================
    # SERVER-SIDE SESSION
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

    # IMPORTANT:
    # Frontend and backend are different domains on Render.
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
    # FLASK LOGIN COOKIE
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
        days=30
    )

    # ========================================================
    # PRINT STARTUP INFORMATION
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
        "Database Password: "
        + (
            "SET"
            if db_password
            else "NOT SET"
        )
    )

    print(
        "DATABASE_URL: "
        + (
            "SET"
            if database_url
            else "NOT SET"
        )
    )

    print(
        f"CORS Origins: {allowed_origins}"
    )

    print(
        "Admin Email: "
        f"{app.config['ADMIN_EMAIL']}"
    )

    print(
        "Admin Password Hash: "
        + (
            "SET"
            if app.config[
                "ADMIN_PASSWORD_HASH"
            ]
            else "NOT SET"
        )
    )

    print(
        "Session SameSite: "
        f"{app.config['SESSION_COOKIE_SAMESITE']}"
    )

    print(
        "Session Secure: "
        f"{app.config['SESSION_COOKIE_SECURE']}"
    )

    print("=" * 70)

    # ========================================================
    # INITIALIZE DATABASE
    # ========================================================

    db.init_app(app)

    print(
        "✅ SQLAlchemy initialized"
    )

    # ========================================================
    # INITIALIZE MIGRATIONS
    # ========================================================

    migrate.init_app(
        app,
        db
    )

    print(
        "✅ Flask-Migrate initialized"
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
            "Origin"
        ],

        expose_headers=[
            "Content-Type",
            "Authorization"
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
    # INITIALIZE FLASK LOGIN
    # ========================================================

    login_manager.init_app(app)

    login_manager.login_view = None

    login_manager.login_message = None

    login_manager.session_protection = "strong"

    print(
        "✅ Flask-Login initialized"
    )

    # ========================================================
    # INITIALIZE BCRYPT
    # ========================================================

    bcrypt.init_app(app)

    print(
        "✅ Bcrypt initialized"
    )

    # ========================================================
    # FLASK LOGIN USER LOADER
    # ========================================================

    @login_manager.user_loader
    def load_user(user_id):

        try:

            if not user_id:
                return None

            user_id = str(
                user_id
            )

            # ------------------------------------------------
            # SUPER ADMIN
            # ------------------------------------------------

            if user_id.startswith(
                "admin:"
            ):

                return AdminUser(
                    app.config[
                        "ADMIN_EMAIL"
                    ]
                )

            # ------------------------------------------------
            # BACKWARD COMPATIBILITY
            # ------------------------------------------------
            #
            # Your old AdminUser used:
            #
            #     self.id = 1
            #
            # So existing sessions containing "1"
            # should still work as admin.
            #
            # ------------------------------------------------

            if user_id == "1":

                return AdminUser(
                    app.config[
                        "ADMIN_EMAIL"
                    ]
                )

            # ------------------------------------------------
            # SHOP USER
            # ------------------------------------------------

            try:

                shop_id = int(
                    user_id
                )

            except (
                ValueError,
                TypeError
            ):

                return None

            shop = db.session.get(
                Shop,
                shop_id
            )

            if shop:

                return shop

        except Exception as e:

            app.logger.exception(
                "User loader error: %s",
                e
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

        return add_cors_headers(
            response
        )

    # ========================================================
    # REGISTER AUTH ROUTES
    # ========================================================
    #
    # IMPORTANT:
    #
    # /api/auth/login
    #
    # MUST come from routes/auth.py.
    #
    # It must NOT be aliased to shop_login().
    #
    # ========================================================

    init_auth_routes(app)

    print(
        "✅ Admin authentication routes initialized"
    )

    # ========================================================
    # REGISTER SHOP ROUTES
    # ========================================================

    init_shop_routes(app)

    print(
        "✅ Shop routes initialized"
    )

    # ========================================================
    # API TEST ROUTE
    # ========================================================

    @app.route(
        "/api/test",
        methods=["GET", "OPTIONS"]
    )
    def api_test():

        if request.method == "OPTIONS":

            return cors_options_response()

        response = jsonify({

            "success": True,

            "message": (
                "Tirsi POS API is working"
            ),

            "timestamp": (
                datetime.utcnow().isoformat()
            ),

            "environment": (
                app.config["ENV"]
            ),

            "cors": True
        })

        return add_cors_headers(
            response
        ), 200

    # ========================================================
    # AUTH DEBUG ROUTE
    # ========================================================

    @app.route(
        "/api/debug/config",
        methods=["GET"]
    )
    def debug_config():

        return jsonify({

            "environment": (
                app.config["ENV"]
            ),

            "admin_email": (
                app.config["ADMIN_EMAIL"]
            ),

            "admin_password_hash": (
                "SET"
                if app.config[
                    "ADMIN_PASSWORD_HASH"
                ]
                else "NOT SET"
            ),

            "cors_origins": (
                app.config["CORS_ORIGINS"]
            ),

            "session_cookie": (
                app.config[
                    "SESSION_COOKIE_NAME"
                ]
            ),

            "session_samesite": (
                app.config[
                    "SESSION_COOKIE_SAMESITE"
                ]
            ),

            "session_secure": (
                app.config[
                    "SESSION_COOKIE_SECURE"
                ]
            )

        }), 200

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

            return jsonify({

                "status": "healthy",

                "database": "connected",

                "environment": (
                    app.config["ENV"]
                ),

                "timestamp": (
                    datetime.utcnow().isoformat()
                )

            }), 200

        except Exception as e:

            app.logger.exception(
                "Health check failed"
            )

            return jsonify({

                "status": "unhealthy",

                "database": "disconnected",

                "environment": (
                    app.config["ENV"]
                ),

                "error": str(e)

            }), 500

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

            "environment": (
                app.config["ENV"]
            ),

            "authentication": (
                "Flask-Login + Cookies + Sessions"
            ),

            "endpoints": {

                "health": "/health",

                "test": "/api/test",

                # Admin
                "admin_login": (
                    "/api/auth/login"
                ),

                "admin_logout": (
                    "/api/auth/logout"
                ),

                "admin_me": (
                    "/api/auth/me"
                ),

                "admin_check": (
                    "/api/auth/check"
                ),

                # Shop
                "shop_login": (
                    "/api/shop/login"
                ),

                "shop_logout": (
                    "/api/shop/logout"
                ),

                "shop_me": (
                    "/api/shop/me"
                )
            }

        }), 200

    # ========================================================
    # ERROR HANDLERS
    # ========================================================

    @app.errorhandler(400)
    def handle_400(error):

        response = jsonify({

            "success": False,

            "error": "Bad request"

        })

        return add_cors_headers(
            response
        ), 400

    # --------------------------------------------------------

    @app.errorhandler(401)
    def handle_401(error):

        response = jsonify({

            "success": False,

            "authenticated": False,

            "error": "Unauthorized"

        })

        return add_cors_headers(
            response
        ), 401

    # --------------------------------------------------------

    @app.errorhandler(403)
    def handle_403(error):

        response = jsonify({

            "success": False,

            "error": "Forbidden"

        })

        return add_cors_headers(
            response
        ), 403

    # --------------------------------------------------------

    @app.errorhandler(404)
    def handle_404(error):

        response = jsonify({

            "success": False,

            "error": "Endpoint not found",

            "path": request.path

        })

        return add_cors_headers(
            response
        ), 404

    # --------------------------------------------------------

    @app.errorhandler(405)
    def handle_405(error):

        response = jsonify({

            "success": False,

            "error": "Method not allowed",

            "method": request.method,

            "path": request.path

        })

        return add_cors_headers(
            response
        ), 405

    # --------------------------------------------------------

    @app.errorhandler(500)
    def handle_500(error):

        app.logger.exception(
            "Unhandled server error"
        )

        response = jsonify({

            "success": False,

            "error": "Internal server error"

        })

        return add_cors_headers(
            response
        ), 500

    # ========================================================
    # DATABASE TEST
    # ========================================================

    test_database_connection(
        app
    )

    # ========================================================
    # FINAL STARTUP MESSAGE
    # ========================================================

    print()
    print("=" * 70)
    print("✅ TIRSI POS API READY")
    print("=" * 70)

    print(
        "Admin Login: "
        "/api/auth/login"
    )

    print(
        "Shop Login: "
        "/api/shop/login"
    )

    print(
        "Admin Email: "
        f"{app.config['ADMIN_EMAIL']}"
    )

    print(
        "Admin Password Hash: "
        + (
            "CONFIGURED"
            if app.config[
                "ADMIN_PASSWORD_HASH"
            ]
            else "MISSING"
        )
    )

    print("=" * 70)

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

            result = db.session.execute(
                text("SELECT 1")
            )

            result.scalar()

            print(
                "✅ Database connected successfully"
            )

            # ------------------------------------------------
            # Database name
            # ------------------------------------------------

            try:

                database_name = (
                    db.session.execute(
                        text(
                            "SELECT DATABASE()"
                        )
                    ).scalar()
                )

                print(
                    "✅ Connected database: "
                    f"{database_name}"
                )

            except Exception:

                pass

            # ------------------------------------------------
            # Database version
            # ------------------------------------------------

            try:

                version = (
                    db.session.execute(
                        text(
                            "SELECT VERSION()"
                        )
                    ).scalar()
                )

                print(
                    "✅ Database version: "
                    f"{version}"
                )

            except Exception:

                pass

    except Exception as e:

        print()
        print(
            "❌ DATABASE CONNECTION FAILED"
        )

        print(
            f"Error: {e}"
        )

        print()
        print(
            "Check these environment variables:"
        )

        print(
            "DB_HOST"
        )

        print(
            "DB_PORT"
        )

        print(
            "DB_NAME"
        )

        print(
            "DB_USER"
        )

        print(
            "DB_PASSWORD"
        )

        print(
            "DATABASE_URL"
        )

        print()

        traceback.print_exc()

        # ----------------------------------------------------
        # Do not crash application.
        # ----------------------------------------------------


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
        ).lower()
        == "true"
    )

    app.run(
        host="0.0.0.0",
        port=port,
        debug=debug
    )