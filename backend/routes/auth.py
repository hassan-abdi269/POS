from flask import request, jsonify, session, current_app
from flask_login import (
    login_user,
    logout_user,
    login_required,
    current_user
)
from datetime import timedelta

from extensions import bcrypt


# ==========================
# ADMIN USER CLASS
# ==========================

class AdminUser:
    """
    Virtual admin user.
    Stored only in .env configuration.
    """

    def __init__(self, email):
        self.id = 1
        self.email = email
        self.username = "admin"

        self.is_admin = True
        self.is_authenticated = True
        self.is_active = True
        self.is_anonymous = False

    def get_id(self):
        return str(self.id)


# ==========================
# PASSWORD CHECK
# ==========================

def verify_admin_password(password):

    password_hash = current_app.config.get(
        "ADMIN_PASSWORD_HASH"
    )

    if not password_hash:
        current_app.logger.error(
            "ADMIN_PASSWORD_HASH missing"
        )
        return False

    try:
        return bcrypt.check_password_hash(
            password_hash,
            password
        )

    except Exception as e:
        current_app.logger.error(
            f"Password verification error: {e}"
        )
        return False


# ==========================
# AUTH ROUTES
# ==========================

def init_auth_routes(app):


    # ======================
    # ADMIN LOGIN
    # ======================

    @app.route(
        "/api/auth/login",
        methods=["POST"]
    )
    def admin_login():

        try:

            if not request.is_json:
                return jsonify({
                    "error":
                    "Content-Type must be application/json"
                }), 400


            data = request.get_json()

            email = data.get("email")
            password = data.get("password")


            if not email or not password:
                return jsonify({
                    "error":
                    "Email and password required"
                }), 400



            admin_email = app.config.get(
                "ADMIN_EMAIL"
            )


            if email != admin_email:
                return jsonify({
                    "error":
                    "Invalid credentials"
                }), 401



            if not verify_admin_password(password):
                return jsonify({
                    "error":
                    "Invalid credentials"
                }), 401



            admin = AdminUser(
                admin_email
            )


            # Login user - THIS SETS THE SESSION
            login_user(
                admin,
                remember=True,
                duration=timedelta(days=1)
            )


            # Force session to be saved
            session.permanent = True
            session.modified = True
            
            # Save session data explicitly
            session["_user_id"] = admin.get_id()
            session["_fresh"] = True
            
            # Log session details for debugging
            current_app.logger.info(f"✅ Admin logged in: {email}")
            current_app.logger.debug(f"Session ID: {session.sid if hasattr(session, 'sid') else 'N/A'}")
            current_app.logger.debug(f"Session contents: {dict(session)}")

            # Return response - session cookie is automatically set by Flask
            return jsonify({

                "message":
                "Login successful",

                "user": {

                    "email":
                    admin.email,

                    "username":
                    admin.username,

                    "is_admin":
                    True,
                    
                    "id": admin.get_id()
                },

                "authenticated":
                True

            }), 200


        except Exception as e:

            current_app.logger.error(
                f"Admin login error: {e}"
            )
            import traceback
            current_app.logger.error(traceback.format_exc())

            return jsonify({
                "error":
                "Login failed"
            }), 500



    # ======================
    # LOGOUT
    # ======================

    @app.route(
        "/api/auth/logout",
        methods=["POST"]
    )
    @login_required
    def logout():

        logout_user()

        session.clear()


        return jsonify({

            "message":
            "Logged out successfully"

        }), 200



    # ======================
    # CHECK LOGIN
    # ======================

    @app.route(
        "/api/auth/check",
        methods=["GET"]
    )
    def check_auth():

        current_app.logger.debug(f"Auth check - Authenticated: {current_user.is_authenticated}")
        
        if current_user.is_authenticated:

            return jsonify({

                "authenticated":
                True,

                "user": {

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
                    ),
                    
                    "id": current_user.get_id()
                }

            }), 200



        return jsonify({

            "authenticated":
            False

        }), 401



    # ======================
    # CURRENT USER
    # ======================

    @app.route(
        "/api/auth/me",
        methods=["GET"]
    )
    @login_required
    def me():

        return jsonify({

            "user": {

                "id":
                current_user.get_id(),

                "email":
                current_user.email,

                "username":
                current_user.username,

                "is_admin":
                current_user.is_admin
            }

        }), 200



    # ======================
    # SESSION STATUS - DEBUG
    # ======================

    @app.route(
        "/api/auth/session-status",
        methods=["GET"]
    )
    @login_required
    def session_status():
        """Check session status and details for debugging"""
        
        return jsonify({
            "authenticated": current_user.is_authenticated,
            "user_id": current_user.get_id(),
            "email": getattr(current_user, "email", None),
            "is_admin": getattr(current_user, "is_admin", False),
            "session_id": session.get('_user_id'),
            "session_data": {k: str(v) for k, v in dict(session).items()},
            "cookies": request.cookies.to_dict()
        }), 200



    # ======================
    # DEBUG
    # ======================

    @app.route(
        "/api/auth/debug",
        methods=["GET"]
    )
    @login_required
    def auth_debug():

        return jsonify({

            "authenticated":
            current_user.is_authenticated,

            "id":
            current_user.get_id(),

            "email":
            getattr(
                current_user,
                "email",
                None
            ),

            "is_admin":
            getattr(
                current_user,
                "is_admin",
                False
            )

        }), 200