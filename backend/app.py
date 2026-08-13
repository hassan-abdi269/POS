import os

from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=True)

from flask import (
    Flask,
    jsonify,
    send_from_directory,
    session,
    request
)

from flask_cors import CORS
from flask_session import Session

from flask_login import (
    login_required,
    current_user
)

from sqlalchemy import text

from extensions import (
    db,
    migrate,
    login_manager,
    bcrypt
)

from config import config

from routes import init_routes
from routes.auth import AdminUser

from models.shop import Shop


# ==================================================
# APPLICATION FACTORY
# ==================================================

def create_app(config_name="development"):

    app = Flask(__name__)

    # Load selected configuration
    app.config.from_object(
        config.get(
            config_name,
            config["default"]
        )
    )

    # ==============================================
    # SESSION CONFIGURATION
    # ==============================================

    app.config["SESSION_TYPE"] = "filesystem"
    app.config["SESSION_PERMANENT"] = True
    app.config["SESSION_USE_SIGNER"] = True
    app.config["SESSION_KEY_PREFIX"] = "tirsi_"

    app.config["SESSION_COOKIE_NAME"] = "session"
    app.config["SESSION_COOKIE_DOMAIN"] = None
    app.config["SESSION_COOKIE_PATH"] = "/"
    app.config["SESSION_COOKIE_HTTPONLY"] = True

    app.config["SESSION_REFRESH_EACH_REQUEST"] = True

    # Production uses HTTPS + cross-origin cookies.
    if config_name == "production":
        app.config["SESSION_COOKIE_SECURE"] = True
        app.config["SESSION_COOKIE_SAMESITE"] = "None"
    else:
        app.config["SESSION_COOKIE_SECURE"] = False
        app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

    # ==============================================
    # EXTENSIONS
    # ==============================================

    initialize_extensions(app)

    # ==============================================
    # FLASK-LOGIN
    # ==============================================

    setup_login_manager(app)

    # ==============================================
    # ROUTES
    # ==============================================

    init_routes(app)

    register_core_routes(app)

    register_error_handlers(app)

    return app


# ==================================================
# EXTENSION INITIALIZATION
# ==================================================

def initialize_extensions(app):

    # Database
    db.init_app(app)

    # Migrations
    migrate.init_app(
        app,
        db
    )

    # ==============================================
    # CORS
    # ==============================================

    allowed_origins = app.config.get(
        "CORS_ORIGINS",
        []
    )

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
            "Cookie"
        ],

        methods=[
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],

        expose_headers=[
            "Content-Type",
            "X-Requested-With"
        ],

        max_age=86400
    )

    # Server-side sessions
    Session(app)

    # Flask-Login
    login_manager.init_app(app)

    # Bcrypt
    bcrypt.init_app(app)

    # ==============================================
    # TEST DATABASE CONNECTION
    # ==============================================

    with app.app_context():

        try:

            db.session.execute(
                text("SELECT 1")
            )

            print(
                "✅ MySQL database connected"
            )

        except Exception as e:

            print(
                f"❌ Database connection failed: {e}"
            )


# ==================================================
# FLASK-LOGIN SETUP
# ==================================================

def setup_login_manager(app):

    login_manager.session_protection = "strong"

    @login_manager.user_loader
    def load_user(user_id):

        try:

            # ======================================
            # ADMIN USER
            # ======================================

            if user_id == "1":

                return AdminUser(
                    app.config["ADMIN_EMAIL"]
                )

            # ======================================
            # SHOP USER
            # ======================================

            shop_id = int(user_id)

            shop = Shop.query.get(
                shop_id
            )

            if shop:
                return shop

        except Exception as e:

            app.logger.error(
                f"User loading error: {e}"
            )

        return None

    @login_manager.unauthorized_handler
    def unauthorized_handler():

        return jsonify({
            "error": "Unauthorized"
        }), 401


# ==================================================
# CORE ROUTES
# ==================================================

def register_core_routes(app):

    # ==============================================
    # HEALTH CHECK
    # ==============================================

    @app.route("/health")
    def health():

        try:

            db.session.execute(
                text("SELECT 1")
            )

            database = "connected"

        except Exception as e:

            database = str(e)

        return jsonify({

            "status": "healthy",

            "database": database,

            "environment":
                app.config["ENV"],

            "admin":
                app.config["ADMIN_EMAIL"]

        })


    # ==============================================
    # ROOT
    # ==============================================

    @app.route("/")
    def index():

        return jsonify({

            "name":
                app.config["APP_NAME"],

            "status":
                "running",

            "version":
                "1.0.0"

        })


    # ==============================================
    # UPLOADS
    # ==============================================

    @app.route("/uploads/<filename>")
    def uploads(filename):

        upload_folder = os.path.join(
            app.root_path,
            "uploads"
        )

        return send_from_directory(
            upload_folder,
            filename
        )


    # ==============================================
    # SESSION CHECK
    # ==============================================

    @app.route(
        "/api/auth/session-check",
        methods=["GET"]
    )
    def session_check():

        app.logger.debug(
            "Session check - "
            f"Authenticated: "
            f"{current_user.is_authenticated}"
        )

        app.logger.debug(
            f"Session data: "
            f"{dict(session) if session else 'No session'}"
        )

        app.logger.debug(
            f"Cookies: "
            f"{request.cookies.to_dict()}"
        )

        if current_user.is_authenticated:

            user_data = {

                "id":
                    current_user.get_id(),

                "email":
                    getattr(
                        current_user,
                        "email",
                        None
                    ),

                "username":
                    getattr(
                        current_user,
                        "username",
                        None
                    ),

                "is_admin":
                    getattr(
                        current_user,
                        "is_admin",
                        False
                    )

            }

            return jsonify({

                "authenticated": True,

                "user": user_data

            }), 200

        return jsonify({

            "authenticated": False

        }), 401


    # ==============================================
    # TEST AUTH
    # ==============================================

    @app.route("/api/test-auth")
    @login_required
    def test_auth():

        return jsonify({

            "authenticated":
                current_user.is_authenticated,

            "id":
                current_user.get_id(),

            "is_admin":
                getattr(
                    current_user,
                    "is_admin",
                    False
                )

        })


# ==================================================
# ERROR HANDLERS
# ==================================================

def register_error_handlers(app):

    @app.errorhandler(401)
    def unauthorized(error):

        return jsonify({

            "error":
                "Unauthorized"

        }), 401


    @app.errorhandler(404)
    def not_found(error):

        return jsonify({

            "error":
                "Not found"

        }), 404


    @app.errorhandler(500)
    def server_error(error):

        app.logger.exception(
            "Internal server error"
        )

        return jsonify({

            "error":
                "Server error"

        }), 500


# ==================================================
# CREATE APPLICATION
# ==================================================

app = create_app(
    os.getenv(
        "ENV",
        "development"
    )
)


# ==================================================
# LOCAL DEVELOPMENT
# ==================================================

if __name__ == "__main__":

    app.run(

        host="0.0.0.0",

        port=int(
            os.getenv(
                "PORT",
                5000
            )
        ),

        debug=app.config["DEBUG"]

    )