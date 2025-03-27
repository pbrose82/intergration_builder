import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """
    Base configuration class with default settings
    """
    # Flask Settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'default-secret-key')
    
    # SQLAlchemy Settings
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL', 
        'sqlite:///integration.db'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Alchemy API Settings
    ALCHEMY_BASE_URL = os.getenv('ALCHEMY_BASE_URL', '')
    ALCHEMY_CLIENT_ID = os.getenv('ALCHEMY_CLIENT_ID', '')
    ALCHEMY_CLIENT_SECRET = os.getenv('ALCHEMY_CLIENT_SECRET', '')
    
    # Logging Configuration
    LOGGING_LEVEL = os.getenv('LOGGING_LEVEL', 'INFO')
    
    # Optional: Extend with environment-specific configurations
    @classmethod
    def get_config(cls, environment='development'):
        """
        Return configuration based on environment
        
        Args:
            environment (str): Environment name
        
        Returns:
            Config subclass for specific environment
        """
        configs = {
            'development': DevelopmentConfig,
            'production': ProductionConfig,
            'testing': TestingConfig
        }
        return configs.get(environment, cls)

class DevelopmentConfig(Config):
    """Development-specific configuration"""
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    """Production-specific configuration"""
    DEBUG = False
    TESTING = False

class TestingConfig(Config):
    """Testing-specific configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
