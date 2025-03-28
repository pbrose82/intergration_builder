"""
Routes for saving and managing integrations
"""
from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models import SalesforceIntegration
import logging
import json
from datetime import datetime

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
        
        # Store the field mappings as JSON
        mapping_json = json.dumps(field_mappings)
        integration.field_mappings = mapping_json
        
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
                'api_key': hs_config.get('api_key'),
                'portal_id': hs_config.get('portal_id'),
                'object_type': hs_config.get('object_type')
            }
        
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
        
        # Store as JSON in the database
        # In a production app, you'd use proper encryption for sensitive values
        integration.field_mappings = json.dumps({
            'config': full_config,
            'mappings': field_mappings
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
        return jsonify({
            "status": "error",
            "message": f"Error: {str(e)}"
        }), 500
