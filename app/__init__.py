"""
Application initialization module
"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
import logging
from logging.handlers import RotatingFileHandler
import os
import sys

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

    # Add the parent directory to sys.path so imports work correctly
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)

    # Import and register troubleshooting routes
    try:
        # Import from the correct location
        from app.troubleshoot_routes import troubleshoot_bp
        app.register_blueprint(troubleshoot_bp)
        app.logger.info("Troubleshooting routes registered successfully")
    except Exception as e:
        app.logger.warning(f"Could not register troubleshooting routes: {str(e)}")
        
    # Import and register HubSpot debug routes
    try:
        from app.hubspot_debug import hubspot_debug_bp
        app.register_blueprint(hubspot_debug_bp)
        app.logger.info("HubSpot debug routes registered successfully")
    except Exception as e:
        app.logger.warning(f"Could not register HubSpot debug routes: {str(e)}")
        
    # Import and register HubSpot routes
    try:
        from app.hubspot_routes import hubspot_bp
        app.register_blueprint(hubspot_bp)
        app.logger.info("HubSpot routes registered successfully")
    except Exception as e:
        app.logger.warning(f"Could not register HubSpot routes: {str(e)}")
        
    # Import and register integration routes
    try:
        from app.integration_routes import integration_bp
        app.register_blueprint(integration_bp)
        app.logger.info("Integration routes registered successfully")
    except Exception as e:
        app.logger.warning(f"Could not register integration routes: {str(e)}")

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

    # Set log level from config - use DEBUG for troubleshooting
    log_level = app.config.get('LOG_LEVEL', 'DEBUG')
    file_handler.setLevel(log_level)
    
    # Add handler to app logger
    app.logger.addHandler(file_handler)
    app.logger.setLevel(log_level)
    
    # Configure other loggers for debugging
    logging.getLogger('urllib3').setLevel(logging.INFO)
    logging.getLogger('werkzeug').setLevel(logging.INFO)
    logging.getLogger('sqlalchemy').setLevel(logging.WARNING)
    
    # Make sure our service logger has DEBUG level
    service_logger = logging.getLogger('services.alchemy_service')
    service_logger.setLevel(logging.DEBUG)
    service_logger.addHandler(file_handler)
    
    # Log startup
    app.logger.info('Integration Platform startup')
