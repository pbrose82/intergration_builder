"""
Application initialization module
"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_session import Session
import logging
from logging.handlers import RotatingFileHandler
import os
import sys

# Initialize Flask extensions
db = SQLAlchemy()
ma = Marshmallow()
sess = Session()

def create_app():
    """Create and configure the Flask application"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object('app.config.Config')
    
    # Initialize database
    db.init_app(app)
    
    # Initialize marshmallow
    ma.init_app(app)
    
    # Initialize session handling
    sess.init_app(app)
    
    # Set up logging
    configure_logging(app)
    
    # Add the parent directory to sys.path to ensure imports work correctly
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)
    
    # Register blueprints
    register_blueprints(app)
    
    # Create database tables within the application context
    with app.app_context():
        try:
            db.create_all()
            app.logger.info("Database tables created successfully")
        except Exception as e:
            app.logger.error(f"Error creating database tables: {str(e)}")
    
    return app

def register_blueprints(app):
    """Register all Flask blueprints"""
    
    # Register main routes
    try:
        from .routes import main_bp
        app.register_blueprint(main_bp)
        app.logger.info("Main routes registered successfully")
    except Exception as e:
        app.logger.warning(f"Could not register main routes: {str(e)}")
    
    # Register Salesforce routes
    try:
        from .salesforce_routes import salesforce_bp
        app.register_blueprint(salesforce_bp)
        app.logger.info("Salesforce routes registered successfully")
    except Exception as e:
        app.logger.warning(f"Could not register Salesforce routes: {str(e)}")
    
    # Register troubleshooting routes
    try:
        from .troubleshoot_routes import troubleshoot_bp
        app.register_blueprint(troubleshoot_bp)
        app.logger.info("Troubleshooting routes registered successfully")
    except Exception as e:
        app.logger.warning(f"Could not register troubleshooting routes: {str(e)}")
    
    # Register SAP routes (if available)
    try:
        from .sap_routes import sap_bp
        app.register_blueprint(sap_bp)
        app.logger.info("SAP routes registered successfully")
    except ImportError:
        app.logger.info("SAP integration not available")
    except Exception as e:
        app.logger.warning(f"Could not register SAP routes: {str(e)}")
    
    # Register HubSpot routes (if available)
    try:
        from .hubspot_routes import hubspot_bp
        app.register_blueprint(hubspot_bp)
        app.logger.info("HubSpot routes registered successfully")
    except ImportError:
        app.logger.info("HubSpot integration not available")
    except Exception as e:
        app.logger.warning(f"Could not register HubSpot routes: {str(e)}")

def configure_logging(app):
    """Configure application logging"""
    
    # Ensure logs directory exists
    log_dir = os.path.dirname(app.config.get('LOG_FILE', 'logs/integration_platform.log'))
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # Configure file handler for application logs
    file_handler = RotatingFileHandler(
        app.config.get('LOG_FILE', 'logs/integration_platform.log'), 
        maxBytes=app.config.get('LOG_MAX_BYTES', 10240), 
        backupCount=app.config.get('LOG_BACKUP_COUNT', 10)
    )
    
    # Set formatter to include timestamp, level, and location
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    
    # Set log level from config
    log_level = app.config.get('LOG_LEVEL', 'INFO')
    file_handler.setLevel(log_level)
    
    # Add handler to app logger
    app.logger.addHandler(file_handler)
    app.logger.setLevel(log_level)
    
    # Configure third-party loggers
    configure_external_loggers(log_level, file_handler)
    
    # Log startup
    app.logger.info('Integration Platform startup')

def configure_external_loggers(log_level, file_handler):
    """Configure logging for external libraries"""
    
    # Configure specific loggers with appropriate levels
    loggers = {
        'urllib3': logging.WARNING,
        'werkzeug': logging.INFO,
        'sqlalchemy': logging.WARNING,
        'simple_salesforce': logging.INFO,
        'services.alchemy_service': logging.DEBUG,
        'services.salesforce_service': logging.DEBUG,
        'services.sap_service': logging.DEBUG,
        'services.hubspot_service': logging.DEBUG,
    }
    
    for logger_name, level in loggers.items():
        logger = logging.getLogger(logger_name)
        logger.setLevel(level)
        logger.addHandler(file_handler)
