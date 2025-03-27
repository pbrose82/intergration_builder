from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
import logging
from logging.handlers import RotatingFileHandler
import os

# Initialize extensions
db = SQLAlchemy()
ma = Marshmallow()

def create_app():
    """
    Application factory to create and configure the Flask application
    """
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object('app.config.Config')
    
    # Initialize extensions
    db.init_app(app)
    ma.init_app(app)
    
    # Configure logging
    configure_logging(app)
    
    # Register blueprints
    from .routes import main_bp
    app.register_blueprint(main_bp)
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app

def configure_logging(app):
    """
    Configure application logging
    """
    # Ensure logs directory exists
    if not os.path.exists('logs'):
        os.mkdir('logs')
    
    # Create a file handler
    file_handler = RotatingFileHandler(
        'logs/integration_platform.log', 
        maxBytes=10240, 
        backupCount=10
    )
    
    # Set logging format
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    
    # Set log level from configuration
    file_handler.setLevel(app.config.get('LOG_LEVEL', 'INFO'))
    
    # Add handler to app logger
    app.logger.addHandler(file_handler)
    app.logger.setLevel(app.config.get('LOG_LEVEL', 'INFO'))
    app.logger.info('Integration Platform startup')
