# routes/shop.py

from flask import request, jsonify, current_app
from flask_login import login_required, login_user, logout_user, current_user
from sqlalchemy import or_
from datetime import datetime
import re

from models.shop import Shop
from extensions import db

# =====================================================
# HELPERS
# =====================================================

def admin_required():
    """
    Check if current logged in user is admin.
    Works with AdminUser from auth.py.
    """
    if not current_user.is_authenticated:
        return False
    return getattr(current_user, "is_admin", False)


def shop_response(shop):
    """
    Safe shop response formatter with all necessary fields.
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
        "revenue": shop.revenue,
        "users": shop.users_count,
        "createdAt": (
            shop.created_at.strftime("%Y-%m-%d")
            if shop.created_at else None
        ),
        "lastActive": (
            shop.last_active.strftime("%Y-%m-%d %H:%M")
            if shop.last_active else None
        ),
        "updatedAt": (
            shop.updated_at.strftime("%Y-%m-%d %H:%M")
            if shop.updated_at else None
        )
    }


def get_allowed_origins():
    """Helper to get and normalize allowed origins"""
    allowed_origins = current_app.config.get("CORS_ORIGINS", [])
    
    if isinstance(allowed_origins, str):
        allowed_origins = [
            item.strip().rstrip('/')
            for item in allowed_origins.split(",")
            if item.strip()
        ]
    elif isinstance(allowed_origins, (list, tuple, set)):
        allowed_origins = [
            str(item).strip().rstrip('/')
            for item in allowed_origins
            if str(item).strip()
        ]
    else:
        allowed_origins = []
    
    # Always add production frontend
    PRODUCTION_FRONTEND = "https://pos-frontend-j0hd.onrender.com"
    if PRODUCTION_FRONTEND not in allowed_origins:
        allowed_origins.append(PRODUCTION_FRONTEND)
    
    # Add local development origins
    LOCAL_ORIGINS = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:5174"
    ]
    
    for local_origin in LOCAL_ORIGINS:
        if local_origin not in allowed_origins:
            allowed_origins.append(local_origin)
    
    return list(dict.fromkeys(allowed_origins))


def set_cors_headers(response, origin):
    """Helper to set CORS headers on response"""
    if origin:
        allowed_origins = get_allowed_origins()
        origin_normalized = origin.rstrip('/')
        
        if origin_normalized in allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin_normalized
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Vary"] = "Origin"
    
    return response


# =====================================================
# ROUTES INITIALIZER
# =====================================================

def init_shop_routes(app):

    # =================================================
    # SHOP LOGIN - WITH COMPLETE CORS FIX
    # =================================================

    @app.route("/api/shop/login", methods=["POST", "OPTIONS"])
    def shop_login():
        """
        Shop login endpoint with complete CORS support.
        """
        
        # =================================================
        # CORS PREFLIGHT REQUEST
        # =================================================
        
        if request.method == "OPTIONS":
            response = jsonify({
                "success": True,
                "message": "CORS preflight successful"
            })
            
            # Get the requesting origin
            origin = request.headers.get("Origin")
            
            if origin:
                allowed_origins = get_allowed_origins()
                origin_normalized = origin.rstrip('/')
                
                if origin_normalized in allowed_origins:
                    response.headers["Access-Control-Allow-Origin"] = origin_normalized
                    response.headers["Access-Control-Allow-Credentials"] = "true"
                    response.headers["Access-Control-Allow-Headers"] = (
                        "Content-Type, Authorization, X-Shop-ID, "
                        "X-Requested-With, Accept, Origin, "
                        "Access-Control-Request-Method, "
                        "Access-Control-Request-Headers, Cookie"
                    )
                    response.headers["Access-Control-Allow-Methods"] = (
                        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
                    )
                    response.headers["Access-Control-Max-Age"] = "86400"
                    response.headers["Vary"] = "Origin"
                    
                    current_app.logger.info(f"✅ CORS preflight allowed for: {origin_normalized}")
                else:
                    current_app.logger.warning(f"⚠️ CORS preflight blocked for: {origin_normalized}")
            
            return response, 200
        
        # =================================================
        # NORMAL SHOP LOGIN
        # =================================================
        
        try:
            # Get origin for CORS headers
            origin = request.headers.get("Origin")
            
            # Validate Content-Type
            if not request.is_json:
                return jsonify({
                    "success": False,
                    "error": "Content-Type must be application/json"
                }), 400
            
            # Get request data
            data = request.get_json()
            
            if not data:
                return jsonify({
                    "success": False,
                    "error": "No data provided"
                }), 400
            
            # Extract and validate credentials
            email = data.get("email", "").lower().strip()
            password = data.get("password")
            
            if not email or not password:
                return jsonify({
                    "success": False,
                    "error": "Email and password are required"
                }), 400
            
            # Find shop by email
            shop = Shop.query.filter_by(email=email).first()
            
            # Check if shop exists
            if not shop:
                current_app.logger.warning(f"❌ Login attempt with non-existent email: {email}")
                return jsonify({
                    "success": False,
                    "error": "Invalid email or password"
                }), 401
            
            # Check if shop is active
            if shop.status != "active":
                current_app.logger.warning(f"❌ Login attempt on inactive shop: {email}")
                return jsonify({
                    "success": False,
                    "error": "Shop account is inactive. Please contact support."
                }), 403
            
            # Verify password
            if not shop.check_password(password):
                current_app.logger.warning(f"❌ Failed login attempt for: {email}")
                return jsonify({
                    "success": False,
                    "error": "Invalid email or password"
                }), 401
            
            # Update last active timestamp
            shop.last_active = datetime.utcnow()
            db.session.commit()
            
            # Login the user
            login_user(shop, remember=True)
            
            # Log successful login
            current_app.logger.info(f"✅ Shop login successful: {shop.email}")
            
            # Prepare response
            response_data = {
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
            }
            
            response = jsonify(response_data), 200
            
            # Add CORS headers
            if origin:
                response = set_cors_headers(response, origin)
            
            return response
            
        except Exception as e:
            current_app.logger.error(f"❌ Shop login error: {str(e)}")
            current_app.logger.exception("Full login traceback:")
            
            return jsonify({
                "success": False,
                "error": "Login failed. Please try again."
            }), 500

    # =================================================
    # GET ALL SHOPS (Admin Only)
    # =================================================

    @app.route("/api/shops", methods=["GET", "OPTIONS"])
    @login_required
    def get_shops():
        """
        Get all shops with optional filtering.
        Admin access required.
        """
        # Handle CORS preflight
        if request.method == "OPTIONS":
            return handle_cors_preflight()
        
        try:
            if not admin_required():
                return jsonify({
                    "success": False,
                    "error": "Admin access required"
                }), 403

            # Get query parameters
            status = request.args.get("status")
            subscription = request.args.get("subscription")
            search = request.args.get("search", "").strip()
            page = request.args.get("page", 1, type=int)
            per_page = request.args.get("per_page", 20, type=int)

            # Build query
            query = Shop.query

            # Apply filters
            if status and status != "all":
                query = query.filter(Shop.status == status)

            if subscription and subscription != "all":
                query = query.filter(Shop.subscription == subscription)

            if search:
                query = query.filter(
                    or_(
                        Shop.name.ilike(f"%{search}%"),
                        Shop.email.ilike(f"%{search}%"),
                        Shop.owner.ilike(f"%{search}%"),
                        Shop.phone.ilike(f"%{search}%")
                    )
                )

            # Paginate results
            paginated = query.order_by(
                Shop.created_at.desc()
            ).paginate(page=page, per_page=per_page, error_out=False)

            return jsonify({
                "success": True,
                "shops": [shop_response(shop) for shop in paginated.items],
                "total": paginated.total,
                "page": page,
                "per_page": per_page,
                "pages": paginated.pages
            }), 200

        except Exception as e:
            current_app.logger.error(f"Get shops error: {str(e)}")
            current_app.logger.exception("Full get shops traceback:")
            return jsonify({
                "success": False,
                "error": "Failed to fetch shops"
            }), 500

    # =================================================
    # GET SHOP STATISTICS (Admin Only)
    # =================================================

    @app.route("/api/shops/stats", methods=["GET", "OPTIONS"])
    @login_required
    def get_shop_stats():
        """
        Get shop statistics for admin dashboard.
        Admin access required.
        """
        # Handle CORS preflight
        if request.method == "OPTIONS":
            return handle_cors_preflight()
        
        try:
            if not admin_required():
                return jsonify({
                    "success": False,
                    "error": "Admin access required"
                }), 403

            # Count by status
            total = Shop.query.count()
            active = Shop.query.filter_by(status="active").count()
            inactive = Shop.query.filter_by(status="inactive").count()
            suspended = Shop.query.filter_by(status="suspended").count()

            # Count by subscription
            premium = Shop.query.filter_by(subscription="premium").count()
            standard = Shop.query.filter_by(subscription="standard").count()
            basic = Shop.query.filter_by(subscription="basic").count()

            # Total revenue
            revenue = db.session.query(
                db.func.sum(Shop.revenue)
            ).scalar() or 0

            # New shops this month
            current_month = datetime.utcnow().replace(day=1)
            new_this_month = Shop.query.filter(
                Shop.created_at >= current_month
            ).count()

            return jsonify({
                "success": True,
                "stats": {
                    "total": total,
                    "active": active,
                    "inactive": inactive,
                    "suspended": suspended,
                    "premium": premium,
                    "standard": standard,
                    "basic": basic,
                    "totalRevenue": float(revenue),
                    "newThisMonth": new_this_month
                }
            }), 200

        except Exception as e:
            current_app.logger.error(f"Get shop stats error: {str(e)}")
            return jsonify({
                "success": False,
                "error": "Failed to fetch statistics"
            }), 500

    # =================================================
    # SHOP LOGOUT
    # =================================================

    @app.route("/api/shop/logout", methods=["POST", "OPTIONS"])
    @login_required
    def shop_logout():
        """
        Logout the current shop user.
        """
        # Handle CORS preflight
        if request.method == "OPTIONS":
            return handle_cors_preflight()
        
        try:
            # Get origin for CORS headers
            origin = request.headers.get("Origin")
            
            logout_user()
            
            response = jsonify({
                "success": True,
                "message": "Logged out successfully"
            }), 200
            
            # Add CORS headers
            if origin:
                response = set_cors_headers(response, origin)
            
            return response

        except Exception as e:
            current_app.logger.error(f"Shop logout error: {str(e)}")
            return jsonify({
                "success": False,
                "error": "Logout failed"
            }), 500


# =====================================================
# CORS HELPER FUNCTION
# =====================================================

def handle_cors_preflight():
    """Handle CORS preflight requests"""
    response = jsonify({"success": True})
    
    origin = request.headers.get("Origin")
    
    if origin:
        allowed_origins = get_allowed_origins()
        origin_normalized = origin.rstrip('/')
        
        if origin_normalized in allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin_normalized
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Headers"] = (
                "Content-Type, Authorization, X-Shop-ID, "
                "X-Requested-With, Accept, Origin, "
                "Access-Control-Request-Method, "
                "Access-Control-Request-Headers, Cookie"
            )
            response.headers["Access-Control-Allow-Methods"] = (
                "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            )
            response.headers["Access-Control-Max-Age"] = "86400"
            response.headers["Vary"] = "Origin"
    
    return response, 200


# =====================================================
# CREATE SHOP (Admin Only)
# =====================================================

@app.route("/api/shops", methods=["POST"])
@login_required
def create_shop():
    """
    Create a new shop.
    Admin access required.
    """
    try:
        if not admin_required():
            return jsonify({
                "success": False,
                "error": "Admin access required"
            }), 403

        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "error": "No data provided"
            }), 400

        # Validate required fields
        required = ["name", "email", "phone", "owner", "password"]
        missing = [field for field in required if not data.get(field)]

        if missing:
            return jsonify({
                "success": False,
                "error": f"Missing fields: {', '.join(missing)}"
            }), 400

        # Validate email
        email = data["email"].lower().strip()
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return jsonify({
                "success": False,
                "error": "Invalid email format"
            }), 400

        # Validate phone
        phone = data["phone"].strip()
        if len(phone) < 10:
            return jsonify({
                "success": False,
                "error": "Phone number must be at least 10 digits"
            }), 400

        # Validate password
        if len(data["password"]) < 6:
            return jsonify({
                "success": False,
                "error": "Password must be at least 6 characters"
            }), 400

        # Check if email already exists
        existing = Shop.query.filter_by(email=email).first()
        if existing:
            return jsonify({
                "success": False,
                "error": "Email already registered"
            }), 400

        # Create shop
        shop = Shop(
            name=data["name"].strip(),
            email=email,
            phone=phone,
            address=data.get("address", "").strip(),
            owner=data["owner"].strip(),
            subscription=data.get("subscription", "basic"),
            status="active",
            password=data["password"],
            revenue=0,
            users_count=0
        )

        db.session.add(shop)
        db.session.commit()

        current_app.logger.info(f"✅ Shop created: {shop.name} ({shop.email})")

        return jsonify({
            "success": True,
            "message": "Shop created successfully",
            "shop": shop_response(shop)
        }), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Create shop error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Failed to create shop"
        }), 500