# models/payment.py
from extensions import db
from datetime import datetime
import re

class Payment(db.Model):
    """Payment model for tracking shop subscription payments"""
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id', ondelete='CASCADE'), nullable=False)
    transaction_id = db.Column(db.String(50), unique=True, nullable=False)
    receipt_number = db.Column(db.String(50), unique=True, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    plan = db.Column(db.String(20), nullable=False, default='Basic')
    payment_method = db.Column(db.String(50), nullable=False, default='credit_card')
    status = db.Column(db.String(20), nullable=False, default='pending')
    customer_name = db.Column(db.String(100), nullable=False)
    customer_email = db.Column(db.String(100))
    customer_phone = db.Column(db.String(20))
    payment_date = db.Column(db.DateTime, nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    shop = db.relationship('Shop', backref=db.backref('payments', lazy=True, cascade='all, delete-orphan'))
    
    def __init__(self, **kwargs):
        super(Payment, self).__init__(**kwargs)
        if not self.transaction_id:
            self.generate_transaction_id()
        if not self.receipt_number:
            self.generate_receipt_number()
    
    def generate_transaction_id(self):
        """Generate unique transaction ID"""
        timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        random_suffix = str(abs(hash(str(datetime.utcnow().timestamp()))))[:4]
        self.transaction_id = f'TXN-{timestamp}-{random_suffix}'
    
    def generate_receipt_number(self):
        """Generate unique receipt number"""
        timestamp = datetime.utcnow().strftime('%Y%m%d')
        count = Payment.query.filter(
            Payment.created_at >= datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        ).count() + 1
        self.receipt_number = f'REC-{timestamp}-{str(count).zfill(4)}'
    
    def to_dict(self):
        """Convert payment to dictionary"""
        return {
            'id': self.id,
            'shop_id': self.shop_id,
            'shop_name': self.shop.name if self.shop else None,
            'transaction_id': self.transaction_id,
            'receipt_number': self.receipt_number,
            'amount': self.amount,
            'plan': self.plan,
            'payment_method': self.payment_method,
            'status': self.status,
            'customer_name': self.customer_name,
            'customer_email': self.customer_email,
            'customer_phone': self.customer_phone,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'formatted_amount': f'KES {self.amount:,.0f}'
        }
    
    def __repr__(self):
        return f'<Payment {self.transaction_id} - {self.amount}>'
    
    @staticmethod
    def get_status_options():
        """Get valid status options"""
        return ['pending', 'completed', 'failed', 'refunded']
    
    @staticmethod
    def get_plan_options():
        """Get valid plan options"""
        return ['Basic', 'Standard', 'Premium']
    
    @staticmethod
    def get_payment_method_options():
        """Get valid payment method options"""
        return ['credit_card', 'bank_transfer', 'mobile_money', 'cash']