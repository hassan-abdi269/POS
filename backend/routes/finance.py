# routes/finance.py
from flask import request, jsonify
from flask_login import login_required, current_user
from extensions import db
from models.sales import Sale
from models.expense import Expense
from models.inventory import Product
from models.customer import Customer
from datetime import datetime, timedelta

def get_current_shop_id():
    """Get the current shop ID from the logged-in user"""
    if hasattr(current_user, 'id'):
        return current_user.id
    return None

def init_finance_routes(app):
    
    # ============ FINANCE OVERVIEW ============
    
    @app.route('/api/finance/overview', methods=['GET'])
    @login_required
    def get_finance_overview():
        """Get complete financial overview for the current shop only"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            # Get date range
            period = request.args.get('period', 'month')
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')
            
            # Calculate date range
            now = datetime.utcnow()
            if start_date and end_date:
                start = datetime.strptime(start_date, '%Y-%m-%d')
                end = datetime.strptime(end_date, '%Y-%m-%d')
                end = end.replace(hour=23, minute=59, second=59)
            else:
                if period == 'today':
                    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
                    end = now
                elif period == 'week':
                    start = now - timedelta(days=7)
                    end = now
                elif period == 'month':
                    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                    end = now
                elif period == 'quarter':
                    start = now - timedelta(days=90)
                    end = now
                elif period == 'year':
                    start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
                    end = now
                else:
                    start = now - timedelta(days=30)
                    end = now
            
            # Get sales data for this shop
            sales = Sale.query.filter(
                Sale.shop_id == shop_id,
                Sale.created_at >= start,
                Sale.created_at <= end,
                Sale.status != 'Cancelled'
            ).all()
            
            total_revenue = sum(s.total for s in sales) if sales else 0
            total_sales_count = len(sales)
            
            # Get expenses data for this shop
            expenses = Expense.query.filter(
                Expense.shop_id == shop_id,
                Expense.created_at >= start,
                Expense.created_at <= end
            ).all()
            
            total_expenses = sum(e.amount for e in expenses) if expenses else 0
            total_expenses_count = len(expenses)
            
            # Get paid vs pending expenses
            paid_expenses = sum(e.amount for e in expenses if e.status == 'Paid') if expenses else 0
            pending_expenses = sum(e.amount for e in expenses if e.status == 'Pending') if expenses else 0
            
            # Calculate net profit
            net_profit = total_revenue - total_expenses
            
            # Get product stats for this shop
            products = Product.query.filter_by(shop_id=shop_id).all()
            total_products = len(products)
            low_stock_products = len([p for p in products if p.get_status() == 'Low Stock'])
            out_of_stock_products = len([p for p in products if p.get_status() == 'Out of Stock'])
            
            # Get customer stats for this shop
            customers = Customer.query.filter_by(shop_id=shop_id).all()
            total_customers = len(customers)
            
            return jsonify({
                'revenue': {
                    'total': float(total_revenue),
                    'count': total_sales_count,
                    'average': float(total_revenue / total_sales_count) if total_sales_count > 0 else 0
                },
                'expenses': {
                    'total': float(total_expenses),
                    'count': total_expenses_count,
                    'paid': float(paid_expenses),
                    'pending': float(pending_expenses)
                },
                'profit': {
                    'net': float(net_profit),
                    'margin': float((net_profit / total_revenue) * 100) if total_revenue > 0 else 0
                },
                'products': {
                    'total': total_products,
                    'low_stock': low_stock_products,
                    'out_of_stock': out_of_stock_products
                },
                'customers': {
                    'total': total_customers
                },
                'period': {
                    'start': start.isoformat(),
                    'end': end.isoformat()
                }
            })
            
        except Exception as e:
            print(f"Error fetching finance overview: {e}")
            return jsonify({'error': str(e)}), 500
    
    # ============ REVENUE CHART DATA ============
    
    @app.route('/api/finance/revenue-chart', methods=['GET'])
    @login_required
    def get_revenue_chart_data():
        """Get revenue chart data for the current shop only"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            period = request.args.get('period', 'month')
            now = datetime.utcnow()
            
            if period == 'today':
                # Hourly breakdown for today
                labels = [f"{i:02d}:00" for i in range(24)]
                data = []
                for hour in range(24):
                    start = now.replace(hour=hour, minute=0, second=0, microsecond=0)
                    end = now.replace(hour=hour, minute=59, second=59, microsecond=999999)
                    sales = Sale.query.filter(
                        Sale.shop_id == shop_id,
                        Sale.created_at >= start,
                        Sale.created_at <= end,
                        Sale.status != 'Cancelled'
                    ).all()
                    data.append(sum(s.total for s in sales) if sales else 0)
                    
            elif period == 'week':
                # Daily breakdown for last 7 days
                labels = []
                data = []
                for i in range(6, -1, -1):
                    day = now - timedelta(days=i)
                    start = day.replace(hour=0, minute=0, second=0, microsecond=0)
                    end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
                    sales = Sale.query.filter(
                        Sale.shop_id == shop_id,
                        Sale.created_at >= start,
                        Sale.created_at <= end,
                        Sale.status != 'Cancelled'
                    ).all()
                    labels.append(day.strftime('%a'))
                    data.append(sum(s.total for s in sales) if sales else 0)
                    
            elif period == 'month':
                # Daily breakdown for current month
                labels = []
                data = []
                for day in range(1, now.day + 1):
                    start = now.replace(day=day, hour=0, minute=0, second=0, microsecond=0)
                    end = now.replace(day=day, hour=23, minute=59, second=59, microsecond=999999)
                    sales = Sale.query.filter(
                        Sale.shop_id == shop_id,
                        Sale.created_at >= start,
                        Sale.created_at <= end,
                        Sale.status != 'Cancelled'
                    ).all()
                    labels.append(str(day))
                    data.append(sum(s.total for s in sales) if sales else 0)
                    
            else:
                # Monthly breakdown for last 12 months
                labels = []
                data = []
                for i in range(11, -1, -1):
                    month = now - timedelta(days=30 * i)
                    start = month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                    next_month = month.replace(day=28) + timedelta(days=4)
                    end = next_month - timedelta(days=next_month.day)
                    end = end.replace(hour=23, minute=59, second=59, microsecond=999999)
                    sales = Sale.query.filter(
                        Sale.shop_id == shop_id,
                        Sale.created_at >= start,
                        Sale.created_at <= end,
                        Sale.status != 'Cancelled'
                    ).all()
                    labels.append(month.strftime('%b'))
                    data.append(sum(s.total for s in sales) if sales else 0)
            
            return jsonify({
                'labels': labels,
                'data': data
            })
            
        except Exception as e:
            print(f"Error fetching revenue chart: {e}")
            return jsonify({'error': str(e)}), 500
    
    # ============ EXPENSE CHART DATA ============
    
    @app.route('/api/finance/expense-chart', methods=['GET'])
    @login_required
    def get_expense_chart_data():
        """Get expense chart data for the current shop only"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            period = request.args.get('period', 'month')
            now = datetime.utcnow()
            
            if period == 'today':
                labels = [f"{i:02d}:00" for i in range(24)]
                data = []
                for hour in range(24):
                    start = now.replace(hour=hour, minute=0, second=0, microsecond=0)
                    end = now.replace(hour=hour, minute=59, second=59, microsecond=999999)
                    expenses = Expense.query.filter(
                        Expense.shop_id == shop_id,
                        Expense.created_at >= start,
                        Expense.created_at <= end
                    ).all()
                    data.append(sum(e.amount for e in expenses) if expenses else 0)
                    
            elif period == 'week':
                labels = []
                data = []
                for i in range(6, -1, -1):
                    day = now - timedelta(days=i)
                    start = day.replace(hour=0, minute=0, second=0, microsecond=0)
                    end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
                    expenses = Expense.query.filter(
                        Expense.shop_id == shop_id,
                        Expense.created_at >= start,
                        Expense.created_at <= end
                    ).all()
                    labels.append(day.strftime('%a'))
                    data.append(sum(e.amount for e in expenses) if expenses else 0)
                    
            else:
                labels = []
                data = []
                for i in range(11, -1, -1):
                    month = now - timedelta(days=30 * i)
                    start = month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                    next_month = month.replace(day=28) + timedelta(days=4)
                    end = next_month - timedelta(days=next_month.day)
                    end = end.replace(hour=23, minute=59, second=59, microsecond=999999)
                    expenses = Expense.query.filter(
                        Expense.shop_id == shop_id,
                        Expense.created_at >= start,
                        Expense.created_at <= end
                    ).all()
                    labels.append(month.strftime('%b'))
                    data.append(sum(e.amount for e in expenses) if expenses else 0)
            
            return jsonify({
                'labels': labels,
                'data': data
            })
            
        except Exception as e:
            print(f"Error fetching expense chart: {e}")
            return jsonify({'error': str(e)}), 500
    
    # ============ RECENT TRANSACTIONS ============
    
    @app.route('/api/finance/transactions', methods=['GET'])
    @login_required
    def get_transactions():
        """Get recent transactions (sales and expenses) for the current shop only"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            limit = request.args.get('limit', 20, type=int)
            
            # Get sales for this shop
            sales = Sale.query.filter(
                Sale.shop_id == shop_id,
                Sale.status != 'Cancelled'
            ).order_by(Sale.created_at.desc()).limit(limit).all()
            
            # Get expenses for this shop
            expenses = Expense.query.filter(
                Expense.shop_id == shop_id
            ).order_by(Expense.created_at.desc()).limit(limit).all()
            
            # Combine and sort
            transactions = []
            
            for sale in sales:
                transactions.append({
                    'id': sale.id,
                    'description': f"Sale #{sale.sale_number} - {sale.customer_name}",
                    'type': 'Revenue',
                    'amount': sale.total,
                    'date': sale.created_at.isoformat(),
                    'category': 'Sales',
                    'status': sale.status,
                    'source': 'sale'
                })
            
            for expense in expenses:
                transactions.append({
                    'id': expense.id,
                    'description': expense.item_name,
                    'type': 'Expense',
                    'amount': -expense.amount,
                    'date': expense.date.isoformat(),
                    'category': expense.payment_method,
                    'status': expense.status,
                    'source': 'expense'
                })
            
            # Sort by date descending
            transactions.sort(key=lambda x: x['date'], reverse=True)
            
            # Limit results
            transactions = transactions[:limit]
            
            return jsonify(transactions)
            
        except Exception as e:
            print(f"Error fetching transactions: {e}")
            return jsonify({'error': str(e)}), 500

    # ============ FINANCE SUMMARY ============
    
    @app.route('/api/finance/summary', methods=['GET'])
    @login_required
    def get_finance_summary():
        """Get quick finance summary for dashboard for the current shop only"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            # Today's sales
            today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            today_sales = Sale.query.filter(
                Sale.shop_id == shop_id,
                Sale.created_at >= today,
                Sale.status != 'Cancelled'
            ).all()
            today_revenue = sum(s.total for s in today_sales) if today_sales else 0
            
            # This month's sales
            month_start = today.replace(day=1)
            month_sales = Sale.query.filter(
                Sale.shop_id == shop_id,
                Sale.created_at >= month_start,
                Sale.status != 'Cancelled'
            ).all()
            month_revenue = sum(s.total for s in month_sales) if month_sales else 0
            
            # Today's expenses
            today_expenses = Expense.query.filter(
                Expense.shop_id == shop_id,
                Expense.created_at >= today
            ).all()
            today_expense_total = sum(e.amount for e in today_expenses) if today_expenses else 0
            
            # This month's expenses
            month_expenses = Expense.query.filter(
                Expense.shop_id == shop_id,
                Expense.created_at >= month_start
            ).all()
            month_expense_total = sum(e.amount for e in month_expenses) if month_expenses else 0
            
            return jsonify({
                'today': {
                    'revenue': float(today_revenue),
                    'expenses': float(today_expense_total),
                    'profit': float(today_revenue - today_expense_total)
                },
                'month': {
                    'revenue': float(month_revenue),
                    'expenses': float(month_expense_total),
                    'profit': float(month_revenue - month_expense_total)
                }
            })
            
        except Exception as e:
            print(f"Error fetching finance summary: {e}")
            return jsonify({'error': str(e)}), 500