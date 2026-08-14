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
    if not current_user.is_authenticated:
        return False
    return getattr(current_user, "is_admin", False)


def shop_response(shop):
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
        )
    }


def get_allowed_origins():
    """Get allowed origins from config"""
    allowed_origins = current_app.config.get("CORS_ORIGINS", [])
    
    if isinstance(allowed_origins, str):
        allowed_origins = [
            origin.strip().rstrip('/')
            for origin in allowed_origins.split(",")
            if origin.strip()
        ]
    elif isinstance(allowed_origins, (list, tuple, set)):
        allowed_origins = [
            str(origin).strip().rstrip('/')
            for origin in allowed_origins
            if str(origin).strip()
        ]
    
    # Ensure production is included
    PRODUCTION = "https://pos-frontend-j0hd.onrender.com"
    if PRODUCTION not in allowed_origins:
        allowed_origins.append(PRODUCTION)
    
    return list(dict.fromkeys(allowed_origins))


def handle_cors_preflight():
    """Handle OPTIONS preflight requests"""
    response = jsonify({"success": True})
    
    origin = request.headers.get("Origin")
    allowed_origins = get_allowed_origins()
    
    if origin:
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
# ROUTES INITIALIZER
# =====================================================

def init_shop_routes(app):

    # =================================================
    # SHOP LOGIN - COMPLETE FIX
    # =================================================

    @app.route("/api/shop/login", methods=["POST", "OPTIONS"])
    def shop_login():
        """Shop login with complete CORS support"""
        
        # Handle preflight
        if request.method == "OPTIONS":
            return handle_cors_preflight()
        
        try:
            # Validate JSON
            if not request.is_json:
                return jsonify({
                    "success": False,
                    "error": "Content-Type must be application/json"
                }), 400
            
            data = request.get_json()
            if not data:
                return jsonify({
                    "success": False,
                    "error": "No data provided"
                }), 400
            
            email = data.get("email", "").lower().strip()
            password = data.get("password")
            
            if not email or not password:
                return jsonify({
                    "success": False,
                    "error": "Email and password are required"
                }), 400
            
            # Find shop
            shop = Shop.query.filter_by(email=email).first()
            
            if not shop:
                current_app.logger.warning(f"❌ Login failed: email not found - {email}")
                return jsonify({
                    "success": False,
                    "error": "Invalid email or password"
                }), 401
            
            if shop.status != "active":
                current_app.logger.warning(f"❌ Login failed: inactive shop - {email}")
                return jsonify({
                    "success": False,
                    "error": "Shop account is inactive"
                }), 403
            
            if not shop.check_password(password):
                current_app.logger.warning(f"❌ Login failed: wrong password - {email}")
                return jsonify({
                    "success": False,
                    "error": "Invalid email or password"
                }), 401
            
            # Update last active
            shop.last_active = datetime.utcnow()
            db.session.commit()
            
            # Login
            login_user(shop, remember=True)
            
            current_app.logger.info(f"✅ Shop login successful: {email}")
            
            # Response
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
            }), 200
            
            # Add CORS headers
            origin = request.headers.get("Origin")
            if origin:
                allowed_origins = get_allowed_origins()
                origin_normalized = origin.rstrip('/')
                if origin_normalized in allowed_origins:
                    response[0].headers["Access-Control-Allow-Origin"] = origin_normalized
                    response[0].headers["Access-Control-Allow-Credentials"] = "true"
            
            return response
            
        except Exception as e:
            current_app.logger.error(f"❌ Shop login error: {str(e)}")
            current_app.logger.exception("Full login traceback:")
            return jsonify({
                "success": False,
                "error": "Login failed. Please try again."
            }), 500

    # =================================================
    # SHOP LOGOUT
    # =================================================

    @app.route("/api/shop/logout", methods=["POST", "OPTIONS"])
    @login_required
    def shop_logout():
        if request.method == "OPTIONS":
            return handle_cors_preflight()
        
        try:
            logout_user()
            response = jsonify({
                "success": True,
                "message": "Logged out successfully"
            }), 200
            
            origin = request.headers.get("Origin")
            if origin:
                allowed_origins = get_allowed_origins()
                origin_normalized = origin.rstrip('/')
                if origin_normalized in allowed_origins:
                    response[0].headers["Access-Control-Allow-Origin"] = origin_normalized
                    response[0].headers["Access-Control-Allow-Credentials"] = "true"
            
            return response
        except Exception as e:
            current_app.logger.error(f"Logout error: {str(e)}")
            return jsonify({
                "success": False,
                "error": "Logout failed"
            }), 500

    # =================================================
    # GET SHOPS (Admin Only)
    # =================================================

    @app.route("/api/shops", methods=["GET", "OPTIONS"])
    @login_required
    def get_shops():
        if request.method == "OPTIONS":
            return handle_cors_preflight()
        
        try:
            if not admin_required():
                return jsonify({
                    "success": False,
                    "error": "Admin access required"
                }), 403

            status = request.args.get("status")
            subscription = request.args.get("subscription")
            search = request.args.get("search", "").strip()

            query = Shop.query

            if status and status != "all":
                query = query.filter(Shop.status == status)
            if subscription and subscription != "all":
                query = query.filter(Shop.subscription == subscription)
            if search:
                query = query.filter(
                    or_(
                        Shop.name.ilike(f"%{search}%"),
                        Shop.email.ilike(f"%{search}%"),
                        Shop.owner.ilike(f"%{search}%")
                    )
                )

            shops = query.order_by(Shop.created_at.desc()).all()

            return jsonify({
                "success": True,
                "shops": [shop_response(shop) for shop in shops],
                "total": len(shops)
            }), 200

        except Exception as e:
            current_app.logger.error(f"Get shops error: {str(e)}")
            return jsonify({
                "success": False,
                "error": "Failed to fetch shops"
            }), 500

    # =================================================
    # SHOP STATISTICS (Admin Only)
    # =================================================

    @app.route("/api/shops/stats", methods=["GET", "OPTIONS"])
    @login_required
    def get_shop_stats():
        if request.method == "OPTIONS":
            return handle_cors_preflight()
        
        try:
            if not admin_required():
                return jsonify({
                    "success": False,
                    "error": "Admin access required"
                }), 403

            total = Shop.query.count()
            active = Shop.query.filter_by(status="active").count()
            inactive = Shop.query.filter_by(status="inactive").count()
            suspended = Shop.query.filter_by(status="suspended").count()
            premium = Shop.query.filter_by(subscription="premium").count()
            standard = Shop.query.filter_by(subscription="standard").count()
            basic = Shop.query.filter_by(subscription="basic").count()
            
            revenue = db.session.query(db.func.sum(Shop.revenue)).scalar() or 0

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
                    "totalRevenue": float(revenue)
                }
            }), 200

        except Exception as e:
            current_app.logger.error(f"Stats error: {str(e)}")
            return jsonify({
                "success": False,
                "error": "Failed to fetch stats"
            }), 500