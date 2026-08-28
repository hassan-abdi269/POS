# ============================================================
# TIRSI POS API
# routes/inventory.py
#
# Inventory / Product Routes
# ============================================================

import os
import uuid
import traceback
import json

from datetime import datetime

from flask import (
    request,
    jsonify,
    current_app,
    send_from_directory,
)

from flask_login import (
    login_required,
    current_user,
)

from werkzeug.utils import secure_filename

from extensions import db

from models.inventory import Product
from models.supplier import Supplier


# ============================================================
# IMAGE UPLOAD CONFIGURATION
# ============================================================

ALLOWED_EXTENSIONS = {
    "png",
    "jpg",
    "jpeg",
    "gif",
    "webp",
}

MAX_CONTENT_LENGTH = 5 * 1024 * 1024


# ============================================================
# HELPER: ALLOWED FILE
# ============================================================

def allowed_file(filename):
    """
    Check whether the uploaded file has an allowed extension.
    """

    return (
        bool(filename)
        and "." in filename
        and filename.rsplit(".", 1)[1].lower()
        in ALLOWED_EXTENSIONS
    )


# ============================================================
# HELPER: CURRENT SHOP ID
# ============================================================

def get_current_shop_id():
    """
    Get the shop ID from the logged-in Flask-Login user.
    """

    if not current_user:
        return None

    if not current_user.is_authenticated:
        return None

    user_id = getattr(
        current_user,
        "id",
        None,
    )

    if user_id is None:
        return None

    try:
        return int(user_id)
    except (
        ValueError,
        TypeError,
    ):
        return None


# ============================================================
# HELPER: VALIDATE JSON
# ============================================================

def get_json_data():
    """
    Safely get JSON request data.
    """

    try:
        data = request.get_json(
            silent=True
        )
    except Exception as e:
        return None, f"Invalid JSON: {str(e)}"

    if data is None:
        return None, "No JSON data provided"

    if not isinstance(data, dict):
        return None, "Data must be a JSON object"

    return data, None


# ============================================================
# INITIALIZE INVENTORY ROUTES
# ============================================================

def init_inventory_routes(app):

    # ========================================================
    # UPLOAD PRODUCT IMAGE
    # ========================================================

    @app.route(
        "/api/upload",
        methods=[
            "POST",
            "OPTIONS",
        ],
    )
    @login_required
    def upload_image():
        """
        Upload a product image.
        """

        if request.method == "OPTIONS":
            return "", 204

        try:

            # ------------------------------------------------
            # Check file
            # ------------------------------------------------

            if "image" not in request.files:
                return jsonify({
                    "success": False,
                    "error": "No image file provided",
                }), 400

            file = request.files["image"]

            if not file or not file.filename:
                return jsonify({
                    "success": False,
                    "error": "No file selected",
                }), 400

            # ------------------------------------------------
            # Check extension
            # ------------------------------------------------

            if not allowed_file(file.filename):

                return jsonify({
                    "success": False,
                    "error": (
                        "File type not allowed. "
                        "Use PNG, JPG, JPEG, GIF, or WEBP"
                    ),
                }), 400

            # ------------------------------------------------
            # Secure filename
            # ------------------------------------------------

            original_filename = secure_filename(
                file.filename
            )

            if not original_filename:
                return jsonify({
                    "success": False,
                    "error": "Invalid filename",
                }), 400

            # ------------------------------------------------
            # Upload directory
            # ------------------------------------------------

            upload_dir = os.path.join(
                current_app.root_path,
                "uploads",
            )

            os.makedirs(
                upload_dir,
                exist_ok=True,
            )

            # ------------------------------------------------
            # Generate unique filename
            # ------------------------------------------------

            extension = (
                original_filename
                .rsplit(".", 1)[1]
                .lower()
            )

            filename = (
                f"{uuid.uuid4().hex}.{extension}"
            )

            filepath = os.path.join(
                upload_dir,
                filename,
            )

            # ------------------------------------------------
            # Save file
            # ------------------------------------------------

            file.save(filepath)

            # ------------------------------------------------
            # URL
            # ------------------------------------------------

            image_url = (
                f"{request.host_url.rstrip('/')}"
                f"/uploads/{filename}"
            )

            return jsonify({
                "success": True,
                "message": "Image uploaded successfully",
                "image_url": image_url,
                "filename": filename,
            }), 201

        except Exception as e:

            current_app.logger.exception(
                "Image upload error"
            )

            return jsonify({
                "success": False,
                "error": f"Upload failed: {str(e)}",
            }), 500


    # ========================================================
    # SERVE UPLOADED IMAGES
    # ========================================================

    @app.route(
        "/uploads/<path:filename>",
        methods=["GET"],
    )
    def uploaded_image(filename):

        upload_dir = os.path.join(
            current_app.root_path,
            "uploads",
        )

        return send_from_directory(
            upload_dir,
            filename,
        )


    # ========================================================
    # UPDATE STOCK
    # ========================================================

    @app.route(
        "/api/products/<int:product_id>/stock",
        methods=[
            "PATCH",
            "OPTIONS",
        ],
    )
    @login_required
    def update_stock(product_id):

        if request.method == "OPTIONS":
            return "", 204

        try:

            shop_id = get_current_shop_id()

            if not shop_id:
                return jsonify({
                    "success": False,
                    "error": "Shop not found",
                }), 401

            data, error = get_json_data()

            if error:
                return jsonify({
                    "success": False,
                    "error": error,
                }), 400

            if "quantity" not in data:
                return jsonify({
                    "success": False,
                    "error": "Quantity required",
                }), 400

            # ------------------------------------------------
            # Quantity
            # ------------------------------------------------

            try:
                quantity_change = int(
                    data["quantity"]
                )
            except (
                ValueError,
                TypeError,
            ):
                return jsonify({
                    "success": False,
                    "error": "Invalid quantity format",
                }), 400

            # ------------------------------------------------
            # Product
            # ------------------------------------------------

            product = Product.query.filter_by(
                id=product_id,
                shop_id=shop_id,
            ).first()

            if not product:
                return jsonify({
                    "success": False,
                    "error": "Product not found",
                }), 404

            # ------------------------------------------------
            # Old status
            # ------------------------------------------------

            old_stock = int(
                product.stock or 0
            )

            old_status = product.get_status()

            # ------------------------------------------------
            # New stock
            # ------------------------------------------------

            new_stock = (
                old_stock
                + quantity_change
            )

            if new_stock < 0:
                return jsonify({
                    "success": False,
                    "error": "Insufficient stock",
                }), 400

            product.stock = new_stock

            # Recalculate profit total based on new stock
            product.calculate_profit()

            db.session.commit()

            # ------------------------------------------------
            # New status
            # ------------------------------------------------

            new_status = product.get_status()

            alerts = []

            # ------------------------------------------------
            # Out of stock
            # ------------------------------------------------

            if (
                old_status != new_status
                and new_status == "Out of Stock"
            ):

                alerts.append(
                    f"🚨 {product.name} is now "
                    f"OUT OF STOCK!"
                )

            # ------------------------------------------------
            # Low stock
            # ------------------------------------------------

            elif (
                old_status == "In Stock"
                and new_status == "Low Stock"
            ):

                alerts.append(
                    f"⚠️ {product.name} is running "
                    f"low on stock "
                    f"({new_stock} units remaining - "
                    f"Limit: {product.stock_limit})"
                )

            return jsonify({
                "success": True,
                "product": product.to_dict(),
                "status": new_status,
                "alerts": alerts,
                "stock_changed": quantity_change,
            }), 200

        except Exception as e:

            db.session.rollback()

            current_app.logger.exception(
                "Error updating stock"
            )

            return jsonify({
                "success": False,
                "error": (
                    f"Failed to update stock: "
                    f"{str(e)}"
                ),
            }), 500


    # ========================================================
    # GET PRODUCTS
    # ========================================================

    @app.route(
        "/api/products",
        methods=[
            "GET",
            "OPTIONS",
        ],
    )
    @login_required
    def get_products():

        if request.method == "OPTIONS":
            return "", 204

        try:

            shop_id = get_current_shop_id()

            if not shop_id:
                return jsonify({
                    "success": False,
                    "error": "Shop not found",
                }), 401

            # ------------------------------------------------
            # Query parameters
            # ------------------------------------------------

            search = request.args.get(
                "search"
            )

            is_active = request.args.get(
                "is_active"
            )

            status = request.args.get(
                "status"
            )

            supplier_id = request.args.get(
                "supplier_id"
            )

            # ------------------------------------------------
            # IMPORTANT:
            # Product is ALWAYS filtered by shop_id
            # ------------------------------------------------

            query = Product.query.filter_by(
                shop_id=shop_id
            )

            # ------------------------------------------------
            # Search
            # ------------------------------------------------

            if search:

                search_value = (
                    search.strip()
                )

                if search_value:

                    query = query.filter(
                        Product.name.contains(
                            search_value
                        )
                        |
                        Product.sku.contains(
                            search_value
                        )
                    )

            # ------------------------------------------------
            # Active
            # ------------------------------------------------

            if is_active is not None:

                active_value = (
                    is_active.lower()
                    == "true"
                )

                query = query.filter_by(
                    is_active=active_value
                )

            # ------------------------------------------------
            # Supplier
            # ------------------------------------------------

            if supplier_id:

                try:
                    supplier_id_int = int(
                        supplier_id
                    )

                    query = query.filter_by(
                        supplier_id=supplier_id_int
                    )

                except (
                    ValueError,
                    TypeError,
                ):
                    return jsonify({
                        "success": False,
                        "error": "Invalid supplier ID",
                    }), 400

            # ------------------------------------------------
            # Products
            # ------------------------------------------------

            products = query.all()

            # ------------------------------------------------
            # Status filter
            # ------------------------------------------------

            if status:

                products = [
                    product
                    for product in products
                    if product.get_status()
                    == status
                ]

            return jsonify([
                product.to_dict()
                for product in products
            ]), 200

        except Exception as e:

            current_app.logger.exception(
                "Error fetching products"
            )

            return jsonify({
                "success": False,
                "error": str(e),
            }), 500


    # ========================================================
    # GET SINGLE PRODUCT
    # ========================================================

    @app.route(
        "/api/products/<int:product_id>",
        methods=[
            "GET",
            "OPTIONS",
        ],
    )
    @login_required
    def get_product(product_id):

        if request.method == "OPTIONS":
            return "", 204

        try:

            shop_id = get_current_shop_id()

            if not shop_id:
                return jsonify({
                    "success": False,
                    "error": "Shop not found",
                }), 401

            product = Product.query.filter_by(
                id=product_id,
                shop_id=shop_id,
            ).first()

            if not product:

                return jsonify({
                    "success": False,
                    "error": "Product not found",
                }), 404

            # Include price history for detailed view
            return jsonify(
                product.to_dict(include_history=True)
            ), 200

        except Exception as e:

            current_app.logger.exception(
                "Error fetching product"
            )

            return jsonify({
                "success": False,
                "error": str(e),
            }), 500


    # ========================================================
    # CREATE PRODUCT
    # ========================================================

    @app.route(
        "/api/products",
        methods=[
            "POST",
            "OPTIONS",
        ],
    )
    @login_required
    def create_product():

        if request.method == "OPTIONS":
            return "", 204

        try:

            shop_id = get_current_shop_id()

            if not shop_id:
                return jsonify({
                    "success": False,
                    "error": "Shop not found",
                }), 401

            # ------------------------------------------------
            # JSON
            # ------------------------------------------------

            data, error = get_json_data()

            if error:
                return jsonify({
                    "success": False,
                    "error": error,
                }), 400

            # ------------------------------------------------
            # Required fields
            # ------------------------------------------------

            required_fields = [
                "name",
                "sku",
                "price",
                "stock",
                "stock_limit",
            ]

            missing = [
                field
                for field in required_fields
                if field not in data
            ]

            if missing:

                return jsonify({
                    "success": False,
                    "error": (
                        "Missing required fields: "
                        + ", ".join(missing)
                    ),
                }), 400

            # ------------------------------------------------
            # Clean strings
            # ------------------------------------------------

            name = str(
                data["name"]
            ).strip()

            sku = str(
                data["sku"]
            ).strip()

            if not name:

                return jsonify({
                    "success": False,
                    "error": "Product name is required",
                }), 400

            if not sku:

                return jsonify({
                    "success": False,
                    "error": "SKU is required",
                }), 400

            # ------------------------------------------------
            # Duplicate SKU
            # ------------------------------------------------

            existing_product = (
                Product.query.filter_by(
                    sku=sku,
                    shop_id=shop_id,
                ).first()
            )

            if existing_product:

                return jsonify({
                    "success": False,
                    "error": (
                        "Product with this SKU "
                        "already exists in your shop"
                    ),
                }), 400

            # ------------------------------------------------
            # Price
            # ------------------------------------------------

            try:

                price = float(
                    data["price"]
                )

            except (
                ValueError,
                TypeError,
            ):

                return jsonify({
                    "success": False,
                    "error": "Invalid price format",
                }), 400

            if price < 0:

                return jsonify({
                    "success": False,
                    "error": "Price cannot be negative",
                }), 400

            # ------------------------------------------------
            # Cost
            # ------------------------------------------------

            try:

                cost = float(
                    data.get(
                        "cost",
                        0
                    )
                )

            except (
                ValueError,
                TypeError,
            ):

                return jsonify({
                    "success": False,
                    "error": "Invalid cost format",
                }), 400

            if cost < 0:

                return jsonify({
                    "success": False,
                    "error": "Cost cannot be negative",
                }), 400

            # ------------------------------------------------
            # Stock
            # ------------------------------------------------

            try:

                stock = int(
                    data["stock"]
                )

            except (
                ValueError,
                TypeError,
            ):

                return jsonify({
                    "success": False,
                    "error": "Invalid stock format",
                }), 400

            if stock < 0:

                return jsonify({
                    "success": False,
                    "error": "Stock cannot be negative",
                }), 400

            # ------------------------------------------------
            # Stock limit
            # ------------------------------------------------

            try:

                stock_limit = int(
                    data["stock_limit"]
                )

            except (
                ValueError,
                TypeError,
            ):

                return jsonify({
                    "success": False,
                    "error": (
                        "Invalid stock limit format"
                    ),
                }), 400

            if stock_limit < 1:

                return jsonify({
                    "success": False,
                    "error": (
                        "Stock limit must be "
                        "at least 1"
                    ),
                }), 400

            # ------------------------------------------------
            # Supplier
            # ------------------------------------------------

            supplier_id = data.get(
                "supplier_id"
            )

            if supplier_id:

                try:
                    supplier_id = int(
                        supplier_id
                    )

                except (
                    ValueError,
                    TypeError,
                ):

                    return jsonify({
                        "success": False,
                        "error": "Invalid supplier ID",
                    }), 400

                supplier = Supplier.query.filter_by(
                    id=supplier_id,
                    shop_id=shop_id,
                ).first()

                if not supplier:

                    return jsonify({
                        "success": False,
                        "error": "Supplier not found",
                    }), 404

            else:

                supplier_id = None

            # ------------------------------------------------
            # Create product
            # ------------------------------------------------

            product = Product(

                shop_id=shop_id,

                name=name,

                sku=sku,

                description=str(
                    data.get(
                        "description",
                        ""
                    )
                ).strip(),

                price=price,

                cost=cost,

                stock=stock,

                stock_limit=stock_limit,

                supplier_id=supplier_id,

                image_url=str(
                    data.get(
                        "image_url",
                        ""
                    )
                ).strip(),
            )

            # Calculate expected profit
            product.calculate_profit()

            # Add initial price history
            product.add_price_history(0, 0)

            db.session.add(
                product
            )

            db.session.commit()

            # ------------------------------------------------
            # Supplier statistics
            # ------------------------------------------------

            if supplier_id:

                supplier = db.session.get(
                    Supplier,
                    supplier_id,
                )

                if supplier:

                    supplier.total_products = (
                        Product.query.filter_by(
                            supplier_id=supplier_id,
                            shop_id=shop_id,
                        ).count()
                    )

                    db.session.commit()

            return jsonify(
                product.to_dict(include_history=True)
            ), 201

        except Exception as e:

            db.session.rollback()

            current_app.logger.exception(
                "Error creating product"
            )

            return jsonify({
                "success": False,
                "error": (
                    f"Failed to create product: "
                    f"{str(e)}"
                ),
            }), 500


    # ========================================================
    # UPDATE PRODUCT
    # ========================================================

    @app.route(
        "/api/products/<int:product_id>",
        methods=[
            "PUT",
            "OPTIONS",
        ],
    )
    @login_required
    def update_product(product_id):

        if request.method == "OPTIONS":
            return "", 204

        try:

            shop_id = get_current_shop_id()

            if not shop_id:
                return jsonify({
                    "success": False,
                    "error": "Shop not found",
                }), 401

            # ------------------------------------------------
            # Product
            # ------------------------------------------------

            product = Product.query.filter_by(
                id=product_id,
                shop_id=shop_id,
            ).first()

            if not product:

                return jsonify({
                    "success": False,
                    "error": "Product not found",
                }), 404

            # ------------------------------------------------
            # JSON
            # ------------------------------------------------

            data, error = get_json_data()

            if error:

                return jsonify({
                    "success": False,
                    "error": error,
                }), 400

            # Store old values for history tracking
            old_price = product.price
            old_cost = product.cost
            
            old_supplier_id = (
                product.supplier_id
            )

            # ------------------------------------------------
            # Name
            # ------------------------------------------------

            if "name" in data:

                name = str(
                    data["name"]
                ).strip()

                if not name:

                    return jsonify({
                        "success": False,
                        "error": (
                            "Product name "
                            "cannot be empty"
                        ),
                    }), 400

                product.name = name

            # ------------------------------------------------
            # SKU
            # ------------------------------------------------

            if "sku" in data:

                sku = str(
                    data["sku"]
                ).strip()

                if not sku:

                    return jsonify({
                        "success": False,
                        "error": "SKU cannot be empty",
                    }), 400

                existing = (
                    Product.query.filter_by(
                        sku=sku,
                        shop_id=shop_id,
                    ).first()
                )

                if (
                    existing
                    and existing.id != product_id
                ):

                    return jsonify({
                        "success": False,
                        "error": (
                            "SKU already exists "
                            "in your shop"
                        ),
                    }), 400

                product.sku = sku

            # ------------------------------------------------
            # Description
            # ------------------------------------------------

            if "description" in data:

                product.description = str(
                    data["description"]
                ).strip()

            # ------------------------------------------------
            # Price - track changes
            # ------------------------------------------------

            if "price" in data:

                try:

                    price = float(
                        data["price"]
                    )

                except (
                    ValueError,
                    TypeError,
                ):

                    return jsonify({
                        "success": False,
                        "error": "Invalid price format",
                    }), 400

                if price < 0:

                    return jsonify({
                        "success": False,
                        "error": (
                            "Price cannot be negative"
                        ),
                    }), 400

                product.price = price

            # ------------------------------------------------
            # Cost - track changes
            # ------------------------------------------------

            if "cost" in data:

                try:

                    cost = float(
                        data["cost"]
                    )

                except (
                    ValueError,
                    TypeError,
                ):

                    return jsonify({
                        "success": False,
                        "error": "Invalid cost format",
                    }), 400

                if cost < 0:

                    return jsonify({
                        "success": False,
                        "error": (
                            "Cost cannot be negative"
                        ),
                    }), 400

                product.cost = cost

            # ------------------------------------------------
            # Stock
            # ------------------------------------------------

            if "stock" in data:

                try:

                    stock = int(
                        data["stock"]
                    )

                except (
                    ValueError,
                    TypeError,
                ):

                    return jsonify({
                        "success": False,
                        "error": "Invalid stock format",
                    }), 400

                if stock < 0:

                    return jsonify({
                        "success": False,
                        "error": (
                            "Stock cannot be negative"
                        ),
                    }), 400

                product.stock = stock

            # ------------------------------------------------
            # Stock limit
            # ------------------------------------------------

            if "stock_limit" in data:

                try:

                    stock_limit = int(
                        data["stock_limit"]
                    )

                except (
                    ValueError,
                    TypeError,
                ):

                    return jsonify({
                        "success": False,
                        "error": (
                            "Invalid stock "
                            "limit format"
                        ),
                    }), 400

                if stock_limit < 1:

                    return jsonify({
                        "success": False,
                        "error": (
                            "Stock limit must be "
                            "at least 1"
                        ),
                    }), 400

                product.stock_limit = (
                    stock_limit
                )

            # ------------------------------------------------
            # Supplier
            # ------------------------------------------------

            if "supplier_id" in data:

                supplier_id = data[
                    "supplier_id"
                ]

                if supplier_id:

                    try:

                        supplier_id = int(
                            supplier_id
                        )

                    except (
                        ValueError,
                        TypeError,
                    ):

                        return jsonify({
                            "success": False,
                            "error": (
                                "Invalid supplier ID"
                            ),
                        }), 400

                    supplier = (
                        Supplier.query.filter_by(
                            id=supplier_id,
                            shop_id=shop_id,
                        ).first()
                    )

                    if not supplier:

                        return jsonify({
                            "success": False,
                            "error": (
                                "Supplier not found"
                            ),
                        }), 404

                else:

                    supplier_id = None

                product.supplier_id = (
                    supplier_id
                )

            # ------------------------------------------------
            # Image
            # ------------------------------------------------

            if "image_url" in data:

                product.image_url = str(
                    data["image_url"]
                ).strip()

            # ------------------------------------------------
            # Calculate profit and add price history if changed
            # ------------------------------------------------

            product.calculate_profit()
            product.add_price_history(old_price, old_cost)

            # ------------------------------------------------
            # Save
            # ------------------------------------------------

            db.session.commit()

            # ------------------------------------------------
            # Update old supplier
            # ------------------------------------------------

            if old_supplier_id:

                old_supplier = db.session.get(
                    Supplier,
                    old_supplier_id,
                )

                if old_supplier:

                    old_supplier.total_products = (
                        Product.query.filter_by(
                            supplier_id=old_supplier_id,
                            shop_id=shop_id,
                        ).count()
                    )

            # ------------------------------------------------
            # Update new supplier
            # ------------------------------------------------

            if product.supplier_id:

                new_supplier = db.session.get(
                    Supplier,
                    product.supplier_id,
                )

                if new_supplier:

                    new_supplier.total_products = (
                        Product.query.filter_by(
                            supplier_id=product.supplier_id,
                            shop_id=shop_id,
                        ).count()
                    )

            db.session.commit()

            # Return with history included
            return jsonify(
                product.to_dict(include_history=True)
            ), 200

        except Exception as e:

            db.session.rollback()

            current_app.logger.exception(
                "Error updating product"
            )

            return jsonify({
                "success": False,
                "error": (
                    f"Failed to update product: "
                    f"{str(e)}"
                ),
            }), 500


    # ========================================================
    # DELETE PRODUCT
    # ========================================================

    @app.route(
        "/api/products/<int:product_id>",
        methods=[
            "DELETE",
            "OPTIONS",
        ],
    )
    @login_required
    def delete_product(product_id):

        if request.method == "OPTIONS":
            return "", 204

        try:

            shop_id = get_current_shop_id()

            if not shop_id:

                return jsonify({
                    "success": False,
                    "error": "Shop not found",
                }), 401

            # ------------------------------------------------
            # Product
            # ------------------------------------------------

            product = Product.query.filter_by(
                id=product_id,
                shop_id=shop_id,
            ).first()

            if not product:

                return jsonify({
                    "success": False,
                    "error": "Product not found",
                }), 404

            supplier_id = (
                product.supplier_id
            )

            # ------------------------------------------------
            # Delete
            # ------------------------------------------------

            db.session.delete(
                product
            )

            db.session.commit()

            # ------------------------------------------------
            # Supplier statistics
            # ------------------------------------------------

            if supplier_id:

                supplier = db.session.get(
                    Supplier,
                    supplier_id,
                )

                if supplier:

                    supplier.total_products = (
                        Product.query.filter_by(
                            supplier_id=supplier_id,
                            shop_id=shop_id,
                        ).count()
                    )

                    db.session.commit()

            return jsonify({
                "success": True,
                "message": (
                    "Product deleted successfully"
                ),
            }), 200

        except Exception as e:

            db.session.rollback()

            current_app.logger.exception(
                "Error deleting product"
            )

            return jsonify({
                "success": False,
                "error": (
                    f"Failed to delete product: "
                    f"{str(e)}"
                ),
            }), 500