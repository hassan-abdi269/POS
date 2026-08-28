# ============================================================
# TIRSI POS API
# routes/shop.py
#
# Shop Authentication
# Shop Registration
# Shop Management
# Shop Statistics
# ============================================================

from flask import (
    request,
    jsonify,
    current_app,
)

from flask_login import (
    login_required,
    login_user,
    logout_user,
    current_user,
)

from sqlalchemy import or_
from datetime import datetime
import re

from models.shop import Shop
from extensions import db


# ============================================================
# HELPERS
# ============================================================

def admin_required():
    """
    Check whether the currently logged-in user is an admin.
    """

    if not current_user.is_authenticated:
        return False

    return getattr(
        current_user,
        "is_admin",
        False
    )


# ============================================================
# SHOP RESPONSE
# ============================================================

def shop_response(shop):
    """
    Convert Shop model into safe JSON response.
    """

    return {
        "id": shop.id,

        "name": shop.name,

        "email": shop.email,

        "phone": shop.phone,

        "address": shop.address,

        "owner": shop.owner,

        "subscription": shop.subscription,

        "status": shop.status,

        "revenue": float(
            shop.revenue or 0
        ),

        "users": shop.users_count,

        "createdAt": (
            shop.created_at.strftime("%Y-%m-%d")
            if shop.created_at
            else None
        ),

        "lastActive": (
            shop.last_active.strftime(
                "%Y-%m-%d %H:%M"
            )
            if shop.last_active
            else None
        )
    }


# ============================================================
# CORS PREFLIGHT
# ============================================================

def handle_cors_preflight():
    """
    Handle browser OPTIONS requests.
    """

    response = jsonify({
        "success": True
    })

    origin = request.headers.get("Origin")

    if origin:

        allowed_origins = current_app.config.get(
            "CORS_ORIGINS",
            []
        )

        normalized_origin = origin.rstrip("/")

        if normalized_origin in allowed_origins:

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


# ============================================================
# ADD CORS HEADERS
# ============================================================

def add_cors_headers(response):
    """
    Add CORS headers to normal responses.
    """

    origin = request.headers.get("Origin")

    if not origin:
        return response

    allowed_origins = current_app.config.get(
        "CORS_ORIGINS",
        []
    )

    normalized_origin = origin.rstrip("/")

    if normalized_origin not in allowed_origins:
        return response

    # Flask responses can sometimes be tuples:
    if isinstance(response, tuple):

        flask_response = response[0]

        flask_response.headers[
            "Access-Control-Allow-Origin"
        ] = origin

        flask_response.headers[
            "Access-Control-Allow-Credentials"
        ] = "true"

        flask_response.headers[
            "Vary"
        ] = "Origin"

        return response

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
# EMAIL VALIDATION
# ============================================================

def valid_email(email):
    """
    Basic email validation.
    """

    if not email:
        return False

    pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"

    return re.match(
        pattern,
        email
    ) is not None


# ============================================================
# ROUTES INITIALIZER
# ============================================================

def init_shop_routes(app):

    # ========================================================
    # SHOP REGISTRATION
    # ========================================================

    @app.route(
        "/api/shops",
        methods=[
            "POST",
            "OPTIONS"
        ]
    )
    @login_required
    def create_shop():

        # ----------------------------------------------------
        # OPTIONS
        # ----------------------------------------------------

        if request.method == "OPTIONS":
            return handle_cors_preflight()

        try:

            current_app.logger.info(
                "📤 Shop registration request received"
            )

            # ------------------------------------------------
            # ADMIN CHECK
            # ------------------------------------------------

            if not admin_required():

                response = jsonify({
                    "success": False,
                    "error": "Admin access required"
                })

                return add_cors_headers(
                    (response, 403)
                )

            # ------------------------------------------------
            # JSON CHECK
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
                    (response, 400)
                )

            data = request.get_json()

            if not data:

                response = jsonify({
                    "success": False,
                    "error": "No shop data provided"
                })

                return add_cors_headers(
                    (response, 400)
                )

            current_app.logger.info(
                f"📝 Creating shop: {data.get('name')}"
            )

            # ------------------------------------------------
            # GET DATA
            # ------------------------------------------------

            name = str(
                data.get("name", "")
            ).strip()

            email = str(
                data.get("email", "")
            ).strip().lower()

            phone = str(
                data.get("phone", "")
            ).strip()

            address = str(
                data.get("address", "")
            ).strip()

            owner = str(
                data.get("owner", "")
            ).strip()

            password = data.get(
                "password",
                ""
            )

            subscription = str(
                data.get(
                    "subscription",
                    "basic"
                )
            ).strip().lower()

            status = str(
                data.get(
                    "status",
                    "active"
                )
            ).strip().lower()

            # ------------------------------------------------
            # REQUIRED FIELDS
            # ------------------------------------------------

            if not name:

                response = jsonify({
                    "success": False,
                    "error": "Shop name is required"
                })

                return add_cors_headers(
                    (response, 400)
                )

            if not email:

                response = jsonify({
                    "success": False,
                    "error": "Shop email is required"
                })

                return add_cors_headers(
                    (response, 400)
                )

            if not valid_email(email):

                response = jsonify({
                    "success": False,
                    "error": "Invalid email address"
                })

                return add_cors_headers(
                    (response, 400)
                )

            if not password:

                response = jsonify({
                    "success": False,
                    "error": "Password is required"
                })

                return add_cors_headers(
                    (response, 400)
                )

            if len(password) < 6:

                response = jsonify({
                    "success": False,
                    "error": (
                        "Password must be at least "
                        "6 characters"
                    )
                })

                return add_cors_headers(
                    (response, 400)
                )

            if not owner:

                response = jsonify({
                    "success": False,
                    "error": "Shop owner is required"
                })

                return add_cors_headers(
                    (response, 400)
                )

            # ------------------------------------------------
            # VALID SUBSCRIPTIONS
            # ------------------------------------------------

            allowed_subscriptions = [
                "basic",
                "standard",
                "premium"
            ]

            if subscription not in allowed_subscriptions:

                response = jsonify({
                    "success": False,
                    "error": (
                        "Invalid subscription. "
                        "Choose basic, standard, "
                        "or premium."
                    )
                })

                return add_cors_headers(
                    (response, 400)
                )

            # ------------------------------------------------
            # VALID STATUS
            # ------------------------------------------------

            allowed_statuses = [
                "active",
                "inactive",
                "suspended"
            ]

            if status not in allowed_statuses:

                response = jsonify({
                    "success": False,
                    "error": (
                        "Invalid shop status"
                    )
                })

                return add_cors_headers(
                    (response, 400)
                )

            # ------------------------------------------------
            # CHECK DUPLICATE EMAIL
            # ------------------------------------------------

            existing_email = Shop.query.filter(
                Shop.email == email
            ).first()

            if existing_email:

                response = jsonify({
                    "success": False,
                    "error": (
                        "A shop with this "
                        "email already exists"
                    )
                })

                return add_cors_headers(
                    (response, 409)
                )

            # ------------------------------------------------
            # CHECK DUPLICATE PHONE
            # ------------------------------------------------

            if phone:

                existing_phone = Shop.query.filter(
                    Shop.phone == phone
                ).first()

                if existing_phone:

                    response = jsonify({
                        "success": False,
                        "error": (
                            "A shop with this "
                            "phone number already exists"
                        )
                    })

                    return add_cors_headers(
                        (response, 409)
                    )

            # ------------------------------------------------
            # CREATE SHOP
            # ------------------------------------------------

            shop = Shop(
                name=name,
                email=email,
                phone=phone,
                address=address,
                owner=owner,
                subscription=subscription,
                status=status,
                revenue=0,
                users_count=0,
                created_at=datetime.utcnow(),
                last_active=None
            )

            # ------------------------------------------------
            # PASSWORD
            # ------------------------------------------------

            shop.set_password(password)

            # ------------------------------------------------
            # SAVE
            # ------------------------------------------------

            db.session.add(shop)

            db.session.commit()

            current_app.logger.info(
                f"✅ Shop created successfully: {email}"
            )

            # ------------------------------------------------
            # RESPONSE
            # ------------------------------------------------

            response = jsonify({
                "success": True,
                "message": "Shop registered successfully",
                "shop": shop_response(shop)
            })

            return add_cors_headers(
                (response, 201)
            )

        except Exception as e:

            db.session.rollback()

            current_app.logger.error(
                f"❌ Shop registration error: {str(e)}"
            )

            current_app.logger.exception(
                "Full shop registration traceback:"
            )

            response = jsonify({
                "success": False,
                "error": (
                    "Failed to register shop. "
                    "Please try again."
                )
            })

            return add_cors_headers(
                (response, 500)
            )


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
            return handle_cors_preflight()

        try:

            current_app.logger.info(
                "📤 Login attempt received"
            )

            if not request.is_json:

                response = jsonify({
                    "success": False,
                    "error": (
                        "Content-Type must be "
                        "application/json"
                    )
                })

                return add_cors_headers(
                    (response, 400)
                )

            data = request.get_json()

            if not data:

                response = jsonify({
                    "success": False,
                    "error": "No data provided"
                })

                return add_cors_headers(
                    (response, 400)
                )

            email = str(
                data.get("email", "")
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
                    (response, 400)
                )

            # ------------------------------------------------
            # FIND SHOP
            # ------------------------------------------------

            shop = Shop.query.filter_by(
                email=email
            ).first()

            if not shop:

                current_app.logger.warning(
                    f"❌ Shop not found: {email}"
                )

                response = jsonify({
                    "success": False,
                    "error": (
                        "Invalid email or password"
                    )
                })

                return add_cors_headers(
                    (response, 401)
                )

            # ------------------------------------------------
            # STATUS
            # ------------------------------------------------

            if shop.status != "active":

                response = jsonify({
                    "success": False,
                    "error": (
                        "Shop account is inactive"
                    )
                })

                return add_cors_headers(
                    (response, 403)
                )

            # ------------------------------------------------
            # PASSWORD
            # ------------------------------------------------

            if not shop.check_password(password):

                current_app.logger.warning(
                    f"❌ Wrong password: {email}"
                )

                response = jsonify({
                    "success": False,
                    "error": (
                        "Invalid email or password"
                    )
                })

                return add_cors_headers(
                    (response, 401)
                )

            # ------------------------------------------------
            # UPDATE LAST ACTIVE
            # ------------------------------------------------

            shop.last_active = datetime.utcnow()

            db.session.commit()

            # ------------------------------------------------
            # LOGIN
            # ------------------------------------------------

            login_user(
                shop,
                remember=True
            )

            current_app.logger.info(
                f"✅ Login successful: {email}"
            )

            response = jsonify({

                "success": True,

                "message": "Login successful",

                "shop": shop_response(shop),

                "user": {
                    "id": shop.id,
                    "email": shop.email,
                    "name": shop.name,
                    "owner": shop.owner,
                    "is_admin": False,
                    "role": "shop_owner"
                }
            })

            return add_cors_headers(
                (response, 200)
            )

        except Exception as e:

            db.session.rollback()

            current_app.logger.error(
                f"❌ Login error: {str(e)}"
            )

            current_app.logger.exception(
                "Full login traceback:"
            )

            response = jsonify({
                "success": False,
                "error": (
                    "Login failed. "
                    "Please try again."
                )
            })

            return add_cors_headers(
                (response, 500)
            )


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
    @login_required
    def shop_logout():

        if request.method == "OPTIONS":
            return handle_cors_preflight()

        try:

            logout_user()

            response = jsonify({
                "success": True,
                "message": "Logged out successfully"
            })

            return add_cors_headers(
                (response, 200)
            )

        except Exception as e:

            current_app.logger.error(
                f"Logout error: {str(e)}"
            )

            response = jsonify({
                "success": False,
                "error": "Logout failed"
            })

            return add_cors_headers(
                (response, 500)
            )


    # ========================================================
    # GET CURRENT SHOP
    # ========================================================

    @app.route(
        "/api/shop/me",
        methods=[
            "GET",
            "OPTIONS"
        ]
    )
    @login_required
    def get_shop_profile():

        if request.method == "OPTIONS":
            return handle_cors_preflight()

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
                    (response, 403)
                )

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
                    (response, 404)
                )

            response = jsonify({
                "success": True,
                "shop": shop_response(shop)
            })

            return add_cors_headers(
                (response, 200)
            )

        except Exception as e:

            current_app.logger.error(
                f"Profile error: {str(e)}"
            )

            response = jsonify({
                "success": False,
                "error": "Failed to load profile"
            })

            return add_cors_headers(
                (response, 500)
            )


    # ========================================================
    # GET ALL SHOPS - ADMIN ONLY
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
            return handle_cors_preflight()

        try:

            if not admin_required():

                response = jsonify({
                    "success": False,
                    "error": "Admin access required"
                })

                return add_cors_headers(
                    (response, 403)
                )

            shops = Shop.query.order_by(
                Shop.created_at.desc()
            ).all()

            response = jsonify({
                "success": True,
                "shops": [
                    shop_response(shop)
                    for shop in shops
                ],
                "total": len(shops)
            })

            return add_cors_headers(
                (response, 200)
            )

        except Exception as e:

            current_app.logger.error(
                f"Get shops error: {str(e)}"
            )

            response = jsonify({
                "success": False,
                "error": "Failed to fetch shops"
            })

            return add_cors_headers(
                (response, 500)
            )


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
    def get_shop_stats():

        if request.method == "OPTIONS":
            return handle_cors_preflight()

        try:

            if not admin_required():

                response = jsonify({
                    "success": False,
                    "error": "Admin access required"
                })

                return add_cors_headers(
                    (response, 403)
                )

            total_revenue = (
                db.session
                .query(
                    db.func.sum(
                        Shop.revenue
                    )
                )
                .scalar()
                or 0
            )

            stats = {

                "total": Shop.query.count(),

                "active": Shop.query.filter_by(
                    status="active"
                ).count(),

                "inactive": Shop.query.filter_by(
                    status="inactive"
                ).count(),

                "suspended": Shop.query.filter_by(
                    status="suspended"
                ).count(),

                "premium": Shop.query.filter_by(
                    subscription="premium"
                ).count(),

                "standard": Shop.query.filter_by(
                    subscription="standard"
                ).count(),

                "basic": Shop.query.filter_by(
                    subscription="basic"
                ).count(),

                "totalRevenue": float(
                    total_revenue
                )
            }

            response = jsonify({
                "success": True,
                "stats": stats
            })

            return add_cors_headers(
                (response, 200)
            )

        except Exception as e:

            current_app.logger.error(
                f"Stats error: {str(e)}"
            )

            response = jsonify({
                "success": False,
                "error": (
                    "Failed to fetch stats"
                )
            })

            return add_cors_headers(
                (response, 500)
            )


# ============================================================
# END OF routes/shop.py
# ============================================================