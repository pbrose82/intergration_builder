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

    # Import and register troubleshooting routes
    from troubleshoot_routes import troubleshoot_bp
    app.register_blueprint(troubleshoot_bp)

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

    # Set log level from config
    log_level = app.config.get('LOG_LEVEL', 'INFO')
    file_handler.setLevel(log_level)
    
    # Add handler to app logger
    app.logger.addHandler(file_handler)
    app.logger.setLevel(log_level)
    
    # Ensure other libraries' loggers don't overwhelm our logs with DEBUG messages
    logging.getLogger('werkzeug').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy').setLevel(logging.WARNING)
    
    # Log startup
    app.logger.info('Integration Platform startup')
