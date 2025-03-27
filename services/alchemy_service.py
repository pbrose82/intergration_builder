
import requests

def get_alchemy_access_token(refresh_token, tenant_id):
    token_url = f"https://core-production.alchemy.cloud/auth/realms/{tenant_id}/protocol/openid-connect/token"
    data = {
        "grant_type": "refresh_token",
        "client_id": "alchemy-web-client",
        "refresh_token": refresh_token
    }

    response = requests.post(token_url, data=data)
    if response.status_code == 200:
        return response.json().get("access_token")
    return None

def get_alchemy_record_types(access_token, tenant_id):
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    url = f"https://core-production.alchemy.cloud/core/api/v2/record-templates"
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        data = response.json()
        return [{"identifier": rt["identifier"], "name": rt["name"]} for rt in data]
    return []

def fetch_alchemy_fields(tenant_id, refresh_token, record_type):
    base_url = "https://core-production.alchemy.cloud"
    token_url = f"{base_url}/auth/realms/{tenant_id}/protocol/openid-connect/token"

    token_response = requests.post(token_url, data={
        "grant_type": "refresh_token",
        "client_id": "alchemy-web-client",
        "refresh_token": refresh_token
    })

    token_response.raise_for_status()
    access_token = token_response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    body = {
        "queryTerm": "Result.Status == 'Valid'",
        "recordTemplateIdentifier": record_type,
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

    if records.get("records"):
        fields = list(records["records"][0].get("fieldValues", {}).keys())
        return [{"identifier": f, "name": f} for f in fields]
    else:
        return []
