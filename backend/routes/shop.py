# routes/shop.py

from flask import request, jsonify, current_app
from flask_login import (
    login_required,
    login_user,
    logout_user,
    current_user
)
from sqlalchemy import or_
from datetime import datetime

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
    Safe shop response formatter.
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
        )
    }


# =====================================================
# ROUTES INITIALIZER
# =====================================================

def init_shop_routes(app):


    # =================================================
    # GET ALL SHOPS
    # =================================================

    @app.route("/api/shops", methods=["GET"])
    @login_required
    def get_shops():

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
                query = query.filter(
                    Shop.status == status
                )


            if subscription and subscription != "all":
                query = query.filter(
                    Shop.subscription == subscription
                )


            if search:

                query = query.filter(
                    or_(
                        Shop.name.ilike(
                            f"%{search}%"
                        ),
                        Shop.email.ilike(
                            f"%{search}%"
                        ),
                        Shop.owner.ilike(
                            f"%{search}%"
                        )
                    )
                )


            shops = query.order_by(
                Shop.created_at.desc()
            ).all()


            return jsonify({

                "success": True,

                "shops": [
                    shop_response(shop)
                    for shop in shops
                ],

                "total": len(shops)

            }), 200


        except Exception as e:

            current_app.logger.error(
                f"Get shops error: {str(e)}"
            )

            return jsonify({

                "success": False,
                "error": "Failed to fetch shops"

            }), 500



    # =================================================
    # GET SINGLE SHOP
    # =================================================

    @app.route(
        "/api/shops/<int:shop_id>",
        methods=["GET"]
    )
    @login_required
    def get_shop(shop_id):

        try:

            if not admin_required():

                return jsonify({

                    "success": False,
                    "error": "Admin access required"

                }), 403


            shop = Shop.query.get(shop_id)


            if not shop:

                return jsonify({

                    "success": False,
                    "error": "Shop not found"

                }), 404


            return jsonify({

                "success": True,
                "shop": shop_response(shop)

            }), 200



        except Exception as e:

            current_app.logger.error(
                f"Get shop error: {str(e)}"
            )

            return jsonify({

                "success": False,
                "error": "Failed to fetch shop"

            }), 500



    # =================================================
    # CREATE SHOP
    # =================================================

    @app.route(
        "/api/shops",
        methods=["POST"]
    )
    @login_required
    def create_shop():

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



            required = [

                "name",
                "email",
                "phone",
                "owner",
                "password"

            ]


            missing = [

                field
                for field in required
                if not data.get(field)

            ]


            if missing:

                return jsonify({

                    "success": False,

                    "error":
                    f"Missing fields: {', '.join(missing)}"

                }), 400



            email = data["email"].lower().strip()



            if not Shop.validate_email(email):

                return jsonify({

                    "success": False,
                    "error": "Invalid email format"

                }), 400



            if not Shop.validate_phone(
                data["phone"]
            ):

                return jsonify({

                    "success": False,
                    "error": "Invalid phone number"

                }), 400



            if len(data["password"]) < 6:

                return jsonify({

                    "success": False,
                    "error":
                    "Password must be at least 6 characters"

                }), 400



            existing = Shop.query.filter_by(
                email=email
            ).first()



            if existing:

                return jsonify({

                    "success": False,
                    "error":
                    "Email already registered"

                }), 400




            shop = Shop(

                name=data["name"],

                email=email,

                phone=data["phone"],

                address=data.get(
                    "address",
                    ""
                ),

                owner=data["owner"],

                subscription=data.get(
                    "subscription",
                    "basic"
                ),

                status="active",

                password=data["password"],

                revenue=0,

                users_count=0

            )



            db.session.add(shop)

            db.session.commit()



            current_app.logger.info(

                f"Shop created: {shop.name}"

            )



            return jsonify({

                "success": True,

                "message":
                "Shop created successfully",

                "shop":
                shop_response(shop)

            }), 201



        except ValueError as e:

            db.session.rollback()

            return jsonify({

                "success": False,
                "error": str(e)

            }), 400



        except Exception as e:

            db.session.rollback()

            current_app.logger.error(

                f"Create shop error: {str(e)}"

            )


            return jsonify({

                "success": False,
                "error":
                "Failed to create shop"

            }), 500

                # =================================================
    # UPDATE SHOP
    # =================================================

    @app.route(
        "/api/shops/<int:shop_id>",
        methods=["PUT"]
    )
    @login_required
    def update_shop(shop_id):

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



            shop = Shop.query.get(shop_id)



            if not shop:

                return jsonify({

                    "success": False,
                    "error": "Shop not found"

                }), 404



            if "name" in data:

                shop.name = data["name"]



            if "email" in data:

                email = data["email"].lower().strip()


                if not Shop.validate_email(email):

                    return jsonify({

                        "success": False,
                        "error": "Invalid email format"

                    }), 400



                existing = Shop.query.filter(

                    Shop.email == email,

                    Shop.id != shop_id

                ).first()



                if existing:

                    return jsonify({

                        "success": False,
                        "error":
                        "Email already in use"

                    }), 400



                shop.email = email



            if "phone" in data:

                if not Shop.validate_phone(
                    data["phone"]
                ):

                    return jsonify({

                        "success": False,
                        "error":
                        "Invalid phone number"

                    }), 400


                shop.phone = data["phone"]



            if "address" in data:

                shop.address = data["address"]



            if "owner" in data:

                shop.owner = data["owner"]



            if "subscription" in data:

                shop.subscription = data["subscription"]



            if data.get("password"):

                if len(data["password"]) < 6:

                    return jsonify({

                        "success": False,

                        "error":
                        "Password must be at least 6 characters"

                    }), 400


                shop.set_password(
                    data["password"]
                )



            shop.updated_at = datetime.utcnow()


            db.session.commit()



            return jsonify({

                "success": True,

                "message":
                "Shop updated successfully",

                "shop":
                shop_response(shop)

            }), 200



        except ValueError as e:

            db.session.rollback()

            return jsonify({

                "success": False,
                "error": str(e)

            }), 400



        except Exception as e:

            db.session.rollback()

            current_app.logger.error(

                f"Update shop error: {str(e)}"

            )

            return jsonify({

                "success": False,

                "error":
                "Failed to update shop"

            }), 500




    # =================================================
    # CHANGE SHOP STATUS
    # =================================================

    @app.route(
        "/api/shops/<int:shop_id>/status",
        methods=["PATCH"]
    )
    @login_required
    def toggle_shop_status(shop_id):

        try:

            if not admin_required():

                return jsonify({

                    "success": False,

                    "error":
                    "Admin access required"

                }), 403



            data = request.get_json()



            if not data or not data.get("status"):

                return jsonify({

                    "success": False,

                    "error":
                    "Status is required"

                }), 400



            valid_statuses = [

                "active",
                "inactive",
                "suspended"

            ]


            status = data["status"]



            if status not in valid_statuses:

                return jsonify({

                    "success": False,

                    "error":
                    "Invalid status"

                }), 400



            shop = Shop.query.get(shop_id)



            if not shop:

                return jsonify({

                    "success": False,

                    "error":
                    "Shop not found"

                }), 404



            shop.status = status

            shop.updated_at = datetime.utcnow()


            db.session.commit()



            return jsonify({

                "success": True,

                "message":
                f"Shop status updated to {status}",

                "shop":
                shop_response(shop)

            }), 200



        except Exception as e:

            db.session.rollback()

            current_app.logger.error(

                f"Status update error: {str(e)}"

            )


            return jsonify({

                "success": False,

                "error":
                "Failed to update status"

            }), 500




    # =================================================
    # DELETE SHOP
    # =================================================

    @app.route(
        "/api/shops/<int:shop_id>",
        methods=["DELETE"]
    )
    @login_required
    def delete_shop(shop_id):

        try:

            if not admin_required():

                return jsonify({

                    "success": False,

                    "error":
                    "Admin access required"

                }), 403



            shop = Shop.query.get(shop_id)



            if not shop:

                return jsonify({

                    "success": False,

                    "error":
                    "Shop not found"

                }), 404



            shop_name = shop.name


            db.session.delete(shop)

            db.session.commit()



            current_app.logger.info(

                f"Shop deleted: {shop_name}"

            )



            return jsonify({

                "success": True,

                "message":
                "Shop deleted successfully"

            }), 200



        except Exception as e:

            db.session.rollback()


            current_app.logger.error(

                f"Delete shop error: {str(e)}"

            )


            return jsonify({

                "success": False,

                "error":
                "Failed to delete shop"

            }), 500




    # =================================================
    # SHOP STATISTICS
    # =================================================

    @app.route(
        "/api/shops/stats",
        methods=["GET"]
    )
    @login_required
    def get_shop_stats():

        try:

            if not admin_required():

                return jsonify({

                    "success": False,

                    "error":
                    "Admin access required"

                }), 403



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



            revenue = db.session.query(

                db.func.sum(
                    Shop.revenue
                )

            ).scalar() or 0



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

            current_app.logger.error(

                f"Stats error: {str(e)}"

            )


            return jsonify({

                "success": False,

                "error":
                "Failed to fetch stats"

            }), 500




    # =================================================
    # RESET SHOP PASSWORD
    # =================================================

    @app.route(
        "/api/shops/<int:shop_id>/reset-password",
        methods=["POST"]
    )
    @login_required
    def reset_shop_password(shop_id):

        try:

            if not admin_required():

                return jsonify({

                    "success": False,

                    "error":
                    "Admin access required"

                }), 403



            data = request.get_json()



            new_password = (

                data.get("new_password")

                if data else None

            )



            if not new_password:

                return jsonify({

                    "success": False,

                    "error":
                    "New password is required"

                }), 400



            if len(new_password) < 6:

                return jsonify({

                    "success": False,

                    "error":
                    "Password must be at least 6 characters"

                }), 400



            shop = Shop.query.get(shop_id)



            if not shop:

                return jsonify({

                    "success": False,

                    "error":
                    "Shop not found"

                }), 404



            shop.set_password(
                new_password
            )

            shop.updated_at = datetime.utcnow()


            db.session.commit()



            return jsonify({

                "success": True,

                "message":
                "Password reset successfully"

            }), 200



        except Exception as e:

            db.session.rollback()


            current_app.logger.error(

                f"Password reset error: {str(e)}"

            )


            return jsonify({

                "success": False,

                "error":
                "Failed to reset password"

            }), 500




                # =================================================
    # SHOP LOGIN
    # =================================================

    @app.route(
        "/api/shop/login",
        methods=["POST", "OPTIONS"]
    )
    def shop_login():

        if request.method == "OPTIONS":

            response = jsonify({
                "success": True
            })

            response.headers.add(
                "Access-Control-Allow-Origin",
                "http://localhost:5173"
            )

            response.headers.add(
                "Access-Control-Allow-Headers",
                "Content-Type,Authorization"
            )

            response.headers.add(
                "Access-Control-Allow-Methods",
                "GET,POST,PUT,PATCH,DELETE,OPTIONS"
            )

            response.headers.add(
                "Access-Control-Allow-Credentials",
                "true"
            )

            return response, 200



        try:

            if not request.is_json:

                return jsonify({

                    "success": False,

                    "error":
                    "Content-Type must be application/json"

                }), 400



            data = request.get_json()


            email = (
                data.get("email","")
                .lower()
                .strip()
            )

            password = data.get(
                "password"
            )



            if not email or not password:

                return jsonify({

                    "success": False,

                    "error":
                    "Email and password required"

                }), 400



            shop = Shop.query.filter_by(
                email=email
            ).first()



            if not shop:

                return jsonify({

                    "success": False,

                    "error":
                    "Invalid credentials"

                }), 401



            if shop.status != "active":

                return jsonify({

                    "success": False,

                    "error":
                    "Shop account is not active"

                }), 401



            if not shop.check_password(
                password
            ):

                return jsonify({

                    "success": False,

                    "error":
                    "Invalid credentials"

                }), 401



            shop.last_active = datetime.utcnow()

            db.session.commit()



            login_user(
                shop,
                remember=True
            )



            current_app.logger.info(

                f"Shop login: {shop.email}"

            )



            return jsonify({

                "success": True,

                "message":
                "Login successful",

                "shop":
                shop_response(shop)

            }), 200



        except Exception as e:


            current_app.logger.error(

                f"Shop login error: {str(e)}"

            )


            return jsonify({

                "success": False,

                "error":
                "Login failed"

            }), 500





    # =================================================
    # CURRENT SHOP PROFILE
    # =================================================

    @app.route(
        "/api/shop/me",
        methods=["GET"]
    )
    @login_required
    def get_shop_profile():

        try:


            if not isinstance(
                current_user,
                Shop
            ):

                return jsonify({

                    "success": False,

                    "error":
                    "Shop account required"

                }), 403



            shop = Shop.query.get(
                current_user.id
            )



            if not shop:

                return jsonify({

                    "success": False,

                    "error":
                    "Shop not found"

                }), 404



            return jsonify({

                "success": True,

                "shop":
                shop_response(shop)

            }), 200



        except Exception as e:


            current_app.logger.error(

                f"Shop profile error: {str(e)}"

            )


            return jsonify({

                "success": False,

                "error":
                "Failed to load profile"

            }), 500





    # =================================================
    # SHOP LOGOUT
    # =================================================

    @app.route(
        "/api/shop/logout",
        methods=["POST"]
    )
    @login_required
    def shop_logout():

        try:

            logout_user()


            return jsonify({

                "success": True,

                "message":
                "Logged out successfully"

            }), 200



        except Exception as e:


            current_app.logger.error(

                f"Shop logout error: {str(e)}"

            )


            return jsonify({

                "success": False,

                "error":
                "Logout failed"

            }), 500