from flask import current_app

def get_alchemy_token(tenant_id, refresh_token):
    auth_url = f"https://{tenant_id}.alchemy-lims.com/api/auth/token"
    try:
        response = requests.post(auth_url, json={"refresh_token": refresh_token})
        response.raise_for_status()
        return response.json().get("access_token")
    except Exception as e:
        logging.error(f"Failed to retrieve Alchemy access token: {str(e)}")
        return None


@main_bp.route('/get-alchemy-record-types', methods=['POST'])
def get_alchemy_record_types():
    data = request.get_json()
    tenant = data.get("tenant")
    refresh_token = data.get("refresh_token")

    token = get_alchemy_token(tenant, refresh_token)
    if not token:
        return jsonify({"error": "Unable to authenticate with Alchemy"}), 401

    try:
        url = f"https://{tenant}.alchemy-lims.com/api/record-types"
        response = requests.get(url, headers={"Authorization": f"Bearer {token}"})
        response.raise_for_status()
        record_types = response.json()
        return jsonify(record_types)
    except Exception as e:
        logging.error(f"Error fetching record types: {str(e)}")
        return jsonify({"error": str(e)}), 500


@main_bp.route('/get-alchemy-fields', methods=['POST'])
def get_alchemy_fields():
    data = request.get_json()
    tenant = data.get("tenant")
    refresh_token = data.get("refresh_token")
    record_type = data.get("record_type")

    token = get_alchemy_token(tenant, refresh_token)
    if not token:
        return jsonify({"error": "Unable to authenticate with Alchemy"}), 401

    try:
        url = f"https://{tenant}.alchemy-lims.com/api/record-types/{record_type}/fields"
        response = requests.get(url, headers={"Authorization": f"Bearer {token}"})
        response.raise_for_status()
        fields = response.json()
        return jsonify(fields)
    except Exception as e:
        logging.error(f"Error fetching Alchemy fields: {str(e)}")
        return jsonify({"error": str(e)}), 500
