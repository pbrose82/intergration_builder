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
    
    # HubSpot Configuration - support for both API key and OAuth
    HUBSPOT_API_KEY = os.getenv('HUBSPOT_API_KEY', '')
    HUBSPOT_PORTAL_ID = os.getenv('HUBSPOT_PORTAL_ID', '')
    # New OAuth specific variables
    HUBSPOT_ACCESS_TOKEN = os.getenv('HUBSPOT_ACCESS_TOKEN', '')
    HUBSPOT_CLIENT_SECRET = os.getenv('HUBSPOT_CLIENT_SECRET', '')
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
