import requests
import logging
import json
import traceback

# Set up logger
logger = logging.getLogger(__name__)

def get_alchemy_access_token(refresh_token, tenant_id):
    """Get access token from refresh token using the working method from scanner app"""
    # Use the working API endpoint
    refresh_url = "https://core-production.alchemy.cloud/core/api/v2/refresh-token"
    
    # Mask token for logging
    masked_token = refresh_token[:5] + "..." if refresh_token and len(refresh_token) > 5 else "None"
    logger.info(f"Attempting to get access token for tenant {tenant_id} with refresh token {masked_token}")
    
    try:
        # Use PUT with JSON payload
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
                    access_token = tenant_token.get("accessToken")
                    # Log success with masked token
                    masked_access = access_token[:5] + "..." if access_token and len(access_token) > 5 else "None"
                    logger.info(f"Access token obtained successfully: {masked_access}")
                    return access_token
                else:
                    # Log available tenants for debugging
                    available_tenants = [t.get("tenant") for t in data.get("tokens", [])]
                    logger.error(f"Tenant {tenant_id} not found in response. Available tenants: {available_tenants}")
            else:
                logger.error("No tokens array in response or invalid format")
                try:
                    logger.error(f"Response content: {json.dumps(data)}")
                except:
                    logger.error(f"Response content (not JSON): {data}")
                
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
        logger.error(traceback.format_exc())
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
        logger.error(traceback.format_exc())
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
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        # First try the record-templates endpoint to get fields metadata
        try:
            templates_url = "https://core-production.alchemy.cloud/core/api/v2/record-templates"
            logger.info(f"Fetching templates from {templates_url}")
            
            templates_response = requests.get(templates_url, headers=headers)
            
            if templates_response.status_code == 200:
                templates_data = templates_response.json()
                
                # Find the matching template
                template = next((t for t in templates_data if t.get("identifier") == record_type), None)
                
                if template and "fields" in template:
                    template_fields = template.get("fields", [])
                    
                    if template_fields:
                        logger.info(f"Found {len(template_fields)} fields in template metadata")
                        return [{"identifier": f.get("identifier"), "name": f.get("displayName", f.get("name", f.get("identifier")))} 
                                for f in template_fields]
            
            logger.warning("Could not get fields from templates, trying filter-records endpoint")
        except Exception as template_error:
            logger.error(f"Error getting template metadata: {str(template_error)}")
        
        # If template approach fails, try using filter-records
        body = {
            "queryTerm": "Result.Status == 'Valid'",
            "recordTemplateIdentifier": record_type,
            "drop": 0,
            "take": 1,
            "lastChangedOnFrom": "2021-03-03T00:00:00Z",
            "lastChangedOnTo": "2028-03-04T00:00:00Z"
        }
        
        filter_url = "https://core-production.alchemy.cloud/core/api/v2/filter-records"
        logger.info(f"Fetching fields from {filter_url} with payload: {json.dumps(body)}")
        
        response = requests.put(filter_url, headers=headers, json=body)
        
        logger.info(f"Fields response status: {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"Failed to get fields: {response.text}")
            return fallback_fields
            
        data = response.json()
        
        # Check if we have records
        if isinstance(data, list) and len(data) > 0 and "fields" in data[0]:
            # Extract fields from the first record
            record_fields = data[0].get("fields", [])
            
            if record_fields:
                fields = []
                for field in record_fields:
                    if "identifier" in field:
                        fields.append({
                            "identifier": field["identifier"],
                            "name": field.get("displayName", field.get("name", field["identifier"]))
                        })
                
                logger.info(f"Successfully extracted {len(fields)} fields from response")
                return fields
        
        # Check for fieldValues instead of fields
        elif isinstance(data, list) and len(data) > 0 and "fieldValues" in data[0]:
            # Extract field keys from the first record
            field_values = data[0].get("fieldValues", {})
            
            if field_values:
                fields = []
                for key in field_values.keys():
                    fields.append({
                        "identifier": key,
                        "name": key
                    })
                
                logger.info(f"Successfully extracted {len(fields)} fields from fieldValues")
                return fields
        
        logger.warning("No fields found in API response, returning fallback fields")
        return fallback_fields
        
    except Exception as e:
        logger.error(f"Exception fetching fields: {str(e)}")
        logger.error(traceback.format_exc())
        return fallback_fields
