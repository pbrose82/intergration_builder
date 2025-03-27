import requests

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
        print("Access token error:", e)
        return None


def get_alchemy_record_types(access_token, tenant_id):
    """
    Fetch all record templates available in the tenant
    """
    url = f"https://core-production.alchemy.cloud/core/api/v2/record-templates"
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
        print("Record type fetch error:", e)
        return []


def fetch_alchemy_fields(access_token, tenant_id, record_type):
    """
    Pull fields for a given record type using the filter-records API
    """
    url = f"https://core-production.alchemy.cloud/core/api/v2/filter-records"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    payload = {
        "queryTerm": "Result.Status == 'Valid'",
        "recordTemplateIdentifier": record_type,
        "drop": 0,
        "take": 11,
        "lastChangedOnFrom": "2021-03-03T00:00:00Z",
        "lastChangedOnTo": "2028-03-04T00:00:00Z"
    }

    try:
        response = requests.put(url, headers=headers, json=payload)
        response.raise_for_status()
        records = response.json()

        if records.get("records"):
            field_keys = list(records["records"][0].get("fieldValues", {}).keys())
            return [{"identifier": f, "name": f} for f in field_keys]
        else:
            return []
    except Exception as e:
        print("Field fetch error:", e)
        return []
