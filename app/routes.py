from flask import Blueprint, render_template, request, jsonify
from app import db
from app.models import SalesforceIntegration, SalesforceIntegrationSchema
from services.alchemy_service import (
    get_alchemy_access_token,
    get_alchemy_record_types,
    fetch_alchemy_fields
)
import logging

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

@main_bp.route('/get-alchemy-fields', methods=['POST'])
def get_fields():
    try:
        data = request.get_json()
        tenant_id = data.get("tenant_id")
        refresh_token = data.get("refresh_token")
        record_type = data.get("record_type")

        if not tenant_id or not refresh_token or not record_type:
            return jsonify({"error": "Missing one or more required fields"}), 400

        fields = fetch_alchemy_fields(tenant_id, refresh_token, record_type)
        return jsonify({"fields": fields})
    except Exception as e:
        logging.error(f"Failed to fetch fields: {str(e)}")
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

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
