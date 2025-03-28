import requests
import logging
import json

# Set up logging
logger = logging.getLogger(__name__)

def authenticate_with_credentials(tenant_id, email, password):
    """
    Authenticate with Alchemy using email/password
    """
    auth_url = "https://core-production.alchemy.cloud/core/api/v2/sign-in"
    
    try:
        logger.info(f"Authenticating with Alchemy for tenant: {tenant_id}")
        
        response = requests.post(
            auth_url,
            json={"email": email, "password": password},
            headers={"Content-Type": "application/json"}
        )
        
        logger.info(f"Authentication response status: {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"Authentication error: {response.text}")
            return None
            
        auth_data = response.json()
        
        # Find token for the specified tenant
        tenant_token = None
        for token in auth_data.get('tokens', []):
            if token.get('tenant') == tenant_id:
                tenant_token = token
                break
                
        if not tenant_token:
            logger.error(f"No token found for tenant {tenant_id}")
            return None
            
        # Extract access token
        access_token = tenant_token.get('token')
        if not access_token:
            logger.error("No access token found in response")
            return None
            
        logger.info(f"Successfully obtained access token for tenant {tenant_id}")
        return access_token
        
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        return None

def get_alchemy_record_types(access_token, tenant_id):
    """
    Fetch all record templates available in the tenant
    """
    url = "https://core-production.alchemy.cloud/core/api/v2/record-templates"
    headers = {"Authorization": f"Bearer {access_token}"}

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()

        return [
            {"identifier": item["identifier"], "name": item.get("displayName", item["identifier"])}
            for item in data
        ]
    except Exception as e:
        logger.error(f"Record type fetch error: {str(e)}")
        return []

def fetch_alchemy_fields(tenant_id, auth_info, record_type):
    """
    Pull fields for a given record type using the filter-records API
    Using direct authentication instead of refresh tokens
    """
    logger.info(f"Fetching fields for record type {record_type} in tenant {tenant_id}")
    
    # Check if auth_info is a refresh token or credentials
    access_token = None
    
    if isinstance(auth_info, dict) and 'email' in auth_info and 'password' in auth_info:
        # It's credentials
        logger.info("Using email/password for authentication")
        access_token = authenticate_with_credentials(tenant_id, auth_info['email'], auth_info['password'])
    else:
        # It's a refresh token (which we know doesn't work), so return error
        logger.error("Refresh token authentication is not supported")
        raise Exception("Authentication method not supported. Please use email/password authentication.")
    
    if not access_token:
        logger.error("Failed to obtain access token")
        raise Exception("Authentication failed: Could not obtain access token")
    
    # Then use the access token to fetch fields
    url = "https://core-production.alchemy.cloud/core/api/v2/filter-records"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    payload = {
        "queryTerm": "Result.Status == 'Valid'",
        "recordTemplateIdentifier": record_type,
        "drop": 0,
        "take": 1,
        "lastChangedOnFrom": "2021-03-03T00:00:00Z",
        "lastChangedOnTo": "2028-03-04T00:00:00Z"
    }

    try:
        logger.info(f"Making PUT request to {url} for record type {record_type}")
        
        response = requests.put(url, headers=headers, json=payload)
        
        logger.info(f"Filter-records API response status: {response.status_code}")
        
        if response.status_code != 200:
            error_msg = f"API error: {response.text}"
            logger.error(error_msg)
            raise Exception(error_msg)
        
        data = response.json()
        
        fields = []
        if data.get("records") and len(data["records"]) > 0:
            record = data["records"][0]
            
            if "fieldValues" in record:
                for field_id in record["fieldValues"].keys():
                    fields.append({"identifier": field_id, "name": field_id})
            
            if not fields:
                logger.warning(f"No field values found in the record for {record_type}")
                raise Exception(f"No fields found for record type: {record_type}")
        else:
            logger.warning(f"No records found for record type {record_type}")
            raise Exception(f"No records found for record type: {record_type}")
        
        return fields
    except Exception as e:
        logger.error(f"Error fetching fields: {str(e)}")
        raise
