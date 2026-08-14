import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv(override=True)


class Config:
    """
    Base configuration for Tirsi POS.
    """

    # =====================================
    # SECURITY
    # =====================================

    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "change-this-secret-key"
    )

    # =====================================
    # DATABASE - AIVEN MYSQL
    # =====================================

    DB_USER = os.getenv(
        "DB_USER",
        "tirsi_user"
    )

    DB_PASSWORD = os.getenv(
        "DB_PASSWORD",
        ""
    )

    DB_HOST = os.getenv(
        "DB_HOST",
        "localhost"
    )

    DB_PORT = os.getenv(
        "DB_PORT",
        "3306"
    )

    DB_NAME = os.getenv(
        "DB_NAME",
        "tirsi_pos_db"
    )

    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://"
        f"{DB_USER}:"
        f"{DB_PASSWORD}@"
        f"{DB_HOST}:"
        f"{DB_PORT}/"
        f"{DB_NAME}"
        "?ssl=true"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 3600,
        "pool_size": 5,
        "max_overflow": 10,
        "pool_timeout": 30
    }

    # =====================================
    # ADMIN ACCOUNT
    # =====================================

    ADMIN_EMAIL = os.getenv(
        "ADMIN_EMAIL",
        "superadmin@system.com"
    )

    ADMIN_PASSWORD_HASH = os.getenv(
        "ADMIN_PASSWORD_HASH",
        ""
    )

    ADMIN_PASSWORD = os.getenv(
        "ADMIN_PASSWORD",
        ""
    )

    # =====================================
    # SESSION
    # =====================================

    SESSION_TYPE = "filesystem"
    SESSION_PERMANENT = True
    SESSION_USE_SIGNER = True
    SESSION_KEY_PREFIX = "tirsi_"

    PERMANENT_SESSION_LIFETIME = timedelta(
        days=7
    )

    SESSION_COOKIE_NAME = "session"
    SESSION_COOKIE_HTTPONLY = True
    SESSION_REFRESH_EACH_REQUEST = True

    # Defaults for development
    SESSION_COOKIE_SECURE = False
    SESSION_COOKIE_SAMESITE = "Lax"

    # =====================================
    # CORS
    # =====================================

    CORS_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5174",
        "http://127.0.0.1:5174",

        # Render frontend
        "https://pos-frontend-j0hd.onrender.com"
    ]

    CORS_SUPPORTS_CREDENTIALS = True

    # =====================================
    # APPLICATION
    # =====================================

    APP_NAME = os.getenv(
        "APP_NAME",
        "Tirsi POS"
    )

    API_PREFIX = "/api"

    DEBUG = (
        os.getenv(
            "DEBUG",
            "False"
        ).lower() == "true"
    )

    ENV = os.getenv(
        "ENV",
        "development"
    )


class DevelopmentConfig(Config):
    DEBUG = True
    ENV = "development"

    SESSION_COOKIE_SECURE = False
    SESSION_COOKIE_SAMESITE = "Lax"


class ProductionConfig(Config):
    DEBUG = False
    ENV = "production"

    # Render uses HTTPS
    SESSION_COOKIE_SECURE = True

    # Required for frontend/backend on different domains
    SESSION_COOKIE_SAMESITE = "None"


config = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig
}