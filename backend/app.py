# ============================================================
# TIRSI POS API
# Complete Flask Application
#
# Production:
#   Frontend:
#   https://pos-frontend-j0hd.onrender.com
#
#   Backend:
#   https://pos-api4.onrender.com
#
# Authentication:
#   Flask-Login
#   Flask-Session
#   HTTP Cookies
# ============================================================

import os
import traceback
from datetime import datetime, timedelta

from dotenv import load_dotenv

from flask import (
    Flask,
    jsonify,
    request,
    session as flask_session,
    current_app,
)

from flask_cors import CORS
from flask_session import Session

from flask_login import (
    LoginManager,
    login_required,
    login_user,
    logout_user,
    current_user,
)

from sqlalchemy import text, func
from sqlalchemy.exc import SQLAlchemyError


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv(override=True)


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
# FLASK LOGIN MANAGER
# ============================================================

login_manager = LoginManager()

login_manager.login_view = None


# ============================================================
# SUPER ADMIN USER
# ============================================================

class AdminUser:
    """
    Virtual Super Admin user.

    The admin is stored in environment variables rather than
    in the database.
    """

    def __init__(self, email):

        self.id = "1"

        self.email = email

        self.username = "admin"

        self.is_admin = True

        self.is_authenticated = True

        self.is_active = True

        self.is_anonymous = False

    def get_id(self):
        """
        IMPORTANT:

        Use a unique prefix so admin ID "1" can never be
        confused with Shop ID 1.
        """

        return "admin:1"


# ============================================================
# CONSTANTS
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
# ADD CORS HEADERS
# ============================================================

def add_cors_headers(response):

    origin = get_request_origin()

    if origin and is_allowed_origin(origin):

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

    response.headers[
        "Vary"
    ] = "Origin"

    return response, 204


# ============================================================
# SERIALIZE SHOP
# ============================================================

def serialize_shop(shop):

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

        "revenue": float(
            getattr(
                shop,
                "revenue",
                0
            ) or 0
        ),

        "users": getattr(
            shop,
            "users_count",
            0
        ),

        "createdAt": (
            shop.created_at.strftime(
                "%Y-%m-%d"
            )
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
# ADMIN PASSWORD VERIFICATION
# ============================================================

def verify_admin_password(password):

    password_hash = current_app.config.get(
        "ADMIN_PASSWORD_HASH"
    )

    if not password_hash:

        current_app.logger.error(
            "ADMIN_PASSWORD_HASH is missing."
        )

        return False

    try:

        return bcrypt.check_password_hash(
            password_hash,
            password
        )

    except Exception as e:

        current_app.logger.exception(
            f"Admin password verification error: {e}"
        )

        return False


# ============================================================
# ADMIN REQUIRED
# ============================================================

def admin_required():

    if not current_user.is_authenticated:

        return False

    return getattr(
        current_user,
        "is_admin",
        False
    )


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
        ).lower() == "true"
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

    app.config["SECRET_KEY"] = secret_key


    # ========================================================
    # ADMIN CONFIGURATION
    # ========================================================

    app.config["ADMIN_EMAIL"] = os.getenv(
        "ADMIN_EMAIL",
        "superadmin@system.com"
    ).strip().lower()

    app.config["ADMIN_PASSWORD_HASH"] = os.getenv(
        "ADMIN_PASSWORD_HASH",
        ""
    ).strip()


    # ========================================================
    # DATABASE CONFIGURATION
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
    # SESSION CONFIGURATION
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
    # LOG CONFIGURATION
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
        "Database password: "
        f"{'SET' if db_password else 'NOT SET'}"
    )

    print(
        "Database source: "
        f"{'DATABASE_URL' if database_url else 'DB_* variables'}"
    )

    print(
        f"CORS origins: {allowed_origins}"
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

        max_age=86400
    )

    print(
        "✅ CORS initialized"
    )


    # ========================================================
    # INITIALIZE SERVER SESSION
    # ========================================================

    Session(app)

    print(
        "✅ Flask-Session initialized"
    )


    # ========================================================
    # INITIALIZE FLASK LOGIN
    # ========================================================

    login_manager.init_app(app)

    login_manager.session_protection = "strong"

    print(
        "✅ Flask-Login initialized"
    )


    # ========================================================
    # USER LOADER
    # ========================================================

    @login_manager.user_loader
    def load_user(user_id):

        try:

            if not user_id:

                return None


            # ------------------------------------------------
            # SUPER ADMIN
            # ------------------------------------------------

            if str(user_id).startswith(
                "admin:"
            ):

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
                f"User loader error: {e}"
            )

        return None


    # ========================================================
    # UNAUTHORIZED HANDLER
    # ========================================================

    @login_manager.unauthorized_handler
    def unauthorized():

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
    # REGISTER ROUTES
    # ========================================================

    register_routes(app)


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


    @app.errorhandler(403)
    def handle_403(error):

        response = jsonify({

            "success": False,

            "error": "Forbidden"
        })

        return add_cors_headers(
            response
        ), 403


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
# ROUTES
# ============================================================

def register_routes(app):


    # ========================================================
    # SUPER ADMIN LOGIN
    # ========================================================

    @app.route(
        "/api/auth/login",
        methods=[
            "POST",
            "OPTIONS"
        ]
    )
    def admin_login():

        if request.method == "OPTIONS":

            return cors_options_response()


        try:

            # ------------------------------------------------
            # JSON validation
            # ------------------------------------------------

            if not request.is_json:

                response = jsonify({

                    "success": False,

                    "error": (
                        "Content-Type must be "
                        "application/json"
                    )
                })

                return add_cors_headers(
                    response
                ), 400


            data = request.get_json(
                silent=True
            )


            if not data:

                response = jsonify({

                    "success": False,

                    "error": "No data provided"
                })

                return add_cors_headers(
                    response
                ), 400


            # ------------------------------------------------
            # Credentials
            # ------------------------------------------------

            email = str(
                data.get(
                    "email",
                    ""
                )
            ).strip().lower()


            password = data.get(
                "password"
            )


            app.logger.info(
                f"Admin login attempt: {email}"
            )


            if not email or not password:

                response = jsonify({

                    "success": False,

                    "error": (
                        "Email and password "
                        "are required"
                    )
                })

                return add_cors_headers(
                    response
                ), 400


            # ------------------------------------------------
            # Check email
            # ------------------------------------------------

            admin_email = app.config[
                "ADMIN_EMAIL"
            ]


            if email != admin_email:

                app.logger.warning(
                    f"Invalid admin email: {email}"
                )

                response = jsonify({

                    "success": False,

                    "error": "Invalid email or password"
                })

                return add_cors_headers(
                    response
                ), 401


            # ------------------------------------------------
            # Check password
            # ------------------------------------------------

            if not verify_admin_password(
                password
            ):

                app.logger.warning(
                    "Invalid admin password"
                )

                response = jsonify({

                    "success": False,

                    "error": "Invalid email or password"
                })

                return add_cors_headers(
                    response
                ), 401


            # ------------------------------------------------
            # Create Admin User
            # ------------------------------------------------

            admin = AdminUser(
                admin_email
            )


            # ------------------------------------------------
            # Login
            # ------------------------------------------------

            login_user(

                admin,

                remember=True,

                duration=timedelta(
                    days=1
                ),

                fresh=True
            )


            # ------------------------------------------------
            # Flask Session
            # ------------------------------------------------

            flask_session.permanent = True

            flask_session.modified = True


            # Explicitly store admin session information.
            # Flask-Login also stores its own _user_id.

            flask_session[
                "user_type"
            ] = "super_admin"

            flask_session[
                "admin_email"
            ] = admin.email

            flask_session[
                "admin_id"
            ] = "1"


            # ------------------------------------------------
            # Log session
            # ------------------------------------------------

            app.logger.info(
                f"✅ Super admin logged in: {email}"
            )

            app.logger.info(
                f"Flask-Login ID: {admin.get_id()}"
            )

            app.logger.info(
                f"Session: {dict(flask_session)}"
            )


            # ------------------------------------------------
            # Response
            # ------------------------------------------------

            response = jsonify({

                "success": True,

                "authenticated": True,

                "message": "Login successful",

                "user": {

                    "id": "1",

                    "email": admin.email,

                    "username": admin.username,

                    "is_admin": True,

                    "role": "super_admin"
                }
            })


            return add_cors_headers(
                response
            ), 200


        except Exception as e:

            app.logger.exception(
                f"Admin login error: {e}"
            )

            response = jsonify({

                "success": False,

                "error": "Login failed"
            })

            return add_cors_headers(
                response
            ), 500


    # ========================================================
    # SESSION CHECK
    #
    # IMPORTANT:
    # Frontend is requesting:
    #
    # GET /api/auth/session-check
    #
    # ========================================================

    @app.route(
        "/api/auth/session-check",
        methods=[
            "GET",
            "OPTIONS"
        ]
    )
    def session_check():

        if request.method == "OPTIONS":

            return cors_options_response()


        try:

            app.logger.info(
                "🔍 Session check requested"
            )


            # ------------------------------------------------
            # Not authenticated
            # ------------------------------------------------

            if not current_user.is_authenticated:

                app.logger.info(
                    "ℹ️ No authenticated session"
                )

                response = jsonify({

                    "success": True,

                    "authenticated": False,

                    "user": None
                })

                return add_cors_headers(
                    response
                ), 200


            # ------------------------------------------------
            # Super Admin
            # ------------------------------------------------

            if isinstance(
                current_user,
                AdminUser
            ):

                app.logger.info(
                    "✅ Super admin session valid"
                )

                response = jsonify({

                    "success": True,

                    "authenticated": True,

                    "user": {

                        "id": "1",

                        "email": current_user.email,

                        "username": current_user.username,

                        "is_admin": True,

                        "role": "super_admin"
                    }
                })

                return add_cors_headers(
                    response
                ), 200


            # ------------------------------------------------
            # Shop
            # ------------------------------------------------

            if isinstance(
                current_user,
                Shop
            ):

                app.logger.info(
                    f"✅ Shop session valid: "
                    f"{current_user.email}"
                )

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

                        "is_admin": False,

                        "role": "shop_owner"
                    }
                })

                return add_cors_headers(
                    response
                ), 200


            # ------------------------------------------------
            # Unknown user
            # ------------------------------------------------

            response = jsonify({

                "success": False,

                "authenticated": False,

                "user": None,

                "error": "Unknown user type"
            })

            return add_cors_headers(
                response
            ), 401


        except Exception as e:

            app.logger.exception(
                f"❌ Session check error: {e}"
            )

            response = jsonify({

                "success": False,

                "authenticated": False,

                "user": None,

                "error": "Failed to check session"
            })

            return add_cors_headers(
                response
            ), 500


    # ========================================================
    # AUTH CHECK
    # ========================================================

    @app.route(
        "/api/auth/check",
        methods=[
            "GET",
            "OPTIONS"
        ]
    )
    def auth_check():

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


            if isinstance(
                current_user,
                AdminUser
            ):

                response = jsonify({

                    "success": True,

                    "authenticated": True,

                    "user": {

                        "id": "1",

                        "email": current_user.email,

                        "username": current_user.username,

                        "is_admin": True,

                        "role": "super_admin"
                    }
                })

                return add_cors_headers(
                    response
                ), 200


            if isinstance(
                current_user,
                Shop
            ):

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

                        "is_admin": False,

                        "role": "shop_owner"
                    }
                })

                return add_cors_headers(
                    response
                ), 200


            response = jsonify({

                "success": False,

                "authenticated": False,

                "user": None
            })

            return add_cors_headers(
                response
            ), 401


        except Exception as e:

            app.logger.exception(
                f"Auth check error: {e}"
            )

            response = jsonify({

                "success": False,

                "authenticated": False,

                "error": "Authentication check failed"
            })

            return add_cors_headers(
                response
            ), 500


    # ========================================================
    # AUTH ME
    # ========================================================

    @app.route(
        "/api/auth/me",
        methods=[
            "GET",
            "OPTIONS"
        ]
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


            if isinstance(
                current_user,
                AdminUser
            ):

                response = jsonify({

                    "success": True,

                    "authenticated": True,

                    "user": {

                        "id": "1",

                        "email": current_user.email,

                        "username": current_user.username,

                        "is_admin": True,

                        "role": "super_admin"
                    }
                })

                return add_cors_headers(
                    response
                ), 200


            if isinstance(
                current_user,
                Shop
            ):

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

                        "is_admin": False,

                        "role": "shop_owner"
                    },

                    "shop": serialize_shop(
                        current_user
                    )
                })

                return add_cors_headers(
                    response
                ), 200


            response = jsonify({

                "success": False,

                "authenticated": False,

                "error": "Unknown user"
            })

            return add_cors_headers(
                response
            ), 401


        except Exception as e:

            app.logger.exception(
                f"Auth me error: {e}"
            )

            response = jsonify({

                "success": False,

                "authenticated": False,

                "error": "Failed to load current user"
            })

            return add_cors_headers(
                response
            ), 500


    # ========================================================
    # AUTH LOGOUT
    # ========================================================

    @app.route(
        "/api/auth/logout",
        methods=[
            "POST",
            "OPTIONS"
        ]
    )
    def auth_logout():

        if request.method == "OPTIONS":

            return cors_options_response()


        try:

            app.logger.info(
                "🔓 Logout requested"
            )


            logout_user()


            flask_session.clear()


            response = jsonify({

                "success": True,

                "authenticated": False,

                "message": "Logged out successfully"
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
    # SHOP LOGIN
    # ========================================================

    @app.route(
        "/api/shop/login",
        methods=[
            "POST",
            "OPTIONS"
        ]
    )
    def shop_login():

        if request.method == "OPTIONS":

            return cors_options_response()


        try:

            if not request.is_json:

                response = jsonify({

                    "success": False,

                    "error": (
                        "Content-Type must be "
                        "application/json"
                    )
                })

                return add_cors_headers(
                    response
                ), 400


            data = request.get_json(
                silent=True
            )


            if not data:

                response = jsonify({

                    "success": False,

                    "error": "No data provided"
                })

                return add_cors_headers(
                    response
                ), 400


            email = str(
                data.get(
                    "email",
                    ""
                )
            ).strip().lower()


            password = data.get(
                "password"
            )


            if not email or not password:

                response = jsonify({

                    "success": False,

                    "error": (
                        "Email and password "
                        "are required"
                    )
                })

                return add_cors_headers(
                    response
                ), 400


            shop = Shop.query.filter_by(
                email=email
            ).first()


            if not shop:

                response = jsonify({

                    "success": False,

                    "error": "Invalid email or password"
                })

                return add_cors_headers(
                    response
                ), 401


            status = getattr(
                shop,
                "status",
                "active"
            )


            if status != "active":

                response = jsonify({

                    "success": False,

                    "error": "Shop account is inactive"
                })

                return add_cors_headers(
                    response
                ), 403


            if not shop.check_password(
                password
            ):

                response = jsonify({

                    "success": False,

                    "error": "Invalid email or password"
                })

                return add_cors_headers(
                    response
                ), 401


            # ------------------------------------------------
            # Update last active
            # ------------------------------------------------

            if hasattr(
                shop,
                "last_active"
            ):

                shop.last_active = datetime.utcnow()

                db.session.commit()


            # ------------------------------------------------
            # Login
            # ------------------------------------------------

            login_user(
                shop,
                remember=True,
                fresh=True
            )


            flask_session.permanent = True

            flask_session.modified = True

            flask_session[
                "user_type"
            ] = "shop_owner"


            response = jsonify({

                "success": True,

                "authenticated": True,

                "message": "Login successful",

                "shop": serialize_shop(
                    shop
                ),

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


            return add_cors_headers(
                response
            ), 200


        except SQLAlchemyError as e:

            db.session.rollback()

            app.logger.exception(
                f"Shop login database error: {e}"
            )

            response = jsonify({

                "success": False,

                "error": "Database error while logging in"
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

                "error": "Login failed. Please try again."
            })

            return add_cors_headers(
                response
            ), 500


    # ========================================================
    # SHOP LOGOUT
    # ========================================================

    @app.route(
        "/api/shop/logout",
        methods=[
            "POST",
            "OPTIONS"
        ]
    )
    def shop_logout():

        if request.method == "OPTIONS":

            return cors_options_response()


        try:

            logout_user()

            flask_session.clear()


            response = jsonify({

                "success": True,

                "authenticated": False,

                "message": "Logged out successfully"
            })


            return add_cors_headers(
                response
            ), 200


        except Exception as e:

            app.logger.exception(
                f"Shop logout error: {e}"
            )

            response = jsonify({

                "success": False,

                "error": "Logout failed"
            })

            return add_cors_headers(
                response
            ), 500


    # ========================================================
    # CURRENT SHOP
    # ========================================================

    @app.route(
        "/api/shop/me",
        methods=[
            "GET",
            "OPTIONS"
        ]
    )
    @login_required
    def shop_me():

        if request.method == "OPTIONS":

            return cors_options_response()


        try:

            if not isinstance(
                current_user,
                Shop
            ):

                response = jsonify({

                    "success": False,

                    "error": "Shop account required"
                })

                return add_cors_headers(
                    response
                ), 403


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
                f"Shop profile error: {e}"
            )

            response = jsonify({

                "success": False,

                "error": "Failed to load shop profile"
            })

            return add_cors_headers(
                response
            ), 500


    # ========================================================
    # ALL SHOPS - ADMIN ONLY
    # ========================================================

    @app.route(
        "/api/shops",
        methods=[
            "GET",
            "OPTIONS"
        ]
    )
    @login_required
    def get_shops():

        if request.method == "OPTIONS":

            return cors_options_response()


        if not admin_required():

            response = jsonify({

                "success": False,

                "error": "Admin access required"
            })

            return add_cors_headers(
                response
            ), 403


        try:

            shops = Shop.query.order_by(
                Shop.created_at.desc()
            ).all()


            response = jsonify({

                "success": True,

                "shops": [
                    serialize_shop(shop)
                    for shop in shops
                ],

                "total": len(shops)
            })


            return add_cors_headers(
                response
            ), 200


        except Exception as e:

            app.logger.exception(
                f"Get shops error: {e}"
            )

            response = jsonify({

                "success": False,

                "error": "Failed to fetch shops"
            })

            return add_cors_headers(
                response
            ), 500


    # ========================================================
    # SHOP STATISTICS - ADMIN ONLY
    # ========================================================

    @app.route(
        "/api/shops/stats",
        methods=[
            "GET",
            "OPTIONS"
        ]
    )
    @login_required
    def shop_stats():

        if request.method == "OPTIONS":

            return cors_options_response()


        if not admin_required():

            response = jsonify({

                "success": False,

                "error": "Admin access required"
            })

            return add_cors_headers(
                response
            ), 403


        try:

            total = Shop.query.count()


            active = Shop.query.filter_by(
                status="active"
            ).count()


            inactive = Shop.query.filter_by(
                status="inactive"
            ).count()


            suspended = Shop.query.filter_by(
                status="suspended"
            ).count()


            premium = Shop.query.filter_by(
                subscription="premium"
            ).count()


            standard = Shop.query.filter_by(
                subscription="standard"
            ).count()


            basic = Shop.query.filter_by(
                subscription="basic"
            ).count()


            total_revenue = (
                db.session.query(
                    func.sum(
                        Shop.revenue
                    )
                ).scalar()
                or 0
            )


            response = jsonify({

                "success": True,

                "stats": {

                    "total": total,

                    "active": active,

                    "inactive": inactive,

                    "suspended": suspended,

                    "premium": premium,

                    "standard": standard,

                    "basic": basic,

                    "totalRevenue": float(
                        total_revenue
                    )
                }
            })


            return add_cors_headers(
                response
            ), 200


        except Exception as e:

            app.logger.exception(
                f"Shop statistics error: {e}"
            )

            response = jsonify({

                "success": False,

                "error": "Failed to fetch statistics"
            })

            return add_cors_headers(
                response
            ), 500


    # ========================================================
    # API TEST
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

            "message": "Tirsi POS API is working",

            "timestamp": datetime.utcnow().isoformat(),

            "environment": app.config[
                "ENV"
            ]
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

            "name": "Tirsi POS API",

            "version": "1.0.0",

            "status": "running",

            "environment": app.config[
                "ENV"
            ],

            "endpoints": {

                "health":
                    "/health",

                "api_test":
                    "/api/test",

                "admin_login":
                    "/api/auth/login",

                "session_check":
                    "/api/auth/session-check",

                "auth_check":
                    "/api/auth/check",

                "auth_me":
                    "/api/auth/me",

                "auth_logout":
                    "/api/auth/logout",

                "shop_login":
                    "/api/shop/login",

                "shop_logout":
                    "/api/shop/logout",

                "shop_me":
                    "/api/shop/me",

                "shops":
                    "/api/shops",

                "shop_stats":
                    "/api/shops/stats"
            }
        }), 200


    # ========================================================
    # HEALTH
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

                "timestamp":
                    datetime.utcnow().isoformat()
            })


            return response, 200


        except Exception as e:

            app.logger.exception(
                f"Health check error: {e}"
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