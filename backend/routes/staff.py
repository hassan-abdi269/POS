# routes/staff.py
from flask import request, jsonify
from flask_login import login_required, current_user
from extensions import db
from models.staff import Staff
from datetime import datetime

def get_current_shop_id():
    """Get the current shop ID from the logged-in user"""
    if hasattr(current_user, 'id'):
        return current_user.id
    return None

def init_staff_routes(app):
    
    # ============ STAFF ROUTES ============
    
    @app.route('/api/staff', methods=['GET'])
    @login_required
    def get_staff():
        """Get all staff members for the current shop only"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            status = request.args.get('status')
            role = request.args.get('role')
            department = request.args.get('department')
            search = request.args.get('search')
            
            # Start with shop filter
            query = Staff.query.filter_by(shop_id=shop_id)
            
            if status:
                query = query.filter_by(status=status)
            
            if role:
                query = query.filter_by(role=role)
            
            if department:
                query = query.filter_by(department=department)
            
            if search:
                query = query.filter(
                    db.or_(
                        Staff.first_name.contains(search),
                        Staff.last_name.contains(search),
                        Staff.email.contains(search),
                        Staff.employee_id.contains(search)
                    )
                )
            
            staff = query.order_by(Staff.created_at.desc()).all()
            return jsonify([s.to_dict() for s in staff])
            
        except Exception as e:
            print(f"Error fetching staff: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/staff/<int:staff_id>', methods=['GET'])
    @login_required
    def get_staff_member(staff_id):
        """Get a specific staff member for the current shop"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            staff = Staff.query.filter_by(id=staff_id, shop_id=shop_id).first()
            if not staff:
                return jsonify({'error': 'Staff member not found'}), 404
            
            return jsonify(staff.to_dict())
            
        except Exception as e:
            print(f"Error fetching staff: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/staff', methods=['POST'])
    @login_required
    def create_staff():
        """Create a new staff member for the current shop"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            data = request.get_json()
            
            required = ['first_name', 'last_name', 'email', 'phone', 'role', 'department', 'join_date', 'salary']
            missing = [f for f in required if f not in data]
            if missing:
                return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400
            
            # Check if email already exists in this shop
            if Staff.query.filter_by(email=data['email'], shop_id=shop_id).first():
                return jsonify({'error': 'Staff member with this email already exists in your shop'}), 400
            
            # Create staff member with shop_id
            staff = Staff(
                shop_id=shop_id,  # ADD THIS
                first_name=data['first_name'],
                last_name=data['last_name'],
                email=data['email'],
                phone=data['phone'],
                address=data.get('address', ''),
                city=data.get('city', ''),
                state=data.get('state', ''),
                country=data.get('country', ''),
                postal_code=data.get('postal_code', ''),
                role=data['role'],
                department=data['department'],
                join_date=datetime.strptime(data['join_date'], '%Y-%m-%d').date(),
                salary=float(data['salary']),
                status=data.get('status', 'Active'),
                performance=data.get('performance', 'Good'),
                tasks=data.get('tasks', 0),
                notes=data.get('notes', '')
            )
            
            # Generate employee ID (now includes shop_id)
            staff.employee_id = staff.generate_employee_id()
            
            db.session.add(staff)
            db.session.commit()
            
            return jsonify(staff.to_dict()), 201
            
        except Exception as e:
            db.session.rollback()
            print(f"Error creating staff: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/staff/<int:staff_id>', methods=['PUT'])
    @login_required
    def update_staff(staff_id):
        """Update a staff member for the current shop"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            staff = Staff.query.filter_by(id=staff_id, shop_id=shop_id).first()
            if not staff:
                return jsonify({'error': 'Staff member not found'}), 404
            
            data = request.get_json()
            
            if 'first_name' in data:
                staff.first_name = data['first_name']
            if 'last_name' in data:
                staff.last_name = data['last_name']
            if 'email' in data:
                existing = Staff.query.filter_by(email=data['email'], shop_id=shop_id).first()
                if existing and existing.id != staff_id:
                    return jsonify({'error': 'Email already in use'}), 400
                staff.email = data['email']
            if 'phone' in data:
                staff.phone = data['phone']
            if 'address' in data:
                staff.address = data['address']
            if 'city' in data:
                staff.city = data['city']
            if 'state' in data:
                staff.state = data['state']
            if 'country' in data:
                staff.country = data['country']
            if 'postal_code' in data:
                staff.postal_code = data['postal_code']
            if 'role' in data:
                staff.role = data['role']
            if 'department' in data:
                staff.department = data['department']
            if 'join_date' in data:
                staff.join_date = datetime.strptime(data['join_date'], '%Y-%m-%d').date()
            if 'salary' in data:
                staff.salary = float(data['salary'])
            if 'status' in data:
                staff.status = data['status']
            if 'performance' in data:
                staff.performance = data['performance']
            if 'tasks' in data:
                staff.tasks = int(data['tasks'])
            if 'notes' in data:
                staff.notes = data['notes']
            
            db.session.commit()
            return jsonify(staff.to_dict())
            
        except Exception as e:
            db.session.rollback()
            print(f"Error updating staff: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/staff/<int:staff_id>', methods=['DELETE'])
    @login_required
    def delete_staff(staff_id):
        """Delete a staff member for the current shop (soft delete - mark as inactive)"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            staff = Staff.query.filter_by(id=staff_id, shop_id=shop_id).first()
            if not staff:
                return jsonify({'error': 'Staff member not found'}), 404
            
            staff.status = 'Inactive'
            db.session.commit()
            
            return jsonify({'message': 'Staff member deactivated successfully'})
            
        except Exception as e:
            db.session.rollback()
            print(f"Error deleting staff: {e}")
            return jsonify({'error': str(e)}), 500
    
    # ============ STAFF STATS ============
    
    @app.route('/api/staff/stats', methods=['GET'])
    @login_required
    def get_staff_stats():
        """Get staff statistics for the current shop only"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            all_staff = Staff.query.filter_by(shop_id=shop_id).all()
            active = Staff.query.filter_by(shop_id=shop_id, status='Active').count()
            on_leave = Staff.query.filter_by(shop_id=shop_id, status='On Leave').count()
            inactive = Staff.query.filter_by(shop_id=shop_id, status='Inactive').count()
            
            total_tasks = sum(s.tasks for s in all_staff)
            total_salary = sum(s.salary for s in all_staff)
            
            # Role breakdown for this shop
            role_breakdown = {}
            for staff in all_staff:
                if staff.role not in role_breakdown:
                    role_breakdown[staff.role] = 0
                role_breakdown[staff.role] += 1
            
            # Department breakdown for this shop
            dept_breakdown = {}
            for staff in all_staff:
                if staff.department not in dept_breakdown:
                    dept_breakdown[staff.department] = 0
                dept_breakdown[staff.department] += 1
            
            return jsonify({
                'total': len(all_staff),
                'active': active,
                'on_leave': on_leave,
                'inactive': inactive,
                'total_tasks': total_tasks,
                'total_salary': float(total_salary),
                'average_salary': float(total_salary / len(all_staff)) if all_staff else 0,
                'role_breakdown': role_breakdown,
                'department_breakdown': dept_breakdown
            })
            
        except Exception as e:
            print(f"Error fetching staff stats: {e}")
            return jsonify({'error': str(e)}), 500