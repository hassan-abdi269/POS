# models/shop.py
from extensions import db, bcrypt
from flask_login import UserMixin
from datetime import datetime
import re

class Shop(db.Model, UserMixin):
    """Shop model for super admin to manage shops"""
    __tablename__ = 'shops'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False, unique=True)
    phone = db.Column(db.String(20), nullable=False)
    address = db.Column(db.String(255))
    owner = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), default='active')
    subscription = db.Column(db.String(20), default='basic')
    revenue = db.Column(db.Float, default=0.00)
    users_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_active = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __init__(self, **kwargs):
        password = kwargs.pop('password', None)
        super(Shop, self).__init__(**kwargs)
        if password:
            self.set_password(password)
    
    def set_password(self, password):
        if not password or len(password) < 6:
            raise ValueError('Password must be at least 6 characters long')
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        if not self.password_hash:
            return False
        return bcrypt.check_password_hash(self.password_hash, password)
    
    # Flask-Login required methods
    def get_id(self):
        return str(self.id)
    
    @property
    def is_authenticated(self):
        return True
    
    @property
    def is_active(self):
        return self.status == 'active'
    
    @property
    def is_anonymous(self):
        return False
    
    @staticmethod
    def validate_email(email):
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def validate_phone(phone):
        clean = re.sub(r'[\s\-\(\)]', '', phone)
        return len(clean) >= 7 and len(clean) <= 15
    
    def to_dict(self, include_password=False):
        data = {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'owner': self.owner,
            'status': self.status,
            'subscription': self.subscription,
            'revenue': self.revenue,
            'users': self.users_count,
            'createdAt': self.created_at.strftime('%Y-%m-%d') if self.created_at else None,
            'lastActive': self.last_active.strftime('%Y-%m-%d %H:%M') if self.last_active else None,
            'updatedAt': self.updated_at.strftime('%Y-%m-%d %H:%M') if self.updated_at else None
        }
        if include_password:
            data['password_hash'] = self.password_hash
        return data
    
    def __repr__(self):
        return f'<Shop {self.name}>'