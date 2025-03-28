"""
Routes for authentication and API troubleshooting
"""
from flask import Blueprint, render_template, request, jsonify, current_app
import requests
import logging
import json
from .services.alchemy_service import get_alchemy_access_token, fetch_alchemy_fields

# Create a blueprint for troubleshooting routes
troubleshoot_bp = Blueprint('troubleshoot', __name__)


@troubleshoot_bp.route('/troubleshoot')
def auth_troubleshooter():
    """Serve the authentication troubleshooting tool"""
    return render_template('auth_troubleshooter.html')


@troubleshoot_bp.route('/test-alchemy-auth', methods=['POST'])
def test_alchemy_auth():
    """
    Test Alchemy authentication with any tenant ID and refresh token
    """
    try:
        data = request.get_json()
        tenant_id = data.get('tenant_id')
        refresh_token = data.get('refresh_token')
        auth_url = data.get('auth_url')
        
        if not tenant_id or not refresh_token:
            return jsonify({
                "status": "error",
                "message": "Missing tenant_id or refresh_token"
            }), 400
        
        # Use the provided auth URL or construct one with the tenant ID
        if not auth_url:
            auth_url = f"https://core-production.alchemy.cloud/auth/realms/{tenant_id}/protocol/openid-connect/token"
        
        current_app.logger.info(f"Testing authentication for tenant {tenant_id} with URL: {auth_url}")
        
        # Make the authentication request
        response = requests.post(
            auth_url,
            data={
                "grant_type": "refresh_token",
                "client_id": "alchemy-web-client",
                "refresh_token": refresh_token
            }
        )
        
        current_app.logger.info(f"Auth response status: {response.status_code}")
        
        if response.status_code != 200:
            current_app.logger.error(f"Auth error: {response.text}")
            
            # Try to parse error details
            error_details = {}
            try:
                error_details = response.json()
            except:
                error_details = {"raw_response": response.text}
            
            return jsonify({
                "status": "error",
                "message": f"Authentication failed with status {response.status_code}",
                "error_details": error_details
            })
        
        # Authentication successful
        token_data = response.json()
        
        return jsonify({
            "status": "success",
            "message": "Authentication successful",
            "access_token": token_data.get("access_token"),
            "expires_in": token_data.get("expires_in"),
            "token_type": token_data.get("token_type"),
            "refresh_expires_in": token_data.get("refresh_expires_in", "Not specified"),
            "scope": token_data.get("scope", "Not specified")
        })
        
    except Exception as e:
        current_app.logger.error(f"Error testing authentication: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error: {str(e)}"
        }), 500


@troubleshoot_bp.route('/test-record-types', methods=['POST'])
def test_record_types():
    """
    Test fetching record types with a specific token
    """
    try:
        data = request.get_json()
        tenant_id = data.get('tenant_id')
        access_token = data.get('access_token')
        
        if not tenant_id or not access_token:
            return jsonify({
                "status": "error",
                "message": "Missing tenant_id or access_token"
            }), 400
        
        current_app.logger.info(f"Testing record types API for tenant {tenant_id}")
        
        # Make request to get record types
        url = "https://core-production.alchemy.cloud/core/api/v2/record-templates"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        response = requests.get(url, headers=headers)
        
        current_app.logger.info(f"Record types response status: {response.status_code}")
        
        if response.status_code != 200:
            current_app.logger.error(f"Record types error: {response.text}")
            
            error_details = {}
            try:
                error_details = response.json()
            except:
                error_details = {"raw_response": response.text}
                
            return jsonify({
                "status": "error",
                "message": f"Failed to fetch record types: {response.status_code}",
                "error_details": error_details
            })
        
        # Process the record types
        record_types = []
        for item in response.json():
            record_types.append({
                "identifier": item.get("identifier"),
                "name": item.get("displayName", item.get("name", item.get("identifier")))
            })
        
        return jsonify({
            "status": "success",
            "message": f"Successfully fetched {len(record_types)} record types",
            "record_types": record_types
        })
        
    except Exception as e:
        current_app.logger.error(f"Error testing record types: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error: {str(e)}"
        }), 500


@troubleshoot_bp.route('/test-fields', methods=['POST'])
def test_fields():
    """
    Test fetching fields for a specific record type
    """
    try:
        data = request.get_json()
        tenant_id = data.get('tenant_id')
        access_token = data.get('access_token')
        record_type = data.get('record_type')
        api_endpoint = data.get('api_endpoint')
        
        if not tenant_id or not access_token or not record_type:
            return jsonify({
                "status": "error",
                "message": "Missing tenant_id, access_token, or record_type"
            }), 400
        
        current_app.logger.info(f"Testing fields API for record type {record_type} in tenant {tenant_id}")
        
        # Construct request payload
        url = api_endpoint or "https://core-production.alchemy.cloud/core/api/v2/filter-records"
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
        
        # Make the request
        response = requests.put(url, headers=headers, json=payload)
        
        current_app.logger.info(f"Fields API response status: {response.status_code}")
        
        if response.status_code != 200:
            current_app.logger.error(f"Fields API error: {response.text}")
            
            error_details = {}
            try:
                error_details = response.json()
            except:
                error_details = {"raw_response": response.text[:500]}
                
            return jsonify({
                "status": "error",
                "message": f"Failed to fetch fields: {response.status_code}",
                "error_details": error_details
            })
        
        # Process the response
        try:
            data = response.json()
            fields = []
            
            if data.get("records") and len(data["records"]) > 0:
                record = data["records"][0]
                
                # Extract field info from fieldValues
                if "fieldValues" in record:
                    for field_id, field_value in record["fieldValues"].items():
                        field_info = {
                            "identifier": field_id,
                            "name": field_id
                        }
                        
                        # Try to extract more information about the field
                        if isinstance(field_value, dict):
                            field_info["type"] = field_value.get("type", "unknown")
                            if "displayName" in field_value:
                                field_info["name"] = field_value["displayName"]
                            
                            # Include sample value if simple enough
                            if "value" in field_value:
                                if isinstance(field_value["value"], (str, int, float, bool)):
                                    field_info["sample_value"] = field_value["value"]
                        
                        fields.append(field_info)
                
                # If no fieldValues, look for alternative field structures
                else:
                    current_app.logger.warning("No fieldValues found in record")
                    
                    # Include diagnostic information for troubleshooting
                    return jsonify({
                        "status": "warning",
                        "message": "Record found but no fieldValues property",
                        "record_keys": list(record.keys()),
                        "record_sample": {k: str(v)[:50] + "..." if isinstance(v, str) and len(str(v)) > 50 else v 
                                          for k, v in record.items() if k not in ["id", "recordId", "recordTemplateId"]}
                    })
            
            return jsonify({
                "status": "success",
                "message": f"Successfully extracted {len(fields)} fields",
                "fields": fields,
                "record_count": len(data.get("records", []))
            })
            
        except Exception as e:
            current_app.logger.error(f"Error processing fields response: {str(e)}")
            return jsonify({
                "status": "error",
                "message": f"Error processing response: {str(e)}",
                "raw_sample": response.text[:500] + "..." if len(response.text) > 500 else response.text
            })
        
    except Exception as e:
        current_app.logger.error(f"Error testing fields API: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error: {str(e)}"
        }), 500


# Additional diagnostic route to check API health
@troubleshoot_bp.route('/api-health-check', methods=['GET'])
def api_health_check():
    """Test basic connectivity to Alchemy APIs"""
    try:
        # Check core API
        core_url = "https://core-production.alchemy.cloud/health"
        core_response = requests.get(core_url, timeout=5)
        
        # Check auth API
        auth_url = "https://core-production.alchemy.cloud/auth"
        auth_response = requests.get(auth_url, timeout=5)
        
        return jsonify({
            "status": "success",
            "core_api": {
                "status_code": core_response.status_code,
                "available": core_response.status_code < 500
            },
            "auth_api": {
                "status_code": auth_response.status_code,
                "available": auth_response.status_code < 500
            }
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"API health check failed: {str(e)}"
        })
