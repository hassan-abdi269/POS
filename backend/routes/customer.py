# routes/customer.py - COMPLETE WITH MULTI-TENANT SUPPORT
from flask import request, jsonify
from flask_login import login_required, current_user
from extensions import db
from models.customer import Customer
from models.sales import Sale
from datetime import datetime

def get_current_shop_id():
    """Get the current shop ID from the logged-in user"""
    if not current_user.is_authenticated:
        print("DEBUG: User not authenticated")
        return None
    
    if hasattr(current_user, 'id'):
        shop_id = current_user.id
        print(f"DEBUG: get_current_shop_id returning {shop_id}")
        return shop_id
    
    print("DEBUG: No shop_id found")
    return None

def init_customer_routes(app):
    
    # ============ CUSTOMER ROUTES ============
    
    @app.route('/api/customers', methods=['GET'])
    @login_required
    def get_customers():
        """Get all customers for the current shop only"""
        try:
            shop_id = get_current_shop_id()
            print(f"DEBUG: shop_id = {shop_id}")
            print(f"DEBUG: current_user.id = {current_user.id if hasattr(current_user, 'id') else 'No ID'}")
            print(f"DEBUG: current_user type = {type(current_user)}")
            
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            status = request.args.get('status')
            tier = request.args.get('tier')
            search = request.args.get('search')
            
            # Start with shop filter
            query = Customer.query.filter_by(shop_id=shop_id)
            print(f"DEBUG: Query = {query}")
            
            if status:
                query = query.filter_by(status=status)
            
            if tier:
                query = query.filter_by(tier=tier)
            
            if search:
                query = query.filter(
                    db.or_(
                        Customer.first_name.contains(search),
                        Customer.last_name.contains(search),
                        Customer.email.contains(search),
                        Customer.phone.contains(search)
                    )
                )
            
            customers = query.order_by(Customer.created_at.desc()).all()
            print(f"DEBUG: Found {len(customers)} customers for shop {shop_id}")
            
            return jsonify([c.to_dict() for c in customers])
            
        except Exception as e:
            print(f"Error fetching customers: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/customers/<int:customer_id>', methods=['GET'])
    @login_required
    def get_customer(customer_id):
        """Get a specific customer for the current shop"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            customer = Customer.query.filter_by(id=customer_id, shop_id=shop_id).first()
            if not customer:
                return jsonify({'error': 'Customer not found'}), 404
            
            return jsonify(customer.to_dict())
            
        except Exception as e:
            print(f"Error fetching customer: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/customers', methods=['POST'])
    @login_required
    def create_customer():
        """Create a new customer for the current shop"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            data = request.get_json()
            
            # Validate required fields
            required = ['first_name', 'last_name', 'email', 'phone']
            missing = [f for f in required if f not in data]
            if missing:
                return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400
            
            # Check if email already exists in THIS SHOP only (not globally)
            if Customer.query.filter_by(email=data['email'], shop_id=shop_id).first():
                return jsonify({'error': 'Customer with this email already exists in your shop'}), 400
            
            # Create customer with shop_id
            customer = Customer(
                shop_id=shop_id,
                first_name=data['first_name'],
                last_name=data['last_name'],
                email=data['email'],
                phone=data['phone'],
                address=data.get('address', ''),
                city=data.get('city', ''),
                state=data.get('state', ''),
                country=data.get('country', ''),
                postal_code=data.get('postal_code', ''),
                status=data.get('status', 'Active'),
                tier=data.get('tier', 'Bronze'),
                notes=data.get('notes', '')
            )
            
            db.session.add(customer)
            db.session.commit()
            
            return jsonify(customer.to_dict()), 201
            
        except Exception as e:
            db.session.rollback()
            print(f"Error creating customer: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/customers/<int:customer_id>', methods=['PUT'])
    @login_required
    def update_customer(customer_id):
        """Update a customer for the current shop"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            customer = Customer.query.filter_by(id=customer_id, shop_id=shop_id).first()
            if not customer:
                return jsonify({'error': 'Customer not found'}), 404
            
            data = request.get_json()
            
            # Update fields
            if 'first_name' in data:
                customer.first_name = data['first_name']
            if 'last_name' in data:
                customer.last_name = data['last_name']
            if 'email' in data:
                # Check if email is taken by another customer in THIS SHOP only
                existing = Customer.query.filter_by(email=data['email'], shop_id=shop_id).first()
                if existing and existing.id != customer_id:
                    return jsonify({'error': 'Email already in use in your shop'}), 400
                customer.email = data['email']
            if 'phone' in data:
                customer.phone = data['phone']
            if 'address' in data:
                customer.address = data['address']
            if 'city' in data:
                customer.city = data['city']
            if 'state' in data:
                customer.state = data['state']
            if 'country' in data:
                customer.country = data['country']
            if 'postal_code' in data:
                customer.postal_code = data['postal_code']
            if 'status' in data:
                customer.status = data['status']
            if 'tier' in data:
                customer.tier = data['tier']
            if 'notes' in data:
                customer.notes = data['notes']
            
            db.session.commit()
            return jsonify(customer.to_dict())
            
        except Exception as e:
            db.session.rollback()
            print(f"Error updating customer: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/customers/<int:customer_id>', methods=['DELETE'])
    @login_required
    def delete_customer(customer_id):
        """Delete a customer for the current shop (soft delete - mark as inactive)"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            customer = Customer.query.filter_by(id=customer_id, shop_id=shop_id).first()
            if not customer:
                return jsonify({'error': 'Customer not found'}), 404
            
            # Soft delete - mark as inactive
            customer.status = 'Inactive'
            db.session.commit()
            
            return jsonify({'message': 'Customer deactivated successfully'})
            
        except Exception as e:
            db.session.rollback()
            print(f"Error deleting customer: {e}")
            return jsonify({'error': str(e)}), 500
    
    # ============ CUSTOMER STATS ============
    
    @app.route('/api/customers/stats', methods=['GET'])
    @login_required
    def get_customer_stats():
        """Get customer statistics for the current shop only"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            customers = Customer.query.filter_by(shop_id=shop_id).all()
            active = Customer.query.filter_by(shop_id=shop_id, status='Active').count()
            inactive = Customer.query.filter_by(shop_id=shop_id, status='Inactive').count()
            
            total_spent = sum(c.total_spent for c in customers)
            total_orders = sum(c.total_orders for c in customers)
            
            # Tier breakdown for this shop
            tier_breakdown = {
                'Platinum': Customer.query.filter_by(shop_id=shop_id, tier='Platinum').count(),
                'Gold': Customer.query.filter_by(shop_id=shop_id, tier='Gold').count(),
                'Silver': Customer.query.filter_by(shop_id=shop_id, tier='Silver').count(),
                'Bronze': Customer.query.filter_by(shop_id=shop_id, tier='Bronze').count()
            }
            
            return jsonify({
                'total': len(customers),
                'active': active,
                'inactive': inactive,
                'total_spent': float(total_spent),
                'total_orders': total_orders,
                'average_spent': float(total_spent / len(customers)) if customers else 0,
                'tier_breakdown': tier_breakdown
            })
            
        except Exception as e:
            print(f"Error fetching customer stats: {e}")
            return jsonify({'error': str(e)}), 500
    
    # ============ UPDATE CUSTOMER STATS ============
    
    @app.route('/api/customers/update-stats', methods=['POST'])
    @login_required
    def update_all_customer_stats():
        """Update all customer stats from existing sales for the current shop only"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            customers = Customer.query.filter_by(shop_id=shop_id).all()
            updated_count = 0
            
            for customer in customers:
                # Get all completed sales for this customer in this shop
                sales = Sale.query.filter_by(customer_id=customer.id, shop_id=shop_id, status='Completed').all()
                
                if sales:
                    total_spent = sum(s.total for s in sales)
                    total_orders = len(sales)
                    
                    customer.total_spent = total_spent
                    customer.total_orders = total_orders
                    customer.update_tier()
                    customer.last_activity = max(s.created_at for s in sales) if sales else customer.created_at
                    
                    updated_count += 1
            
            db.session.commit()
            return jsonify({
                'message': f'Updated {updated_count} customers',
                'updated_count': updated_count
            }), 200
            
        except Exception as e:
            db.session.rollback()
            print(f"Error updating customer stats: {e}")
            return jsonify({'error': str(e)}), 500