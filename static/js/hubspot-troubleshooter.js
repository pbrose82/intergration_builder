/**
 * HubSpot Connection Troubleshooter
 * 
 * This script helps troubleshoot HubSpot connection issues.
 * Add this to your config.html page right before the closing </body> tag.
 */

// Create a debug panel in the UI
function createDebugPanel() {
    const debugPanel = document.createElement('div');
    debugPanel.id = 'hubspotDebugPanel';
    debugPanel.style.position = 'fixed';
    debugPanel.style.bottom = '10px';
    debugPanel.style.right = '10px';
    debugPanel.style.width = '400px';
    debugPanel.style.maxHeight = '500px';
    debugPanel.style.overflowY = 'auto';
    debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    debugPanel.style.color = '#00ff00';
    debugPanel.style.padding = '10px';
    debugPanel.style.borderRadius = '5px';
    debugPanel.style.zIndex = '9999';
    debugPanel.style.fontFamily = 'monospace';
    debugPanel.style.fontSize = '12px';
    
    // Add header
    const header = document.createElement('div');
    header.innerHTML = '<h4 style="color: #fff; margin-top: 0;">HubSpot Troubleshooter</h4>';
    debugPanel.appendChild(header);
    
    // Add controls
    const controls = document.createElement('div');
    controls.style.marginBottom = '10px';
    controls.innerHTML = `
        <button id="testHubspotBtn" style="background: #3f88f6; color: white; border: none; padding: 5px 10px; margin-right: 5px; cursor: pointer; border-radius: 3px;">
            Test HubSpot Connection
        </button>
        <button id="getObjectTypesBtn" style="background: #3f88f6; color: white; border: none; padding: 5px 10px; margin-right: 5px; cursor: pointer; border-radius: 3px;">
            Get Object Types
        </button>
        <button id="clearLogBtn" style="background: #666; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">
            Clear Log
        </button>
    `;
    debugPanel.appendChild(controls);
    
    // Add log area
    const logArea = document.createElement('div');
    logArea.id = 'hubspotDebugLog';
    logArea.style.backgroundColor = '#111';
    logArea.style.padding = '10px';
    logArea.style.borderRadius = '3px';
    logArea.style.height = '300px';
    logArea.style.overflowY = 'auto';
    logArea.innerHTML = '<div>HubSpot Troubleshooter loaded. Click buttons above to test.</div>';
    debugPanel.appendChild(logArea);
    
    document.body.appendChild(debugPanel);
    
    // Add event listeners
    document.getElementById('testHubspotBtn').addEventListener('click', testHubSpotConnection);
    document.getElementById('getObjectTypesBtn').addEventListener('click', testGetObjectTypes);
    document.getElementById('clearLogBtn').addEventListener('click', () => {
        document.getElementById('hubspotDebugLog').innerHTML = '<div>Log cleared.</div>';
    });
    
    logToDebug('Troubleshooter initialized');
}

// Log to debug panel
function logToDebug(message, isError = false) {
    const logArea = document.getElementById('hubspotDebugLog');
    if (!logArea) return;
    
    const entry = document.createElement('div');
    entry.style.borderBottom = '1px solid #333';
    entry.style.paddingBottom = '5px';
    entry.style.marginBottom = '5px';
    
    if (isError) {
        entry.style.color = '#ff5555';
        message = '❌ ERROR: ' + message;
    } else if (message.includes('SUCCESS')) {
        entry.style.color = '#55ff55';
    }
    
    const timestamp = new Date().toLocaleTimeString();
    entry.innerHTML = `<span style="color: #999;">[${timestamp}]</span> ${message}`;
    
    logArea.appendChild(entry);
    logArea.scrollTop = logArea.scrollHeight;
}

// Test HubSpot connection using the validation endpoint
function testHubSpotConnection() {
    logToDebug('Testing HubSpot connection...');
    
    // Get token from input
    const accessToken = document.getElementById('hubspotApiKey').value.trim();
    
    if (!accessToken) {
        logToDebug('No HubSpot API Key/Token found in input field', true);
        return;
    }
    
    logToDebug(`Found token: ${accessToken.substring(0, 5)}...`);
    
    // Make request to validation endpoint
    fetch('/hubspot/validate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            access_token: accessToken,
            oauth_mode: true
        })
    })
    .then(response => {
        logToDebug(`Response status: ${response.status} ${response.statusText}`);
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            logToDebug(`✅ SUCCESS: ${data.message || 'Connection successful'}`);
        } else {
            logToDebug(`Failed: ${data.message || 'Unknown error'}`, true);
        }
        
        // Log full response for debugging
        logToDebug(`Full response: ${JSON.stringify(data, null, 2)}`);
    })
    .catch(error => {
        logToDebug(`Request failed: ${error.message}`, true);
    });
}

// Test getting object types
function testGetObjectTypes() {
    logToDebug('Testing getting HubSpot object types...');
    
    // Get token from input
    const accessToken = document.getElementById('hubspotApiKey').value.trim();
    
    if (!accessToken) {
        logToDebug('No HubSpot API Key/Token found in input field', true);
        return;
    }
    
    // Make request to object types endpoint
    fetch('/hubspot/object-types', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            access_token: accessToken,
            oauth_mode: true
        })
    })
    .then(response => {
        logToDebug(`Response status: ${response.status} ${response.statusText}`);
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            const objectCount = data.object_types?.length || 0;
            logToDebug(`✅ SUCCESS: Retrieved ${objectCount} object types`);
            
            // If we got object types, display them
            if (data.object_types && data.object_types.length > 0) {
                const objectList = data.object_types.map(obj => `- ${obj.name} (${obj.id})`).join('<br>');
                logToDebug(`Object types:<br>${objectList}`);
                
                // Try to auto-update the UI
                const objectTypeSelect = document.getElementById('hubspotObjectType');
                if (objectTypeSelect) {
                    logToDebug('Attempting to update object type select...');
                    
                    // Clear existing options
                    objectTypeSelect.innerHTML = '<option value="">-- Select Object Type --</option>';
                    
                    // Add new options
                    data.object_types.forEach(obj => {
                        const option = document.createElement('option');
                        option.value = obj.id;
                        option.textContent = obj.name;
                        objectTypeSelect.appendChild(option);
                    });
                    
                    // Enable select
                    objectTypeSelect.disabled = false;
                    
                    logToDebug('✅ Updated object type select with options');
                } else {
                    logToDebug('Object type select element not found', true);
                }
            }
        } else {
            logToDebug(`Failed: ${data.message || 'Unknown error'}`, true);
        }
    })
    .catch(error => {
        logToDebug(`Request failed: ${error.message}`, true);
    });
}

// Check if we have both jQuery/Bootstrap already on the page
function checkDependencies() {
    let missing = [];
    
    if (typeof $ === 'undefined') {
        missing.push('jQuery');
    }
    
    if (typeof bootstrap === 'undefined') {
        missing.push('Bootstrap');
    }
    
    return missing;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const missingDeps = checkDependencies();
    if (missingDeps.length > 0) {
        console.warn(`HubSpot Troubleshooter: Missing dependencies: ${missingDeps.join(', ')}`);
    }
    
    // Add debug panel with button to toggle
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = '🛠️ Troubleshoot';
    toggleBtn.style.position = 'fixed';
    toggleBtn.style.bottom = '10px';
    toggleBtn.style.right = '10px';
    toggleBtn.style.padding = '10px';
    toggleBtn.style.backgroundColor = '#0047BB';
    toggleBtn.style.color = 'white';
    toggleBtn.style.border = 'none';
    toggleBtn.style.borderRadius = '5px';
    toggleBtn.style.cursor = 'pointer';
    toggleBtn.style.zIndex = '9998';
    
    toggleBtn.addEventListener('click', function() {
        const panel = document.getElementById('hubspotDebugPanel');
        if (panel) {
            // Toggle existing panel
            if (panel.style.display === 'none') {
                panel.style.display = 'block';
            } else {
                panel.style.display = 'none';
            }
        } else {
            // Create panel if it doesn't exist
            createDebugPanel();
        }
    });
    
    document.body.appendChild(toggleBtn);
    
    // Monitor AJAX requests for debugging
    if (typeof $ !== 'undefined') {
        $(document).ajaxSend(function(event, jqXHR, settings) {
            if (settings.url.includes('hubspot')) {
                console.log(`HubSpot AJAX request: ${settings.url}`);
            }
        });
        
        $(document).ajaxSuccess(function(event, jqXHR, settings, data) {
            if (settings.url.includes('hubspot')) {
                console.log(`HubSpot AJAX success: ${settings.url}`, data);
            }
        });
        
        $(document).ajaxError(function(event, jqXHR, settings, error) {
            if (settings.url.includes('hubspot')) {
                console.error(`HubSpot AJAX error: ${settings.url}`, error);
            }
        });
    }
    
    console.log('HubSpot Troubleshooter loaded');
});
