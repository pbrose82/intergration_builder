from flask import Blueprint, render_template, request, jsonify, current_app, session
from app import db
from app.models import SalesforceIntegration, SalesforceIntegrationSchema
from services.alchemy_service import (
    get_alchemy_access_token,
    get_alchemy_record_types,
    fetch_alchemy_fields
)
import logging
import requests
import json
from datetime import datetime

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    return render_template('index.html')

@main_bp.route('/get-alchemy-record-types', methods=['POST'])
def get_record_types():
    try:
        data = request.get_json()
        tenant_id = data.get("tenant_id")
        refresh_token = data.get("refresh_token")

        # Try to get token from session if not provided directly
        if not refresh_token and tenant_id:
            if 'alchemy_tokens' in session and tenant_id in session['alchemy_tokens']:
                refresh_token = session['alchemy_tokens'][tenant_id].get('refresh_token')
                current_app.logger.info(f"Using refresh token from session for tenant {tenant_id}")

        if not tenant_id or not refresh_token:
            return jsonify({"error": "Missing tenant_id or refresh_token"}), 400

        access_token = get_alchemy_access_token(refresh_token, tenant_id)
        if not access_token:
            return jsonify({"error": "Unable to get access token"}), 401

        record_types = get_alchemy_record_types(access_token, tenant_id)
        if not record_types:
            return jsonify({"error": "Failed to fetch record types"}), 500

        return jsonify({"recordTypes": record_types})

    except Exception as e:
        logging.error(f"Failed to get record types: {str(e)}")
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

# Add this route to your app/routes.py file

@main_bp.route('/select-platform', methods=['POST'])
def select_platform():
    """
    Handle platform selection form submission
    """
    platform = request.form.get('platform')
    
    if not platform:
        current_app.logger.error("No platform specified in form submission")
        return jsonify({"error": "No platform specified"}), 400
    
    current_app.logger.info(f"Platform selected: {platform}")
    
    # Store the selected platform in session
    session['selected_platform'] = platform
    
    # Redirect to the configuration page
    return render_template('config.html', platform=platform)

@main_bp.route('/get-alchemy-fields', methods=['POST'])
def get_fields():
    try:
        data = request.get_json()
        tenant_id = data.get("tenant_id")
        refresh_token = data.get("refresh_token")
        record_type = data.get("record_type")
        
        current_app.logger.info(f"Field fetch request for record type: {record_type} in tenant: {tenant_id}")

        # Try to get token from session if not provided directly
        if refresh_token == "session" and tenant_id:
            if 'alchemy_tokens' in session and tenant_id in session['alchemy_tokens']:
                refresh_token = session['alchemy_tokens'][tenant_id].get('refresh_token')
                current_app.logger.info(f"Using refresh token from session for tenant {tenant_id}")
            else:
                current_app.logger.error(f"No session token found for tenant {tenant_id}")
                return jsonify({
                    "status": "error",
                    "message": f"Authentication required: No session token found for tenant {tenant_id}"
                }), 401

        if not tenant_id or not refresh_token or not record_type:
            current_app.logger.error("Missing required parameters")
            return jsonify({
                "status": "error", 
                "message": "Missing one or more required fields"
            }), 400

        # Call the service to fetch fields
        current_app.logger.info(f"Fetching fields for record type {record_type}")
        try:
            fields = fetch_alchemy_fields(tenant_id, refresh_token, record_type)
            
            if not fields:
                current_app.logger.warning(f"No fields returned for record type {record_type}")
                return jsonify({
                    "status": "error",
                    "message": f"No fields found for record type {record_type}"
                }), 404
                
            current_app.logger.info(f"Successfully fetched {len(fields)} fields for record type {record_type}")
            return jsonify({
                "status": "success",
                "message": f"Successfully fetched {len(fields)} fields",
                "fields": fields
            })
            
        except Exception as e:
            current_app.logger.error(f"Error fetching fields: {str(e)}")
            return jsonify({
                "status": "error",
                "message": str(e)
            }), 401
            
    except Exception as e:
        current_app.logger.error(f"Failed to fetch fields: {str(e)}")
        return jsonify({
            "status": "error", 
            "message": f"Unexpected error: {str(e)}"
        }), 500

@main_bp.route('/save-integration', methods=['POST'])
def save_integration():
    try:
        data = request.get_json()
        
        # Extract data from request
        platform = data.get('platform')
        alchemy_config = data.get('alchemy', {})
        platform_config = data.get('platform_config', {})
        record_type = data.get('record_type')
        field_mappings = data.get('field_mappings', [])
        
        # Validate required fields
        if not platform or not alchemy_config or not record_type or not field_mappings:
            return jsonify({"status": "error", "message": "Missing required fields"}), 400
        
        # Create or update integration in database
        integration = SalesforceIntegration(
            alchemy_base_url=alchemy_config.get('tenant_id', ''),
            alchemy_api_key=alchemy_config.get('refresh_token', ''), 
            salesforce_username=platform_config.get('instance_url', ''),
            sync_frequency='daily',  # Default value
            is_active=True
        )
        
        # Set field mappings
        integration.set_field_mappings({
            'record_type': record_type,
            'mappings': field_mappings
        })
        
        # Save to database
        db.session.add(integration)
        db.session.commit()
        
        return jsonify({
            "status": "success", 
            "message": "Integration configured successfully",
            "id": integration.id
        })
        
    except Exception as e:
        logging.error(f"Failed to save integration: {str(e)}")
        db.session.rollback()
        return jsonify({"status": "error", "message": f"Unexpected error: {str(e)}"}), 500

@main_bp.route('/authenticate-alchemy', methods=['POST'])
def authenticate_alchemy():
    """
    Authenticate with Alchemy using username/password to get a refresh token
    and store it in the session
    """
    try:
        data = request.get_json()
        tenant_id = data.get('tenant_id')
        email = data.get('email')
        password = data.get('password')
        
        if not tenant_id or not email or not password:
            return jsonify({
                "status": "error",
                "message": "Missing required credentials"
            }), 400
        
        # Format the authentication URL with the tenant ID
        auth_url = f"https://core-production.alchemy.cloud/core/api/v2/sign-in"
        
        current_app.logger.info(f"Authenticating with Alchemy for tenant: {tenant_id}")
        
        # Make the authentication request
        response = requests.post(
            auth_url,
            json={
                "email": email,
                "password": password
            },
            headers={
                "Content-Type": "application/json"
            }
        )
        
        current_app.logger.info(f"Authentication response status: {response.status_code}")
        
        if response.status_code != 200:
            current_app.logger.error(f"Authentication error: {response.text}")
            return jsonify({
                "status": "error",
                "message": f"Authentication failed: {response.text}"
            })
        
        # Parse the authentication response
        auth_data = response.json()
        
        # Extract refresh tokens
        if not auth_data.get('tokens'):
            return jsonify({
                "status": "error",
                "message": "No tokens returned from authentication"
            })
        
        # Find the token for the specified tenant
        tenant_token = None
        for token in auth_data.get('tokens', []):
            if token.get('tenant') == tenant_id:
                tenant_token = token
                break
        
        if not tenant_token:
            # If the exact tenant wasn't found, log available tenants for debugging
            available_tenants = [t.get('tenant') for t in auth_data.get('tokens', [])]
            current_app.logger.error(f"Tenant {tenant_id} not found in response. Available tenants: {available_tenants}")
            
            return jsonify({
                "status": "error",
                "message": f"Tenant {tenant_id} not found in authentication response",
                "available_tenants": available_tenants
            })
        
        # Get the refresh token from the tenant token
        refresh_token = tenant_token.get('refreshToken')
        
        if not refresh_token:
            return jsonify({
                "status": "error",
                "message": "No refresh token found in authentication response"
            })
        
        # Store the refresh token in the session
        if 'alchemy_tokens' not in session:
            session['alchemy_tokens'] = {}
        
        session['alchemy_tokens'][tenant_id] = {
            'refresh_token': refresh_token,
            'timestamp': datetime.now().isoformat()
        }
        
        # Also store the current tenant ID for convenience
        session['current_tenant'] = tenant_id
        
        current_app.logger.info(f"Successfully authenticated and stored refresh token for tenant {tenant_id}")
        
        return jsonify({
            "status": "success",
            "message": "Authentication successful",
            "tenant_id": tenant_id,
            "token_saved": True
        })
        
    except Exception as e:
        current_app.logger.error(f"Error in Alchemy authentication: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error: {str(e)}"
        }), 500

@main_bp.route('/get-session-token', methods=['POST'])
def get_session_token():
    """
    Retrieve a stored refresh token from the session
    """
    try:
        data = request.get_json()
        tenant_id = data.get('tenant_id')
        
        if not tenant_id:
            return jsonify({
                "status": "error",
                "message": "Missing tenant_id"
            }), 400
        
        # Check if the token exists in the session
        if 'alchemy_tokens' not in session or tenant_id not in session['alchemy_tokens']:
            return jsonify({
                "status": "error",
                "message": "No token found for this tenant",
                "authenticated": False
            })
        
        # Return success with authentication status
        return jsonify({
            "status": "success",
            "message": "Token found in session",
            "authenticated": True,
            "tenant_id": tenant_id
        })
        
    except Exception as e:
        current_app.logger.error(f"Error retrieving token from session: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error: {str(e)}"
        }), 500

@main_bp.route('/test-alchemy-auth', methods=['POST'])
def test_alchemy_auth():
    """
    Test Alchemy authentication with any tenant ID
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
            "token_type": token_data.get("token_type")
        })
        
    except Exception as e:
        current_app.logger.error(f"Error testing authentication: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error: {str(e)}"
        }), 500

@main_bp.route('/test-record-types', methods=['POST'])
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
            return jsonify({
                "status": "error",
                "message": f"Failed to fetch record types: {response.status_code}"
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

@main_bp.route('/tenant-tester')
def tenant_tester():
    """
    Serve the tenant testing tool page
    """
    return render_template('tenant_tester.html')

@main_bp.route('/troubleshoot')
def auth_troubleshooter():
    """Serve the authentication troubleshooting tool"""
    return render_template('auth_troubleshooter.html')
