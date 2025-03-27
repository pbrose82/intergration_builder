from flask import Blueprint, render_template, request, jsonify
from simple_salesforce import Salesforce
from app import db
from app.models import SalesforceIntegration, SalesforceIntegrationSchema
import requests
import logging

# Create blueprint
main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """
    Render the main integration setup page
    """
    return render_template('index.html')

@main_bp.route('/test-alchemy-connection', methods=['POST'])
def test_alchemy_connection():
    """
    Test connection to Alchemy LIMS
    """
    try:
        data = request.get_json()
        base_url = data.get('base_url')
        api_key = data.get('api_key')
        
        # Make a test request to Alchemy API
        response = requests.get(
            f"{base_url}/test-connection", 
            headers={'Authorization': f'Bearer {api_key}'}
        )
        
        if response.status_code == 200:
            return jsonify({
                'status': 'success', 
                'message': 'Alchemy LIMS connection successful'
            }), 200
        else:
            return jsonify({
                'status': 'error', 
                'message': 'Failed to connect to Alchemy LIMS'
            }), 400
    except Exception as e:
        logging.error(f"Alchemy connection test failed: {str(e)}")
        return jsonify({
            'status': 'error', 
            'message': f'Connection test error: {str(e)}'
        }), 500

@main_bp.route('/test-salesforce-connection', methods=['POST'])
def test_salesforce_connection():
    """
    Test connection to Salesforce
    """
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        security_token = data.get('security_token')
        domain = data.get('domain', 'test')
        
        # Attempt Salesforce connection
        sf = Salesforce(
            username=username, 
            password=password, 
            security_token=security_token,
            domain=domain
        )
        
        # Basic query to verify connection
        sf.query("SELECT Id FROM User LIMIT 1")
        
        return jsonify({
            'status': 'success', 
            'message': 'Salesforce connection successful'
        }), 200
    except Exception as e:
        logging.error(f"Salesforce connection test failed: {str(e)}")
        return jsonify({
            'status': 'error', 
            'message': f'Connection test error: {str(e)}'
        }), 500

@main_bp.route('/save-integration-config', methods=['POST'])
def save_integration_config():
    """
    Save Salesforce integration configuration
    """
    try:
        data = request.get_json()
        
        # Create new integration configuration
        new_integration = SalesforceIntegration(
            alchemy_base_url=data['alchemy'].get('tenant'),
            alchemy_api_key=data['alchemy'].get('refreshToken') or data['alchemy'].get('password'),
            salesforce_username=data['platformConnection'].get('consumerKey'),  # Replace with what makes sense
            sync_frequency='manual'  # Can be dynamic later
        )
        
        # Set field mappings if provided
        if data.get('fieldMappings'):
            new_integration.set_field_mappings(data['fieldMappings'])
        
        db.session.add(new_integration)
        db.session.commit()
        
        schema = SalesforceIntegrationSchema()
        return jsonify({
            'status': 'success', 
            'message': 'Integration configuration saved',
            'integration': schema.dump(new_integration)
        }), 201
    
    except Exception as e:
        db.session.rollback()
        logging.error(f"Integration save failed: {str(e)}")
        return jsonify({
            'status': 'error', 
            'message': f'Save error: {str(e)}'
        }), 500

@main_bp.route('/sync-data', methods=['POST'])
def sync_data():
    """
    Trigger manual data synchronization
    """
    try:
        # Retrieve the most recent integration configuration
        integration = SalesforceIntegration.query.order_by(
            SalesforceIntegration.created_at.desc()
        ).first()
        
        if not integration:
            return jsonify({
                'status': 'error', 
                'message': 'No integration configuration found'
            }), 404
        
        # Placeholder for actual sync logic
        return jsonify({
            'status': 'success', 
            'message': 'Data synchronization initiated',
            'details': {
                'alchemy_url': integration.alchemy_base_url,
                'salesforce_username': integration.salesforce_username
            }
        }), 200
    
    except Exception as e:
        logging.error(f"Data sync failed: {str(e)}")
        return jsonify({
            'status': 'error', 
            'message': f'Sync error: {str(e)}'
        }), 500

@main_bp.route('/get-alchemy-tenants', methods=['GET'])
def get_alchemy_tenants():
    """
    Return mocked list of Alchemy tenants
    """
    tenants = [
        {"id": "alchemy-prod", "name": "Alchemy Production"},
        {"id": "alchemy-dev", "name": "Alchemy Development"},
        {"id": "alchemy-uat", "name": "Alchemy UAT"}
    ]
    return jsonify(tenants)

@main_bp.route('/get-alchemy-fields', methods=['GET'])
def get_alchemy_fields():
    """
    Return mocked Alchemy field metadata
    """
    fields = [
        {"identifier": "sample_id", "name": "Sample ID"},
        {"identifier": "test_result", "name": "Test Result"},
        {"identifier": "batch_number", "name": "Batch Number"},
        {"identifier": "material_name", "name": "Material Name"}
    ]
    return jsonify(fields)

@main_bp.route('/get-salesforce-fields', methods=['GET'])
def get_salesforce_fields():
    """
    Return mocked Salesforce field metadata
    """
    fields = [
        {"identifier": "account_id", "name": "Account ID"},
        {"identifier": "opportunity_name", "name": "Opportunity Name"},
        {"identifier": "stage", "name": "Stage"},
        {"identifier": "close_date", "name": "Close Date"}
    ]
    return jsonify(fields)
