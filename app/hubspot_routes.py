"""
Routes for HubSpot integration
"""
from flask import Blueprint, request, jsonify, current_app
from services.hubspot_service import get_hubspot_service
import logging

# Set up logger
logger = logging.getLogger(__name__)

# Create a blueprint for HubSpot routes
hubspot_bp = Blueprint('hubspot', __name__, url_prefix='/hubspot')

@hubspot_bp.route('/validate', methods=['POST'])
def validate_hubspot():
    """
    Validate HubSpot API credentials
    """
    try:
        data = request.get_json()
        api_key = data.get('api_key')
        portal_id = data.get('portal_id')  # We'll store this but it's not used for API auth
        
        if not api_key:
            return jsonify({
                "status": "error",
                "message": "Missing API key"
            }), 400
        
        # Log the request (mask the API key for security)
        masked_key = api_key[:5] + "..." if len(api_key) > 5 else "***"
        logger.info(f"Validating HubSpot credentials with API key {masked_key} for portal {portal_id}")
        
        # Validate credentials
        hubspot_service = get_hubspot_service(api_key=api_key)
        is_valid, message = hubspot_service.validate_credentials()
        
        if is_valid:
            return jsonify({
                "status": "success",
                "message": message
            })
        else:
            return jsonify({
                "status": "error",
                "message": message
            })
    
    except Exception as e:
        logger.error(f"Error validating HubSpot credentials: {str(e)}")
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
        api_key = data.get('api_key')
        
        if not api_key:
            return jsonify({
                "status": "error",
                "message": "Missing API key"
            }), 400
        
        logger.info(f"Fetching HubSpot object types")
        
        # Get object types
        hubspot_service = get_hubspot_service(api_key=api_key)
        object_types = hubspot_service.get_object_types()
        
        if object_types:
            return jsonify({
                "status": "success",
                "message": f"Successfully retrieved {len(object_types)} object types",
                "object_types": object_types
            })
        else:
            return jsonify({
                "status": "warning",
                "message": "No object types found or error occurred",
                "object_types": []
            })
    
    except Exception as e:
        logger.error(f"Error getting HubSpot object types: {str(e)}")
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
        api_key = data.get('api_key')
        object_type = data.get('object_type')
        
        if not api_key or not object_type:
            return jsonify({
                "status": "error",
                "message": "Missing API key or object type",
                "fields": []
            }), 400
        
        logger.info(f"Fetching HubSpot fields for object type: {object_type}")
        
        # Get fields
        hubspot_service = get_hubspot_service(api_key=api_key)
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
            
            return jsonify({
                "status": "warning",
                "message": f"Using fallback fields for {object_type}",
                "fields": fallback_fields
            })
    
    except Exception as e:
        logger.error(f"Error getting HubSpot fields: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error: {str(e)}",
            "fields": []
        }), 500
