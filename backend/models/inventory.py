# models/inventory.py (or wherever your Product model is)
from extensions import db
from datetime import datetime

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    sku = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    cost = db.Column(db.Float, default=0.0)
    stock = db.Column(db.Integer, default=0)
    stock_limit = db.Column(db.Integer, default=50)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=True)
    image_emoji = db.Column(db.String(10), default='📦')
    image_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    supplier = db.relationship('Supplier', backref='products', lazy=True)
    shop = db.relationship('Shop', backref='products', lazy=True)  # ADD THIS
    
    def get_status(self):
        """Determine stock status based on quantity and limit"""
        if self.stock >= self.stock_limit:
            return 'In Stock'
        elif 0 < self.stock < self.stock_limit:
            return 'Low Stock'
        elif self.stock <= 0:
            return 'Out of Stock'
        else:
            return 'Unknown'
    
    def to_dict(self):
        return {
            'id': self.id,
            'shop_id': self.shop_id,  # ADD THIS
            'name': self.name,
            'sku': self.sku,
            'description': self.description,
            'price': float(self.price),
            'cost': float(self.cost) if self.cost else 0,
            'stock': self.stock,
            'stock_limit': self.stock_limit,
            'supplier_id': self.supplier_id,
            'supplier_name': self.supplier.name if self.supplier else None,
            'status': self.get_status(),
            'image_emoji': self.image_emoji,
            'image_url': self.image_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_active': self.is_active
        }