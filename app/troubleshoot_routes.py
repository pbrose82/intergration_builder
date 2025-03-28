"""
Routes for authentication and API troubleshooting
"""
from flask import Blueprint, render_template, request, jsonify, current_app
import requests
import logging
import json
from services.alchemy_service import get_alchemy_access_token

# Create a blueprint for troubleshooting routes
troubleshoot_bp = Blueprint('troubleshoot', __name__)


@troubleshoot_bp.route('/troubleshoot')
def auth_troubleshooter():
    """Serve the authentication troubleshooting tool"""
    return render_template('auth_troubleshooter.html')


@troubleshoot_bp.route('/test-alchemy-auth', methods=['POST'])
def test_alchemy_auth():
    """
    Test Alchemy authentication with tenant ID and refresh token
    using the fixed/working approach
    """
    try:
        data = request.get_json()
        tenant_id = data.get('tenant_id')
        refresh_token = data.get('refresh_token')
        
        if not tenant_id or not refresh_token:
            return jsonify({
                "status": "error",
                "message": "Missing tenant_id or refresh_token"
            }), 400
        
        current_app.logger.info(f"Testing authentication for tenant {tenant_id}")
        
        # Make the authentication request using the working approach from scanner
        refresh_url = "https://core-production.alchemy.cloud/core/api/v2/refresh-token"
        
        try:
            response = requests.put(
                refresh_url, 
                json={"refreshToken": refresh_token},
                headers={"Content-Type": "application/json"}
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
            
            # Process the tokens array
            token_data = response.json()
            
            if "tokens" not in token_data or not isinstance(token_data["tokens"], list):
                return jsonify({
                    "status": "error",
                    "message": "No tokens array in response or invalid format"
                })
            
            # Find token for the specified tenant
            tenant_token = next((token for token in token_data["tokens"] 
                               if token.get("tenant") == tenant_id), None)
            
            if not tenant_token:
                # Log available tenants
                available_tenants = [t.get("tenant") for t in token_data.get("tokens", [])]
                return jsonify({
                    "status": "error",
                    "message": f"Tenant {tenant_id} not found in response",
                    "available_tenants": available_tenants 
                })
            
            # Authentication successful
            return jsonify({
                "status": "success",
                "message": "Authentication successful",
                "access_token": tenant_token.get("accessToken"),
                "expires_in": tenant_token.get("expiresIn"),
                "token_type": "Bearer"
            })
            
        except Exception as req_error:
            current_app.logger.error(f"Request error: {str(req_error)}")
            return jsonify({
                "status": "error",
                "message": f"Request error: {str(req_error)}"
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
    Test fetching record types with access token
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
