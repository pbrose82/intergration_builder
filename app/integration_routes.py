"""
Routes for saving and managing integrations
"""
from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models import SalesforceIntegration
import logging
import json
from datetime import datetime
import traceback

# Set up logger
logger = logging.getLogger(__name__)

# Create integration blueprint
integration_bp = Blueprint('integration', __name__)

@integration_bp.route('/save-integration', methods=['POST'])
def save_integration():
    """
    Save an integration configuration
    """
    try:
        data = request.get_json()
        logger.info(f"Received integration save request: {json.dumps(data)[:500]}...")
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400
        
        # Check required fields based on platform
        platform = data.get('platform')
        
        if platform not in ['salesforce', 'sap', 'hubspot']:
            return jsonify({
                "status": "error",
                "message": f"Unsupported platform: {platform}"
            }), 400
        
        # Get the Alchemy configuration
        alchemy_config = data.get('alchemy', {})
        
        # Validate Alchemy configuration
        tenant_id = alchemy_config.get('tenant_id')
        record_type = alchemy_config.get('record_type')
        
        if not tenant_id or not record_type:
            return jsonify({
                "status": "error",
                "message": "Missing required Alchemy configuration"
            }), 400
        
        # Get the field mappings
        field_mappings = data.get('field_mappings', [])
        
        if not field_mappings or len(field_mappings) == 0:
            return jsonify({
                "status": "error",
                "message": "No field mappings provided"
            }), 400
        
        # Create a new integration record
        # For now, we're using the SalesforceIntegration model for all integrations
        # In a production environment, you'd want to create platform-specific models
        
        integration = SalesforceIntegration(
            alchemy_base_url=current_app.config.get('ALCHEMY_BASE_URL'),
            alchemy_api_key=current_app.config.get('ALCHEMY_API_KEY'),
            salesforce_username=f"{platform}_integration"  # Using this field to store the platform
        )
        
        # Set sync frequency
        sync_config = data.get('sync_config', {})
        integration.sync_frequency = sync_config.get('frequency', 'daily')
        integration.is_active = sync_config.get('is_active', True)
        
        # Store the platform-specific configuration
        # In a production environment, this would be stored in platform-specific fields
        platform_config = {}
        
        if platform == 'salesforce':
            sf_config = data.get('salesforce', {})
            platform_config = {
                'instance_url': sf_config.get('instance_url'),
                'client_id': sf_config.get('client_id'),
                'client_secret': sf_config.get('client_secret'),
                'username': sf_config.get('username'),
                'password': sf_config.get('password')
            }
        elif platform == 'sap':
            sap_config = data.get('sap', {})
            platform_config = {
                'base_url': sap_config.get('base_url'),
                'client_id': sap_config.get('client_id'),
                'client_secret': sap_config.get('client_secret')
            }
        elif platform == 'hubspot':
            hs_config = data.get('hubspot', {})
            platform_config = {
                'access_token': hs_config.get('access_token'),
                'client_secret': hs_config.get('client_secret'),
                'object_type': hs_config.get('object_type'),
                # System now uses standard identifiers for record matching
                # Default to 'id' as the identifier field unless explicitly specified
                'record_identifier': hs_config.get('record_identifier', 'id')
            }
            
            # Log the HubSpot config
            logger.info(f"HubSpot config: object_type={platform_config['object_type']}, record_identifier={platform_config['record_identifier']}")
        
        # Store Alchemy configuration
        alchemy_config_to_store = {
            'tenant_id': tenant_id,
            'record_type': record_type
        }
        
        # Combine configurations
        full_config = {
            'platform': platform,
            'alchemy': alchemy_config_to_store,
            platform: platform_config,
            'sync_config': sync_config
        }
        
        # Process field mappings to ensure consistent format
        processed_mappings = []
        for mapping in field_mappings:
            processed_mapping = {
                'alchemy_field': mapping.get('alchemy_field'),
                'platform_field': mapping.get('platform_field', mapping.get('hubspot_field', mapping.get('salesforce_field', mapping.get('sap_field'))))
            }
            
            # Include required flag if present
            if 'required' in mapping:
                processed_mapping['required'] = mapping['required']
                
            processed_mappings.append(processed_mapping)
        
        # Store as JSON in the database
        # In a production app, you'd use proper encryption for sensitive values
        integration.field_mappings = json.dumps({
            'config': full_config,
            'mappings': processed_mappings
        })
        
        # Save to database
        db.session.add(integration)
        db.session.commit()
        
        logger.info(f"Saved {platform} integration with ID {integration.id}")
        
        return jsonify({
            "status": "success",
            "message": f"{platform.capitalize()} integration saved successfully",
            "integration_id": integration.id
        })
        
    except Exception as e:
        logger.error(f"Error saving integration: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            "status": "error",
            "message": f"Error: {str(e)}"
        }), 500

@integration_bp.route('/integrations', methods=['GET'])
def list_integrations():
    """
    List all saved integrations
    """
    try:
        integrations = SalesforceIntegration.query.all()
        result = []
        
        for integration in integrations:
            try:
                # Parse the field mappings to extract platform and other info
                mappings_data = json.loads(integration.field_mappings)
                config = mappings_data.get('config', {})
                platform = config.get('platform', 'unknown')
                
                # Get platform-specific details
                platform_config = config.get(platform, {})
                
                # Add to result list
                result.append({
                    'id': integration.id,
                    'platform': platform,
                    'created_at': integration.created_at.isoformat() if integration.created_at else None,
                    'updated_at': integration.updated_at.isoformat() if integration.updated_at else None,
                    'is_active': integration.is_active,
                    'sync_frequency': integration.sync_frequency,
                    'details': {
                        'alchemy_record_type': config.get('alchemy', {}).get('record_type'),
                        'platform_object_type': platform_config.get('object_type') if platform == 'hubspot' else None,
                        'mapping_count': len(mappings_data.get('mappings', []))
                    }
                })
            except Exception as e:
                logger.error(f"Error processing integration {integration.id}: {str(e)}")
                # Continue with next integration
        
        return jsonify({
            'status': 'success',
            'integrations': result
        })
        
    except Exception as e:
        logger.error(f"Error listing integrations: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': f"Error: {str(e)}"
        }), 500

@integration_bp.route('/integration/<int:integration_id>', methods=['GET'])
def get_integration(integration_id):
    """
    Get a specific integration by ID
    """
    try:
        integration = SalesforceIntegration.query.get(integration_id)
        
        if not integration:
            return jsonify({
                'status': 'error',
                'message': f"Integration with ID {integration_id} not found"
            }), 404
        
        # Parse the field mappings to extract configuration and mappings
        mappings_data = json.loads(integration.field_mappings)
        config = mappings_data.get('config', {})
        mappings = mappings_data.get('mappings', [])
        platform = config.get('platform', 'unknown')
        
        # Build response
        response = {
            'id': integration.id,
            'platform': platform,
            'created_at': integration.created_at.isoformat() if integration.created_at else None,
            'updated_at': integration.updated_at.isoformat() if integration.updated_at else None,
            'is_active': integration.is_active,
            'sync_frequency': integration.sync_frequency,
            'alchemy_config': config.get('alchemy', {}),
            'platform_config': config.get(platform, {}),
            'field_mappings': mappings
        }
        
        return jsonify({
            'status': 'success',
            'integration': response
        })
        
    except Exception as e:
        logger.error(f"Error getting integration {integration_id}: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': f"Error: {str(e)}"
        }), 500

@integration_bp.route('/integration/<int:integration_id>', methods=['DELETE'])
def delete_integration(integration_id):
    """
    Delete an integration by ID
    """
    try:
        integration = SalesforceIntegration.query.get(integration_id)
        
        if not integration:
            return jsonify({
                'status': 'error',
                'message': f"Integration with ID {integration_id} not found"
            }), 404
        
        # Delete the integration
        db.session.delete(integration)
        db.session.commit()
        
        logger.info(f"Deleted integration with ID {integration_id}")
        
        return jsonify({
            'status': 'success',
            'message': f"Integration with ID {integration_id} deleted successfully"
        })
        
    except Exception as e:
        logger.error(f"Error deleting integration {integration_id}: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': f"Error: {str(e)}"
        }), 500
