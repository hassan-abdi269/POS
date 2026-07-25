# models/purchase_order.py
from extensions import db
from datetime import datetime

class PurchaseOrder(db.Model):
    __tablename__ = 'purchase_orders'
    
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id'), nullable=False)
    order_number = db.Column(db.String(50), unique=True, nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=False)
    order_date = db.Column(db.Date, nullable=False)
    subtotal = db.Column(db.Float, default=0.0)
    tax = db.Column(db.Float, default=0.0)
    discount = db.Column(db.Float, default=0.0)
    total = db.Column(db.Float, nullable=False)
    notes = db.Column(db.Text)
    status = db.Column(db.String(20), default='Pending')
    created_by = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    supplier = db.relationship('Supplier', backref='purchase_orders')
    items = db.relationship('PurchaseOrderItem', backref='purchase_order', lazy=True, cascade='all, delete-orphan')
    shop = db.relationship('Shop', backref='purchase_orders', lazy=True)
    status_history = db.relationship('OrderStatusHistory', backref='order', lazy=True, cascade='all, delete-orphan')
    
    def generate_order_number(self):
        """Generate a unique order number with shop prefix"""
        now = datetime.utcnow()
        date_str = now.strftime('%Y%m%d')
        shop_prefix = f"PO-{self.shop_id:02d}"
        count = PurchaseOrder.query.filter(
            PurchaseOrder.shop_id == self.shop_id,
            PurchaseOrder.created_at >= now.replace(hour=0, minute=0, second=0, microsecond=0),
            PurchaseOrder.created_at <= now.replace(hour=23, minute=59, second=59, microsecond=999999)
        ).count()
        sequence = str(count + 1).zfill(4)
        return f"{shop_prefix}-{date_str}-{sequence}"
    
    def to_dict(self):
        return {
            'id': self.id,
            'shop_id': self.shop_id,
            'order_number': self.order_number,
            'supplier_id': self.supplier_id,
            'supplier_name': self.supplier.name if self.supplier else None,
            'order_date': self.order_date.isoformat() if self.order_date else None,
            'subtotal': float(self.subtotal),
            'tax': float(self.tax),
            'discount': float(self.discount),
            'total': float(self.total),
            'notes': self.notes,
            'status': self.status,
            'items': [item.to_dict() for item in self.items],
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'status_history': [h.to_dict() for h in self.status_history]
        }


class PurchaseOrderItem(db.Model):
    __tablename__ = 'purchase_order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id'), nullable=False)
    order_id = db.Column(db.Integer, db.ForeignKey('purchase_orders.id', ondelete='CASCADE'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    product_name = db.Column(db.String(200), nullable=False)
    product_sku = db.Column(db.String(50), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    total = db.Column(db.Float, nullable=False)
    received_quantity = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    product = db.relationship('Product')
    shop = db.relationship('Shop', backref='purchase_order_items', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'shop_id': self.shop_id,
            'order_id': self.order_id,
            'product_id': self.product_id,
            'product_name': self.product_name,
            'product_sku': self.product_sku,
            'quantity': self.quantity,
            'price': float(self.price),
            'total': float(self.total),
            'received_quantity': self.received_quantity,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class OrderStatusHistory(db.Model):
    """Track order status changes"""
    __tablename__ = 'order_status_history'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('purchase_orders.id', ondelete='CASCADE'), nullable=False)
    old_status = db.Column(db.String(20), nullable=False)
    new_status = db.Column(db.String(20), nullable=False)
    changed_by = db.Column(db.Integer, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'old_status': self.old_status,
            'new_status': self.new_status,
            'changed_by': self.changed_by,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }