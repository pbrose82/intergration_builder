from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from app.config import Config

# Initialize extensions
db = SQLAlchemy()
ma = Marshmallow()

def create_app(config_class=Config):
    """
    Application factory function to create and configure the Flask application
    
    Args:
        config_class (Config): Configuration class, defaults to base Config
    
    Returns:
        Flask: Configured Flask application instance
    """
    # Create Flask app instance
    app = Flask(__name__, 
                static_folder='../frontend/static', 
                template_folder='../frontend/templates')
    
    # Load configuration
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    ma.init_app(app)
    
    # Import and register blueprints
    from app.routes import main_bp
    app.register_blueprint(main_bp)
    
    return app
