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
    SESSION_TYPE = 'filesystem'
    SESSION_PERMANENT = True
    PERMANENT_SESSION_LIFETIME = 86400  # 24 hours (in seconds)
    
    # Database configuration
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL', 
        'sqlite:///integration.db'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Alchemy LIMS Configuration
    ALCHEMY_BASE_URL = os.getenv('ALCHEMY_BASE_URL', 'https://core-production.alchemy.cloud')
    ALCHEMY_API_URL = os.getenv('ALCHEMY_API_URL', 'https://core-production.alchemy.cloud/core/api/v2')
    ALCHEMY_REFRESH_URL = os.getenv('ALCHEMY_REFRESH_URL', 'https://core-production.alchemy.cloud/core/api/v2/refresh-token')
    ALCHEMY_FILTER_URL = os.getenv('ALCHEMY_FILTER_URL', 'https://core-production.alchemy.cloud/core/api/v2/filter-records')
    ALCHEMY_RECORD_TYPES_URL = os.getenv('ALCHEMY_RECORD_TYPES_URL', 'https://core-production.alchemy.cloud/core/api/v2/record-templates')
    
    # Default Alchemy tenant (optional)
    ALCHEMY_DEFAULT_TENANT = os.getenv('ALCHEMY_DEFAULT_TENANT', '')
    ALCHEMY_DEFAULT_TOKEN = os.getenv('ALCHEMY_DEFAULT_TOKEN', '')
    
    # Salesforce Configuration
    # Basic authentication
    SALESFORCE_USERNAME = os.getenv('SALESFORCE_USERNAME', '')
    SALESFORCE_PASSWORD = os.getenv('SALESFORCE_PASSWORD', '')
    SALESFORCE_SECURITY_TOKEN = os.getenv('SALESFORCE_SECURITY_TOKEN', '')
    SALESFORCE_DOMAIN = os.getenv('SALESFORCE_DOMAIN', 'test')  # or 'login' for production
    
    # Salesforce OAuth Configuration
    SALESFORCE_CLIENT_ID = os.getenv('SALESFORCE_CLIENT_ID', '')
    SALESFORCE_CLIENT_SECRET = os.getenv('SALESFORCE_CLIENT_SECRET', '')
    SALESFORCE_REDIRECT_URI = os.getenv('SALESFORCE_REDIRECT_URI', '')
    
    # Salesforce API Configuration
    SALESFORCE_API_VERSION = os.getenv('SALESFORCE_API_VERSION', '56.0')
    
    # SAP Configuration (for future integration)
    SAP_BASE_URL = os.getenv('SAP_BASE_URL', '')
    SAP_CLIENT_ID = os.getenv('SAP_CLIENT_ID', '')
    SAP_CLIENT_SECRET = os.getenv('SAP_CLIENT_SECRET', '')
    
    # HubSpot Configuration (for future integration)
    HUBSPOT_API_KEY = os.getenv('HUBSPOT_API_KEY', '')
    HUBSPOT_PORTAL_ID = os.getenv('HUBSPOT_PORTAL_ID', '')
    
    # Integration Settings
    SYNC_INTERVAL = int(os.getenv('SYNC_INTERVAL', '3600'))  # Default: 1 hour (in seconds)
    MAX_RETRIES = int(os.getenv('MAX_RETRIES', '3'))         # Default: 3 retries
    RETRY_DELAY = int(os.getenv('RETRY_DELAY', '300'))       # Default: 5 minutes (in seconds)
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', 'logs/integration_platform.log')
    LOG_MAX_BYTES = int(os.getenv('LOG_MAX_BYTES', '10240'))  # 10KB
    LOG_BACKUP_COUNT = int(os.getenv('LOG_BACKUP_COUNT', '10'))
    
    # General Settings
    DEBUG = os.getenv('DEBUG', 'False').lower() in ('true', '1', 't')
    TESTING = os.getenv('TESTING', 'False').lower() in ('true', '1', 't')
    
    # Security Settings
    PREFERRED_URL_SCHEME = 'https'  # Force HTTPS when generating URLs
    SESSION_COOKIE_SECURE = True    # Send cookies only via HTTPS
    SESSION_COOKIE_HTTPONLY = True  # Prevent JavaScript access to session cookie
    
    # Set reasonable security defaults based on environment
    if DEBUG or TESTING:
        SESSION_COOKIE_SECURE = False  # Allow HTTP in development
