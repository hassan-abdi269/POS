# routes/inventory.py (Complete Fixed Version)
import os
import uuid
import traceback
from flask import request, jsonify, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from extensions import db
from models.inventory import Product
from models.supplier import Supplier
from datetime import datetime

# ============ IMAGE UPLOAD CONFIGURATION ============

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5MB max file size

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_current_shop_id():
    """Get the current shop ID from the logged-in user"""
    if hasattr(current_user, 'id'):
        return current_user.id
    return None

def init_inventory_routes(app):
    
    # ============ IMAGE UPLOAD ROUTE ============
    
    @app.route('/api/upload', methods=['POST'])
    @login_required
    def upload_image():
        """Upload product image"""
        try:
            if 'image' not in request.files:
                return jsonify({'error': 'No image file provided'}), 400
            
            file = request.files['image']
            
            if file.filename == '':
                return jsonify({'error': 'No file selected'}), 400
            
            if not allowed_file(file.filename):
                return jsonify({
                    'error': 'File type not allowed. Use PNG, JPG, JPEG, GIF, or WEBP'
                }), 400
            
            upload_dir = os.path.join(current_app.root_path, 'uploads')
            os.makedirs(upload_dir, exist_ok=True)
            
            ext = file.filename.rsplit('.', 1)[1].lower()
            filename = f"{uuid.uuid4().hex}.{ext}"
            filepath = os.path.join(upload_dir, filename)
            
            file.save(filepath)
            
            image_url = f"http://localhost:5000/uploads/{filename}"
            
            return jsonify({
                'message': 'Image uploaded successfully',
                'image_url': image_url,
                'filename': filename
            }), 201
            
        except Exception as e:
            print(f"Upload error: {e}")
            return jsonify({'error': f'Upload failed: {str(e)}'}), 500
    
    # ============ STOCK UPDATE ROUTE ============
    
    @app.route('/api/products/<int:product_id>/stock', methods=['PATCH'])
    @login_required
    def update_stock(product_id):
        """Update product stock quantity - Only alerts on status change"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            data = request.get_json()
            
            if not data or 'quantity' not in data:
                return jsonify({'error': 'Quantity required'}), 400
            
            try:
                quantity_change = int(data['quantity'])
            except ValueError:
                return jsonify({'error': 'Invalid quantity format'}), 400
            
            # Find the product - FILTER BY SHOP
            product = Product.query.filter_by(id=product_id, shop_id=shop_id).first()
            if not product:
                return jsonify({'error': 'Product not found'}), 404
            
            old_stock = product.stock
            old_status = product.get_status()
            
            new_stock = old_stock + quantity_change
            
            if new_stock < 0:
                return jsonify({'error': 'Insufficient stock'}), 400
            
            product.stock = new_stock
            db.session.commit()
            
            new_status = product.get_status()
            
            alerts = []
            
            if old_status != new_status:
                if new_status == 'Out of Stock' and new_stock <= 0:
                    alerts.append(f'🚨 {product.name} is now OUT OF STOCK!')
                elif new_status == 'Low Stock' and old_status == 'In Stock':
                    alerts.append(f'⚠️ {product.name} is running low on stock ({new_stock} units remaining - Limit: {product.stock_limit})')
                elif new_status == 'Out of Stock' and old_status == 'Low Stock':
                    alerts.append(f'🚨 {product.name} is now OUT OF STOCK!')
            
            return jsonify({
                'product': product.to_dict(),
                'status': new_status,
                'alerts': alerts,
                'stock_changed': quantity_change
            }), 200
            
        except Exception as e:
            db.session.rollback()
            print(f"Error updating stock: {e}")
            return jsonify({'error': f'Failed to update stock: {str(e)}'}), 500
    
    # ============ PRODUCT ROUTES ============
    
    @app.route('/api/products', methods=['GET'])
    @login_required
    def get_products():
        """Get all products for the current shop only"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            search = request.args.get('search')
            is_active = request.args.get('is_active')
            status = request.args.get('status')
            supplier_id = request.args.get('supplier_id')
            
            # Start with shop filter
            query = Product.query.filter_by(shop_id=shop_id)
            
            if search:
                query = query.filter(
                    Product.name.contains(search) | Product.sku.contains(search)
                )
            
            if is_active is not None:
                query = query.filter_by(is_active=is_active == 'true')
            
            if supplier_id:
                query = query.filter_by(supplier_id=supplier_id)
            
            products = query.all()
            
            # Filter by status if provided
            if status:
                products = [p for p in products if p.get_status() == status]
            
            return jsonify([p.to_dict() for p in products])
            
        except Exception as e:
            print(f"Error fetching products: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/products/<int:product_id>', methods=['GET'])
    @login_required
    def get_product(product_id):
        """Get a specific product for the current shop"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            product = Product.query.filter_by(id=product_id, shop_id=shop_id).first()
            if not product:
                return jsonify({'error': 'Product not found'}), 404
            
            return jsonify(product.to_dict())
            
        except Exception as e:
            print(f"Error fetching product: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/products', methods=['POST'])
    @login_required
    def create_product():
        """Create a new product for the current shop"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            # ✅ FIXED: Get JSON data with error handling
            try:
                data = request.get_json()
            except Exception as e:
                return jsonify({'error': f'Invalid JSON: {str(e)}'}), 400
            
            # ✅ FIXED: Check if data is a dictionary
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            if not isinstance(data, dict):
                return jsonify({'error': 'Data must be a JSON object'}), 400
            
            # ✅ FIXED: Handle required fields with proper checking
            required = ['name', 'sku', 'price', 'stock', 'stock_limit']
            missing = []
            for field in required:
                if field not in data:
                    missing.append(field)
            
            if missing:
                return jsonify({
                    'error': f'Missing required fields: {", ".join(missing)}'
                }), 400
            
            # Check for duplicate SKU within the same shop
            if Product.query.filter_by(sku=data['sku'], shop_id=shop_id).first():
                return jsonify({'error': 'Product with this SKU already exists in your shop'}), 400
            
            try:
                price = float(data['price'])
                if price < 0:
                    return jsonify({'error': 'Price cannot be negative'}), 400
            except ValueError:
                return jsonify({'error': 'Invalid price format'}), 400
            
            try:
                stock = int(data['stock'])
                if stock < 0:
                    return jsonify({'error': 'Stock cannot be negative'}), 400
            except ValueError:
                return jsonify({'error': 'Invalid stock format'}), 400
            
            try:
                stock_limit = int(data['stock_limit'])
                if stock_limit < 1:
                    return jsonify({'error': 'Stock limit must be at least 1'}), 400
            except ValueError:
                return jsonify({'error': 'Invalid stock limit format'}), 400
            
            supplier_id = data.get('supplier_id')
            if supplier_id:
                supplier = Supplier.query.filter_by(id=supplier_id, shop_id=shop_id).first()
                if not supplier:
                    return jsonify({'error': 'Supplier not found'}), 404
            
            product = Product(
                shop_id=shop_id,
                name=data['name'],
                sku=data['sku'],
                description=data.get('description', ''),
                price=price,
                cost=float(data.get('cost', 0)),
                stock=stock,
                stock_limit=stock_limit,
                supplier_id=supplier_id,
                image_url=data.get('image_url', '')
            )
            
            db.session.add(product)
            db.session.commit()
            
            # Update supplier stats
            if supplier_id:
                supplier = Supplier.query.get(supplier_id)
                if supplier:
                    supplier.total_products = Product.query.filter_by(supplier_id=supplier_id, shop_id=shop_id).count()
                    db.session.commit()
            
            return jsonify(product.to_dict()), 201
            
        except Exception as e:
            db.session.rollback()
            print(f"Error creating product: {e}")
            print(traceback.format_exc())
            return jsonify({'error': f'Failed to create product: {str(e)}'}), 500
    
    @app.route('/api/products/<int:product_id>', methods=['PUT'])
    @login_required
    def update_product(product_id):
        """Update an existing product for the current shop"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            product = Product.query.filter_by(id=product_id, shop_id=shop_id).first()
            if not product:
                return jsonify({'error': 'Product not found'}), 404
            
            try:
                data = request.get_json()
            except Exception as e:
                return jsonify({'error': f'Invalid JSON: {str(e)}'}), 400
            
            if not data or not isinstance(data, dict):
                return jsonify({'error': 'Invalid data format'}), 400
            
            old_supplier_id = product.supplier_id
            
            if 'name' in data:
                product.name = data['name']
            if 'sku' in data:
                existing = Product.query.filter_by(sku=data['sku'], shop_id=shop_id).first()
                if existing and existing.id != product_id:
                    return jsonify({'error': 'SKU already exists in your shop'}), 400
                product.sku = data['sku']
            if 'description' in data:
                product.description = data['description']
            if 'price' in data:
                product.price = float(data['price'])
            if 'cost' in data:
                product.cost = float(data['cost'])
            if 'stock' in data:
                product.stock = int(data['stock'])
            if 'stock_limit' in data:
                stock_limit = int(data['stock_limit'])
                if stock_limit < 1:
                    return jsonify({'error': 'Stock limit must be at least 1'}), 400
                product.stock_limit = stock_limit
            if 'supplier_id' in data:
                supplier_id = data['supplier_id']
                if supplier_id:
                    supplier = Supplier.query.filter_by(id=supplier_id, shop_id=shop_id).first()
                    if not supplier:
                        return jsonify({'error': 'Supplier not found'}), 404
                product.supplier_id = supplier_id
            if 'image_url' in data:
                product.image_url = data['image_url']
            
            db.session.commit()
            
            # Update supplier stats
            if old_supplier_id:
                old_supplier = Supplier.query.get(old_supplier_id)
                if old_supplier:
                    old_supplier.total_products = Product.query.filter_by(supplier_id=old_supplier_id, shop_id=shop_id).count()
            
            if product.supplier_id:
                new_supplier = Supplier.query.get(product.supplier_id)
                if new_supplier:
                    new_supplier.total_products = Product.query.filter_by(supplier_id=product.supplier_id, shop_id=shop_id).count()
            
            db.session.commit()
            
            return jsonify(product.to_dict()), 200
            
        except Exception as e:
            db.session.rollback()
            print(f"Error updating product: {e}")
            return jsonify({'error': f'Failed to update product: {str(e)}'}), 500
    
    @app.route('/api/products/<int:product_id>', methods=['DELETE'])
    @login_required
    def delete_product(product_id):
        """Delete a product for the current shop"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            product = Product.query.filter_by(id=product_id, shop_id=shop_id).first()
            if not product:
                return jsonify({'error': 'Product not found'}), 404
            
            supplier_id = product.supplier_id
            
            db.session.delete(product)
            db.session.commit()
            
            if supplier_id:
                supplier = Supplier.query.get(supplier_id)
                if supplier:
                    supplier.total_products = Product.query.filter_by(supplier_id=supplier_id, shop_id=shop_id).count()
                    db.session.commit()
            
            return jsonify({'message': 'Product deleted successfully'}), 200
            
        except Exception as e:
            db.session.rollback()
            print(f"Error deleting product: {e}")
            return jsonify({'error': f'Failed to delete product: {str(e)}'}), 500