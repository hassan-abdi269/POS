# routes/shop.py - COMPLETE FILE
from flask import request, jsonify, current_app
from flask_login import login_required, login_user, logout_user, current_user
from models.shop import Shop
from extensions import db
from datetime import datetime
import re

def init_shop_routes(app):
    """Initialize shop management routes"""
    
    # ============ SHOP CRUD ROUTES ============
    
    @app.route('/api/shops', methods=['GET'])
    @login_required
    def get_shops():
        """Get all shops with optional filtering"""
        try:
            status = request.args.get('status')
            subscription = request.args.get('subscription')
            search = request.args.get('search', '')
            
            query = Shop.query
            
            if status and status != 'all':
                query = query.filter(Shop.status == status)
            if subscription and subscription != 'all':
                query = query.filter(Shop.subscription == subscription)
            if search:
                query = query.filter(
                    db.or_(
                        Shop.name.ilike(f'%{search}%'),
                        Shop.email.ilike(f'%{search}%'),
                        Shop.owner.ilike(f'%{search}%')
                    )
                )
            
            shops = query.order_by(Shop.created_at.desc()).all()
            
            return jsonify({
                'success': True,
                'shops': [shop.to_dict() for shop in shops],
                'total': len(shops)
            }), 200
            
        except Exception as e:
            current_app.logger.error(f"Error fetching shops: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to fetch shops'}), 500
    
    @app.route('/api/shops/<int:shop_id>', methods=['GET'])
    @login_required
    def get_shop(shop_id):
        """Get a single shop by ID"""
        try:
            shop = Shop.query.get(shop_id)
            if not shop:
                return jsonify({'success': False, 'error': 'Shop not found'}), 404
            
            return jsonify({
                'success': True,
                'shop': shop.to_dict()
            }), 200
            
        except Exception as e:
            current_app.logger.error(f"Error fetching shop {shop_id}: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to fetch shop'}), 500
    
    @app.route('/api/shops', methods=['POST'])
    @login_required
    def create_shop():
        """Create a new shop with password"""
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400
            
            required = ['name', 'email', 'phone', 'owner', 'password']
            missing = [field for field in required if not data.get(field)]
            if missing:
                return jsonify({
                    'success': False, 
                    'error': f'Missing required fields: {", ".join(missing)}'
                }), 400
            
            if not Shop.validate_email(data['email']):
                return jsonify({'success': False, 'error': 'Invalid email format'}), 400
            
            if not Shop.validate_phone(data['phone']):
                return jsonify({'success': False, 'error': 'Invalid phone number'}), 400
            
            password = data['password']
            if len(password) < 6:
                return jsonify({'success': False, 'error': 'Password must be at least 6 characters'}), 400
            
            existing = Shop.query.filter_by(email=data['email']).first()
            if existing:
                return jsonify({'success': False, 'error': 'Email already registered'}), 400
            
            shop = Shop(
                name=data['name'],
                email=data['email'],
                phone=data['phone'],
                address=data.get('address', ''),
                owner=data['owner'],
                subscription=data.get('subscription', 'basic'),
                status='active',
                password=password,
                revenue=0.00,
                users_count=0
            )
            
            db.session.add(shop)
            db.session.commit()
            
            current_app.logger.info(f"New shop created: {shop.name} (ID: {shop.id})")
            
            return jsonify({
                'success': True,
                'message': 'Shop created successfully',
                'shop': shop.to_dict()
            }), 201
            
        except ValueError as e:
            db.session.rollback()
            return jsonify({'success': False, 'error': str(e)}), 400
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error creating shop: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to create shop'}), 500
    
    @app.route('/api/shops/<int:shop_id>', methods=['PUT'])
    @login_required
    def update_shop(shop_id):
        """Update a shop"""
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400
            
            shop = Shop.query.get(shop_id)
            if not shop:
                return jsonify({'success': False, 'error': 'Shop not found'}), 404
            
            if 'name' in data:
                shop.name = data['name']
            if 'email' in data:
                if not Shop.validate_email(data['email']):
                    return jsonify({'success': False, 'error': 'Invalid email format'}), 400
                existing = Shop.query.filter(Shop.email == data['email'], Shop.id != shop_id).first()
                if existing:
                    return jsonify({'success': False, 'error': 'Email already in use'}), 400
                shop.email = data['email']
            if 'phone' in data:
                if not Shop.validate_phone(data['phone']):
                    return jsonify({'success': False, 'error': 'Invalid phone number'}), 400
                shop.phone = data['phone']
            if 'address' in data:
                shop.address = data['address']
            if 'owner' in data:
                shop.owner = data['owner']
            if 'subscription' in data:
                shop.subscription = data['subscription']
            if 'password' in data and data['password']:
                if len(data['password']) < 6:
                    return jsonify({'success': False, 'error': 'Password must be at least 6 characters'}), 400
                shop.set_password(data['password'])
            
            shop.updated_at = datetime.utcnow()
            db.session.commit()
            
            current_app.logger.info(f"Shop updated: {shop.name} (ID: {shop.id})")
            
            return jsonify({
                'success': True,
                'message': 'Shop updated successfully',
                'shop': shop.to_dict()
            }), 200
            
        except ValueError as e:
            db.session.rollback()
            return jsonify({'success': False, 'error': str(e)}), 400
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error updating shop {shop_id}: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to update shop'}), 500
    
    @app.route('/api/shops/<int:shop_id>/status', methods=['PATCH'])
    @login_required
    def toggle_shop_status(shop_id):
        """Toggle shop status"""
        try:
            data = request.get_json()
            status = data.get('status')
            
            if not status:
                return jsonify({'success': False, 'error': 'Status is required'}), 400
            
            shop = Shop.query.get(shop_id)
            if not shop:
                return jsonify({'success': False, 'error': 'Shop not found'}), 404
            
            valid_statuses = ['active', 'inactive', 'suspended']
            if status not in valid_statuses:
                return jsonify({
                    'success': False, 
                    'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
                }), 400
            
            shop.status = status
            shop.updated_at = datetime.utcnow()
            db.session.commit()
            
            current_app.logger.info(f"Shop {shop.name} status changed to {status}")
            
            return jsonify({
                'success': True,
                'message': f'Shop status updated to {status}',
                'shop': shop.to_dict()
            }), 200
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error toggling shop {shop_id} status: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to update shop status'}), 500
    
    @app.route('/api/shops/<int:shop_id>', methods=['DELETE'])
    @login_required
    def delete_shop(shop_id):
        """Delete a shop"""
        try:
            shop = Shop.query.get(shop_id)
            if not shop:
                return jsonify({'success': False, 'error': 'Shop not found'}), 404
            
            db.session.delete(shop)
            db.session.commit()
            
            current_app.logger.info(f"Shop deleted: {shop.name} (ID: {shop.id})")
            
            return jsonify({
                'success': True,
                'message': 'Shop deleted successfully'
            }), 200
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error deleting shop {shop_id}: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to delete shop'}), 500
    
    @app.route('/api/shops/stats', methods=['GET'])
    @login_required
    def get_shop_stats():
        """Get shop statistics"""
        try:
            total = Shop.query.count()
            active = Shop.query.filter_by(status='active').count()
            inactive = Shop.query.filter_by(status='inactive').count()
            suspended = Shop.query.filter_by(status='suspended').count()
            premium = Shop.query.filter_by(subscription='premium').count()
            standard = Shop.query.filter_by(subscription='standard').count()
            basic = Shop.query.filter_by(subscription='basic').count()
            
            total_revenue = db.session.query(db.func.sum(Shop.revenue)).scalar() or 0
            
            return jsonify({
                'success': True,
                'stats': {
                    'total': total,
                    'active': active,
                    'inactive': inactive,
                    'suspended': suspended,
                    'premium': premium,
                    'standard': standard,
                    'basic': basic,
                    'totalRevenue': float(total_revenue)
                }
            }), 200
            
        except Exception as e:
            current_app.logger.error(f"Error fetching shop stats: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to fetch stats'}), 500
    
    @app.route('/api/shops/<int:shop_id>/reset-password', methods=['POST'])
    @login_required
    def reset_shop_password(shop_id):
        """Reset shop password"""
        try:
            data = request.get_json()
            new_password = data.get('new_password')
            
            if not new_password:
                return jsonify({'success': False, 'error': 'New password is required'}), 400
            
            if len(new_password) < 6:
                return jsonify({'success': False, 'error': 'Password must be at least 6 characters'}), 400
            
            shop = Shop.query.get(shop_id)
            if not shop:
                return jsonify({'success': False, 'error': 'Shop not found'}), 404
            
            shop.set_password(new_password)
            shop.updated_at = datetime.utcnow()
            db.session.commit()
            
            current_app.logger.info(f"Password reset for shop: {shop.name} (ID: {shop.id})")
            
            return jsonify({
                'success': True,
                'message': 'Password reset successfully'
            }), 200
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error resetting password for shop {shop_id}: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to reset password'}), 500

    # ============ SHOP AUTHENTICATION ROUTES ============
    
    @app.route('/api/shop/login', methods=['POST', 'OPTIONS'])
    def shop_login():
        """Shop login endpoint with CORS support"""
        # Handle preflight OPTIONS request
        if request.method == 'OPTIONS':
            response = jsonify({'success': True})
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response, 200
        
        try:
            # Check if request has JSON data
            if not request.is_json:
                return jsonify({'success': False, 'error': 'Content-Type must be application/json'}), 400
            
            data = request.get_json()
            
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400
            
            email = data.get('email')
            password = data.get('password')
            
            if not email or not password:
                return jsonify({'success': False, 'error': 'Email and password required'}), 400
            
            # Find shop by email
            shop = Shop.query.filter_by(email=email).first()
            
            if not shop:
                current_app.logger.warning(f"Shop login failed: Email not found - {email}")
                return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
            
            # Check if shop is active
            if shop.status != 'active':
                current_app.logger.warning(f"Shop login failed: Shop not active - {shop.name}")
                return jsonify({'success': False, 'error': 'Shop account is not active'}), 401
            
            # Verify password
            if not shop.check_password(password):
                current_app.logger.warning(f"Shop login failed: Invalid password - {shop.name}")
                return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
            
            # Update last active
            shop.last_active = datetime.utcnow()
            db.session.commit()
            
            # Login the shop using Flask-Login
            login_user(shop, remember=True)
            
            current_app.logger.info(f"Shop login successful: {shop.name} (ID: {shop.id})")
            
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'shop': {
                    'id': shop.id,
                    'name': shop.name,
                    'email': shop.email,
                    'owner': shop.owner,
                    'phone': shop.phone,
                    'address': shop.address,
                    'subscription': shop.subscription,
                    'status': shop.status,
                    'revenue': shop.revenue
                }
            }), 200
            
        except Exception as e:
            current_app.logger.error(f"Error during shop login: {str(e)}")
            return jsonify({'success': False, 'error': 'Login failed'}), 500
    
    @app.route('/api/shop/me', methods=['GET'])
    @login_required
    def get_shop_profile():
        """Get current logged in shop profile"""
        try:
            if not current_user or not hasattr(current_user, 'id'):
                return jsonify({'success': False, 'error': 'Not authenticated'}), 401
            
            shop = Shop.query.get(current_user.id)
            if not shop:
                return jsonify({'success': False, 'error': 'Shop not found'}), 404
            
            return jsonify({
                'success': True,
                'shop': shop.to_dict()
            }), 200
            
        except Exception as e:
            current_app.logger.error(f"Error fetching shop profile: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to fetch profile'}), 500
    
    @app.route('/api/shop/logout', methods=['POST'])
    @login_required
    def shop_logout():
        """Shop logout endpoint"""
        try:
            logout_user()
            return jsonify({'success': True, 'message': 'Logged out successfully'}), 200
        except Exception as e:
            return jsonify({'success': False, 'error': 'Logout failed'}), 500