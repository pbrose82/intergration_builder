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
import traceback
from flask import render_template, current_app, redirect, url_for


# Create blueprint
main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    return render_template('index.html')

@main_bp.route('/get-alchemy-record-types', methods=['POST'])
def get_record_types():
    """Get Alchemy record types endpoint with improved error handling"""
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

        # Get access token using improved method
        access_token = get_alchemy_access_token(refresh_token, tenant_id)
        if not access_token:
            current_app.logger.error(f"Failed to get access token for tenant {tenant_id}")
            return jsonify({
                "status": "error",
                "message": "Unable to get access token - authentication may have expired",
                "recordTypes": []
            }), 401

        # Fetch record types
        record_types = get_alchemy_record_types(access_token, tenant_id)
        if not record_types:
            current_app.logger.warning(f"No record types found for tenant {tenant_id}")
            return jsonify({
                "status": "warning",
                "message": "No record types found",
                "recordTypes": []
            })

        return jsonify({
            "status": "success",
            "message": f"Successfully retrieved {len(record_types)} record types",
            "recordTypes": record_types
        })

    except Exception as e:
        current_app.logger.error(f"Error in get_record_types: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            "status": "error",
            "message": f"Unexpected error: {str(e)}",
            "recordTypes": []
        }), 500
        
@main_bp.route('/view-integration.html')
def view_integration_html():
    """
    Render the view integration page
    """
    integration_id = request.args.get('id')
    return render_template('view-integration.html', integration_id=integration_id)
    
@main_bp.route('/select-platform.html')
def select_platform_html():
    """
    Render the platform selection page with HTML extension
    """
    current_app.logger.info("Rendering platform selection page")
    return render_template('platform_select.html')

# Fixed - separate function names for GET and POST handlers
@main_bp.route('/select-platform', methods=['GET'])
def select_platform_get():
    """
    Render the platform selection page without HTML extension (GET method)
    """
    current_app.logger.info("Redirecting to platform selection page")
    return render_template('platform_select.html')

@main_bp.route('/get-alchemy-fields', methods=['POST'])
def get_fields():
    """Get fields for a specific record type with improved error handling"""
    try:
        data = request.get_json()
        tenant_id = data.get("tenant_id")
        refresh_token = data.get("refresh_token")
        record_type = data.get("record_type")
        
        current_app.logger.info(f"Field fetch request for record type: {record_type} in tenant: {tenant_id}")

        # Try to get token from session if "session" is passed
        if refresh_token == "session" and tenant_id:
            if 'alchemy_tokens' in session and tenant_id in session['alchemy_tokens']:
                refresh_token = session['alchemy_tokens'][tenant_id].get('refresh_token')
                current_app.logger.info(f"Using refresh token from session for tenant {tenant_id}")
            else:
                current_app.logger.error(f"No session token found for tenant {tenant_id}")
                return jsonify({
                    "status": "error", 
                    "message": "No token in session for this tenant or session expired",
                    "fields": []
                }), 401

        if not tenant_id or not refresh_token or not record_type:
            current_app.logger.error("Missing required parameters")
            return jsonify({
                "status": "error", 
                "message": "Missing one or more required fields",
                "fields": []
            }), 400

        # Get fields using improved service method
        fields = fetch_alchemy_fields(tenant_id, refresh_token, record_type)
        
        # Log the actual fields for debugging
        current_app.logger.info(f"Fields to return: {json.dumps(fields)}")
        
        # Check if these are fallback fields
        is_fallback = len(fields) == 4 and fields[0]['identifier'] == 'Name' and fields[1]['identifier'] == 'Description'
        
        if is_fallback:
            current_app.logger.warning("Returning fallback fields")
            return jsonify({
                "status": "warning",
                "message": "Using fallback fields due to API issues",
                "fields": fields
            })
        
        return jsonify({
            "status": "success",
            "message": f"Successfully fetched {len(fields)} fields",
            "fields": fields
        })
        
    except Exception as e:
        current_app.logger.error(f"Failed to fetch fields: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        # Always include fields array for frontend compatibility
        return jsonify({
            "status": "error", 
            "message": f"Unexpected error: {str(e)}",
            "fields": []
        }), 500

# Fixed - renamed to avoid conflicts
@main_bp.route('/select-platform', methods=['POST'])
def handle_platform_selection():
    """
    Handle platform selection form submission (POST method)
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

@main_bp.route('/config.html', methods=['GET'])
def config_html():
    """
    Render the configuration page with HTML extension
    """
    platform = request.args.get('platform')
    if not platform:
        current_app.logger.error("No platform specified for config page")
        return redirect('/select-platform.html')
    
    current_app.logger.info(f"Rendering config page for platform: {platform}")
    return render_template('config.html', platform=platform)

@main_bp.route('/authenticate-alchemy', methods=['POST'])
def authenticate_alchemy():
    """
    Authenticate with Alchemy using username/password to get a refresh token
    and store it in the session - using the improved approach based on scanner
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
        try:
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
        except requests.exceptions.RequestException as e:
            current_app.logger.error(f"Network error during authentication: {str(e)}")
            return jsonify({
                "status": "error",
                "message": f"Network error: {str(e)}"
            }), 500
        
        current_app.logger.info(f"Authentication response status: {response.status_code}")
        
        if response.status_code != 200:
            error_message = "Authentication failed"
            try:
                error_data = response.json()
                if 'message' in error_data:
                    error_message = error_data['message']
            except:
                error_message = f"Authentication failed: {response.text}"
                
            current_app.logger.error(f"Authentication error: {error_message}")
            return jsonify({
                "status": "error",
                "message": error_message
            })
        
        # Parse the authentication response
        try:
            auth_data = response.json()
        except json.JSONDecodeError:
            current_app.logger.error(f"Invalid JSON response: {response.text[:200]}")
            return jsonify({
                "status": "error",
                "message": "Invalid response from authentication server"
            })
        
        # Extract refresh tokens
        if not auth_data.get('tokens'):
            current_app.logger.error("No tokens returned from authentication")
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
            current_app.logger.error("No refresh token found in authentication response")
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
        
        # Store the current tenant ID for convenience
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
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            "status": "error",
            "message": f"Error: {str(e)}"
        }), 500
