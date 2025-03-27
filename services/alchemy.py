# app/services/alchemy_service.py
import requests
import os

def get_alchemy_fields(tenant_id, refresh_token):
    base_url = "https://core-production.alchemy.cloud"
    token_url = f"{base_url}/auth/realms/{tenant_id}/protocol/openid-connect/token"

    # Get access token using refresh token
    token_response = requests.post(token_url, data={
        "grant_type": "refresh_token",
        "client_id": "alchemy-web-client",
        "refresh_token": refresh_token
    })

    token_response.raise_for_status()
    access_token = token_response.json()["access_token"]

    # Use access token to fetch fields
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    body = {
        "queryTerm": "Result.Status == 'Valid'",
        "recordTemplateIdentifier": "AC_Location",
        "drop": 0,
        "take": 11,
        "lastChangedOnFrom": "2021-03-03T00:00:00Z",
        "lastChangedOnTo": "2028-03-04T00:00:00Z"
    }

    response = requests.put(
        f"{base_url}/core/api/v2/filter-records",
        headers=headers,
        json=body
    )

    response.raise_for_status()
    records = response.json()

    # Extract unique field identifiers from the first record
    if records.get("records"):
        fields = list(records["records"][0].get("fieldValues", {}).keys())
        return [{"identifier": f, "name": f} for f in fields]
    else:
        return []
