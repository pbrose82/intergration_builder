from flask import Blueprint, request, redirect, url_for, session, current_app, jsonify
import requests
from simple_salesforce import Salesforce
import json
import logging
from urllib.parse import urlencode

salesforce_bp = Blueprint('salesforce', __name__, url_prefix='/salesforce')

@salesforce_bp.route('/authorize')
def authorize():
    """
    Start Salesforce OAuth flow
    """
    # Get Salesforce OAuth settings from form or config
    client_id = request.args.get('client_id') or current_app.config.get('SALESFORCE_CLIENT_ID')
    redirect_uri = request.args.get('redirect_uri') or url_for('salesforce.callback', _external=True)
    
    if not client_id:
        return jsonify({"error": "Missing client_id parameter"}), 400
    
    # Store settings in session
    session['salesforce_client_id'] = client_id
    session['salesforce_redirect_uri'] = redirect_uri
    
    # Build authorization URL
    params = {
        'response_type': 'code',
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'state': 'integration' # State parameter for security
    }
    
    # Use production instance for developers
    auth_url = f"https://login.salesforce.com/services/oauth2/authorize?{urlencode(params)}"
    
    # Redirect to Salesforce login
    return redirect(auth_url)

@salesforce_bp.route('/callback')
def callback():
    """
    Handle Salesforce OAuth callback
    """
    # Get authorization code from the callback
    code = request.args.get('code')
    state = request.args.get('state')
    error = request.args.get('error')
    
    if error:
        current_app.logger.error(f"Salesforce OAuth error: {error}")
        return jsonify({"status": "error", "message": f"Authentication failed: {error}"}), 400
    
    if not code:
        return jsonify({"status": "error", "message": "No authorization code received"}), 400
    
    # Retrieve saved OAuth settings
    client_id = session.get('salesforce_client_id') or current_app.config.get('SALESFORCE_CLIENT_ID')
    client_secret = session.get('salesforce_client_secret') or current_app.config.get('SALESFORCE_CLIENT_SECRET')
    redirect_uri = session.get('salesforce_redirect_uri') or url_for('salesforce.callback', _external=True)
    
    if not client_id or not redirect_uri:
        return jsonify({"status": "error", "message": "Missing OAuth settings"}), 400
    
    # Exchange authorization code for access token
    token_url = "https://login.salesforce.com/services/oauth2/token"
    payload = {
        'grant_type': 'authorization_code',
        'code': code,
        'client_id': client_id,
        'client_secret': client_secret,
        'redirect_uri': redirect_uri
    }
    
    # Make token request
    try:
        response = requests.post(token_url, data=payload)
        data = response.json()
        
        if response.status_code != 200 or 'error' in data:
            error_msg = data.get('error_description', data.get('error', 'Unknown error'))
            current_app.logger.error(f"Salesforce token error: {error_msg}")
            return jsonify({"status": "error", "message": f"Token exchange failed: {error_msg}"}), 400
        
        # Extract and store tokens
        access_token = data.get('access_token')
        refresh_token = data.get('refresh_token')
        instance_url = data.get('instance_url')
        
        if not access_token or not instance_url:
            return jsonify({"status": "error", "message": "Invalid token response"}), 400
        
        # Store tokens in session
        if 'salesforce_tokens' not in session:
            session['salesforce_tokens'] = {}
        
        session['salesforce_tokens'] = {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'instance_url': instance_url
        }
        
        current_app.logger.info(f"Successfully authenticated with Salesforce")
        
        # Render success page that will communicate with the parent window
        return f"""
        <html>
        <head>
            <title>Salesforce Authentication Complete</title>
            <script>
                window.onload = function() {{
                    window.opener.postMessage({{
                        status: 'success',
                        message: 'Successfully authenticated with Salesforce',
                        instance_url: '{instance_url}'
                    }}, '*');
                    setTimeout(function() {{ window.close(); }}, 2000);
                }};
            </script>
        </head>
        <body>
            <h3>Authentication Successful!</h3>
            <p>You may close this window and return to the application.</p>
        </body>
        </html>
        """
        
    except Exception as e:
        current_app.logger.error(f"Error in Salesforce callback: {str(e)}")
        return jsonify({"status": "error", "message": f"Error: {str(e)}"}), 500

@salesforce_bp.route('/direct-auth', methods=['POST'])
def direct_auth():
    """
    Directly authenticate with Salesforce using provided credentials
    """
    try:
        data = request.get_json()
        
        # Get credentials from request or config
        client_id = data.get('client_id') or current_app.config.get('SALESFORCE_CLIENT_ID')
        client_secret = data.get('client_secret') or current_app.config.get('SALESFORCE_CLIENT_SECRET')
        username = data.get('username') or current_app.config.get('SALESFORCE_USERNAME')
        password = data.get('password') or current_app.config.get('SALESFORCE_PASSWORD')
        security_token = data.get('security_token', '') or current_app.config.get('SALESFORCE_SECURITY_TOKEN', '')
        
        # Validate required fields
        if not client_id or not client_secret or not username or not password:
            return jsonify({
                "status": "error", 
                "message": "Missing required parameters"
            }), 400
        
        # Combine password and security token if provided
        password_with_token = password + security_token
        
        # Authenticate using username-password flow
        auth_url = "https://login.salesforce.com/services/oauth2/token"
        payload = {
            'grant_type': 'password',
            'client_id': client_id,
            'client_secret': client_secret,
            'username': username,
            'password': password_with_token
        }
        
        current_app.logger.info(f"Authenticating with Salesforce using direct auth for user: {username}")
        
        response = requests.post(auth_url, data=payload)
        data = response.json()
        
        if response.status_code != 200 or 'error' in data:
            error_msg = data.get('error_description', data.get('error', 'Unknown error'))
            current_app.logger.error(f"Salesforce direct auth error: {error_msg}")
            return jsonify({
                "status": "error", 
                "message": f"Authentication failed: {error_msg}"
            }), 400
        
        # Extract tokens
        access_token = data.get('access_token')
        instance_url = data.get('instance_url')
        
        if not access_token or not instance_url:
            return jsonify({
                "status": "error", 
                "message": "Invalid token response"
            }), 400
        
        # Store tokens in session
        if 'salesforce_tokens' not in session:
            session['salesforce_tokens'] = {}
        
        session['salesforce_tokens'] = {
            'access_token': access_token,
            'instance_url': instance_url
        }
        
        current_app.logger.info(f"Successfully authenticated with Salesforce using direct auth")
        
        return jsonify({
            "status": "success",
            "message": "Successfully authenticated with Salesforce",
            "instance_url": instance_url,
            "access_token": access_token[:10] + "..." # Show partial token for verification
        })
        
    except Exception as e:
        current_app.logger.error(f"Error in Salesforce direct auth: {str(e)}")
        return jsonify({"status": "error", "message": f"Error: {str(e)}"}), 500

@salesforce_bp.route('/get-fields', methods=['POST'])
def get_fields():
    """
    Get fields for a Salesforce object
    """
    try:
        data = request.get_json()
        object_name = data.get('object_name')
        
        if not object_name:
            return jsonify({"status": "error", "message": "Missing object_name parameter"}), 400
        
        # Get Salesforce tokens from session
        sf_tokens = session.get('salesforce_tokens')
        if not sf_tokens or 'access_token' not in sf_tokens or 'instance_url' not in sf_tokens:
            return jsonify({"status": "error", "message": "Not authenticated with Salesforce"}), 401
        
        current_app.logger.info(f"Fetching fields for Salesforce object: {object_name}")
        
        # Create Salesforce client
        sf = Salesforce(
            instance_url=sf_tokens['instance_url'],
            session_id=sf_tokens['access_token']
        )
        
        # Get object description (includes fields)
        try:
            object_desc = getattr(sf, object_name).describe()
            
            # Extract field information
            fields = []
            for field in object_desc['fields']:
                fields.append({
                    'identifier': field['name'],
                    'name': field['label'],
                    'type': field['type'],
                    'required': field['nillable'] == False and field['createable'] == True
                })
            
            current_app.logger.info(f"Successfully fetched {len(fields)} fields for Salesforce object {object_name}")
            
            return jsonify({
                "status": "success",
                "message": f"Successfully fetched {len(fields)} fields for {object_name}",
                "fields": fields
            })
            
        except Exception as sf_error:
            current_app.logger.error(f"Salesforce API error: {str(sf_error)}")
            return jsonify({
                "status": "error", 
                "message": f"Error fetching Salesforce fields: {str(sf_error)}"
            }), 400
            
    except Exception as e:
        current_app.logger.error(f"Error in get_fields: {str(e)}")
        return jsonify({"status": "error", "message": f"Error: {str(e)}"}), 500

@salesforce_bp.route('/get-objects', methods=['GET'])
def get_objects():
    """
    Get list of available Salesforce objects
    """
    try:
        # Get Salesforce tokens from session
        sf_tokens = session.get('salesforce_tokens')
        if not sf_tokens or 'access_token' not in sf_tokens or 'instance_url' not in sf_tokens:
            return jsonify({"status": "error", "message": "Not authenticated with Salesforce"}), 401
        
        current_app.logger.info("Fetching Salesforce objects")
        
        # Create Salesforce client
        sf = Salesforce(
            instance_url=sf_tokens['instance_url'],
            session_id=sf_tokens['access_token']
        )
        
        # Get object list
        try:
            # Get list of objects
            describe_result = sf.describe()
            
            # Extract object information
            objects = []
            for sobject in describe_result['sobjects']:
                # Only include creatable and queryable objects
                if sobject['createable'] and sobject['queryable']:
                    objects.append({
                        'name': sobject['name'],
                        'label': sobject['label'],
                        'custom': sobject['custom']
                    })
            
            # Sort objects by label
            objects.sort(key=lambda x: x['label'])
            
            current_app.logger.info(f"Successfully fetched {len(objects)} Salesforce objects")
            
            return jsonify({
                "status": "success",
                "message": f"Successfully fetched {len(objects)} objects",
                "objects": objects
            })
            
        except Exception as sf_error:
            current_app.logger.error(f"Salesforce API error: {str(sf_error)}")
            return jsonify({
                "status": "error", 
                "message": f"Error fetching Salesforce objects: {str(sf_error)}"
            }), 400
            
    except Exception as e:
        current_app.logger.error(f"Error in get_objects: {str(e)}")
        return jsonify({"status": "error", "message": f"Error: {str(e)}"}), 500

@salesforce_bp.route('/status')
def status():
    """
    Check Salesforce authentication status
    """
    # Get Salesforce tokens from session
    sf_tokens = session.get('salesforce_tokens')
    if not sf_tokens or 'access_token' not in sf_tokens or 'instance_url' not in sf_tokens:
        return jsonify({
            "status": "unauthenticated",
            "message": "Not authenticated with Salesforce"
        })
    
    return jsonify({
        "status": "authenticated",
        "message": "Authenticated with Salesforce",
        "instance_url": sf_tokens.get('instance_url')
    })
