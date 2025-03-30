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
            tuple: (bool, str) indicating success and message
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
            logger.info("Getting HubSpot object types")
            
            # HubSpot has standard objects we can use to start with
            standard_objects = [
                {"id": "contact", "name": "Contact", "description": "Store and manage contact details"},
                {"id": "company", "name": "Company", "description": "Store and manage company information"},
                {"id": "deal", "name": "Deal", "description": "Track sales opportunities"},
                {"id": "ticket", "name": "Ticket", "description": "Track customer support requests"},
                {"id": "product", "name": "Product", "description": "Store product information"}
            ]
            
            # Log that we're using the hardcoded standard objects
            logger.info(f"Returning {len(standard_objects)} standard object types")
            
            # Add additional debugging
            debug_token = self.access_token[:5] + "..." if self.access_token and len(self.access_token) > 5 else "None"
            logger.debug(f"Using access token starting with: {debug_token}")
            logger.debug(f"OAuth mode: {self.oauth_mode}")
            
            # Return the standard objects - this ensures we always have some objects even if API call fails
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
            
            # Return fallback fields for error cases based on object type
            fallback_fields = self.get_fallback_fields(object_type)
            logger.info(f"Using {len(fallback_fields)} fallback fields for {object_type}")
            return fallback_fields
    
    def get_fallback_fields(self, object_type):
        """Get fallback fields for different object types"""
        # Common fields for all object types
        common_fields = [
            {"identifier": "id", "name": "ID", "type": "string", "required": True},
            {"identifier": "name", "name": "Name", "type": "string", "required": False},
            {"identifier": "description", "name": "Description", "type": "string", "required": False},
            {"identifier": "createdate", "name": "Create Date", "type": "date", "required": False},
            {"identifier": "lastmodifieddate", "name": "Last Modified Date", "type": "date", "required": False}
        ]
        
        # Object-specific fields
        if object_type == "contact":
            return common_fields + [
                {"identifier": "firstname", "name": "First Name", "type": "string", "required": False},
                {"identifier": "lastname", "name": "Last Name", "type": "string", "required": False},
                {"identifier": "email", "name": "Email", "type": "string", "required": False},
                {"identifier": "phone", "name": "Phone Number", "type": "string", "required": False},
                {"identifier": "company", "name": "Company", "type": "string", "required": False},
                {"identifier": "jobtitle", "name": "Job Title", "type": "string", "required": False},
                {"identifier": "address", "name": "Address", "type": "string", "required": False}
            ]
        elif object_type == "company":
            return common_fields + [
                {"identifier": "domain", "name": "Website Domain", "type": "string", "required": False},
                {"identifier": "phone", "name": "Phone Number", "type": "string", "required": False},
                {"identifier": "address", "name": "Address", "type": "string", "required": False},
                {"identifier": "city", "name": "City", "type": "string", "required": False},
                {"identifier": "state", "name": "State/Region", "type": "string", "required": False},
                {"identifier": "country", "name": "Country", "type": "string", "required": False},
                {"identifier": "industry", "name": "Industry", "type": "string", "required": False}
            ]
        elif object_type == "deal":
            return common_fields + [
                {"identifier": "amount", "name": "Amount", "type": "number", "required": False},
                {"identifier": "dealstage", "name": "Deal Stage", "type": "string", "required": False},
                {"identifier": "pipeline", "name": "Pipeline", "type": "string", "required": False},
                {"identifier": "closedate", "name": "Close Date", "type": "date", "required": False},
                {"identifier": "dealtype", "name": "Deal Type", "type": "string", "required": False}
            ]
        elif object_type == "ticket":
            return common_fields + [
                {"identifier": "subject", "name": "Subject", "type": "string", "required": False},
                {"identifier": "content", "name": "Content", "type": "string", "required": False},
                {"identifier": "priority", "name": "Priority", "type": "string", "required": False},
                {"identifier": "status", "name": "Status", "type": "string", "required": False},
                {"identifier": "source", "name": "Source", "type": "string", "required": False}
            ]
        elif object_type == "product":
            return common_fields + [
                {"identifier": "price", "name": "Price", "type": "number", "required": False},
                {"identifier": "sku", "name": "SKU", "type": "string", "required": False},
                {"identifier": "producttype", "name": "Product Type", "type": "string", "required": False},
                {"identifier": "brand", "name": "Brand", "type": "string", "required": False},
                {"identifier": "categories", "name": "Categories", "type": "string", "required": False}
            ]
        else:
            # Generic fallback for custom objects
            return common_fields + [
                {"identifier": "custom_field1", "name": "Custom Field 1", "type": "string", "required": False},
                {"identifier": "custom_field2", "name": "Custom Field 2", "type": "string", "required": False},
                {"identifier": "custom_field3", "name": "Custom Field 3", "type": "string", "required": False}
            ]

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
