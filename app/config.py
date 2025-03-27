import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """
    Application configuration
    """
    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'development_secret_key')
    
    # Database configuration
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL', 
        'sqlite:///integration.db'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Alchemy LIMS Configuration
    ALCHEMY_BASE_URL = os.getenv('ALCHEMY_BASE_URL', '')
    ALCHEMY_API_KEY = os.getenv('ALCHEMY_API_KEY', '')
    
    # Salesforce Configuration
    SALESFORCE_USERNAME = os.getenv('SALESFORCE_USERNAME', '')
    SALESFORCE_PASSWORD = os.getenv('SALESFORCE_PASSWORD', '')
    SALESFORCE_SECURITY_TOKEN = os.getenv('SALESFORCE_SECURITY_TOKEN', '')
    SALESFORCE_DOMAIN = os.getenv('SALESFORCE_DOMAIN', 'test')
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
