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
        response = requests.post(token_url, data={
            "grant_type": "refresh_token",
            "client_id": "alchemy-web-client",
            "refresh_token": refresh_token
        })

        response.raise_for_status()
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
    """
    logger.info(f"Fetching fields for record type {record_type} in tenant {tenant_id}")
    
    # First, get an access token using the refresh token
    try:
        access_token = get_alchemy_access_token(refresh_token, tenant_id)
        if not access_token:
            logger.error("Failed to obtain access token")
            return []
    except Exception as e:
        logger.error(f"Error getting access token: {str(e)}")
        return []
    
    # Now use the access token to fetch the record data
    url = "https://core-production.alchemy.cloud/core/api/v2/filter-records"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    payload = {
        "queryTerm": "Result.Status == 'Valid'",
        "recordTemplateIdentifier": record_type,
        "drop": 0,
        "take": 1,  # We just need one record to extract field names
        "lastChangedOnFrom": "2021-03-03T00:00:00Z",
        "lastChangedOnTo": "2028-03-04T00:00:00Z"
    }

    try:
        logger.info(f"Making PUT request to {url} for record type {record_type}")
        logger.debug(f"Request payload: {payload}")
        
        response = requests.put(url, headers=headers, json=payload)
        
        # Log response status
        logger.info(f"Filter-records API response status: {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"API error: {response.text}")
            return []
        
        # Parse the response
        data = response.json()
        logger.info(f"Successfully received filter-records response with {len(data.get('records', []))} records")
        
        # Extract field identifiers from the records
        fields = []
        if data.get("records") and len(data["records"]) > 0:
            record = data["records"][0]
            
            # Check for fieldValues
            if "fieldValues" in record:
                for field_id in record["fieldValues"].keys():
                    fields.append({"identifier": field_id, "name": field_id})
            
            # Check for fields
            if "fields" in record:
                for field in record["fields"]:
                    if field.get("identifier") and not any(f["identifier"] == field["identifier"] for f in fields):
                        fields.append({"identifier": field["identifier"], "name": field.get("name", field["identifier"])})
            
            # If no fields were found, provide some default fields
            if not fields:
                logger.warning(f"No fields found in record. Using default field structure.")
                fields = [
                    {"identifier": "Name", "name": "Name"},
                    {"identifier": "Description", "name": "Description"},
                    {"identifier": "Status", "name": "Status"},
                    {"identifier": "ExternalId", "name": "External ID"}
                ]
        else:
            logger.warning(f"No records found for template {record_type}")
            
        return fields
        
    except Exception as e:
        logger.error(f"Error fetching fields: {str(e)}")
        return []
