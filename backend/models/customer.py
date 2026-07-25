# models/customer.py
from extensions import db
from datetime import datetime

class Customer(db.Model):
    __tablename__ = 'customers'
    
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id'), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False)  # Remove unique=True
    phone = db.Column(db.String(20), nullable=False)
    address = db.Column(db.Text, nullable=True)
    city = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(100), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    postal_code = db.Column(db.String(20), nullable=True)
    
    # Customer metadata
    total_spent = db.Column(db.Float, default=0.0)
    total_orders = db.Column(db.Integer, default=0)
    tier = db.Column(db.String(20), default='Bronze')
    status = db.Column(db.String(20), default='Active')
    notes = db.Column(db.Text, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    shop = db.relationship('Shop', backref='customers', lazy=True)
    
    # Composite unique constraint for (shop_id, email)
    __table_args__ = (
        db.UniqueConstraint('shop_id', 'email', name='idx_shop_email'),
    )
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def get_tier_color(self):
        colors = {
            'Platinum': 'bg-gray-700',
            'Gold': 'bg-yellow-500',
            'Silver': 'bg-gray-400',
            'Bronze': 'bg-amber-600'
        }
        return colors.get(self.tier, 'bg-gray-400')
    
    def update_tier(self):
        """Update customer tier based on total spending"""
        if self.total_spent >= 5000:
            self.tier = 'Platinum'
        elif self.total_spent >= 2000:
            self.tier = 'Gold'
        elif self.total_spent >= 500:
            self.tier = 'Silver'
        else:
            self.tier = 'Bronze'
    
    def to_dict(self):
        return {
            'id': self.id,
            'shop_id': self.shop_id,
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
            'total_spent': float(self.total_spent),
            'total_orders': self.total_orders,
            'tier': self.tier,
            'tier_color': self.get_tier_color(),
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_activity': self.last_activity.isoformat() if self.last_activity else None
        }