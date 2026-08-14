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
        "createdAt": shop.created_at.strftime("%Y-%m-%d") if shop.created_at else None,
        "lastActive": shop.last_active.strftime("%Y-%m-%d %H:%M") if shop.last_active else None
    }


def handle_cors_preflight():
    response = jsonify({"success": True})
    origin = request.headers.get("Origin")
    
    if origin:
        allowed_origins = current_app.config.get("CORS_ORIGINS", [])
        if origin.rstrip('/') in allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Headers"] = (
                "Content-Type, Authorization, X-Shop-ID, "
                "X-Requested-With, Accept, Origin, Cookie"
            )
            response.headers["Access-Control-Allow-Methods"] = (
                "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            )
            response.headers["Access-Control-Max-Age"] = "86400"
    
    return response, 200


def add_cors_headers(response):
    origin = request.headers.get("Origin")
    if origin:
        allowed_origins = current_app.config.get("CORS_ORIGINS", [])
        if origin.rstrip('/') in allowed_origins:
            if isinstance(response, tuple):
                response[0].headers["Access-Control-Allow-Origin"] = origin
                response[0].headers["Access-Control-Allow-Credentials"] = "true"
            else:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
    return response


# =====================================================
# ROUTES INITIALIZER
# =====================================================

def init_shop_routes(app):

    # =================================================
    # SHOP LOGIN
    # =================================================

    @app.route("/api/shop/login", methods=["POST", "OPTIONS"])
    def shop_login():
        """Shop login endpoint"""
        
        # Handle CORS preflight
        if request.method == "OPTIONS":
            return handle_cors_preflight()
        
        try:
            # Log request
            current_app.logger.info("📤 Login attempt received")
            
            # Check Content-Type
            if not request.is_json:
                current_app.logger.error("❌ Not JSON request")
                return jsonify({
                    "success": False,
                    "error": "Content-Type must be application/json"
                }), 400
            
            # Get data
            data = request.get_json()
            current_app.logger.info(f"📝 Login data: {data}")
            
            if not data:
                return jsonify({
                    "success": False,
                    "error": "No data provided"
                }), 400
            
            # Extract credentials
            email = data.get("email", "").lower().strip()
            password = data.get("password")
            
            current_app.logger.info(f"🔑 Login attempt for: {email}")
            
            if not email or not password:
                return jsonify({
                    "success": False,
                    "error": "Email and password are required"
                }), 400
            
            # Find shop
            shop = Shop.query.filter_by(email=email).first()
            
            if not shop:
                current_app.logger.warning(f"❌ Shop not found: {email}")
                return jsonify({
                    "success": False,
                    "error": "Invalid email or password"
                }), 401
            
            # Check status
            if shop.status != "active":
                current_app.logger.warning(f"❌ Inactive shop: {email}")
                return jsonify({
                    "success": False,
                    "error": "Shop account is inactive"
                }), 403
            
            # Check password
            if not shop.check_password(password):
                current_app.logger.warning(f"❌ Wrong password: {email}")
                return jsonify({
                    "success": False,
                    "error": "Invalid email or password"
                }), 401
            
            # Update last active
            shop.last_active = datetime.utcnow()
            db.session.commit()
            
            # Login user
            login_user(shop, remember=True)
            
            current_app.logger.info(f"✅ Login successful: {email}")
            
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
            return add_cors_headers(response)
            
        except Exception as e:
            current_app.logger.error(f"❌ Login error: {str(e)}")
            current_app.logger.exception("Full traceback:")
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
            return add_cors_headers(response)
        except Exception as e:
            current_app.logger.error(f"Logout error: {str(e)}")
            return jsonify({
                "success": False,
                "error": "Logout failed"
            }), 500

    # =================================================
    # GET CURRENT SHOP
    # =================================================

    @app.route("/api/shop/me", methods=["GET", "OPTIONS"])
    @login_required
    def get_shop_profile():
        if request.method == "OPTIONS":
            return handle_cors_preflight()
        
        try:
            if not isinstance(current_user, Shop):
                return jsonify({
                    "success": False,
                    "error": "Shop account required"
                }), 403
            
            shop = Shop.query.get(current_user.id)
            if not shop:
                return jsonify({
                    "success": False,
                    "error": "Shop not found"
                }), 404
            
            response = jsonify({
                "success": True,
                "shop": shop_response(shop)
            }), 200
            return add_cors_headers(response)
            
        except Exception as e:
            current_app.logger.error(f"Profile error: {str(e)}")
            return jsonify({
                "success": False,
                "error": "Failed to load profile"
            }), 500

    # =================================================
    # GET ALL SHOPS (Admin Only)
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

            shops = Shop.query.order_by(Shop.created_at.desc()).all()

            response = jsonify({
                "success": True,
                "shops": [shop_response(shop) for shop in shops],
                "total": len(shops)
            }), 200
            return add_cors_headers(response)

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

            stats = {
                "total": Shop.query.count(),
                "active": Shop.query.filter_by(status="active").count(),
                "inactive": Shop.query.filter_by(status="inactive").count(),
                "suspended": Shop.query.filter_by(status="suspended").count(),
                "premium": Shop.query.filter_by(subscription="premium").count(),
                "standard": Shop.query.filter_by(subscription="standard").count(),
                "basic": Shop.query.filter_by(subscription="basic").count(),
                "totalRevenue": float(db.session.query(db.func.sum(Shop.revenue)).scalar() or 0)
            }

            response = jsonify({
                "success": True,
                "stats": stats
            }), 200
            return add_cors_headers(response)

        except Exception as e:
            current_app.logger.error(f"Stats error: {str(e)}")
            return jsonify({
                "success": False,
                "error": "Failed to fetch stats"
            }), 500