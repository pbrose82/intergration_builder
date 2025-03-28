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
        # Log token details (masked for security)
        masked_token = refresh_token[:5] + "..." if refresh_token and len(refresh_token) > 5 else "None"
        logger.info(f"Getting access token for tenant {tenant_id} with refresh token starting with: {masked_token}")
        
        response = requests.post(
            token_url, 
            data={
                "grant_type": "refresh_token",
                "client_id": "alchemy-web-client",
                "refresh_token": refresh_token
            }
        )

        logger.info(f"Token response status: {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"Token error response: {response.text}")
            return None
            
        token_data = response.json()
        access_token = token_data.get("access_token")
        
        if access_token:
            logger.info(f"Successfully obtained access token")
            return access_token
        else:
            logger.error("No access token in response")
            return None
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
    logger.info(f"Starting field fetch for record type '{record_type}' in tenant '{tenant_id}'")
    
    # Get access token
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
        logger.info(f"Making PUT request to {url} with payload: {json.dumps(payload)}")
        logger.info(f"Using headers: {json.dumps({'Authorization': 'Bearer [MASKED]', 'Content-Type': headers['Content-Type']})}")
        
        response = requests.put(url, headers=headers, json=payload)
        
        logger.info(f"Filter-records API response status: {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"API error response: {response.text}")
            # Return sample fields instead of failing
            return [
                {"identifier": "Name", "name": "Name"},
                {"identifier": "Description", "name": "Description"},
                {"identifier": "Status", "name": "Status"},
                {"identifier": "ExternalId", "name": "External ID"}
            ]
        
        # Parse the response
        try:
            data = response.json()
            logger.info(f"Successfully parsed response JSON")
            
            # Log the number of records found
            records_count = len(data.get("records", []))
            logger.info(f"Found {records_count} records for record type '{record_type}'")
            
            # Log the first record structure if available
            if records_count > 0:
                first_record = data["records"][0]
                logger.info(f"First record ID: {first_record.get('recordId') or first_record.get('id', 'unknown')}")
                
                # Check for fieldValues
                field_values = first_record.get("fieldValues", {})
                logger.info(f"Field values count: {len(field_values)}")
                
                if field_values:
                    field_keys = list(field_values.keys())
                    logger.info(f"First few field keys: {field_keys[:5] if len(field_keys) > 5 else field_keys}")
                else:
                    logger.warning(f"No fieldValues found in the record")
                    # Check if there are other properties we can extract fields from
                    logger.info(f"Record properties: {list(first_record.keys())}")
            else:
                logger.warning(f"No records found for record type '{record_type}'")
        except Exception as json_error:
            logger.error(f"Error parsing JSON response: {str(json_error)}")
            logger.error(f"Raw response text: {response.text[:500]}...")  # First 500 chars of response
            # Return sample fields
            return [
                {"identifier": "Name", "name": "Name"},
                {"identifier": "Description", "name": "Description"},
                {"identifier": "Status", "name": "Status"},
                {"identifier": "ExternalId", "name": "External ID"}
            ]
        
        fields = []
        if data.get("records") and len(data["records"]) > 0:
            record = data["records"][0]
            
            if "fieldValues" in record:
                for field_id in record["fieldValues"].keys():
                    fields.append({"identifier": field_id, "name": field_id})
                    logger.info(f"Added field: {field_id}")
            
            # Try to get fields from other record properties if fieldValues is empty
            if not fields and "fields" in record:
                logger.info("No fieldValues found, trying to extract from 'fields' property")
                for field in record.get("fields", []):
                    if "identifier" in field:
                        field_id = field["identifier"]
                        fields.append({"identifier": field_id, "name": field_id})
                        logger.info(f"Added field from 'fields' property: {field_id}")
        
        # If no fields found, return sample fields
        if not fields:
            logger.warning(f"No fields found for record type {record_type}, returning sample fields")
            fields = [
                {"identifier": "Name", "name": "Name"},
                {"identifier": "Description", "name": "Description"},
                {"identifier": "Status", "name": "Status"},
                {"identifier": "ExternalId", "name": "External ID"}
            ]
            logger.info("Added sample fields")
        
        # Log final fields result
        logger.info(f"Returning {len(fields)} fields for record type '{record_type}'")
        return fields
    except Exception as e:
        logger.error(f"Error fetching fields: {str(e)}")
        # Return sample fields instead of failing
        return [
            {"identifier": "Name", "name": "Name"},
            {"identifier": "Description", "name": "Description"},
            {"identifier": "Status", "name": "Status"},
            {"identifier": "ExternalId", "name": "External ID"}
        ]
