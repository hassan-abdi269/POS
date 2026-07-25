from app import app
from extensions import db
from models.customer import Customer
from models.sales import Sale

def update_all_customer_stats():
    with app.app_context():
        try:
            print("🔄 Updating customer statistics from existing sales...")
            customers = Customer.query.all()
            updated_count = 0
            
            for customer in customers:
                # Get all completed sales for this customer
                sales = Sale.query.filter_by(customer_id=customer.id, status='Completed').all()
                
                if sales:
                    total_spent = sum(s.total for s in sales)
                    total_orders = len(sales)
                    
                    customer.total_spent = total_spent
                    customer.total_orders = total_orders
                    customer.update_tier()
                    customer.last_activity = max(s.created_at for s in sales) if sales else customer.created_at
                    
                    updated_count += 1
                    print(f"✅ Updated {customer.get_full_name()}: Spent: KES {total_spent:,.2f}, Orders: {total_orders}, Tier: {customer.tier}")
                else:
                    print(f"⏭️ No sales for {customer.get_full_name()}")
            
            db.session.commit()
            print(f"\n✅ Successfully updated {updated_count} customers")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    update_all_customer_stats()