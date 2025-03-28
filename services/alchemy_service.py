import requests
import logging
import json
from datetime import datetime, timedelta
import time

# Set up logging
logger = logging.getLogger(__name__)

class AlchemyTokenManager:
    """
    Helper class to manage Alchemy tokens with caching
    """
    def __init__(self):
        self.token_cache = {}  # Format: {tenant_id: {'access_token': token, 'expires_at': time}}
    
    def get_cached_token(self, tenant_id):
        """
        Get a cached access token if it exists and is valid
        """
        if tenant_id in self.token_cache:
            cache_entry = self.token_cache[tenant_id]
            # Check if token is still valid (with 30 second buffer)
            if datetime.now() < cache_entry['expires_at'] - timedelta(seconds=30):
                logger.info(f"Using cached access token for tenant {tenant_id}")
                return cache_entry['access_token']
        
        return None
    
    def cache_token(self, tenant_id, access_token, expires_in):
        """
        Store a token in the cache with its expiration time
        """
        # Convert expires_in (seconds) to an actual datetime
        expires_at = datetime.now() + timedelta(seconds=int(expires_in))
        
        self.token_cache[tenant_id] = {
            'access_token': access_token,
            'expires_at': expires_at
        }
        
        logger.info(f"Cached access token for tenant {tenant_id}, expires in {expires_in} seconds")

# Create a global token manager instance
token_manager = AlchemyTokenManager()

def get_alchemy_access_token(refresh_token, tenant_id, force_refresh=False):
    """
    Exchange refresh token for access token with caching
    
    Args:
        refresh_token (str): The refresh token
        tenant_id (str): The tenant identifier
        force_refresh (bool): Whether to force a new token even if cached
        
    Returns:
        str: The access token if successful, None otherwise
    """
    # Check cache first unless forced refresh
    if not force_refresh:
        cached_token = token_manager.get_cached_token(tenant_id)
        if cached_token:
            return cached_token
    
    token_url = f"https://core-production.alchemy.cloud/auth/realms/{tenant_id}/protocol/openid-connect/token"
    
    try:
        # Log token details (masked for security)
        masked_token = refresh_token[:5] + "..." if refresh_token and len(refresh_token) > 5 else "None"
        logger.info(f"Getting fresh access token for tenant {tenant_id} with refresh token starting with: {masked_token}")
        
        # Prepare the request payload
        payload = {
            "grant_type": "refresh_token",
            "client_id": "alchemy-web-client",
            "refresh_token": refresh_token
        }
        
        response = requests.post(token_url, data=payload, timeout=10)
        
        logger.info(f"Token response status: {response.status_code}")
        
        if response.status_code == 200:
            # Success - parse the token
            token_data = response.json()
            access_token = token_data.get("access_token")
            expires_in = token_data.get("expires_in", 300)  # Default to 5 minutes
            
            if access_token:
                # Cache the token
                token_manager.cache_token(tenant_id, access_token, expires_in)
                logger.info(f"Successfully obtained access token")
                return access_token
            else:
                logger.error("No access token in response")
                return None
        else:
            # Other error
            error_message = "Unknown error"
            try:
                error_data = response.json()
                error_message = error_data.get("error_description", error_data.get("error", "Unknown error"))
            except:
                error_message = response.text or "Unknown error"
            
            logger.error(f"Token error response: {error_message}")
            return None
    except Exception as e:
        logger.error(f"Access token error: {str(e)}")
        return None


def get_alchemy_record_types(access_token, tenant_id):
    """
    Fetch all record templates available in the tenant
    
    Args:
        access_token (str): The access token
        tenant_id (str): The tenant identifier
        
    Returns:
        list: List of record type objects with identifier and name
    """
    url = "https://core-production.alchemy.cloud/core/api/v2/record-templates"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json"
    }

    try:
        response = requests.get(url, headers=headers, timeout=15)
        
        if response.status_code != 200:
            logger.error(f"Record type fetch error: {response.status_code} - {response.text}")
            return []
        
        data = response.json()
        
        # Transform the response to the expected format
        record_types = [
            {"identifier": item["identifier"], 
             "name": item.get("displayName", item.get("name", item["identifier"]))}
            for item in data
        ]
        
        logger.info(f"Successfully fetched {len(record_types)} record types")
        return record_types
            
    except Exception as e:
        logger.error(f"Record type fetch error: {str(e)}")
        return []


def fetch_alchemy_fields(tenant_id, refresh_token, record_type, direct_access_token=None):
    """
    Pull fields for a given record type using the filter-records API
    
    Args:
        tenant_id (str): The tenant identifier
        refresh_token (str): The refresh token or "session" if using session auth
        record_type (str): The record type identifier
        direct_access_token (str, optional): Optional direct access token to use
        
    Returns:
        list: List of field objects with identifier and name
    """
    logger.info(f"Starting field fetch for record type '{record_type}' in tenant '{tenant_id}'")
    
    # Get access token (either use provided or get a new one)
    access_token = direct_access_token
    if not access_token:
        access_token = get_alchemy_access_token(refresh_token, tenant_id)
    
    if not access_token:
        logger.error("Failed to obtain access token")
        # Return sample fields instead of failing
        return [
            {"identifier": "Name", "name": "Name"},
            {"identifier": "Description", "name": "Description"},
            {"identifier": "Status", "name": "Status"},
            {"identifier": "ExternalId", "name": "External ID"}
        ]
    
    # Then use the access token to fetch fields
    url = "https://core-production.alchemy.cloud/core/api/v2/filter-records"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    # Define a more robust query payload
    payload = {
        "queryTerm": "Result.Status == 'Valid'",  # Generic filter that should work for most records
        "recordTemplateIdentifier": record_type,
        "drop": 0,
        "take": 1,  # We only need one record to extract field schema
        "lastChangedOnFrom": "2021-03-03T00:00:00Z",
        "lastChangedOnTo": "2028-03-04T00:00:00Z"  # Far future date to ensure we get something
    }

    # Add catch-all fallback fields in case extraction fails
    fallback_fields = [
        {"identifier": "Name", "name": "Name"},
        {"identifier": "Description", "name": "Description"},
        {"identifier": "Status", "name": "Status"},
        {"identifier": "ExternalId", "name": "External ID"}
    ]

    try:
        response = requests.put(url, headers=headers, json=payload, timeout=20)
        
        logger.info(f"Filter-records API response status: {response.status_code}")
        
        if response.status_code != 200:
            # Return fallback fields
            logger.info("Returning fallback fields due to API error")
            return fallback_fields
        
        # Parse the response
        try:
            data = response.json()
            
            # Log the number of records found
            records_count = len(data.get("records", []))
            
            # No records found
            if records_count == 0:
                logger.warning(f"No records found for record type '{record_type}', returning fallback fields")
                return fallback_fields
            
            # Process the first record to extract fields
            first_record = data["records"][0]
            
            fields = []
            
            # Extract fields from different possible structures
            
            # 1. Try fieldValues first (most common)
            if "fieldValues" in first_record and first_record["fieldValues"]:
                field_values = first_record["fieldValues"]
                
                for field_id, field_value in field_values.items():
                    # Extract display name if available, otherwise use identifier
                    display_name = field_id
                    
                    # If field_value is a dict with a displayName, use that
                    if isinstance(field_value, dict) and "displayName" in field_value:
                        display_name = field_value["displayName"]
                    
                    fields.append({"identifier": field_id, "name": display_name})
            
            # 2. Try fields array next
            elif "fields" in first_record and isinstance(first_record["fields"], list):
                
                for field in first_record["fields"]:
                    if isinstance(field, dict) and "identifier" in field:
                        field_id = field["identifier"]
                        display_name = field.get("displayName", field_id)
                        fields.append({"identifier": field_id, "name": display_name})
            
            # 3. For raw record structure, use top-level keys (less common)
            elif not fields:
                # Skip some known metadata fields
                skip_fields = ["id", "recordId", "recordTemplateId", "createdOn", "lastChangedOn"]
                
                for field_id in first_record.keys():
                    if field_id not in skip_fields:
                        fields.append({"identifier": field_id, "name": field_id})
            
            # If we found fields, return them
            if fields:
                logger.info(f"Successfully extracted {len(fields)} fields")
                return fields
            else:
                logger.warning("No fields could be extracted, returning fallback fields")
                return fallback_fields
                
        except Exception as json_error:
            logger.error(f"Error processing response: {str(json_error)}")
            return fallback_fields
            
    except Exception as e:
        logger.error(f"Error fetching fields: {str(e)}")
        return fallback_fields
