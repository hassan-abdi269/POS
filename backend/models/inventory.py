# models/inventory.py

from extensions import db
from datetime import datetime
import json

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    sku = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)  # Selling price
    cost = db.Column(db.Float, default=0.0)      # Buying cost
    stock = db.Column(db.Integer, default=0)
    stock_limit = db.Column(db.Integer, default=50)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=True)
    image_emoji = db.Column(db.String(10), default='📦')
    image_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # New fields for profit tracking
    expected_profit_per_unit = db.Column(db.Float, default=0.0)  # price - cost
    expected_profit_total = db.Column(db.Float, default=0.0)     # profit_per_unit * stock
    profit_margin_percentage = db.Column(db.Float, default=0.0)  # (profit/price) * 100
    
    # Store price history as JSON
    price_history = db.Column(db.Text, default='[]')  # JSON array of price changes
    
    # Relationships
    supplier = db.relationship('Supplier', backref='products', lazy=True)
    shop = db.relationship('Shop', backref='products', lazy=True)
    
    def calculate_profit(self):
        """Calculate expected profit based on price and cost"""
        if self.price > 0:
            self.expected_profit_per_unit = round(self.price - self.cost, 2)
            self.expected_profit_total = round(self.expected_profit_per_unit * self.stock, 2)
            self.profit_margin_percentage = round((self.expected_profit_per_unit / self.price) * 100, 2)
        else:
            self.expected_profit_per_unit = 0
            self.expected_profit_total = 0
            self.profit_margin_percentage = 0
        return self.expected_profit_per_unit
    
    def add_price_history(self, old_price, old_cost):
        """Add price change to history"""
        import json
        history = json.loads(self.price_history) if self.price_history else []
        
        # Only record if price or cost changed
        if old_price != self.price or old_cost != self.cost:
            history.append({
                'date': datetime.utcnow().isoformat(),
                'old_price': round(old_price, 2) if old_price else 0,
                'new_price': round(self.price, 2) if self.price else 0,
                'old_cost': round(old_cost, 2) if old_cost else 0,
                'new_cost': round(self.cost, 2) if self.cost else 0,
                'old_profit': round(old_price - old_cost, 2) if (old_price and old_cost) else 0,
                'new_profit': round(self.price - self.cost, 2) if (self.price and self.cost) else 0,
            })
            
            # Keep last 50 changes
            if len(history) > 50:
                history = history[-50:]
            
            self.price_history = json.dumps(history)
    
    def get_price_history(self):
        """Get price history as list"""
        import json
        if self.price_history:
            try:
                return json.loads(self.price_history)
            except:
                return []
        return []
    
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
    
    def to_dict(self, include_history=False):
        """Convert product to dictionary with profit data"""
        data = {
            'id': self.id,
            'shop_id': self.shop_id,
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
            'is_active': self.is_active,
            # Profit data
            'expected_profit_per_unit': float(self.expected_profit_per_unit) if self.expected_profit_per_unit else 0,
            'expected_profit_total': float(self.expected_profit_total) if self.expected_profit_total else 0,
            'profit_margin_percentage': float(self.profit_margin_percentage) if self.profit_margin_percentage else 0,
        }
        
        if include_history:
            data['price_history'] = self.get_price_history()
        
        return data