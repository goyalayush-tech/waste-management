"""
Flask application configuration
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'postgresql://postgres:password@localhost:5432/waste_management'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 86400)))
    JWT_ALGORITHM = 'HS256'
    
    # Redis
    REDIS_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379/0'
    
    # Blockchain
    POLYGON_RPC_URL = os.environ.get('POLYGON_RPC_URL', 'https://rpc-mumbai.maticvigil.com/')
    PRIVATE_KEY = os.environ.get('PRIVATE_KEY')
    CONTRACT_ADDRESS = os.environ.get('CONTRACT_ADDRESS')
    
    # File uploads
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'csv', 'json'}
    
    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')
    
    # WebSocket
    SOCKETIO_ASYNC_MODE = os.environ.get('SOCKETIO_ASYNC_MODE', 'eventlet')
    
    # Email
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'True').lower() == 'true'
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    
    # Logging
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FILE = os.environ.get('LOG_FILE', 'app.log')
    
    # Pagination
    ITEMS_PER_PAGE = 20
    
    # Delhi Zones Configuration
    DELHI_ZONES = {
        1: {
            'name': 'North Delhi',
            'area': 60.86,  # sq km
            'population': 887978,
            'coordinates': {'lat': 28.7041, 'lng': 77.1025}
        },
        2: {
            'name': 'South Delhi',
            'area': 250.48,
            'population': 2731929,
            'coordinates': {'lat': 28.5355, 'lng': 77.2503}
        },
        3: {
            'name': 'East Delhi',
            'area': 64.0,
            'population': 1709346,
            'coordinates': {'lat': 28.6280, 'lng': 77.2989}
        },
        4: {
            'name': 'West Delhi',
            'area': 129.38,
            'population': 2543243,
            'coordinates': {'lat': 28.6519, 'lng': 77.0678}
        },
        5: {
            'name': 'Central Delhi',
            'area': 25.0,
            'population': 582320,
            'coordinates': {'lat': 28.6517, 'lng': 77.2219}
        }
    }
    
    # Waste Types Configuration
    WASTE_TYPES = {
        'organic': {
            'name': 'Organic Waste',
            'color': '#4CAF50',
            'icon': 'compost',
            'recyclable': False,
            'disposal_method': 'composting'
        },
        'plastic': {
            'name': 'Plastic Waste',
            'color': '#2196F3',
            'icon': 'bottle',
            'recyclable': True,
            'disposal_method': 'recycling'
        },
        'paper': {
            'name': 'Paper Waste',
            'color': '#FF9800',
            'icon': 'newspaper',
            'recyclable': True,
            'disposal_method': 'recycling'
        },
        'metal': {
            'name': 'Metal Waste',
            'color': '#9E9E9E',
            'icon': 'can',
            'recyclable': True,
            'disposal_method': 'recycling'
        },
        'ewaste': {
            'name': 'E-Waste',
            'color': '#F44336',
            'icon': 'devices',
            'recyclable': True,
            'disposal_method': 'special_processing'
        }
    }


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SQLALCHEMY_ECHO = True


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    SQLALCHEMY_ECHO = False
    
    # Use stronger security in production
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)
    
    # Ensure HTTPS in production
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}