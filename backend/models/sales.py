# models/sales.py - Add shop_id to all models, removed tax field
from extensions import db
from datetime import datetime

class Sale(db.Model):
    __tablename__ = 'sales'
    
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id'), nullable=False)
    sale_number = db.Column(db.String(50), unique=True, nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=True)
    customer_name = db.Column(db.String(100), nullable=False, default='Walk-in Customer')
    customer_email = db.Column(db.String(100), default='')
    customer_phone = db.Column(db.String(20), default='')
    payment_method = db.Column(db.String(50), nullable=False)
    subtotal = db.Column(db.Float, default=0.0)
    # tax = db.Column(db.Float, default=0.0)  # REMOVED
    discount = db.Column(db.Float, default=0.0)
    total = db.Column(db.Float, nullable=False)
    notes = db.Column(db.Text)
    status = db.Column(db.String(20), default='Completed')
    created_by = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    items = db.relationship('SaleItem', backref='sale', lazy=True, cascade='all, delete-orphan')
    payments = db.relationship('SalePayment', backref='sale', lazy=True, cascade='all, delete-orphan')
    returns = db.relationship('Return', backref='sale', lazy=True, cascade='all, delete-orphan')
    
    customer = db.relationship('Customer', backref='customer_ref', lazy=True)
    shop = db.relationship('Shop', backref='sales', lazy=True)
    
    def generate_sale_number(self):
        """Generate a unique sale number with shop prefix"""
        now = datetime.utcnow()
        date_str = now.strftime('%Y%m%d')
        shop_prefix = f"S{self.shop_id:02d}" if self.shop_id else "S"
        today_sales = Sale.query.filter(
            Sale.shop_id == self.shop_id,
            Sale.created_at >= now.replace(hour=0, minute=0, second=0, microsecond=0),
            Sale.created_at <= now.replace(hour=23, minute=59, second=59, microsecond=999999)
        ).count()
        
        sequence = str(today_sales + 1).zfill(4)
        return f"{shop_prefix}-{date_str}-{sequence}"
    
    def to_dict(self):
        return {
            'id': self.id,
            'shop_id': self.shop_id,
            'sale_number': self.sale_number,
            'customer_id': self.customer_id,
            'customer_name': self.customer_name,
            'customer_email': self.customer_email,
            'customer_phone': self.customer_phone,
            'payment_method': self.payment_method,
            'subtotal': float(self.subtotal),
            'discount': float(self.discount),
            'total': float(self.total),
            'notes': self.notes,
            'status': self.status,
            'items': [item.to_dict() for item in self.items],
            'payments': [payment.to_dict() for payment in self.payments],
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Sale {self.sale_number}>'

class SaleItem(db.Model):
    __tablename__ = 'sale_items'
    
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id'), nullable=False)
    sale_id = db.Column(db.Integer, db.ForeignKey('sales.id', ondelete='CASCADE'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    product_name = db.Column(db.String(200), nullable=False)
    product_sku = db.Column(db.String(50), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    cost = db.Column(db.Float, default=0.0)
    discount = db.Column(db.Float, default=0.0)
    total = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    product = db.relationship('Product')
    shop = db.relationship('Shop', backref='sale_items', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'shop_id': self.shop_id,
            'sale_id': self.sale_id,
            'product_id': self.product_id,
            'product_name': self.product_name,
            'product_sku': self.product_sku,
            'quantity': self.quantity,
            'price': float(self.price),
            'cost': float(self.cost) if self.cost else 0,
            'discount': float(self.discount) if self.discount else 0,
            'total': float(self.total),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<SaleItem {self.product_name} x{self.quantity}>'

class SalePayment(db.Model):
    __tablename__ = 'sale_payments'
    
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id'), nullable=False)
    sale_id = db.Column(db.Integer, db.ForeignKey('sales.id', ondelete='CASCADE'), nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    reference = db.Column(db.String(100), nullable=True)
    status = db.Column(db.String(20), default='Completed')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    shop = db.relationship('Shop', backref='sale_payments', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'shop_id': self.shop_id,
            'sale_id': self.sale_id,
            'payment_method': self.payment_method,
            'amount': float(self.amount),
            'reference': self.reference,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Return(db.Model):
    __tablename__ = 'returns'
    
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id'), nullable=False)
    return_number = db.Column(db.String(50), unique=True, nullable=False)
    sale_id = db.Column(db.Integer, db.ForeignKey('sales.id', ondelete='CASCADE'), nullable=False)
    customer_name = db.Column(db.String(100), nullable=False)
    customer_email = db.Column(db.String(100), default='')
    customer_phone = db.Column(db.String(20), default='')
    reason = db.Column(db.Text, nullable=False)
    total = db.Column(db.Float, nullable=False)
    notes = db.Column(db.Text)
    status = db.Column(db.String(20), default='Pending')
    created_by = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    items = db.relationship('ReturnItem', backref='return_record', lazy=True, cascade='all, delete-orphan')
    shop = db.relationship('Shop', backref='returns', lazy=True)
    
    def generate_return_number(self):
        """Generate a unique return number with shop prefix"""
        now = datetime.utcnow()
        date_str = now.strftime('%Y%m%d')
        shop_prefix = f"R{self.shop_id:02d}" if self.shop_id else "R"
        return_count = Return.query.filter(
            Return.shop_id == self.shop_id,
            Return.created_at >= now.replace(hour=0, minute=0, second=0, microsecond=0),
            Return.created_at <= now.replace(hour=23, minute=59, second=59, microsecond=999999)
        ).count()
        
        sequence = str(return_count + 1).zfill(4)
        return f"{shop_prefix}-{date_str}-{sequence}"
    
    def to_dict(self):
        return {
            'id': self.id,
            'shop_id': self.shop_id,
            'return_number': self.return_number,
            'sale_id': self.sale_id,
            'sale_number': self.sale.sale_number if self.sale else None,
            'customer_name': self.customer_name,
            'customer_email': self.customer_email,
            'customer_phone': self.customer_phone,
            'reason': self.reason,
            'total': float(self.total),
            'notes': self.notes,
            'status': self.status,
            'items': [item.to_dict() for item in self.items],
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class ReturnItem(db.Model):
    __tablename__ = 'return_items'
    
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id'), nullable=False)
    return_id = db.Column(db.Integer, db.ForeignKey('returns.id', ondelete='CASCADE'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    product_name = db.Column(db.String(200), nullable=False)
    product_sku = db.Column(db.String(50), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    refund_amount = db.Column(db.Float, nullable=False)
    reason = db.Column(db.Text, nullable=True)
    condition = db.Column(db.String(50), default='Good')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    product = db.relationship('Product')
    shop = db.relationship('Shop', backref='return_items', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'shop_id': self.shop_id,
            'return_id': self.return_id,
            'product_id': self.product_id,
            'product_name': self.product_name,
            'product_sku': self.product_sku,
            'quantity': self.quantity,
            'price': float(self.price),
            'refund_amount': float(self.refund_amount),
            'reason': self.reason,
            'condition': self.condition,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }