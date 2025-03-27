
import requests
import logging

def get_alchemy_access_token(refresh_token, tenant_id):
    try:
        response = requests.post(
            f"https://{tenant_id}.alchemy.cloud/api/auth/token",
            json={"refreshToken": refresh_token}
        )
        response.raise_for_status()
        return response.json().get("accessToken")
    except Exception as e:
        logging.error(f"Failed to get Alchemy access token: {str(e)}")
        return None

def get_alchemy_record_types(access_token, tenant_id):
    try:
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        response = requests.get(
            f"https://{tenant_id}.alchemy.cloud/api/lims/record-types",
            headers=headers
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logging.error(f"Failed to fetch record types: {str(e)}")
        return None
