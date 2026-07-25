# models/supplier.py
from extensions import db
from datetime import datetime

class Supplier(db.Model):
    __tablename__ = 'suppliers'
    
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    contact_person = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False)  # Remove unique=True
    phone = db.Column(db.String(20), nullable=False)
    address = db.Column(db.Text, nullable=True)
    city = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(100), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    postal_code = db.Column(db.String(20), nullable=True)
    item_name = db.Column(db.String(100), nullable=True)
    
    # Supplier metadata
    total_products = db.Column(db.Integer, default=0)
    total_orders = db.Column(db.Integer, default=0)
    total_spent = db.Column(db.Float, default=0.0)
    rating = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(20), default='Active')
    notes = db.Column(db.Text, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_order_date = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    shop = db.relationship('Shop', backref='suppliers', lazy=True)
    
    # Add composite unique constraint
    __table_args__ = (
        db.UniqueConstraint('shop_id', 'email', name='idx_shop_email'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'shop_id': self.shop_id,
            'name': self.name,
            'contact_person': self.contact_person,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'country': self.country,
            'postal_code': self.postal_code,
            'item_name': self.item_name,
            'total_products': self.total_products,
            'total_orders': self.total_orders,
            'total_spent': float(self.total_spent) if self.total_spent else 0,
            'rating': float(self.rating) if self.rating else 0,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_order_date': self.last_order_date.isoformat() if self.last_order_date else None
        }