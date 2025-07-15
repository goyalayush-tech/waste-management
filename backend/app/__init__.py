"""
Flask application factory and initialization
"""
import os
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO

from config import config

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
socketio = SocketIO()


def create_app(config_name=None):
    """Create and configure the Flask application"""
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, origins=app.config['CORS_ORIGINS'])
    socketio.init_app(app, 
                      cors_allowed_origins=app.config['CORS_ORIGINS'],
                      async_mode=app.config['SOCKETIO_ASYNC_MODE'])
    
    # Setup logging
    setup_logging(app)
    
    # Register blueprints
    register_blueprints(app)
    
    # Register error handlers
    register_error_handlers(app)
    
    # Create upload directory
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    return app


def register_blueprints(app):
    """Register all blueprints"""
    from app.routes import (
        auth_bp, users_bp, zones_bp, bins_bp, 
        waste_bp, collections_bp, analytics_bp, 
        alerts_bp, blockchain_bp
    )
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(zones_bp, url_prefix='/api/zones')
    app.register_blueprint(bins_bp, url_prefix='/api/bins')
    app.register_blueprint(waste_bp, url_prefix='/api/waste')
    app.register_blueprint(collections_bp, url_prefix='/api/collections')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(alerts_bp, url_prefix='/api/alerts')
    app.register_blueprint(blockchain_bp, url_prefix='/api/blockchain')


def register_error_handlers(app):
    """Register error handlers"""
    from app.utils.errors import register_error_handlers as reg_handlers
    reg_handlers(app)


def setup_logging(app):
    """Setup application logging"""
    if not app.debug and not app.testing:
        if not os.path.exists('logs'):
            os.mkdir('logs')
        
        file_handler = RotatingFileHandler(
            f'logs/{app.config["LOG_FILE"]}',
            maxBytes=10240000,  # 10MB
            backupCount=10
        )
        
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s '
            '[in %(pathname)s:%(lineno)d]'
        ))
        
        file_handler.setLevel(getattr(logging, app.config['LOG_LEVEL']))
        app.logger.addHandler(file_handler)
        
        app.logger.setLevel(getattr(logging, app.config['LOG_LEVEL']))
        app.logger.info('Waste Management System startup')