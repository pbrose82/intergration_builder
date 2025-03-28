"""
Routes for HubSpot integration with OAuth support
"""
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
                    "message": "Missing access token"
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
                    "message": "Missing API key"
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

@hubspot_bp.route('/records', methods=['POST'])
def get_records():
    """
    Get records from HubSpot for a specific object type
    """
    try:
        data = request.get_json()
        
        # Check if using OAuth mode
        oauth_mode = data.get('oauth_mode', False)
        object_type = data.get('object_type')
        limit = data.get('limit', 50)
        after = data.get('after')  # Pagination cursor
        properties = data.get('properties')  # Optional list of property names
        
        if not object_type:
            logger.error("Missing object type in records request")
            return jsonify({
                "status": "error",
                "message": "Missing object type",
                "records": [],
                "paging": None
            }), 400
        
        if oauth_mode:
            access_token = data.get('access_token')
            client_secret = data.get('client_secret')
            
            if not access_token:
                logger.error("Missing access token in records request")
                return jsonify({
                    "status": "error",
                    "message": "Missing access token",
                    "records": [],
                    "paging": None
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
                logger.error("Missing API key in records request")
                return jsonify({
                    "status": "error",
                    "message": "Missing API key",
                    "records": [],
                    "paging": None
                }), 400
            
            # Create service with API key - remove any whitespace
            hubspot_service = get_hubspot_service(access_token=api_key.strip() if api_key else None)
        
        logger.info(f"Fetching HubSpot records for object type: {object_type}, limit: {limit}")
        
        # Get records
        result = hubspot_service.get_records(
            object_type=object_type,
            limit=limit,
            properties=properties,
            after=after
        )
        
        if result.get("error"):
            logger.error(f"Error fetching records: {result['error']}")
            return jsonify({
                "status": "error",
                "message": result["error"],
                "records": [],
                "paging": None
            })
        
        records = result.get("results", [])
        paging = result.get("paging")
        
        return jsonify({
            "status": "success",
            "message": f"Successfully retrieved {len(records)} records",
            "records": records,
            "paging": paging
        })
    
    except Exception as e:
        logger.error(f"Error getting HubSpot records: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            "status": "error",
            "message": f"Error: {str(e)}",
            "records": [],
            "paging": None
        }), 500

@hubspot_bp.route('/search', methods=['POST'])
def search_records():
    """
    Search for records in HubSpot with filtering
    """
    try:
        data = request.get_json()
        
        # Check if using OAuth mode
        oauth_mode = data.get('oauth_mode', False)
        object_type = data.get('object_type')
        filter_groups = data.get('filter_groups')
        sorts = data.get('sorts')
        limit = data.get('limit', 50)
        after = data.get('after')  # Pagination cursor
        properties = data.get('properties')  # Optional list of property names
        
        if not object_type:
            logger.error("Missing object type in search request")
            return jsonify({
                "status": "error",
                "message": "Missing object type",
                "records": [],
                "paging": None
            }), 400
        
        if oauth_mode:
            access_token = data.get('access_token')
            client_secret = data.get('client_secret')
            
            if not access_token:
                logger.error("Missing access token in search request")
                return jsonify({
                    "status": "error",
                    "message": "Missing access token",
                    "records": [],
                    "paging": None
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
                logger.error("Missing API key in search request")
                return jsonify({
                    "status": "error",
                    "message": "Missing API key",
                    "records": [],
                    "paging": None
                }), 400
            
            # Create service with API key - remove any whitespace
            hubspot_service = get_hubspot_service(access_token=api_key.strip() if api_key else None)
        
        logger.info(f"Searching HubSpot records for object type: {object_type}, limit: {limit}")
        
        # Search records
        result = hubspot_service.search_records(
            object_type=object_type,
            filter_groups=filter_groups,
            sorts=sorts,
            properties=properties,
            limit=limit,
            after=after
        )
        
        if result.get("error"):
            logger.error(f"Error searching records: {result['error']}")
            return jsonify({
                "status": "error",
                "message": result["error"],
                "records": [],
                "paging": None
            })
        
        records = result.get("results", [])
        paging = result.get("paging")
        
        return jsonify({
            "status": "success",
            "message": f"Successfully found {len(records)} records",
            "records": records,
            "paging": paging
        })
    
    except Exception as e:
        logger.error(f"Error searching HubSpot records: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            "status": "error",
            "message": f"Error: {str(e)}",
            "records": [],
            "paging": None
        }), 500

@hubspot_bp.route('/test-mapping', methods=['POST'])
def test_mapping():
    """
    Test a field mapping between Alchemy and HubSpot
    """
    try:
        data = request.get_json()
        
        # Get mapping details
        field_mappings = data.get('field_mappings', [])
        sample_data = data.get('sample_data', {})
        
        if not field_mappings:
            logger.error("No field mappings provided for testing")
            return jsonify({
                "status": "error",
                "message": "No field mappings provided"
            }), 400
        
        if not sample_data:
            logger.error("No sample data provided for testing")
            return jsonify({
                "status": "error",
                "message": "No sample data provided"
            }), 400
        
        # Test the mapping
        mapped_data = {}
        mapping_issues = []
        
        for mapping in field_mappings:
            alchemy_field = mapping.get('alchemy_field')
            hubspot_field = mapping.get('hubspot_field')
            required = mapping.get('required', False)
            
            if not alchemy_field or not hubspot_field:
                mapping_issues.append({
                    "field": alchemy_field or "unknown",
                    "issue": "Missing either Alchemy or HubSpot field identifier"
                })
                continue
            
            # Check if the Alchemy field exists in the sample data
            if alchemy_field not in sample_data:
                if required:
                    mapping_issues.append({
                        "field": alchemy_field,
                        "issue": "Required field missing in sample data"
                    })
                continue
            
            # Perform any necessary data transformations
            # (For now, just copy the value)
            value = sample_data.get(alchemy_field)
            mapped_data[hubspot_field] = value
        
        return jsonify({
            "status": "success",
            "message": "Field mapping test completed",
            "mapped_data": mapped_data,
            "mapping_issues": mapping_issues,
            "is_valid": len(mapping_issues) == 0
        })
    
    except Exception as e:
        logger.error(f"Error testing field mapping: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            "status": "error",
            "message": f"Error: {str(e)}"
        }), 500

@hubspot_bp.route('/validate-mapping', methods=['POST'])
def validate_mapping():
    """
    Validate a field mapping configuration
    """
    try:
        data = request.get_json()
        
        # Get mapping details
        field_mappings = data.get('field_mappings', [])
        object_type = data.get('object_type')
        
        if not field_mappings:
            logger.error("No field mappings provided for validation")
            return jsonify({
                "status": "error",
                "message": "No field mappings provided"
            }), 400
        
        if not object_type:
            logger.error("No object type provided for validation")
            return jsonify({
                "status": "error",
                "message": "No object type provided"
            }), 400
        
        # Check if using OAuth mode
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
            
            # Create service with OAuth credentials - remove any whitespace
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
            
            # Create service with API key - remove any whitespace
            hubspot_service = get_hubspot_service(access_token=api_key.strip() if api_key else None)
        
        # Get fields for the object type to validate the mapping
        fields = hubspot_service.get_fields_for_object(object_type)
        field_names = [field.get('identifier') for field in fields]
        
        # Validate the mapping
        validation_issues = []
        
        for i, mapping in enumerate(field_mappings):
            alchemy_field = mapping.get('alchemy_field')
            hubspot_field = mapping.get('hubspot_field')
            required = mapping.get('required', False)
            
            if not alchemy_field:
                validation_issues.append({
                    "index": i,
                    "issue": "Missing Alchemy field identifier"
                })
            
            if not hubspot_field:
                validation_issues.append({
                    "index": i,
                    "issue": "Missing HubSpot field identifier"
                })
                continue
            
            # Check if the HubSpot field exists
            if hubspot_field not in field_names:
                validation_issues.append({
                    "index": i,
                    "field": hubspot_field,
                    "issue": f"HubSpot field '{hubspot_field}' does not exist for object type '{object_type}'"
                })
        
        # Check for duplicate mappings
        hubspot_fields = [mapping.get('hubspot_field') for mapping in field_mappings if mapping.get('hubspot_field')]
        duplicate_fields = [field for field in set(hubspot_fields) if hubspot_fields.count(field) > 1]
        
        for field in duplicate_fields:
            validation_issues.append({
                "field": field,
                "issue": f"Duplicate mapping for HubSpot field '{field}'"
            })
        
        # Required fields for different object types
        required_fields = {
            "contact": ["email"],
            "company": ["name"],
            "deal": ["dealname"]
        }
        
        # Check if all required fields are mapped
        if object_type in required_fields:
            mapped_hubspot_fields = set(hubspot_fields)
            for required_field in required_fields[object_type]:
                if required_field not in mapped_hubspot_fields:
                    validation_issues.append({
                        "field": required_field,
                        "issue": f"Required HubSpot field '{required_field}' is not mapped"
                    })
        
        return jsonify({
            "status": "success",
            "message": "Field mapping validation completed",
            "validation_issues": validation_issues,
            "is_valid": len(validation_issues) == 0
        })
    
    except Exception as e:
        logger.error(f"Error validating field mapping: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            "status": "error",
            "message": f"Error: {str(e)}"
        }), 500
