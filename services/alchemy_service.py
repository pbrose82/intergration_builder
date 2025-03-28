import requests
import logging
import json

# Set up logger
logger = logging.getLogger(__name__)

def get_alchemy_access_token(refresh_token, tenant_id):
    """Get access token from refresh token using the working method from scanner app"""
    # Use the working API endpoint from the scanner
    refresh_url = "https://core-production.alchemy.cloud/core/api/v2/refresh-token"
    
    # Mask token for logging
    masked_token = refresh_token[:5] + "..." if refresh_token and len(refresh_token) > 5 else "None"
    logger.info(f"Attempting to get access token for tenant {tenant_id} with refresh token {masked_token}")
    
    try:
        # Use PUT with JSON payload (matching scanner implementation)
        response = requests.put(
            refresh_url, 
            json={"refreshToken": refresh_token},
            headers={"Content-Type": "application/json"}
        )
        
        logger.info(f"Token response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Process tokens array to find matching tenant
            if "tokens" in data and isinstance(data["tokens"], list):
                tenant_token = next((token for token in data["tokens"] 
                                    if token.get("tenant") == tenant_id), None)
                
                if tenant_token:
                    logger.info(f"Found token for tenant {tenant_id}")
                    return tenant_token.get("accessToken")
                else:
                    # Log available tenants for debugging
                    available_tenants = [t.get("tenant") for t in data.get("tokens", [])]
                    logger.error(f"Tenant {tenant_id} not found in response. Available tenants: {available_tenants}")
            else:
                logger.error("No tokens array in response or invalid format")
                
            return None
        else:
            # Log the error response
            try:
                error_data = response.json()
                logger.error(f"Token error response: {json.dumps(error_data)}")
            except:
                logger.error(f"Token error response: {response.text}")
            return None
    except Exception as e:
        logger.error(f"Exception getting access token: {str(e)}")
        return None

def get_alchemy_record_types(access_token, tenant_id):
    """Get record types with detailed logging"""
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    url = "https://core-production.alchemy.cloud/core/api/v2/record-templates"
    
    logger.info(f"Fetching record types from {url}")
    
    try:
        response = requests.get(url, headers=headers)
        logger.info(f"Record types response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            record_types = [{"identifier": rt["identifier"], "name": rt.get("displayName", rt.get("name", rt["identifier"]))} for rt in data]
            logger.info(f"Successfully fetched {len(record_types)} record types")
            return record_types
        else:
            # Log the error response
            try:
                error_data = response.json()
                logger.error(f"Record types error response: {json.dumps(error_data)}")
            except:
                logger.error(f"Record types error response: {response.text}")
            return []
    except Exception as e:
        logger.error(f"Exception getting record types: {str(e)}")
        return []

def fetch_alchemy_fields(tenant_id, refresh_token, record_type):
    """Fetch fields for record type with improved authentication method"""
    logger.info(f"Starting field fetch for record type '{record_type}' in tenant '{tenant_id}'")
    
    # Fallback fields to return in case of errors
    fallback_fields = [
        {"identifier": "Name", "name": "Name"},
        {"identifier": "Description", "name": "Description"},
        {"identifier": "Status", "name": "Status"},
        {"identifier": "ExternalId", "name": "External ID"}
    ]
    
    # Get access token using the improved method
    access_token = get_alchemy_access_token(refresh_token, tenant_id)
    
    if not access_token:
        logger.error(f"Failed to get access token for tenant {tenant_id}")
        return fallback_fields
    
    # Now fetch the fields using the access token
    try:
        base_url = "https://core-production.alchemy.cloud"
        
        # Log token info (masked)
        logger.info(f"Access token: {access_token[:5]}...")
        
        # Now fetch the fields
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        body = {
            "queryTerm": "Result.Status == 'Valid'",
            "recordTemplateIdentifier": record_type,
            "drop": 0,
            "take": 1,  # We only need one record to get the fields
            "lastChangedOnFrom": "2021-03-03T00:00:00Z",
            "lastChangedOnTo": "2028-03-04T00:00:00Z"
        }
        
        filter_url = f"{base_url}/core/api/v2/filter-records"
        logger.info(f"Fetching fields from {filter_url} with payload: {json.dumps(body)}")
        
        response = requests.put(
            filter_url,
            headers=headers,
            json=body
        )
        
        logger.info(f"Fields response status: {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"Failed to get fields: {response.text}")
            return fallback_fields
            
        records_data = response.json()
        
        # Log the response structure for debugging
        logger.info(f"Response keys: {list(records_data.keys())}")
        logger.info(f"Records count: {len(records_data.get('records', []))}")
        
        if not records_data.get("records"):
            logger.warning(f"No records found for type {record_type}")
            return fallback_fields
            
        # Get the first record to extract fields
        first_record = records_data["records"][0]
        
        # Log record structure
        record_keys = list(first_record.keys())
        logger.info(f"Record structure - keys: {record_keys}")
        
        # Check for fieldValues
        if "fieldValues" not in first_record:
            logger.warning("No fieldValues in record, looking for alternative structure")
            return fallback_fields
            
        field_values = first_record.get("fieldValues", {})
        
        # Check if there are field values
        if not field_values:
            logger.warning("Empty fieldValues object")
            return fallback_fields
            
        # Log field structure
        field_keys = list(field_values.keys())
        logger.info(f"Found {len(field_keys)} fields: {field_keys[:10]}")
        
        # Create the list of fields to return
        fields = [{"identifier": f, "name": f} for f in field_keys]
        logger.info(f"Returning {len(fields)} fields")
        
        return fields
        
    except Exception as e:
        logger.error(f"Exception fetching fields: {str(e)}")
        return fallback_fields
