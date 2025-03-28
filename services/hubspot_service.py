"""
HubSpot API integration service with OAuth support
"""
import requests
import logging
import json
from flask import current_app

# Set up logger
logger = logging.getLogger(__name__)

class HubSpotService:
    """
    Service for interacting with the HubSpot API
    """
    def __init__(self, access_token=None, client_secret=None, oauth_mode=False):
        self.access_token = access_token
        self.client_secret = client_secret
        self.base_url = "https://api.hubapi.com"
        self.oauth_mode = oauth_mode
    
    def validate_credentials(self):
        """
        Validate HubSpot credentials by making a simple request
        
        Returns:
            bool: True if valid, False otherwise
        """
        try:
            # Check if we have a token
            if not self.access_token:
                logger.error("No access token provided")
                return False, "No access token provided"
            
            # Check if the token starts with 'pat-' - HubSpot private app token format
            is_pat = self.access_token.startswith('pat-')
            
            # Normalize token - remove any whitespace
            token = self.access_token.strip()
            
            # Log token format (masked)
            masked_token = token[:6] + "..." if len(token) > 6 else "***"
            logger.info(f"Validating HubSpot credentials with token format: {masked_token}")
            
            # Use different endpoint based on token type
            if is_pat:
                # For Private App tokens
                url = f"{self.base_url}/crm/v3/objects/contacts"
                headers = {
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
                params = {"limit": 1}  # Just request a single contact to minimize data transfer
            else:
                # For OAuth tokens (original code path)
                url = f"{self.base_url}/oauth/v1/access-tokens/info"
                headers = {
                    "Authorization": f"Bearer {token}"
                }
                params = {}
            
            logger.info(f"Making validation request to: {url}")
            response = requests.get(url, headers=headers, params=params)
            
            # Log the response status
            logger.info(f"HubSpot API response status: {response.status_code}")
            
            if response.status_code == 200:
                logger.info("HubSpot credentials are valid")
                return True, "Credentials validated successfully"
            else:
                error_msg = f"Invalid credentials: {response.status_code}"
                if response.text:
                    try:
                        error_detail = response.json()
                        if isinstance(error_detail, dict) and 'message' in error_detail:
                            error_msg = f"{error_msg} - {error_detail['message']}"
                        else:
                            error_msg = f"{error_msg} - {response.text[:100]}"
                    except:
                        error_msg = f"{error_msg} - {response.text[:100]}"
                        
                logger.error(error_msg)
                return False, error_msg
        except Exception as e:
            logger.error(f"Error validating HubSpot credentials: {str(e)}")
            return False, f"Error: {str(e)}"
    
    def get_object_types(self):
        """
        Get available object types from HubSpot that can be used for integration
        
        Returns:
            list: List of object types
        """
        try:
            # HubSpot has standard objects we can use to start with
            standard_objects = [
                {"id": "contact", "name": "Contact", "description": "Store and manage contact details"},
                {"id": "company", "name": "Company", "description": "Store and manage company information"},
                {"id": "deal", "name": "Deal", "description": "Track sales opportunities"},
                {"id": "ticket", "name": "Ticket", "description": "Track customer support requests"},
                {"id": "product", "name": "Product", "description": "Store product information"}
            ]
            
            # Normalize token - remove any whitespace
            token = self.access_token.strip() if self.access_token else ""
            
            # Try to fetch schema metadata to verify our access
            try:
                url = f"{self.base_url}/crm/v3/schemas"
                headers = {
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
                
                response = requests.get(url, headers=headers)
                
                if response.status_code == 200:
                    logger.info("Successfully verified API access with schema metadata")
                    # We could add custom objects here if needed
                else:
                    logger.warning(f"Could not fetch schema metadata: {response.status_code} - {response.text[:100]}")
            except Exception as e:
                logger.warning(f"Error fetching schema metadata: {str(e)}")
            
            return standard_objects
        except Exception as e:
            logger.error(f"Error getting HubSpot object types: {str(e)}")
            return []
    
    def get_fields_for_object(self, object_type):
        """
        Get available fields/properties for a given object type
        
        Args:
            object_type (str): The object type to get fields for (e.g., contact, company)
            
        Returns:
            list: List of fields with id and name
        """
        try:
            logger.info(f"Fetching fields for HubSpot object type: {object_type}")
            
            # Normalize token - remove any whitespace
            token = self.access_token.strip() if self.access_token else ""
            
            # Use the appropriate endpoint based on object type
            if object_type in ["contact", "company", "deal", "ticket", "product"]:
                url = f"{self.base_url}/crm/v3/properties/{object_type}"
            else:
                # For custom objects
                url = f"{self.base_url}/crm/v3/properties/{object_type}"
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(url, headers=headers)
            
            if response.status_code != 200:
                logger.error(f"Error fetching fields: {response.status_code} - {response.text[:100]}")
                return []
            
            # Parse the response
            properties = response.json().get("results", [])
            
            # Transform to standard format
            fields = []
            for prop in properties:
                field = {
                    "identifier": prop.get("name"),
                    "name": prop.get("label", prop.get("name")),
                    "type": prop.get("type", "string"),
                    "description": prop.get("description", ""),
                    "required": prop.get("required", False)
                }
                fields.append(field)
            
            logger.info(f"Successfully fetched {len(fields)} fields for object type {object_type}")
            return fields
        
        except Exception as e:
            logger.error(f"Error getting fields for object type {object_type}: {str(e)}")
            
            # Return fallback fields for error cases
            fallback_fields = [
                {"identifier": "firstname", "name": "First Name", "type": "string"},
                {"identifier": "lastname", "name": "Last Name", "type": "string"},
                {"identifier": "email", "name": "Email", "type": "string"},
                {"identifier": "phone", "name": "Phone Number", "type": "string"},
                {"identifier": "address", "name": "Address", "type": "string"},
                {"identifier": "company", "name": "Company Name", "type": "string"},
                {"identifier": "website", "name": "Website URL", "type": "string"},
                {"identifier": "description", "name": "Description", "type": "string"}
            ]
            
            # Filter based on object type
            if object_type == "contact":
                return [f for f in fallback_fields if f["identifier"] not in ["company", "website"]]
            elif object_type == "company":
                return [f for f in fallback_fields if f["identifier"] not in ["firstname", "lastname"]]
            else:
                return fallback_fields

def get_hubspot_service(access_token=None, client_secret=None, oauth_mode=False):
    """
    Factory function to create a HubSpot service instance
    
    Args:
        access_token (str, optional): HubSpot access token. Defaults to None.
        client_secret (str, optional): Client secret for OAuth flow. Defaults to None.
        oauth_mode (bool, optional): Whether to use OAuth authentication. Defaults to False.
        
    Returns:
        HubSpotService: Service instance
    """
    # If credentials are not provided, try to get from config
    if not access_token and current_app:
        if oauth_mode:
            access_token = current_app.config.get('HUBSPOT_ACCESS_TOKEN')
            client_secret = current_app.config.get('HUBSPOT_CLIENT_SECRET')
        else:
            access_token = current_app.config.get('HUBSPOT_API_KEY')
    
    return HubSpotService(access_token=access_token, client_secret=client_secret, oauth_mode=oauth_mode)
