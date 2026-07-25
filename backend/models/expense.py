# models/expense.py
from extensions import db
from datetime import datetime

class Expense(db.Model):
    __tablename__ = 'expenses'
    
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id'), nullable=False)  # ADD THIS
    item_name = db.Column(db.String(255), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)
    reference = db.Column(db.String(100), nullable=True)
    status = db.Column(db.String(20), default='Pending')
    notes = db.Column(db.Text, nullable=True)
    receipt_url = db.Column(db.String(500), nullable=True)
    created_by = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    shop = db.relationship('Shop', backref='expenses', lazy=True)  # ADD THIS
    
    def to_dict(self):
        return {
            'id': self.id,
            'shop_id': self.shop_id,  # ADD THIS
            'item_name': self.item_name,
            'amount': float(self.amount),
            'date': self.date.isoformat() if self.date else None,
            'payment_method': self.payment_method,
            'reference': self.reference,
            'status': self.status,
            'notes': self.notes,
            'receipt_url': self.receipt_url,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }