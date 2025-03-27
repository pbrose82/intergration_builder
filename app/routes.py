from flask import Blueprint, render_template, request, jsonify
from app import db
from app.models import IntegrationConfig
import json

# Create a blueprint for main routes
main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """
    Render the main index page for the integration platform
    """
    return render_template('index.html')

@main_bp.route('/save-integration-config', methods=['POST'])
def save_integration_config():
    """
    Save integration configuration to the database
    
    Returns:
        JSON response indicating success or failure
    """
    try:
        # Get JSON data from request
        config_data = request.get_json()
        
        # Create new integration configuration
        new_config = IntegrationConfig(
            platform=config_data.get('platform'),
            alchemy_config=json.dumps(config_data.get('alchemy', {})),
            platform_connection=json.dumps(config_data.get('platformConnection', {})),
            field_mappings=json.dumps(config_data.get('fieldMappings', []))
        )
        
        # Add and commit to database
        db.session.add(new_config)
        db.session.commit()
        
        return jsonify({
            'status': 'success', 
            'message': 'Integration configuration saved',
            'config_id': new_config.id
        }), 201
    
    except Exception as e:
        # Rollback the session and return error
        db.session.rollback()
        return jsonify({
            'status': 'error', 
            'message': str(e)
        }), 400

@main_bp.route('/get-alchemy-tenants', methods=['GET'])
def get_alchemy_tenants():
    """
    Retrieve list of Alchemy tenants (mock data for now)
    
    Returns:
        JSON list of tenants
    """
    # In a real implementation, this would query actual Alchemy API
    tenants = [
        {'id': 'tenant1', 'name': 'Primary Research Lab'},
        {'id': 'tenant2', 'name': 'Diagnostics Center'}
    ]
    return jsonify(tenants)

@main_bp.route('/get-alchemy-fields', methods=['GET'])
def get_alchemy_fields():
    """
    Retrieve list of Alchemy LIMS fields
    
    Returns:
        JSON list of fields
    """
    # Mock fields - would be dynamically fetched from Alchemy LIMS
    fields = [
        {'identifier': 'sample_id', 'name': 'Sample ID'},
        {'identifier': 'test_type', 'name': 'Test Type'},
        {'identifier': 'client_name', 'name': 'Client Name'},
        {'identifier': 'result_status', 'name': 'Result Status'}
    ]
    return jsonify(fields)

@main_bp.route('/get-sap-fields', methods=['GET'])
def get_sap_fields():
    """
    Retrieve SAP fields for mapping
    
    Returns:
        JSON list of fields
    """
    fields = [
        {'identifier': 'order_number', 'name': 'Order Number'},
        {'identifier': 'customer_id', 'name': 'Customer ID'},
        {'identifier': 'material_code', 'name': 'Material Code'}
    ]
    return jsonify(fields)

@main_bp.route('/get-salesforce-fields', methods=['GET'])
def get_salesforce_fields():
    """
    Retrieve Salesforce fields for mapping
    
    Returns:
        JSON list of fields
    """
    fields = [
        {'identifier': 'lead_id', 'name': 'Lead ID'},
        {'identifier': 'contact_name', 'name': 'Contact Name'},
        {'identifier': 'opportunity_id', 'name': 'Opportunity ID'}
    ]
    return jsonify(fields)

@main_bp.route('/get-hubspot-fields', methods=['GET'])
def get_hubspot_fields():
    """
    Retrieve HubSpot fields for mapping
    
    Returns:
        JSON list of fields
    """
    fields = [
        {'identifier': 'company_id', 'name': 'Company ID'},
        {'identifier': 'deal_id', 'name': 'Deal ID'},
        {'identifier': 'contact_email', 'name': 'Contact Email'}
    ]
    return jsonify(fields)
