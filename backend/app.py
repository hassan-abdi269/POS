# app.py - MUST BE AT THE VERY TOP
import os
from dotenv import load_dotenv

# Load .env FIRST - before ANY other imports
load_dotenv(override=True)

# Now import everything else
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_session import Session
from flask_login import LoginManager, login_required, login_user, logout_user, current_user
from extensions import db, migrate, cors, session as session_ext, login_manager, bcrypt
from config import config
from routes import init_routes

# Import Shop model for user_loader
from models.shop import Shop

# ============ APPLICATION FACTORY ============

def create_app(config_name='development'):
    """Create and configure the Flask application"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    initialize_extensions(app)
    
    # Setup login manager
    setup_login_manager(app)
    
    # Register blueprints/routes
    init_routes(app)
    
    # Register error handlers
    register_error_handlers(app)
    
    return app


# ============ EXTENSIONS SETUP ============

def initialize_extensions(app):
    """Initialize all Flask extensions"""
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, 
         supports_credentials=True,
         origins=app.config['CORS_ORIGINS'].split(','))
    session_ext.init_app(app)
    login_manager.init_app(app)
    bcrypt.init_app(app)
    
    # Test database connection
    with app.app_context():
        try:
            db.engine.connect()
            print("✅ MySQL database connected successfully!")
        except Exception as e:
            print(f"❌ MySQL connection failed: {e}")


# ============ LOGIN MANAGER SETUP ============

class AdminUser:
    """Simple admin user class (no database)"""
    def __init__(self, email):
        self.id = 1
        self.is_authenticated = True
        self.is_active = True
        self.is_anonymous = False
        self.username = "admin"
        self.email = email
    
    def get_id(self):
        return str(self.id)


def setup_login_manager(app):
    """Configure Flask-Login - supports both Admin and Shop users"""
    login_manager.login_view = None
    login_manager.session_protection = "strong"
    
    @login_manager.user_loader
    def load_user(user_id):
        """Load user by ID - supports both Admin (ID=1) and Shop users"""
        # Check if it's admin (user_id == "1")
        if user_id == "1":
            return AdminUser(app.config.get('ADMIN_EMAIL', 'superadmin@system.com'))
        
        # Check if it's a shop
        try:
            shop_id = int(user_id)
            shop = Shop.query.get(shop_id)
            if shop:
                # Shop model has UserMixin with get_id() method
                return shop
        except (ValueError, TypeError):
            pass
        except Exception as e:
            app.logger.error(f"Error loading user {user_id}: {str(e)}")
        
        return None


# ============ ERROR HANDLERS ============

def register_error_handlers(app):
    """Register custom error handlers"""
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({'error': 'Unauthorized - Please log in'}), 401
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500


# ============ ROUTES ============

def register_routes(app):
    """Register application routes"""
    
    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        try:
            db.session.execute("SELECT 1")
            db_status = "connected"
        except Exception as e:
            db_status = f"disconnected: {str(e)}"
        
        return jsonify({
            'status': 'healthy',
            'environment': app.config['ENV'],
            'admin_email': app.config['ADMIN_EMAIL'],
            'database': db_status
        })
    
    @app.route('/', methods=['GET'])
    def index():
        """Root endpoint"""
        return jsonify({
            'name': app.config['APP_NAME'],
            'version': '1.0.0',
            'status': 'running',
            'environment': app.config['ENV'],
            'endpoints': {
                'auth': '/api/auth/',
                'shop': '/api/shop/',
                'health': '/health'
            }
        })
    
    @app.route('/uploads/<filename>')
    def uploaded_file(filename):
        """Serve uploaded files"""
        upload_dir = os.path.join(app.root_path, 'uploads')
        return send_from_directory(upload_dir, filename)
    
    # Debug endpoint to check current user
    @app.route('/api/debug/user', methods=['GET'])
    @login_required
    def debug_user():
        """Debug endpoint to check current user"""
        user_info = {
            'is_authenticated': current_user.is_authenticated,
            'user_id': current_user.get_id() if hasattr(current_user, 'get_id') else None,
            'user_type': 'admin' if hasattr(current_user, 'username') and current_user.username == 'admin' else 'shop',
        }
        
        if hasattr(current_user, 'name'):
            user_info['name'] = current_user.name
        if hasattr(current_user, 'email'):
            user_info['email'] = current_user.email
        if hasattr(current_user, 'shop_id'):
            user_info['shop_id'] = current_user.shop_id
        
        return jsonify(user_info), 200


# ============ CREATE APP INSTANCE ============

# Create app instance
app = create_app(os.getenv('ENV', 'development'))

# Register additional routes
register_routes(app)


# ============ RUN APPLICATION ============

if __name__ == '__main__':
    app.run(
        debug=app.config['DEBUG'],
        host='0.0.0.0',
        port=5000,
        threaded=True
    )