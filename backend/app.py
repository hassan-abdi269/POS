# ============================================================
# TIRSI POS API
# Application Factory
#
# Authentication routes:
#   routes/auth.py
#
# Shop routes:
#   routes/shop.py
#
# Authentication:
#   Flask-Login
#   Flask-Session
#   HTTP Cookies
#
# Frontend:
#   https://pos-frontend-j0hd.onrender.com
#
# Backend:
#   https://pos-api4.onrender.com
# ============================================================

import os
import traceback
from datetime import timedelta

from dotenv import load_dotenv

from flask import (
    Flask,
    jsonify,
    request,
)

from flask_cors import CORS
from flask_session import Session
from flask_login import LoginManager

from sqlalchemy import text

from extensions import (
    db,
    migrate,
    bcrypt,
)

from models.shop import Shop

# ------------------------------------------------------------
# ROUTE MODULES
# ------------------------------------------------------------

from routes.auth import (
    init_auth_routes,
    AdminUser,
)

from routes.shop import (
    init_shop_routes,
)


# ============================================================
# LOAD ENVIRONMENT
# ============================================================

load_dotenv(override=True)


# ============================================================
# FLASK LOGIN MANAGER
# ============================================================

login_manager = LoginManager()

# API application does not need HTML redirects.
login_manager.login_view = None


# ============================================================
# FRONTEND URLS
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

    return list(
        dict.fromkeys(origins)
    )


# ============================================================
# REQUEST ORIGIN
# ============================================================

def get_request_origin():

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

    if not origin:
        return False

    allowed = current_app.config.get(
        "CORS_ORIGINS",
        []
    )

    return origin.rstrip("/") in allowed


# ============================================================
# CORS HEADERS
# ============================================================

def add_cors_headers(response):

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
# CORS PREFLIGHT
# ============================================================

def cors_options_response():

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

    app = Flask(__name__)


    # ========================================================
    # ENVIRONMENT
    # ========================================================

    environment = os.getenv(
        "ENV",
        config_name
    ).strip().lower()

    app.config["ENV"] = environment


    # ========================================================
    # DEBUG
    # ========================================================

    app.config["DEBUG"] = (
        os.getenv(
            "DEBUG",
            "False"
        ).strip().lower() == "true"
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
    # ADMIN CONFIG
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
    # ========================================================

    database_url = os.getenv(
        "DATABASE_URL"
    )

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


    # ========================================================
    # SQLALCHEMY
    # ========================================================

    app.config[
        "SQLALCHEMY_TRACK_MODIFICATIONS"
    ] = False

    app.config[
        "SQLALCHEMY_ENGINE_OPTIONS"
    ] = {

        "pool_pre_ping": True,

        "pool_recycle": 280,

        "pool_timeout": 30,

        "max_overflow": 10,

        "connect_args": {
            "connect_timeout": 15
        },
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
        ]["connect_args"]["ssl"] = {
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

    # Frontend and backend are on different Render domains.
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
        f"Admin email: {app.config['ADMIN_EMAIL']}"
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
    # INITIALIZE DATABASE
    # ========================================================

    db.init_app(app)

    print(
        "✅ SQLAlchemy initialized"
    )


    # ========================================================
    # FLASK MIGRATE
    # ========================================================

    migrate.init_app(
        app,
        db
    )

    print(
        "✅ Flask-Migrate initialized"
    )


    # ========================================================
    # BCRYPT
    # ========================================================

    bcrypt.init_app(app)

    print(
        "✅ Bcrypt initialized"
    )


    # ========================================================
    # CORS
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
    # FLASK SESSION
    # ========================================================

    Session(app)

    print(
        "✅ Flask-Session initialized"
    )


    # ========================================================
    # FLASK LOGIN
    # ========================================================

    login_manager.init_app(app)

    # Strong session protection can invalidate sessions when
    # client information changes.
    login_manager.session_protection = "strong"

    print(
        "✅ Flask-Login initialized"
    )


    # ========================================================
    # FLASK-LOGIN USER LOADER
    #
    # IMPORTANT:
    #
    # AdminUser comes from routes/auth.py.
    #
    # Shop comes from models.shop.
    #
    # app.py only loads the user.
    # It does NOT implement login/logout.
    # ========================================================

    @login_manager.user_loader
    def load_user(user_id):

        try:

            if not user_id:
                return None

            user_id = str(user_id)


            # ------------------------------------------------
            # ADMIN
            # ------------------------------------------------

            if user_id == "admin:1":

                return AdminUser(
                    app.config[
                        "ADMIN_EMAIL"
                    ]
                )


            # ------------------------------------------------
            # SHOP
            # ------------------------------------------------

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
    # UNAUTHORIZED HANDLER
    #
    # Flask-Login normally redirects.
    # For an API we return JSON.
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
    # routes/auth.py owns:
    #
    #   /api/auth/login
    #   /api/auth/logout
    #   /api/auth/check
    #   /api/auth/me
    #   /api/auth/session-status
    #   /api/auth/debug
    # ========================================================

    init_auth_routes(app)

    print(
        "✅ Authentication routes registered"
    )


    # ========================================================
    # REGISTER SHOP ROUTES
    #
    # routes/shop.py owns:
    #
    #   /api/shop/login
    #   /api/shop/logout
    #   /api/shop/me
    #   /api/shops
    #   /api/shops/stats
    # ========================================================

    init_shop_routes(app)

    print(
        "✅ Shop routes registered"
    )


    # ========================================================
    # API TEST
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
    # ROOT
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
    # ERROR HANDLERS
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
    # DATABASE TEST
    # ========================================================

    test_database_connection(
        app
    )


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

                database_name = db.session.execute(
                    text("SELECT DATABASE()")
                ).scalar()

                print(
                    f"✅ Connected database: "
                    f"{database_name}"
                )

            except Exception:
                pass


            # ------------------------------------------------
            # DATABASE VERSION
            # ------------------------------------------------

            try:

                version = db.session.execute(
                    text("SELECT VERSION()")
                ).scalar()

                print(
                    f"✅ Database version: "
                    f"{version}"
                )

            except Exception:
                pass


    except Exception as e:

        print(
            "❌ DATABASE CONNECTION FAILED"
        )

        print(
            f"Error: {str(e)}"
        )

        traceback.print_exc()

    print("=" * 70)


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
        ).strip().lower() == "true"
    )

    app.run(

        host="0.0.0.0",

        port=port,

        debug=debug
    )