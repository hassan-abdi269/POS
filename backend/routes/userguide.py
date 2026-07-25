from flask import Blueprint, request, jsonify, current_app
from extensions import db
from datetime import datetime
import re
import json

# Create blueprint
userguide_bp = Blueprint('userguide', __name__, url_prefix='/api/userguide')

# In-memory Q&A storage (you can replace with database if needed)
qa_pairs = [
    {
        "id": 1,
        "question": "How to add a product?",
        "answer": "To add a product, navigate to Inventory Management > Add Product. Fill in the product details including name, SKU, price, stock quantity, and category. You can also add product images and set up variants for products with multiple options.",
        "category": "inventory",
        "keywords": "product add create new item",
        "times_asked": 0
    },
    {
        "id": 2,
        "question": "How to create a sale order?",
        "answer": "Navigate to Sales Management > New Sale. Select a customer, add products to the cart, and process the payment. You can also handle returns, refunds, and generate invoices for customers.",
        "category": "sales",
        "keywords": "order sale create new transaction",
        "times_asked": 0
    },
    {
        "id": 3,
        "question": "How to manage customers?",
        "answer": "Go to Customer Management where you can add new customers, manage profiles, and set up loyalty programs. You can track purchase history and contact information for better customer relationships.",
        "category": "customers",
        "keywords": "customer manage add profile loyalty",
        "times_asked": 0
    },
    {
        "id": 4,
        "question": "How to view reports?",
        "answer": "Navigate to Finance & Analytics section where you can view comprehensive reports including profit & loss statements, sales analytics, and expense reports. You can filter by date range and export data for further analysis.",
        "category": "finance",
        "keywords": "report analytics view financial",
        "times_asked": 0
    },
    {
        "id": 5,
        "question": "How to add staff?",
        "answer": "Go to Staff Management and click 'Add Staff Member'. Fill in the employee details, assign roles and permissions, and set up attendance tracking. You can also manage access levels for different roles.",
        "category": "staff",
        "keywords": "staff employee add role permission",
        "times_asked": 0
    },
    {
        "id": 6,
        "question": "How to configure settings?",
        "answer": "In Settings, you can configure your business information, set up security preferences, and manage notification settings. Customize the system to match your specific business needs.",
        "category": "settings",
        "keywords": "settings configure business",
        "times_asked": 0
    },
    {
        "id": 7,
        "question": "How to manage stock?",
        "answer": "The Inventory module tracks stock levels in real-time. You can perform stock counts, receive low stock alerts, and set reorder points based on historical sales data.",
        "category": "inventory",
        "keywords": "stock inventory manage count",
        "times_asked": 0
    },
    {
        "id": 8,
        "question": "How to process returns?",
        "answer": "In Sales Management, select the order and click 'Process Return'. You can issue refunds, exchange products, and track return history.",
        "category": "sales",
        "keywords": "return refund exchange",
        "times_asked": 0
    },
    {
        "id": 9,
        "question": "How to generate invoices?",
        "answer": "After creating an order, click 'Generate Invoice'. You can customize invoice templates, add tax details, and email or print invoices for customers.",
        "category": "sales",
        "keywords": "invoice generate print",
        "times_asked": 0
    },
    {
        "id": 10,
        "question": "How to set up loyalty programs?",
        "answer": "In Customer Management, navigate to Loyalty Programs. You can create reward tiers, set points per purchase, and track customer rewards.",
        "category": "customers",
        "keywords": "loyalty rewards program points",
        "times_asked": 0
    },
    {
        "id": 11,
        "question": "How to add expense?",
        "answer": "Navigate to Expense Tracking and click 'Add Expense'. Enter the amount, category, date, and description. You can also attach receipts for documentation.",
        "category": "expense",
        "keywords": "expense add track record",
        "times_asked": 0
    },
    {
        "id": 12,
        "question": "How to handle supplier orders?",
        "answer": "In Supplier Management, you can create purchase orders, track supplier performance, and manage supplier ratings. You can also set reorder points and automatically generate orders when stock is low.",
        "category": "suppliers",
        "keywords": "supplier order purchase",
        "times_asked": 0
    },
    {
        "id": 13,
        "question": "How to use the dashboard?",
        "answer": "The dashboard provides real-time business analytics including total sales, customer contacts, purchase history, and key performance indicators. Use charts and graphs to identify trends and opportunities.",
        "category": "dashboard",
        "keywords": "dashboard overview analytics",
        "times_asked": 0
    },
    {
        "id": 14,
        "question": "What is POS?",
        "answer": "POS (Point of Sale) is a system used to manage sales transactions, inventory, customers, and business operations. Tirsi POS provides a comprehensive solution for retail and service businesses.",
        "category": "getting-started",
        "keywords": "pos point of sale system",
        "times_asked": 0
    },
    {
        "id": 15,
        "question": "How to set up tax rates?",
        "answer": "Go to Settings > Tax Configuration. You can add multiple tax rates, set default tax for products, and configure tax-inclusive or tax-exclusive pricing.",
        "category": "settings",
        "keywords": "tax rate configure",
        "times_asked": 0
    },
    {
        "id": 16,
        "question": "How to handle multiple currencies?",
        "answer": "In Settings > Currency Configuration, you can add multiple currencies, set exchange rates, and configure which currencies are accepted for payments.",
        "category": "settings",
        "keywords": "currency exchange multi",
        "times_asked": 0
    },
    {
        "id": 17,
        "question": "How to backup data?",
        "answer": "Navigate to Settings > Backup & Restore. You can create manual backups, schedule automatic backups, and restore data from previous backups.",
        "category": "settings",
        "keywords": "backup restore data",
        "times_asked": 0
    },
    {
        "id": 18,
        "question": "How to manage user permissions?",
        "answer": "Go to Staff Management > Roles & Permissions. You can create custom roles, assign specific permissions, and control access to different modules.",
        "category": "staff",
        "keywords": "permissions role access control",
        "times_asked": 0
    },
    {
        "id": 19,
        "question": "How to create discount codes?",
        "answer": "In Sales Management > Discounts & Promotions, you can create discount codes, set percentage or fixed amount discounts, and define validity periods.",
        "category": "sales",
        "keywords": "discount promo code",
        "times_asked": 0
    },
    {
        "id": 20,
        "question": "How to print receipts?",
        "answer": "After completing a sale, click 'Print Receipt'. You can customize receipt templates, add store information, and choose between thermal or A4 receipt formats.",
        "category": "sales",
        "keywords": "receipt print thermal",
        "times_asked": 0
    },
    {
        "id": 21,
        "question": "How to add categories?",
        "answer": "In Inventory Management > Categories, you can create product categories, assign parent categories, and organize your products for better management and reporting.",
        "category": "inventory",
        "keywords": "category organize product",
        "times_asked": 0
    },
    {
        "id": 22,
        "question": "How to handle customer returns?",
        "answer": "Go to Sales Management, find the original sale, and click 'Process Return'. You can issue refunds to the original payment method or provide store credit.",
        "category": "sales",
        "keywords": "return refund customer credit",
        "times_asked": 0
    },
    {
        "id": 23,
        "question": "How to track expenses by category?",
        "answer": "In Expense Tracking, you can filter expenses by category, view spending trends, and generate category-wise expense reports for better financial management.",
        "category": "expense",
        "keywords": "expense category track spending",
        "times_asked": 0
    },
    {
        "id": 24,
        "question": "How to add product variants?",
        "answer": "When adding a product, enable 'Has Variants' and add options like size, color, or material. Each variant can have its own SKU, price, and stock level.",
        "category": "inventory",
        "keywords": "variant size color option sku",
        "times_asked": 0
    },
    {
        "id": 25,
        "question": "How to export reports?",
        "answer": "In any report view, click the 'Export' button. You can export data as PDF, Excel, or CSV format for further analysis or sharing with stakeholders.",
        "category": "finance",
        "keywords": "export report pdf excel csv",
        "times_asked": 0
    }
]

# Article content data
article_content = {
    'welcome': {
        'title': 'Welcome to Tirsi POS',
        'content': [
            'Welcome to the Tirsi POS Dashboard! This comprehensive guide will help you navigate and make the most of your point of sale system.',
            'The dashboard provides you with a complete overview of your business operations, including real-time sales data, inventory management, customer relationships, and detailed financial analytics.',
            'Use the sidebar navigation to access different modules of the system. Each module is designed to help you manage specific aspects of your business efficiently and effectively.'
        ],
        'tips': [
            'Start by exploring the Dashboard to get an overview of your business performance',
            'Add your products in the Inventory section to begin selling',
            'Set up your staff and their permissions for secure access',
            'Configure your settings to match your specific business needs',
            'Use the AI chat assistant for instant help and guidance'
        ]
    },
    'setup': {
        'title': 'Initial Setup Guide',
        'content': [
            'Setting up your Tirsi POS system is straightforward. Follow these steps to get started:',
            '1. Configure your business information including name, address, and contact details.',
            '2. Set up your tax rates and payment methods.',
            '3. Create user accounts for your staff members with appropriate permissions.',
            '4. Import or add your product catalog with pricing and stock levels.'
        ],
        'tips': [
            'Keep your business license and tax information handy',
            'Create a backup of your initial configuration',
            'Test the system with sample transactions before going live'
        ]
    },
    'navigation': {
        'title': 'Navigating the Dashboard',
        'content': [
            'The dashboard is designed for intuitive navigation and quick access to all features.',
            'The main sidebar contains all modules grouped by function. Click on any module to expand and view its sub-sections.',
            'The top bar displays key metrics, notifications, and quick action buttons.',
            'Use the search bar to quickly find specific features or articles.'
        ],
        'tips': [
            'Pin frequently used modules for quick access',
            'Use keyboard shortcuts for common actions',
            'Customize your dashboard view based on your role'
        ]
    },
    'overview': {
        'title': 'Dashboard Overview',
        'content': [
            'The Dashboard is your central hub for monitoring your business performance in real-time.',
            'At the top, you\'ll see key metrics including total sales, customer contacts, and recent purchase history.',
            'The dashboard provides quick access to your most important business data, allowing you to make informed decisions.',
            'Interactive charts and graphs help visualize trends and patterns in your business data.'
        ],
        'tips': [
            'Monitor your sales trends daily to identify patterns',
            'Keep an eye on customer activity for retention opportunities',
            'Check recent transactions regularly for discrepancies',
            'Use the data to identify business growth opportunities'
        ]
    },
    'add-product': {
        'title': 'Adding Products',
        'content': [
            'The Inventory module allows you to manage your product catalog efficiently and effectively.',
            'To add a new product, navigate to Inventory and click the "Add Product" button.',
            'Fill in the product details including name, SKU, category, price, and initial stock quantity.',
            'You can also add product images and set up variants for products with multiple options like size or color.',
            'Set minimum stock levels to receive automated alerts when inventory is low.'
        ],
        'tips': [
            'Use descriptive names and SKUs for easy searching',
            'Set appropriate stock levels based on sales velocity',
            'Categorize products for better organization and reporting',
            'Regularly update product information and pricing'
        ]
    },
    'create-order': {
        'title': 'Creating Orders',
        'content': [
            'The Sales module enables you to process customer orders quickly and efficiently.',
            'To create a new order, navigate to Sales and click the "New Sale" button.',
            'Select the customer from the dropdown or create a new customer profile.',
            'Add products to the cart by searching or scanning barcodes.',
            'Process the payment using your preferred payment method (cash, card, mobile money, etc.).'
        ],
        'tips': [
            'Verify customer information before processing',
            'Double-check product quantities and prices',
            'Offer multiple payment options to customers',
            'Print or email receipts to customers for their records'
        ]
    },
    'manage-stock': {
        'title': 'Managing Stock',
        'content': [
            'Effective stock management is crucial for business operations.',
            'The system tracks inventory levels in real-time and updates automatically with each sale.',
            'You can perform stock counts to verify physical inventory against system records.',
            'Receive alerts when stock levels fall below minimum thresholds.'
        ],
        'tips': [
            'Perform regular stock audits to maintain accuracy',
            'Set reorder points based on historical sales data',
            'Track stock movements for better inventory control'
        ]
    }
}

def get_best_match(question):
    """Find the best matching Q&A pair for a given question"""
    question_lower = question.lower().strip()
    best_match = None
    best_score = 0
    
    for qa in qa_pairs:
        q_lower = qa['question'].lower()
        keywords_lower = qa['keywords'].lower()
        
        # Calculate match score
        score = 0
        
        # Check for exact matches
        if q_lower in question_lower or question_lower in q_lower:
            score += 10
        
        # Check for word matches
        question_words = set(re.findall(r'\w+', question_lower))
        q_words = set(re.findall(r'\w+', q_lower))
        keyword_words = set(re.findall(r'\w+', keywords_lower))
        
        # Count matching words
        common_q_words = len(question_words.intersection(q_words))
        common_keywords = len(question_words.intersection(keyword_words))
        
        score += common_q_words * 2
        score += common_keywords * 3
        
        # Give bonus for category matches
        for word in question_words:
            if word in qa['category']:
                score += 1
        
        if score > best_score:
            best_score = score
            best_match = qa
    
    if best_match and best_score > 0:
        # Increment times_asked
        best_match['times_asked'] += 1
        return best_match
    
    return None

def generate_contextual_response(question, context=None):
    """Generate a contextual response when no exact match is found"""
    question_lower = question.lower()
    
    # Check for specific keywords to provide relevant responses
    if any(word in question_lower for word in ['add', 'create', 'new']):
        if 'product' in question_lower or 'item' in question_lower:
            return "To add a product, navigate to Inventory Management and click 'Add Product'. Fill in all the required details including name, SKU, price, and stock quantity. Don't forget to set up categories for better organization!"
        elif 'sale' in question_lower or 'order' in question_lower:
            return "Creating a sale order is easy! Go to Sales Management and click 'New Sale'. Select the customer, add products to the cart, and process the payment. You can also handle returns and generate invoices from the same section."
        elif 'customer' in question_lower:
            return "To add a customer, go to Customer Management and click 'Add Customer'. Fill in their contact details, and you can optionally set up loyalty program enrollment."
    
    elif 'manage' in question_lower or 'view' in question_lower or 'track' in question_lower:
        if 'customer' in question_lower:
            return "Customer Management allows you to view and manage all customer profiles, track purchase history, and set up loyalty programs. You can also export customer data for marketing purposes."
        elif 'stock' in question_lower or 'inventory' in question_lower:
            return "The Inventory module provides real-time stock tracking. You can view current stock levels, set low stock alerts, and generate inventory reports."
        elif 'expense' in question_lower:
            return "Expense Tracking lets you view all business expenses, categorize them, and generate expense reports. You can also set budgets and track spending against budgets."
    
    elif 'report' in question_lower or 'analytics' in question_lower:
        return "The Finance & Analytics section provides comprehensive reports including profit & loss statements, sales analytics, expense reports, and customer insights. You can filter by date range and export data in various formats."
    
    elif 'setting' in question_lower or 'configure' in question_lower:
        return "In Settings, you can configure business information, set up payment methods, manage tax rates, configure notifications, and customize the system to match your business needs."
    
    elif 'staff' in question_lower or 'employee' in question_lower:
        return "Staff Management lets you add team members, assign roles and permissions, track attendance, and manage payroll settings. Set up different access levels to ensure proper security."
    
    elif 'return' in question_lower or 'refund' in question_lower:
        return "To process returns, go to Sales Management, select the order, and click 'Process Return'. You can issue refunds to the original payment method, provide store credit, or exchange items."
    
    elif 'invoice' in question_lower:
        return "Generate invoices from the Sales section after creating an order. You can customize invoice templates, add tax details, and email or print invoices for customers."
    
    elif 'supplier' in question_lower:
        return "Supplier Management allows you to manage supplier relationships, create purchase orders, track supplier performance, and manage supplier ratings."
    
    elif 'dashboard' in question_lower:
        return "The dashboard provides real-time business analytics including total sales, customer contacts, purchase history, and key performance indicators. Use charts and graphs to identify trends and opportunities."
    
    elif 'backup' in question_lower:
        return "You can backup your data in Settings > Backup & Restore. Create manual backups or schedule automatic backups to ensure your data is always safe and recoverable."
    
    elif 'permission' in question_lower or 'role' in question_lower:
        return "Manage user permissions in Staff Management > Roles & Permissions. Create custom roles with specific permissions to control access to different modules and features."
    
    elif 'discount' in question_lower or 'promo' in question_lower:
        return "Create discount codes in Sales Management > Discounts & Promotions. Set percentage or fixed amount discounts, define validity periods, and track discount usage."
    
    elif 'tax' in question_lower:
        return "Configure tax rates in Settings > Tax Configuration. Set default tax rates, create multiple tax types, and choose between tax-inclusive or tax-exclusive pricing."
    
    elif context and context in article_content:
        # If we have context from the current article, provide related info
        article = article_content[context]
        return f"Based on the '{article['title']}' article: {article['content'][0]}"
    
    else:
        return """I'm here to help you with any questions about the Tirsi POS system. You can ask me about:
        
• Products & Inventory (add, manage, stock)
• Sales & Orders (create, process, returns)
• Customers (manage, loyalty programs)
• Reports & Analytics (financial reports, insights)
• Staff Management (add staff, permissions)
• Settings & Configuration (tax, currency, backup)
• Expenses (track, categorize, report)
• Suppliers (orders, ratings)

What would you like to know more about?"""

# Routes
def init_userguide_routes(app):
    """Initialize user guide routes"""
    app.register_blueprint(userguide_bp)

@userguide_bp.route('/chat', methods=['POST'])
def chat():
    """Handle chat messages from the AI assistant"""
    try:
        data = request.json
        message = data.get('message', '')
        context = data.get('context', '')
        
        if not message:
            return jsonify({'error': 'No message provided'}), 400
        
        # Find best matching Q&A
        match = get_best_match(message)
        
        if match:
            response = match['answer']
        else:
            # Generate contextual response
            response = generate_contextual_response(message, context)
        
        return jsonify({
            'response': response,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@userguide_bp.route('/qa', methods=['GET'])
def get_qa_pairs():
    """Get all Q&A pairs"""
    try:
        return jsonify({
            'qa_pairs': qa_pairs,
            'total': len(qa_pairs)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@userguide_bp.route('/qa', methods=['POST'])
def add_qa_pair():
    """Add a new Q&A pair"""
    try:
        data = request.json
        question = data.get('question')
        answer = data.get('answer')
        category = data.get('category', 'general')
        keywords = data.get('keywords', '')
        
        if not question or not answer:
            return jsonify({'error': 'Question and answer are required'}), 400
        
        # Generate new ID
        new_id = max([qa['id'] for qa in qa_pairs]) + 1 if qa_pairs else 1
        
        new_qa = {
            'id': new_id,
            'question': question,
            'answer': answer,
            'category': category,
            'keywords': keywords,
            'times_asked': 0
        }
        
        qa_pairs.append(new_qa)
        
        return jsonify({
            'message': 'Q&A pair added successfully',
            'qa_pair': new_qa
        }), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@userguide_bp.route('/qa/<int:qa_id>', methods=['PUT'])
def update_qa_pair(qa_id):
    """Update an existing Q&A pair"""
    try:
        data = request.json
        
        # Find the Q&A pair
        for qa in qa_pairs:
            if qa['id'] == qa_id:
                qa['question'] = data.get('question', qa['question'])
                qa['answer'] = data.get('answer', qa['answer'])
                qa['category'] = data.get('category', qa['category'])
                qa['keywords'] = data.get('keywords', qa['keywords'])
                
                return jsonify({
                    'message': 'Q&A pair updated successfully',
                    'qa_pair': qa
                })
        
        return jsonify({'error': 'Q&A pair not found'}), 404
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@userguide_bp.route('/qa/<int:qa_id>', methods=['DELETE'])
def delete_qa_pair(qa_id):
    """Delete a Q&A pair"""
    try:
        for i, qa in enumerate(qa_pairs):
            if qa['id'] == qa_id:
                deleted = qa_pairs.pop(i)
                return jsonify({
                    'message': 'Q&A pair deleted successfully',
                    'qa_pair': deleted
                })
        
        return jsonify({'error': 'Q&A pair not found'}), 404
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@userguide_bp.route('/feedback', methods=['POST'])
def submit_feedback():
    """Submit feedback for an article or Q&A"""
    try:
        data = request.json
        article_id = data.get('article_id')
        helpful = data.get('helpful')
        comment = data.get('comment')
        
        # Here you can store feedback in your database
        # For now, we'll just log it
        current_app.logger.info(f"Feedback received for {article_id}: helpful={helpful}, comment={comment}")
        
        return jsonify({
            'message': 'Thank you for your feedback!',
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@userguide_bp.route('/articles', methods=['GET'])
def get_articles():
    """Get all article content"""
    try:
        return jsonify({
            'articles': article_content
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@userguide_bp.route('/articles/<article_id>', methods=['GET'])
def get_article(article_id):
    """Get specific article content"""
    try:
        if article_id in article_content:
            return jsonify({
                'article': article_content[article_id]
            })
        else:
            return jsonify({'error': 'Article not found'}), 404
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@userguide_bp.route('/search', methods=['POST'])
def search_qa():
    """Search Q&A pairs by keyword"""
    try:
        data = request.json
        query = data.get('query', '').lower().strip()
        
        if not query:
            return jsonify({'qa_pairs': qa_pairs, 'total': len(qa_pairs)})
        
        results = []
        for qa in qa_pairs:
            # Search in question, answer, category, and keywords
            search_text = f"{qa['question']} {qa['answer']} {qa['category']} {qa['keywords']}".lower()
            if query in search_text:
                results.append(qa)
        
        return jsonify({
            'qa_pairs': results,
            'total': len(results)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@userguide_bp.route('/stats', methods=['GET'])
def get_stats():
    """Get statistics about Q&A usage"""
    try:
        total_asked = sum(qa['times_asked'] for qa in qa_pairs)
        most_asked = max(qa_pairs, key=lambda x: x['times_asked']) if qa_pairs else None
        
        return jsonify({
            'total_qa_pairs': len(qa_pairs),
            'total_questions_asked': total_asked,
            'most_asked_question': most_asked,
            'categories': list(set(qa['category'] for qa in qa_pairs))
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500