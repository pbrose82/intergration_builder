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
    
    def get_records(self, object_type, limit=100, properties=None, after=None):
        """
        Get records from HubSpot for a given object type
        
        Args:
            object_type (str): The object type to get records for (e.g., contact, company)
            limit (int, optional): Maximum number of records to return. Defaults to 100.
            properties (list, optional): List of property names to include. Defaults to None (all properties).
            after (str, optional): Pagination cursor. Defaults to None.
            
        Returns:
            dict: Result containing records and pagination info
        """
        try:
            logger.info(f"Fetching {limit} records for HubSpot object type: {object_type}")
            
            # Normalize token - remove any whitespace
            token = self.access_token.strip() if self.access_token else ""
            
            if not token:
                logger.error("No access token provided for fetching records")
                return {
                    "results": [],
                    "paging": None,
                    "error": "No access token provided"
                }
            
            # Use the CRM API endpoint
            url = f"{self.base_url}/crm/v3/objects/{object_type}"
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            params = {
                "limit": min(limit, 100)  # HubSpot API limit is 100 per page
            }
            
            # Add properties if specified
            if properties:
                params["properties"] = properties
                
            # Add pagination cursor if specified
            if after:
                params["after"] = after
            
            response = requests.get(url, headers=headers, params=params)
            
            if response.status_code != 200:
                logger.error(f"Error fetching records: {response.status_code} - {response.text[:100]}")
                return {
                    "results": [],
                    "paging": None,
                    "error": f"Error {response.status_code}: {response.text[:100]}"
                }
            
            # Parse the response
            data = response.json()
            
            # Extract records and pagination info
            results = data.get("results", [])
            paging = data.get("paging", None)
            
            logger.info(f"Successfully fetched {len(results)} records for object type {object_type}")
            
            return {
                "results": results,
                "paging": paging,
                "error": None
            }
        
        except Exception as e:
            logger.error(f"Error getting records for object type {object_type}: {str(e)}")
            return {
                "results": [],
                "paging": None,
                "error": f"Error: {str(e)}"
            }
    
    def create_record(self, object_type, properties):
        """
        Create a new record in HubSpot
        
        Args:
            object_type (str): The object type to create (e.g., contact, company)
            properties (dict): Properties for the new record
            
        Returns:
            dict: Created record or error
        """
        try:
            logger.info(f"Creating new {object_type} in HubSpot")
            
            # Normalize token - remove any whitespace
            token = self.access_token.strip() if self.access_token else ""
            
            if not token:
                logger.error("No access token provided for creating record")
                return {
                    "success": False,
                    "error": "No access token provided"
                }
            
            # Use the CRM API endpoint
            url = f"{self.base_url}/crm/v3/objects/{object_type}"
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            # Prepare data
            data = {
                "properties": properties
            }
            
            response = requests.post(url, headers=headers, json=data)
            
            if response.status_code not in [200, 201]:
                logger.error(f"Error creating record: {response.status_code} - {response.text[:100]}")
                return {
                    "success": False,
                    "error": f"Error {response.status_code}: {response.text[:100]}"
                }
            
            # Parse the response
            record = response.json()
            
            logger.info(f"Successfully created {object_type} with ID: {record.get('id')}")
            
            return {
                "success": True,
                "record": record,
                "error": None
            }
        
        except Exception as e:
            logger.error(f"Error creating {object_type}: {str(e)}")
            return {
                "success": False,
                "error": f"Error: {str(e)}"
            }
    
    def update_record(self, object_type, record_id, properties):
        """
        Update an existing record in HubSpot
        
        Args:
            object_type (str): The object type to update (e.g., contact, company)
            record_id (str): The ID of the record to update
            properties (dict): Properties to update
            
        Returns:
            dict: Updated record or error
        """
        try:
            logger.info(f"Updating {object_type} with ID {record_id} in HubSpot")
            
            # Normalize token - remove any whitespace
            token = self.access_token.strip() if self.access_token else ""
            
            if not token:
                logger.error("No access token provided for updating record")
                return {
                    "success": False,
                    "error": "No access token provided"
                }
            
            # Use the CRM API endpoint
            url = f"{self.base_url}/crm/v3/objects/{object_type}/{record_id}"
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            # Prepare data
            data = {
                "properties": properties
            }
            
            response = requests.patch(url, headers=headers, json=data)
            
            if response.status_code != 200:
                logger.error(f"Error updating record: {response.status_code} - {response.text[:100]}")
                return {
                    "success": False,
                    "error": f"Error {response.status_code}: {response.text[:100]}"
                }
            
            # Parse the response
            record = response.json()
            
            logger.info(f"Successfully updated {object_type} with ID: {record_id}")
            
            return {
                "success": True,
                "record": record,
                "error": None
            }
        
        except Exception as e:
            logger.error(f"Error updating {object_type} {record_id}: {str(e)}")
            return {
                "success": False,
                "error": f"Error: {str(e)}"
            }
    
    def search_records(self, object_type, filter_groups=None, sorts=None, properties=None, limit=100, after=None):
        """
        Search for records in HubSpot with filtering
        
        Args:
            object_type (str): The object type to search (e.g., contact, company)
            filter_groups (list, optional): Filter groups for the search. Defaults to None.
            sorts (list, optional): Sort criteria for the search. Defaults to None.
            properties (list, optional): List of property names to include. Defaults to None (all properties).
            limit (int, optional): Maximum number of records to return. Defaults to 100.
            after (str, optional): Pagination cursor. Defaults to None.
            
        Returns:
            dict: Result containing records and pagination info
        """
        try:
            logger.info(f"Searching {object_type} in HubSpot")
            
            # Normalize token - remove any whitespace
            token = self.access_token.strip() if self.access_token else ""
            
            if not token:
                logger.error("No access token provided for searching records")
                return {
                    "results": [],
                    "paging": None,
                    "error": "No access token provided"
                }
            
            # Use the CRM API search endpoint
            url = f"{self.base_url}/crm/v3/objects/{object_type}/search"
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            # Prepare search request
            search_request = {
                "limit": min(limit, 100)  # HubSpot API limit is 100 per page
            }
            
            # Add filter groups if specified
            if filter_groups:
                search_request["filterGroups"] = filter_groups
                
            # Add sorts if specified
            if sorts:
                search_request["sorts"] = sorts
                
            # Add properties if specified
            if properties:
                search_request["properties"] = properties
                
            # Add pagination cursor if specified
            if after:
                search_request["after"] = after
            
            response = requests.post(url, headers=headers, json=search_request)
            
            if response.status_code != 200:
                logger.error(f"Error searching records: {response.status_code} - {response.text[:100]}")
                return {
                    "results": [],
                    "paging": None,
                    "error": f"Error {response.status_code}: {response.text[:100]}"
                }
            
            # Parse the response
            data = response.json()
            
            # Extract records and pagination info
            results = data.get("results", [])
            paging = data.get("paging", None)
            
            logger.info(f"Search returned {len(results)} {object_type} records")
            
            return {
                "results": results,
                "paging": paging,
                "error": None
            }
        
        except Exception as e:
            logger.error(f"Error searching {object_type}: {str(e)}")
            return {
                "results": [],
                "paging": None,
                "error": f"Error: {str(e)}"
            }

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
