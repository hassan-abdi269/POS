# config.py
import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Base configuration"""
    
    # Secret key for sessions
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Database configuration - MySQL (SECURE VERSION)
    # Get database password from system environment or secure file
    DB_PASSWORD = os.getenv('DB_PASSWORD')  # From system environment (not .env)
    
    # If DB_PASSWORD is not set, try to read from secure file
    if not DB_PASSWORD:
        secure_file = os.path.expanduser('~/.db-credentials/password')
        if os.path.exists(secure_file):
            with open(secure_file, 'r') as f:
                DB_PASSWORD = f.read().strip()
    
    # Fallback to .env only for development (with warning)
    if not DB_PASSWORD:
        # Check if password is in .env (for backward compatibility)
        env_password = os.getenv('DATABASE_URL', '')
        if 'tirsi123' in env_password or 'YourSecurePassword123!' in env_password:
            print("⚠️ WARNING: Using database password from .env - This is not secure!")
            # Extract password from DATABASE_URL as fallback
            DB_PASSWORD = 'tirsi123'  # Only for development
    
    # Build DATABASE_URL securely
    DB_USER = os.getenv('DB_USER', 'tirsi_user')
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '3306')
    DB_NAME = os.getenv('DB_NAME', 'tirsi_pos_db')
    
    # Use secure password
    if DB_PASSWORD:
        SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    else:
        # Fallback to DATABASE_URL from .env (not recommended)
        SQLALCHEMY_DATABASE_URI = os.getenv(
            'DATABASE_URL', 
            'mysql+pymysql://tirsi_user:YourSecurePassword123!@localhost:3306/tirsi_pos_db'
        )
        print("⚠️ WARNING: Using DATABASE_URL from .env - Password is exposed!")
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_recycle': 3600,
        'pool_pre_ping': True,
        'pool_timeout': 30,
    }
    
    # Admin credentials from .env - SUPPORT BOTH PLAIN AND HASHED
    ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'superadmin@system.com')
    ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD')  # Plain text (fallback for development)
    ADMIN_PASSWORD_HASH = os.getenv('ADMIN_PASSWORD_HASH')  # Hashed password (preferred)
    
    # Session configuration
    SESSION_TYPE = 'filesystem'
    SESSION_PERMANENT = False
    SESSION_USE_SIGNER = True
    SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'False') == 'True'
    SESSION_COOKIE_HTTPONLY = os.getenv('SESSION_COOKIE_HTTPONLY', 'True') == 'True'
    SESSION_COOKIE_SAMESITE = os.getenv('SESSION_COOKIE_SAMESITE', 'Lax')
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)
    
    # CORS configuration
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000,http://localhost:5000')
    CORS_SUPPORTS_CREDENTIALS = True
    
    # Environment
    DEBUG = os.getenv('DEBUG', 'True') == 'True'
    ENV = os.getenv('ENV', 'development')
    
    # Application specific
    APP_NAME = os.getenv('APP_NAME', 'Tirsi POS')
    API_PREFIX = os.getenv('API_PREFIX', '/api')


class DevelopmentConfig(Config):
    DEBUG = True
    ENV = 'development'
    
    # In development, you can still use .env if you want
    # But with a warning


class ProductionConfig(Config):
    DEBUG = False
    ENV = 'production'
    SESSION_COOKIE_SECURE = True
    
    # In production, REQUIRE secure password storage
    def __init__(self):
        super().__init__()
        # Force secure password in production
        if not self.DB_PASSWORD:
            raise ValueError(
                "DB_PASSWORD must be set via environment variable or secure file in production!"
            )


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

# Get the appropriate config class based on environment
ConfigClass = config[os.getenv('ENV', 'development')]