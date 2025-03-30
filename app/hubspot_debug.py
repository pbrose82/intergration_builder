"""
HubSpot Debug Route for Flask

Add this code to your Flask application to create a dedicated debug endpoint
that directly tests HubSpot API integration and displays the results.

Usage:
1. Add this route to your existing Flask app
2. Access /hubspot-debug in your browser
3. Enter your HubSpot token and test the integration
"""

from flask import Blueprint, render_template_string, request, jsonify
import requests
import logging
import json

# Create a blueprint for debugging routes
hubspot_debug_bp = Blueprint('hubspot_debug', __name__)

# HTML template for the debug page
DEBUG_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>HubSpot API Debug</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; }
        .container { border: 1px solid #ddd; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .result { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 15px; 
                 max-height: 400px; overflow-y: auto; font-family: monospace; white-space: pre-wrap; }
        .success { color: green; }
        .error { color: red; }
        input[type="text"], input[type="password"] { width: 100%; padding: 8px; margin: 5px 0 15px 0; }
        button { background-color: #0077cc; color: white; border: none; padding: 10px 15px; 
                cursor: pointer; margin-right: 5px; }
        h1, h2 { margin-top: 0; }
        .hidden { display: none; }
    </style>
</head>
<body>
    <h1>HubSpot API Debug Tool</h1>
    <p>This page allows you to test HubSpot API integration directly.</p>
    
    <div class="container">
        <h2>Enter HubSpot Token</h2>
        <form id="tokenForm">
            <input type="password" id="hubspotToken" placeholder="Enter your HubSpot token (starts with pat-)" required>
            <button type="button" onclick="toggleToken()">Show/Hide</button>
            <button type="submit">Test Connection</button>
        </form>
    </div>
    
    <div id="connectionResult" class="container hidden">
        <h2>Connection Test Result</h2>
        <div id="connectionOutput" class="result"></div>
    </div>
    
    <div id="objectTypesContainer" class="container hidden">
        <h2>HubSpot Object Types</h2>
        <div id="objectTypesOutput" class="result"></div>
        
        <h3>Test Object Fields</h3>
        <form id="fieldsForm">
            <select id="objectTypeSelect">
                <option value="contact">Contact</option>
                <option value="company">Company</option>
                <option value="deal">Deal</option>
                <option value="ticket">Ticket</option>
                <option value="product">Product</option>
            </select>
            <button type="submit">Get Fields</button>
        </form>
    </div>
    
    <div id="fieldsResult" class="container hidden">
        <h2>Fields Result</h2>
        <div id="fieldsOutput" class="result"></div>
    </div>
    
    <script>
        // Toggle token visibility
        function toggleToken() {
            const tokenInput = document.getElementById('hubspotToken');
            tokenInput.type = tokenInput.type === 'password' ? 'text' : 'password';
        }
        
        // Test connection
        document.getElementById('tokenForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const token = document.getElementById('hubspotToken').value.trim();
            if (!token) return;
            
            // Show loading
            const connectionOutput = document.getElementById('connectionOutput');
            connectionOutput.textContent = 'Testing connection...';
            document.getElementById('connectionResult').classList.remove('hidden');
            
            // Make API request to test endpoint
            fetch('/hubspot-debug/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: token })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    connectionOutput.innerHTML = '<span class="success">✓ Connection successful!</span><br>' + 
                                               JSON.stringify(data.data, null, 2);
                    document.getElementById('objectTypesContainer').classList.remove('hidden');
                    
                    // Display object types
                    const objectTypesOutput = document.getElementById('objectTypesOutput');
                    objectTypesOutput.textContent = JSON.stringify(data.object_types, null, 2);
                } else {
                    connectionOutput.innerHTML = '<span class="error">✗ Connection failed!</span><br>' + 
                                               JSON.stringify(data.error, null, 2);
                }
            })
            .catch(error => {
                connectionOutput.innerHTML = '<span class="error">✗ Error!</span><br>' + error.message;
            });
        });
        
        // Get fields for object type
        document.getElementById('fieldsForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const token = document.getElementById('hubspotToken').value.trim();
            const objectType = document.getElementById('objectTypeSelect').value;
            
            // Show loading
            const fieldsOutput = document.getElementById('fieldsOutput');
            fieldsOutput.textContent = 'Fetching fields...';
            document.getElementById('fieldsResult').classList.remove('hidden');
            
            // Make API request to fields endpoint
            fetch('/hubspot-debug/get-fields', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: token, object_type: objectType })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    fieldsOutput.innerHTML = '<span class="success">✓ Fields retrieved successfully!</span><br>' + 
                                           `Found ${data.fields.length} fields.<br><br>` +
                                           JSON.stringify(data.fields, null, 2);
                } else {
                    fieldsOutput.innerHTML = '<span class="error">✗ Failed to retrieve fields!</span><br>' + 
                                           JSON.stringify(data.error, null, 2);
                }
            })
            .catch(error => {
                fieldsOutput.innerHTML = '<span class="error">✗ Error!</span><br>' + error.message;
            });
        });
    </script>
</body>
</html>
"""

@hubspot_debug_bp.route('/hubspot-debug')
def hubspot_debug_page():
    """Render the debug page"""
    return render_template_string(DEBUG_TEMPLATE)

@hubspot_debug_bp.route('/hubspot-debug/test-connection', methods=['POST'])
def test_connection():
    """Test HubSpot API connection"""
    data = request.get_json()
    token = data.get('token')
    
    if not token:
        return jsonify({'success': False, 'error': 'No token provided'})
    
    try:
        # Define standard object types
        standard_objects = [
            {"id": "contact", "name": "Contact"},
            {"id": "company", "name": "Company"},
            {"id": "deal", "name": "Deal"},
            {"id": "ticket", "name": "Ticket"},
            {"id": "product", "name": "Product"}
        ]
        
        # Test API access
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # Make a simple request to get a contact
        response = requests.get("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", headers=headers)
        
        if response.status_code != 200:
            return jsonify({
                'success': False, 
                'error': {
                    'status': response.status_code,
                    'message': 'Failed to connect to HubSpot API',
                    'response': response.json() if response.text else None
                }
            })
        
        # Successfully connected
        return jsonify({
            'success': True,
            'data': response.json(),
            'object_types': standard_objects
        })
        
    except Exception as e:
        logging.error(f"Error testing HubSpot connection: {str(e)}")
        return jsonify({
            'success': False,
            'error': {
                'message': str(e)
            }
        })

@hubspot_debug_bp.route('/hubspot-debug/get-fields', methods=['POST'])
def get_fields():
    """Get fields for a specified object type"""
    data = request.get_json()
    token = data.get('token')
    object_type = data.get('object_type', 'contact')
    
    if not token:
        return jsonify({'success': False, 'error': 'No token provided'})
    
    try:
        # Test API access
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # Get properties for the object type
        response = requests.get(f"https://api.hubapi.com/crm/v3/properties/{object_type}", headers=headers)
        
        if response.status_code != 200:
            return jsonify({
                'success': False, 
                'error': {
                    'status': response.status_code,
                    'message': f'Failed to get fields for {object_type}',
                    'response': response.json() if response.text else None
                }
            })
        
        # Successfully got fields
        fields_data = response.json()
        fields = fields_data.get('results', [])
        
        return jsonify({
            'success': True,
            'fields': fields
        })
        
    except Exception as e:
        logging.error(f"Error getting HubSpot fields: {str(e)}")
        return jsonify({
            'success': False,
            'error': {
                'message': str(e)
            }
        })

# Add this blueprint to your Flask app
# Example:
# from app import app
# app.register_blueprint(hubspot_debug_bp)
