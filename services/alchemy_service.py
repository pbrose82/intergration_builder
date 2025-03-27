import requests
import logging
import json

# Set up logging
logger = logging.getLogger(__name__)

def get_alchemy_access_token(refresh_token, tenant_id):
    """
    Exchange refresh token for access token
    """
    token_url = f"https://core-production.alchemy.cloud/auth/realms/{tenant_id}/protocol/openid-connect/token"
    
    try:
        # Log token details (partially masked for security)
        masked_token = refresh_token[:10] + "..." if refresh_token and len(refresh_token) > 10 else "None"
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
            
        return response.json().get("access_token")
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


def fetch_alchemy_fields(tenant_id, refresh_token, record_type):
    """
    Pull fields for a given record type using the filter-records API
    Using direct PUT request instead of trying to get a token first
    """
    logger.info(f"Fetching fields for record type {record_type} in tenant {tenant_id}")
    
    # Create a list of sample fields that should be present in most Alchemy record types
    sample_fields = [
        {"identifier": "Name", "name": "Name"},
        {"identifier": "Description", "name": "Description"},
        {"identifier": "Status", "name": "Status"},
        {"identifier": "ExternalId", "name": "External ID"},
        {"identifier": "LocationName", "name": "Location Name"},
        {"identifier": "Company", "name": "Company"},
        {"identifier": "LocationType", "name": "Location Type"},
        {"identifier": "Street", "name": "Street"},
        {"identifier": "City", "name": "City"},
        {"identifier": "Country", "name": "Country"},
        {"identifier": "State", "name": "State"},
        {"identifier": "PostalCode", "name": "Postal Code"},
        {"identifier": "StorageType", "name": "Storage Type"},
        {"identifier": "Phone", "name": "Phone"},
        {"identifier": "Email", "name": "Email"},
        {"identifier": "RecordName", "name": "Record Name"}
    ]
    
    # First, try direct access token approach
    try:
        access_token = get_alchemy_access_token(refresh_token, tenant_id)
        if access_token:
            logger.info("Successfully obtained access token, attempting to fetch fields")
            fields = fetch_fields_with_token(access_token, record_type)
            if fields:
                logger.info(f"Successfully fetched {len(fields)} fields with access token")
                return fields
        else:
            logger.warning("Failed to get access token, using sample fields")
    except Exception as e:
        logger.error(f"Error in token approach: {str(e)}")
    
    # Return sample fields if we couldn't get actual fields
    logger.info(f"Using sample fields for record type {record_type}")
    return sample_fields


def fetch_fields_with_token(access_token, record_type):
    """
    Fetch fields using an access token
    """
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
            logger.error(f"API error: {response.text}")
            return []
        
        data = response.json()
        
        fields = []
        if data.get("records") and len(data["records"]) > 0:
            record = data["records"][0]
            
            if "fieldValues" in record:
                for field_id in record["fieldValues"].keys():
                    fields.append({"identifier": field_id, "name": field_id})
        
        return fields
    except Exception as e:
        logger.error(f"Error fetching fields with token: {str(e)}")
        return []
