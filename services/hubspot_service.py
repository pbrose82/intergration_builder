"""
HubSpot API integration service
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
    def __init__(self, api_key=None):
        self.api_key = api_key
        self.base_url = "https://api.hubapi.com"
    
    def validate_credentials(self):
        """
        Validate HubSpot API key by making a simple request
        
        Returns:
            bool: True if valid, False otherwise
        """
        try:
            # Use the /integrations/v1/me API endpoint to validate credentials
            url = f"{self.base_url}/integrations/v1/me"
            headers = {
                "Authorization": f"Bearer {self.api_key}"
            }
            
            logger.info(f"Validating HubSpot credentials")
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                logger.info("HubSpot credentials are valid")
                return True, "Credentials validated successfully"
            else:
                error_msg = f"Invalid credentials: {response.status_code}"
                if response.text:
                    try:
                        error_detail = response.json()
                        error_msg = f"{error_msg} - {error_detail.get('message', '')}"
                    except:
                        error_msg = f"{error_msg} - {response.text}"
                        
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
            
            # Optionally fetch custom objects for Enterprise accounts
            try:
                url = f"{self.base_url}/crm/v3/schemas"
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                
                response = requests.get(url, headers=headers)
                
                if response.status_code == 200:
                    custom_objects = response.json().get("results", [])
                    for obj in custom_objects:
                        if obj.get("objectTypeId") not in [o["id"] for o in standard_objects]:
                            standard_objects.append({
                                "id": obj.get("objectTypeId"),
                                "name": obj.get("labels", {}).get("singular", obj.get("objectTypeId")),
                                "description": "Custom object"
                            })
            except Exception as e:
                logger.warning(f"Could not fetch custom objects: {str(e)}")
            
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
            
            # Use the appropriate endpoint based on object type
            if object_type in ["contact", "company", "deal", "ticket", "product"]:
                url = f"{self.base_url}/crm/v3/properties/{object_type}"
            else:
                # For custom objects
                url = f"{self.base_url}/crm/v3/properties/{object_type}"
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(url, headers=headers)
            
            if response.status_code != 200:
                logger.error(f"Error fetching fields: {response.status_code} - {response.text}")
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

def get_hubspot_service(api_key=None):
    """
    Factory function to create a HubSpot service instance
    
    Args:
        api_key (str, optional): HubSpot API key. Defaults to None.
        
    Returns:
        HubSpotService: Service instance
    """
    # If API key is not provided, try to get from config
    if not api_key and current_app:
        api_key = current_app.config.get('HUBSPOT_API_KEY')
    
    return HubSpotService(api_key=api_key)
