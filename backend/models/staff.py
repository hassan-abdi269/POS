# models/staff.py
from extensions import db
from datetime import datetime

class Staff(db.Model):
    __tablename__ = 'staff'
    
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id'), nullable=False)  # ADD THIS
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    address = db.Column(db.Text, nullable=True)
    city = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(100), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    postal_code = db.Column(db.String(20), nullable=True)
    
    # Staff details
    role = db.Column(db.String(50), nullable=False)
    department = db.Column(db.String(50), nullable=False)
    join_date = db.Column(db.Date, nullable=False)
    salary = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(20), default='Active')  # Active, On Leave, Inactive
    performance = db.Column(db.String(20), default='Good')  # Excellent, Good, Average, Poor
    tasks = db.Column(db.Integer, default=0)
    notes = db.Column(db.Text, nullable=True)
    
    # Employee ID
    employee_id = db.Column(db.String(50), unique=True, nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    shop = db.relationship('Shop', backref='staff', lazy=True)  # ADD THIS
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def generate_employee_id(self):
        """Generate a unique employee ID for this shop"""
        year = datetime.utcnow().year
        # Count staff in this shop for the year
        count = Staff.query.filter(
            Staff.shop_id == self.shop_id,
            Staff.created_at >= datetime(year, 1, 1),
            Staff.created_at <= datetime(year, 12, 31)
        ).count()
        sequence = str(count + 1).zfill(4)
        return f"EMP-{self.shop_id}-{year}-{sequence}"
    
    def to_dict(self):
        return {
            'id': self.id,
            'shop_id': self.shop_id,  # ADD THIS
            'employee_id': self.employee_id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.get_full_name(),
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'country': self.country,
            'postal_code': self.postal_code,
            'role': self.role,
            'department': self.department,
            'join_date': self.join_date.isoformat() if self.join_date else None,
            'salary': float(self.salary) if self.salary else 0,
            'status': self.status,
            'performance': self.performance,
            'tasks': self.tasks,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }