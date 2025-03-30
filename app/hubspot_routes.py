# app/hubspot_routes.py (updated)
from flask import Blueprint, request, jsonify, current_app
from services.hubspot_service import get_hubspot_service
import logging
import traceback

# Set up logger
logger = logging.getLogger(__name__)

# Create a blueprint for HubSpot routes
hubspot_bp = Blueprint('hubspot', __name__, url_prefix='/hubspot')

@hubspot_bp.route('/validate', methods=['POST'])
def validate_hubspot():
    """
    Validate HubSpot API credentials - supports both API key and OAuth
    """
    try:
        data = request.get_json()
        
        # Check if using OAuth mode (access token) or API key
        oauth_mode = data.get('oauth_mode', False)
        
        if oauth_mode:
            access_token = data.get('access_token')
            client_secret = data.get('client_secret')
            
            if not access_token:
                logger.error("Missing access token in validation request")
                return jsonify({
                    "status": "error",
                    "message": "Missing access token"
                }), 400
            
            # Log the request (mask the token for security)
            masked_token = access_token[:5] + "..." if len(access_token) > 5 else "***"
            logger.info(f"Validating HubSpot OAuth credentials with token {masked_token}")
            
            # Validate credentials - remove any whitespace
            hubspot_service = get_hubspot_service(
                access_token=access_token.strip() if access_token else None, 
                client_secret=client_secret.strip() if client_secret else None, 
                oauth_mode=True
            )
        else:
            api_key = data.get('api_key')
            if not api_key:
                logger.error("Missing API key in validation request")
                return jsonify({
                    "status": "error",
                    "message": "Missing API key"
                }), 400
            
            # Log the request (mask the API key for security)
            masked_key = api_key[:5] + "..." if len(api_key) > 5 else "***"
            logger.info(f"Validating HubSpot API key {masked_key}")
            
            # Validate credentials - remove any whitespace
            hubspot_service = get_hubspot_service(access_token=api_key.strip() if api_key else None)
        
        is_valid, message = hubspot_service.validate_credentials()
        
        if is_valid:
            return jsonify({
                "status": "success",
                "message": message
            })
        else:
            logger.warning(f"HubSpot validation failed: {message}")
            return jsonify({
                "status": "error",
                "message": message
            })
    
    except Exception as e:
        logger.error(f"Error validating HubSpot credentials: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            "status": "error",
            "message": f"Error: {str(e)}"
        }), 500

@hubspot_bp.route('/object-types', methods=['POST'])
def get_object_types():
    """
    Get available object types from HubSpot
    """
    try:
        data = request.get_json()
        
        # Check if using OAuth mode
        oauth_mode = data.get('oauth_mode', False)
        
        if oauth_mode:
            access_token = data.get('access_token')
            client_secret = data.get('client_secret')
            
            if not access_token:
                logger.error("Missing access token for object types request")
                return jsonify({
                    "status": "error",
                    "message": "Missing access token",
                    "object_types": []
                }), 400
            
            # Create service with OAuth credentials - remove any whitespace
            hubspot_service = get_hubspot_service(
                access_token=access_token.strip() if access_token else None, 
                client_secret=client_secret.strip() if client_secret else None, 
                oauth_mode=True
            )
        else:
            api_key = data.get('api_key')
            if not api_key:
                logger.error("Missing API key for object types request")
                return jsonify({
                    "status": "error",
                    "message": "Missing API key",
                    "object_types": []
                }), 400
            
            # Create service with API key - remove any whitespace
            hubspot_service = get_hubspot_service(access_token=api_key.strip() if api_key else None)
        
        logger.info(f"Fetching HubSpot object types")
        
        # Get object types
        object_types = hubspot_service.get_object_types()
        
        if object_types:
            return jsonify({
                "status": "success",
                "message": f"Successfully retrieved {len(object_types)} object types",
                "object_types": object_types
            })
        else:
            logger.warning("No object types found or error occurred")
            return jsonify({
                "status": "warning",
                "message": "No object types found or error occurred",
                "object_types": []
            })
    
    except Exception as e:
        logger.error(f"Error getting HubSpot object types: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            "status": "error",
            "message": f"Error: {str(e)}",
            "object_types": []
        }), 500

@hubspot_bp.route('/fields', methods=['POST'])
def get_fields():
    """
    Get available fields for a HubSpot object type
    """
    try:
        data = request.get_json()
        
        # Check if using OAuth mode
        oauth_mode = data.get('oauth_mode', False)
        object_type = data.get('object_type')
        
        if not object_type:
            logger.error("Missing object type in fields request")
            return jsonify({
                "status": "error",
                "message": "Missing object type",
                "fields": []
            }), 400
        
        if oauth_mode:
            access_token = data.get('access_token')
            client_secret = data.get('client_secret')
            
            if not access_token:
                logger.error("Missing access token in fields request")
                return jsonify({
                    "status": "error",
                    "message": "Missing access token",
                    "fields": []
                }), 400
            
            # Create service with OAuth credentials - remove any whitespace
            hubspot_service = get_hubspot_service(
                access_token=access_token.strip() if access_token else None, 
                client_secret=client_secret.strip() if client_secret else None, 
                oauth_mode=True
            )
        else:
            api_key = data.get('api_key')
            if not api_key:
                logger.error("Missing API key in fields request")
                return jsonify({
                    "status": "error",
                    "message": "Missing API key",
                    "fields": []
                }), 400
            
            # Create service with API key - remove any whitespace
            hubspot_service = get_hubspot_service(access_token=api_key.strip() if api_key else None)
        
        logger.info(f"Fetching HubSpot fields for object type: {object_type}")
        
        # Get fields
        fields = hubspot_service.get_fields_for_object(object_type)
        
        if fields:
            return jsonify({
                "status": "success",
                "message": f"Successfully retrieved {len(fields)} fields for {object_type}",
                "fields": fields
            })
        else:
            # Return fallback fields based on object type
            fallback_fields = [
                {"identifier": "firstname", "name": "First Name"},
                {"identifier": "lastname", "name": "Last Name"},
                {"identifier": "email", "name": "Email"},
                {"identifier": "phone", "name": "Phone Number"}
            ]
            
            logger.warning(f"Using fallback fields for {object_type}")
            return jsonify({
                "status": "warning",
                "message": f"Using fallback fields for {object_type}",
                "fields": fallback_fields
            })
    
    except Exception as e:
        logger.error(f"Error getting HubSpot fields: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            "status": "error",
            "message": f"Error: {str(e)}",
            "fields": []
        }), 500
