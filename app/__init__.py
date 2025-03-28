"""
Application initialization module
"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
import logging
from logging.handlers import RotatingFileHandler
import os

db = SQLAlchemy()
ma = Marshmallow()

def create_app():
    app = Flask(__name__)
    app.config.from_object('app.config.Config')
    db.init_app(app)
    ma.init_app(app)
    configure_logging(app)

    # Import and register blueprints
    from .routes import main_bp
    app.register_blueprint(main_bp)

    # No troubleshooting routes for now
    # We'll add them back once the app is stable

    # Create database tables within the application context
    with app.app_context():
        db.create_all()

    return app

def configure_logging(app):
    """Set up application logging"""
    if not os.path.exists('logs'):
        os.mkdir('logs')

    # Configure file handler for application logs
    file_handler = RotatingFileHandler(
        'logs/integration_platform.log', 
        maxBytes=10240, 
        backupCount=10
    )

    # Set formatter to include timestamp, level, and location
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))

    # Set log level from config - use DEBUG for now to get more information
    log_level = app.config.get('LOG_LEVEL', 'DEBUG')
    file_handler.setLevel(log_level)
    
    # Add handler to app logger
    app.logger.addHandler(file_handler)
    app.logger.setLevel(log_level)
    
    # Configure other loggers for debugging
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    logging.getLogger('werkzeug').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy').setLevel(logging.WARNING)
    
    # Make sure our service logger has DEBUG level
    service_logger = logging.getLogger('services.alchemy_service')
    service_logger.setLevel(logging.DEBUG)
    service_logger.addHandler(file_handler)
    
    # Log startup
    app.logger.info('Integration Platform startup')
