# routes/payment.py - FIXED DATE PARSING
from flask import request, jsonify, current_app
from flask_login import login_required, current_user
from models.payment import Payment
from models.shop import Shop
from extensions import db
from datetime import datetime
import re
from dateutil import parser

def init_payment_routes(app):
    """Initialize payment management routes"""
    
    # ============ PAYMENT CRUD ROUTES ============
    
    @app.route('/api/payments', methods=['GET'])
    @login_required
    def get_payments():
        """Get all payments with optional filtering"""
        try:
            shop_id = request.args.get('shop_id')
            status = request.args.get('status')
            plan = request.args.get('plan')
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')
            search = request.args.get('search', '')
            
            query = Payment.query
            
            # Apply filters
            if shop_id:
                query = query.filter(Payment.shop_id == shop_id)
            if status and status != 'all':
                query = query.filter(Payment.status == status)
            if plan and plan != 'all':
                query = query.filter(Payment.plan == plan)
            if start_date:
                query = query.filter(Payment.payment_date >= start_date)
            if end_date:
                query = query.filter(Payment.payment_date <= end_date)
            if search:
                query = query.filter(
                    db.or_(
                        Payment.transaction_id.ilike(f'%{search}%'),
                        Payment.receipt_number.ilike(f'%{search}%'),
                        Payment.customer_name.ilike(f'%{search}%'),
                        Payment.customer_email.ilike(f'%{search}%')
                    )
                )
            
            payments = query.order_by(Payment.payment_date.desc()).all()
            
            # If user is shop, only show their payments
            if hasattr(current_user, 'shop_id') and current_user.shop_id:
                payments = [p for p in payments if p.shop_id == current_user.shop_id]
            
            return jsonify({
                'success': True,
                'payments': [payment.to_dict() for payment in payments],
                'total': len(payments)
            }), 200
            
        except Exception as e:
            current_app.logger.error(f"Error fetching payments: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to fetch payments'}), 500
    
    @app.route('/api/payments/<int:payment_id>', methods=['GET'])
    @login_required
    def get_payment(payment_id):
        """Get a single payment by ID"""
        try:
            payment = Payment.query.get(payment_id)
            if not payment:
                return jsonify({'success': False, 'error': 'Payment not found'}), 404
            
            # Check if user has access
            if hasattr(current_user, 'shop_id') and current_user.shop_id:
                if payment.shop_id != current_user.shop_id:
                    return jsonify({'success': False, 'error': 'Access denied'}), 403
            
            return jsonify({
                'success': True,
                'payment': payment.to_dict()
            }), 200
            
        except Exception as e:
            current_app.logger.error(f"Error fetching payment {payment_id}: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to fetch payment'}), 500
    
    @app.route('/api/payments', methods=['POST'])
    @login_required
    def create_payment():
        """Create a new payment"""
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400
            
            # Validate required fields
            required = ['shop_id', 'amount', 'payment_date', 'customer_name']
            missing = [field for field in required if not data.get(field)]
            if missing:
                return jsonify({
                    'success': False,
                    'error': f'Missing required fields: {", ".join(missing)}'
                }), 400
            
            # Validate shop exists
            shop = Shop.query.get(data['shop_id'])
            if not shop:
                return jsonify({'success': False, 'error': 'Shop not found'}), 404
            
            # Validate amount
            try:
                amount = float(data['amount'])
                if amount <= 0:
                    raise ValueError('Amount must be greater than 0')
            except (ValueError, TypeError):
                return jsonify({'success': False, 'error': 'Invalid amount'}), 400
            
            # Validate plan
            valid_plans = Payment.get_plan_options()
            plan = data.get('plan', 'Basic')
            if plan not in valid_plans:
                return jsonify({
                    'success': False,
                    'error': f'Invalid plan. Must be one of: {", ".join(valid_plans)}'
                }), 400
            
            # Validate status
            valid_statuses = Payment.get_status_options()
            status = data.get('status', 'pending')
            if status not in valid_statuses:
                return jsonify({
                    'success': False,
                    'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
                }), 400
            
            # Validate payment method
            valid_methods = Payment.get_payment_method_options()
            payment_method = data.get('payment_method', 'credit_card')
            if payment_method not in valid_methods:
                return jsonify({
                    'success': False,
                    'error': f'Invalid payment method. Must be one of: {", ".join(valid_methods)}'
                }), 400
            
            # Parse payment date - FIXED
            try:
                payment_date_str = data['payment_date']
                # Try parsing with dateutil parser (handles multiple formats)
                payment_date = parser.parse(payment_date_str)
            except (ValueError, TypeError, OverflowError) as e:
                current_app.logger.error(f"Date parsing error: {str(e)}")
                return jsonify({
                    'success': False, 
                    'error': f'Invalid payment date format. Please use ISO format (YYYY-MM-DDTHH:MM:SS)'
                }), 400
            
            # Create payment
            payment = Payment(
                shop_id=data['shop_id'],
                amount=amount,
                plan=plan,
                payment_method=payment_method,
                status=status,
                customer_name=data['customer_name'],
                customer_email=data.get('customer_email'),
                customer_phone=data.get('customer_phone'),
                payment_date=payment_date,
                notes=data.get('notes')
            )
            
            db.session.add(payment)
            db.session.commit()
            
            current_app.logger.info(f"Payment created: {payment.transaction_id} for shop {shop.name}")
            
            return jsonify({
                'success': True,
                'message': 'Payment created successfully',
                'payment': payment.to_dict()
            }), 201
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error creating payment: {str(e)}")
            return jsonify({'success': False, 'error': f'Failed to create payment: {str(e)}'}), 500
    
    @app.route('/api/payments/<int:payment_id>', methods=['PUT'])
    @login_required
    def update_payment(payment_id):
        """Update a payment"""
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400
            
            payment = Payment.query.get(payment_id)
            if not payment:
                return jsonify({'success': False, 'error': 'Payment not found'}), 404
            
            # Check if user has access
            if hasattr(current_user, 'shop_id') and current_user.shop_id:
                if payment.shop_id != current_user.shop_id:
                    return jsonify({'success': False, 'error': 'Access denied'}), 403
            
            # Update fields
            if 'amount' in data:
                try:
                    amount = float(data['amount'])
                    if amount <= 0:
                        raise ValueError('Amount must be greater than 0')
                    payment.amount = amount
                except (ValueError, TypeError):
                    return jsonify({'success': False, 'error': 'Invalid amount'}), 400
            
            if 'plan' in data:
                valid_plans = Payment.get_plan_options()
                if data['plan'] not in valid_plans:
                    return jsonify({
                        'success': False,
                        'error': f'Invalid plan. Must be one of: {", ".join(valid_plans)}'
                    }), 400
                payment.plan = data['plan']
            
            if 'status' in data:
                valid_statuses = Payment.get_status_options()
                if data['status'] not in valid_statuses:
                    return jsonify({
                        'success': False,
                        'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
                    }), 400
                payment.status = data['status']
            
            if 'payment_method' in data:
                valid_methods = Payment.get_payment_method_options()
                if data['payment_method'] not in valid_methods:
                    return jsonify({
                        'success': False,
                        'error': f'Invalid payment method. Must be one of: {", ".join(valid_methods)}'
                    }), 400
                payment.payment_method = data['payment_method']
            
            if 'customer_name' in data:
                payment.customer_name = data['customer_name']
            
            if 'customer_email' in data:
                payment.customer_email = data['customer_email']
            
            if 'customer_phone' in data:
                payment.customer_phone = data['customer_phone']
            
            if 'payment_date' in data:
                try:
                    payment_date_str = data['payment_date']
                    payment.payment_date = parser.parse(payment_date_str)
                except (ValueError, TypeError, OverflowError) as e:
                    return jsonify({
                        'success': False,
                        'error': f'Invalid payment date format: {str(e)}'
                    }), 400
            
            if 'notes' in data:
                payment.notes = data['notes']
            
            payment.updated_at = datetime.utcnow()
            db.session.commit()
            
            current_app.logger.info(f"Payment updated: {payment.transaction_id}")
            
            return jsonify({
                'success': True,
                'message': 'Payment updated successfully',
                'payment': payment.to_dict()
            }), 200
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error updating payment {payment_id}: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to update payment'}), 500
    
    @app.route('/api/payments/<int:payment_id>', methods=['DELETE'])
    @login_required
    def delete_payment(payment_id):
        """Delete a payment"""
        try:
            payment = Payment.query.get(payment_id)
            if not payment:
                return jsonify({'success': False, 'error': 'Payment not found'}), 404
            
            # Only super admin can delete payments
            if not hasattr(current_user, 'is_super_admin') or not current_user.is_super_admin:
                return jsonify({'success': False, 'error': 'Access denied'}), 403
            
            db.session.delete(payment)
            db.session.commit()
            
            current_app.logger.info(f"Payment deleted: {payment.transaction_id}")
            
            return jsonify({
                'success': True,
                'message': 'Payment deleted successfully'
            }), 200
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error deleting payment {payment_id}: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to delete payment'}), 500
    
    @app.route('/api/payments/stats', methods=['GET'])
    @login_required
    def get_payment_stats():
        """Get payment statistics"""
        try:
            shop_id = request.args.get('shop_id')
            
            query = Payment.query
            
            if shop_id:
                query = query.filter(Payment.shop_id == shop_id)
            
            # If user is shop, only show their stats
            if hasattr(current_user, 'shop_id') and current_user.shop_id:
                query = query.filter(Payment.shop_id == current_user.shop_id)
            
            total_revenue = db.session.query(db.func.sum(Payment.amount)).filter(
                Payment.status == 'completed'
            ).scalar() or 0
            
            pending = query.filter(Payment.status == 'pending').count()
            completed = query.filter(Payment.status == 'completed').count()
            failed = query.filter(Payment.status == 'failed').count()
            refunded = query.filter(Payment.status == 'refunded').count()
            
            # Get revenue by plan
            revenue_by_plan = db.session.query(
                Payment.plan,
                db.func.sum(Payment.amount)
            ).filter(Payment.status == 'completed').group_by(Payment.plan).all()
            
            # Get recent payments (last 30 days)
            thirty_days_ago = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            recent_revenue = db.session.query(db.func.sum(Payment.amount)).filter(
                Payment.status == 'completed',
                Payment.payment_date >= thirty_days_ago
            ).scalar() or 0
            
            return jsonify({
                'success': True,
                'stats': {
                    'totalRevenue': float(total_revenue),
                    'pendingPayments': pending,
                    'completedPayments': completed,
                    'failedPayments': failed,
                    'refundedPayments': refunded,
                    'totalPayments': pending + completed + failed + refunded,
                    'revenueByPlan': [{'plan': p[0], 'revenue': float(p[1])} for p in revenue_by_plan],
                    'recentRevenue': float(recent_revenue)
                }
            }), 200
            
        except Exception as e:
            current_app.logger.error(f"Error fetching payment stats: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to fetch stats'}), 500
    
    @app.route('/api/payments/<int:payment_id>/status', methods=['PATCH'])
    @login_required
    def update_payment_status(payment_id):
        """Update payment status (approve/reject)"""
        try:
            data = request.get_json()
            status = data.get('status')
            
            if not status:
                return jsonify({'success': False, 'error': 'Status is required'}), 400
            
            payment = Payment.query.get(payment_id)
            if not payment:
                return jsonify({'success': False, 'error': 'Payment not found'}), 404
            
            valid_statuses = Payment.get_status_options()
            if status not in valid_statuses:
                return jsonify({
                    'success': False,
                    'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
                }), 400
            
            payment.status = status
            payment.updated_at = datetime.utcnow()
            db.session.commit()
            
            current_app.logger.info(f"Payment {payment.transaction_id} status updated to {status}")
            
            return jsonify({
                'success': True,
                'message': f'Payment status updated to {status}',
                'payment': payment.to_dict()
            }), 200
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error updating payment status {payment_id}: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to update payment status'}), 500