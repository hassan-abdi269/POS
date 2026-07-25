# routes/auth.py - Add debug logging
from flask import request, jsonify, session, current_app
from flask_login import login_user, logout_user, login_required, current_user
import bcrypt
import os

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


def verify_admin_password(password):
    """
    Verify admin password - checks hash first, then plain text fallback
    """
    admin_password_hash = current_app.config.get('ADMIN_PASSWORD_HASH')
    admin_password_plain = current_app.config.get('ADMIN_PASSWORD')
    
    print(f"🔍 Verifying password...")
    print(f"   Hash present: {bool(admin_password_hash)}")
    print(f"   Plain present: {bool(admin_password_plain)}")
    
    # Try hashed password first (preferred method)
    if admin_password_hash:
        try:
            # Check if it's a valid bcrypt hash
            result = bcrypt.checkpw(password.encode('utf-8'), admin_password_hash.encode('utf-8'))
            print(f"   Hash verification: {'✅ PASSED' if result else '❌ FAILED'}")
            if result:
                return True
        except Exception as e:
            print(f"⚠️ Password hash verification error: {e}")
    
    # Fallback to plain text (for development/backwards compatibility)
    if admin_password_plain:
        print(f"   Plain text verification: {'✅ PASSED' if password == admin_password_plain else '❌ FAILED'}")
        if password == admin_password_plain:
            if admin_password_hash:
                print("⚠️ Using plain text password - but hashed password is also present")
                print("💡 Tip: Remove ADMIN_PASSWORD from .env and use only ADMIN_PASSWORD_HASH")
            else:
                print("⚠️ Using plain text password - please generate a hash")
                print("💡 Run: python generate_hash.py")
            return True
    
    print("❌ Password verification FAILED!")
    return False


def init_auth_routes(app):
    """Initialize authentication routes"""
    
    @app.route('/api/auth/login', methods=['POST'])
    def login():
        """Admin login - checks credentials from .env with hashed password support"""
        print("\n" + "=" * 50)
        print("🔐 LOGIN ATTEMPT")
        print("=" * 50)
        
        data = request.get_json()
        print(f"📥 Request data: {data}")
        
        if not data:
            print("❌ No data provided")
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email')
        password = data.get('password')
        print(f"📧 Email: {email}")
        print(f"🔑 Password: {'*' * len(password) if password else 'None'}")
        
        if not email or not password:
            print("❌ Email or password missing")
            return jsonify({'error': 'Email and password required'}), 400
        
        # Get admin email from config
        admin_email = app.config.get('ADMIN_EMAIL')
        print(f"📧 Admin email from config: {admin_email}")
        
        if not admin_email:
            print("❌ Admin email not configured")
            return jsonify({'error': 'Admin email not configured'}), 500
        
        # Check email
        if email != admin_email:
            print(f"❌ Email mismatch: {email} != {admin_email}")
            return jsonify({'error': 'Invalid credentials'}), 401
        
        print("✅ Email matches!")
        
        # Verify password using the utility function
        if not verify_admin_password(password):
            print("❌ Password verification failed")
            return jsonify({'error': 'Invalid credentials'}), 401
        
        print("✅ Password verified!")
        
        # Login user
        user = AdminUser(admin_email)
        login_user(user, remember=True)
        
        # Log successful login
        app.logger.info(f"Admin login successful: {email}")
        print("✅ Login successful!")
        print("=" * 50 + "\n")
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'email': admin_email,
                'username': 'admin',
                'is_admin': True
            },
            'is_authenticated': True
        }), 200

    @app.route('/api/auth/logout', methods=['POST'])
    @login_required
    def logout():
        """Logout endpoint"""
        logout_user()
        session.clear()
        return jsonify({'message': 'Logged out successfully'}), 200

    @app.route('/api/auth/check', methods=['GET'])
    def check_auth():
        """Check if user is authenticated"""
        if current_user.is_authenticated:
            return jsonify({
                'authenticated': True,
                'user': {
                    'email': app.config.get('ADMIN_EMAIL'),
                    'username': 'admin'
                }
            }), 200
        return jsonify({
            'authenticated': False,
            'message': 'Not authenticated'
        }), 401

    @app.route('/api/auth/me', methods=['GET'])
    @login_required
    def get_current_user():
        """Get current authenticated user"""
        return jsonify({
            'user': {
                'email': app.config.get('ADMIN_EMAIL'),
                'username': 'admin',
                'is_admin': True
            },
            'is_authenticated': True
        }), 200