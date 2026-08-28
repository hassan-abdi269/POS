from flask import (
    request,
    jsonify,
    session,
    current_app,
)

from flask_login import (
    login_user,
    logout_user,
    login_required,
    current_user,
)

from datetime import timedelta
import os

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

        return "admin:1"


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
            password,
        )

    except Exception as e:

        current_app.logger.error(
            f"Password verification error: {e}"
        )

        return False


# ==========================
# CORS HELPER FUNCTIONS
# ==========================

def add_cors_headers_to_response(response):

    """
    Add CORS headers to a response.
    """

    origin = request.headers.get(
        "Origin"
    )

    if origin:

        allowed_origins = (
            current_app.config.get(
                "CORS_ORIGINS",
                []
            )
        )

        if origin.rstrip("/") in allowed_origins:

            # Handle tuple response
            if isinstance(
                response,
                tuple
            ):

                response[0].headers[
                    "Access-Control-Allow-Origin"
                ] = origin

                response[0].headers[
                    "Access-Control-Allow-Credentials"
                ] = "true"

            else:

                response.headers[
                    "Access-Control-Allow-Origin"
                ] = origin

                response.headers[
                    "Access-Control-Allow-Credentials"
                ] = "true"

    return response


def handle_cors_preflight():

    """
    Handle OPTIONS preflight requests.
    """

    response = jsonify({
        "success": True
    })

    origin = request.headers.get(
        "Origin"
    )

    if origin:

        allowed_origins = (
            current_app.config.get(
                "CORS_ORIGINS",
                []
            )
        )

        if origin.rstrip("/") in allowed_origins:

            response.headers[
                "Access-Control-Allow-Origin"
            ] = origin

            response.headers[
                "Access-Control-Allow-Credentials"
            ] = "true"

            response.headers[
                "Access-Control-Allow-Headers"
            ] = (
                "Content-Type, Authorization, "
                "X-Shop-ID, X-Requested-With, "
                "Accept, Origin, Cookie"
            )

            response.headers[
                "Access-Control-Allow-Methods"
            ] = (
                "GET, POST, PUT, PATCH, "
                "DELETE, OPTIONS"
            )

            response.headers[
                "Access-Control-Max-Age"
            ] = "86400"

    return response, 200


# ==========================
# AUTH ROUTES
# ==========================

def init_auth_routes(app):

    # ======================
    # ADMIN LOGIN
    # ======================

    @app.route(
        "/api/auth/login",
        methods=[
            "POST",
            "OPTIONS",
        ],
    )
    def admin_login():

        # Handle CORS preflight
        if request.method == "OPTIONS":

            return handle_cors_preflight()

        try:

            if not request.is_json:

                return jsonify({
                    "error": (
                        "Content-Type must be "
                        "application/json"
                    )
                }), 400

            data = request.get_json()

            # Normalize email
            email = (
                data.get("email") or ""
            ).strip().lower()

            password = data.get(
                "password"
            )

            if not email or not password:

                return jsonify({
                    "error": (
                        "Email and password required"
                    )
                }), 400

            admin_email = (
                app.config.get(
                    "ADMIN_EMAIL"
                )
            )

            if email != admin_email:

                return jsonify({
                    "error": "Invalid credentials"
                }), 401

            if not verify_admin_password(
                password
            ):

                return jsonify({
                    "error": "Invalid credentials"
                }), 401

            # Create virtual admin
            admin = AdminUser(
                admin_email
            )

            # ==================================================
            # LOGIN USER
            # ==================================================

            login_user(
                admin,
                remember=True,
                duration=timedelta(
                    days=1
                ),
            )

            # ==================================================
            # SESSION
            # ==================================================

            session.permanent = True

            session.modified = True

            # Explicit Flask-Login session values
            session["_user_id"] = (
                admin.get_id()
            )

            session["_fresh"] = True

            # ==================================================
            # SAVE SESSION
            # ==================================================

            try:

                if hasattr(
                    session,
                    "save"
                ):

                    session.save()

                session_id = (
                    session.sid
                    if hasattr(
                        session,
                        "sid"
                    )
                    else None
                )

                if session_id:

                    current_app.logger.info(
                        f"Session ID: {session_id}"
                    )

            except Exception as e:

                current_app.logger.warning(
                    "Could not save session "
                    f"explicitly: {e}"
                )

            # ==================================================
            # DEBUG LOG
            # ==================================================

            current_app.logger.info(
                f"✅ Admin logged in: {email}"
            )

            current_app.logger.info(
                "📝 Session contents: "
                f"{dict(session)}"
            )

            current_app.logger.info(
                "🍪 Session cookie name: "
                f"{app.config['SESSION_COOKIE_NAME']}"
            )

            # ==================================================
            # RESPONSE
            # ==================================================

            response = jsonify({

                "success": True,

                "message": (
                    "Login successful"
                ),

                "user": {

                    "email": admin.email,

                    "username": admin.username,

                    "is_admin": True,

                    "id": admin.get_id(),
                },

                "authenticated": True,
            }), 200

            return add_cors_headers_to_response(
                response
            )

        except Exception as e:

            current_app.logger.error(
                f"Admin login error: {e}"
            )

            import traceback

            current_app.logger.error(
                traceback.format_exc()
            )

            return jsonify({
                "error": "Login failed"
            }), 500


    # ======================
    # LOGOUT
    # ======================

    @app.route(
        "/api/auth/logout",
        methods=[
            "POST",
            "OPTIONS",
        ],
    )
    @login_required
    def logout():

        # Handle CORS preflight
        if request.method == "OPTIONS":

            return handle_cors_preflight()

        logout_user()

        session.clear()

        try:

            if hasattr(
                session,
                "clear"
            ):

                session.clear()

        except Exception:

            pass

        response = jsonify({

            "success": True,

            "message": (
                "Logged out successfully"
            ),
        }), 200

        return add_cors_headers_to_response(
            response
        )


    # ======================
    # CHECK LOGIN
    # ======================

    @app.route(
        "/api/auth/check",
        methods=[
            "GET",
            "OPTIONS",
        ],
    )
    def check_auth():

        # Handle CORS preflight
        if request.method == "OPTIONS":

            return handle_cors_preflight()

        current_app.logger.debug(
            "Auth check - Authenticated: "
            f"{current_user.is_authenticated}"
        )

        if current_user.is_authenticated:

            response = jsonify({

                "authenticated": True,

                "user": {

                    "email": getattr(
                        current_user,
                        "email",
                        None,
                    ),

                    "username": getattr(
                        current_user,
                        "username",
                        None,
                    ),

                    "is_admin": getattr(
                        current_user,
                        "is_admin",
                        False,
                    ),

                    "id": current_user.get_id(),
                },
            }), 200

            return add_cors_headers_to_response(
                response
            )

        response = jsonify({
            "authenticated": False
        }), 401

        return add_cors_headers_to_response(
            response
        )


    # ======================
    # SESSION CHECK
    # ======================

    @app.route(
        "/api/auth/session-check",
        methods=[
            "GET",
            "OPTIONS",
        ],
    )
    def session_check():

        """
        Check if current session is valid.

        Used by the frontend.
        """

        # Handle CORS preflight
        if request.method == "OPTIONS":

            return handle_cors_preflight()

        # ==================================================
        # DEBUG LOGGING
        # ==================================================

        current_app.logger.info(
            "🔍 Session check - "
            f"Authenticated: "
            f"{current_user.is_authenticated}"
        )

        current_app.logger.info(
            "📝 Session data: "
            f"{dict(session) if session else 'Empty'}"
        )

        current_app.logger.info(
            "🍪 Cookies received: "
            f"{request.cookies.to_dict()}"
        )

        # ==================================================
        # AUTHENTICATED
        # ==================================================

        if current_user.is_authenticated:

            response = jsonify({

                "authenticated": True,

                "user": {

                    "id": current_user.get_id(),

                    "email": getattr(
                        current_user,
                        "email",
                        None,
                    ),

                    "username": getattr(
                        current_user,
                        "username",
                        None,
                    ),

                    "is_admin": getattr(
                        current_user,
                        "is_admin",
                        False,
                    ),

                    "role": (
                        "superadmin"
                        if getattr(
                            current_user,
                            "is_admin",
                            False,
                        )
                        else "shop_owner"
                    ),
                },
            }), 200

            return add_cors_headers_to_response(
                response
            )

        # ==================================================
        # NOT AUTHENTICATED
        # ==================================================

        response = jsonify({

            "authenticated": False,

            "error": (
                "Not authenticated"
            ),
        }), 401

        return add_cors_headers_to_response(
            response
        )


    # ======================
    # CURRENT USER
    # ======================

    @app.route(
        "/api/auth/me",
        methods=[
            "GET",
            "OPTIONS",
        ],
    )
    @login_required
    def me():

        # Handle CORS preflight
        if request.method == "OPTIONS":

            return handle_cors_preflight()

        response = jsonify({

            "user": {

                "id": current_user.get_id(),

                "email": getattr(
                    current_user,
                    "email",
                    None,
                ),

                "username": getattr(
                    current_user,
                    "username",
                    None,
                ),

                "is_admin": getattr(
                    current_user,
                    "is_admin",
                    False,
                ),
            },
        }), 200

        return add_cors_headers_to_response(
            response
        )


    # ======================
    # SESSION STATUS
    # ======================

    @app.route(
        "/api/auth/session-status",
        methods=[
            "GET",
            "OPTIONS",
        ],
    )
    @login_required
    def session_status():

        """
        Check session status and details.
        """

        # Handle CORS preflight
        if request.method == "OPTIONS":

            return handle_cors_preflight()

        response = jsonify({

            "authenticated": (
                current_user.is_authenticated
            ),

            "user_id": (
                current_user.get_id()
            ),

            "email": getattr(
                current_user,
                "email",
                None,
            ),

            "is_admin": getattr(
                current_user,
                "is_admin",
                False,
            ),

            "session_id": session.get(
                "_user_id"
            ),

            "session_data": {
                key: str(value)
                for key, value in dict(
                    session
                ).items()
            },

            "cookies": (
                request.cookies.to_dict()
            ),
        }), 200

        return add_cors_headers_to_response(
            response
        )


    # ======================
    # DEBUG
    # ======================

    @app.route(
        "/api/auth/debug",
        methods=[
            "GET",
            "OPTIONS",
        ],
    )
    @login_required
    def auth_debug():

        # Handle CORS preflight
        if request.method == "OPTIONS":

            return handle_cors_preflight()

        response = jsonify({

            "authenticated": (
                current_user.is_authenticated
            ),

            "id": (
                current_user.get_id()
            ),

            "email": getattr(
                current_user,
                "email",
                None,
            ),

            "is_admin": getattr(
                current_user,
                "is_admin",
                False,
            ),
        }), 200

        return add_cors_headers_to_response(
            response
        )