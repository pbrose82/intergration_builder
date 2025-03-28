import requests
import logging

# Set up logging
logger = logging.getLogger(__name__)

def get_alchemy_access_token(refresh_token, tenant_id):
    """
    Exchange refresh token for access token
    """
    token_url = f"https://core-production.alchemy.cloud/auth/realms/{tenant_id}/protocol/openid-connect/token"
    
    try:
        # Log token details (partially masked for security)
        masked_token = refresh_token[:5] + "..." if refresh_token and len(refresh_token) > 5 else "None"
        logger.info(f"Attempting to get access token for tenant {tenant_id} with refresh token starting with: {masked_token}")
        
        response = requests.post(token_url, data={
            "grant_type": "refresh_token",
            "client_id": "alchemy-web-client",
            "refresh_token": refresh_token
        })

        logger.info(f"Token response status: {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"Token error response: {response.text}")
            return None
            
        token_data = response.json()
        access_token = token_data.get("access_token")
        logger.info(f"Successfully obtained access token")
        
        return access_token
    except Exception as e:
        logger.error(f"Access token error: {str(e)}")
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


def authenticate_direct(tenant_id, email, password):
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


def fetch_alchemy_fields(tenant_id, refresh_token, record_type):
    """
    Pull fields for a given record type using the filter-records API
    This function tries both auth methods - first refresh token, then direct auth if credentials available
    """
    logger.info(f"Fetching fields for record type {record_type} in tenant {tenant_id}")
    
    # First try refresh token if it's a normal token (not "session")
    access_token = None
    if refresh_token != "session":
        access_token = get_alchemy_access_token(refresh_token, tenant_id)
    
    # If no access token and we have credentials in session, try direct auth
    if not access_token and refresh_token == "session":
        try:
            from flask import session
            if session and 'alchemy_credentials' in session and tenant_id in session['alchemy_credentials']:
                credentials = session['alchemy_credentials'][tenant_id]
                email = credentials.get('email')
                password = credentials.get('password')
                logger.info(f"Using credentials from session for direct authentication")
                access_token = authenticate_direct(tenant_id, email, password)
        except Exception as e:
            logger.error(f"Error using session credentials: {str(e)}")
    
    # If we still don't have a token, raise an error
    if not access_token:
        logger.error("Failed to obtain access token")
        raise Exception("Authentication failed: Could not obtain access token")
    
    # Use the access token to fetch fields
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
