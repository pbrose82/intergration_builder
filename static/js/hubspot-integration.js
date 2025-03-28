/**
 * HubSpot Integration JavaScript
 * Handles HubSpot-specific integration logic
 */

// Global variables
let hubspotObjectTypes = [];
let hubspotFields = [];

// Initialize HubSpot integration
document.addEventListener('DOMContentLoaded', function() {
    console.log('HubSpot integration script loaded');
    
    // Check if on HubSpot configuration page
    const isHubSpotConfig = window.location.href.includes('platform=hubspot');
    if (!isHubSpotConfig) return;
    
    console.log('Initializing HubSpot integration UI');
    
    // Add HubSpot specific elements to the UI
    setupHubSpotUI();
    
    // Set up event handlers
    const validateBtn = document.getElementById('validateHubspotBtn');
    if (validateBtn) {
        validateBtn.addEventListener('click', function() {
            console.log('Validate HubSpot button clicked');
            validateHubSpotCredentials();
        });
    }
    
    const fetchObjectsBtn = document.getElementById('fetchHubspotObjectsBtn');
    if (fetchObjectsBtn) {
        fetchObjectsBtn.addEventListener('click', function() {
            fetchHubSpotObjectTypes();
        });
    }
    
    // Handle object type selection
    const objectTypeSelect = document.getElementById('hubspotObjectType');
    if (objectTypeSelect) {
        objectTypeSelect.addEventListener('change', function() {
            const selectedType = this.value;
            if (selectedType) {
                const fetchFieldsBtn = document.getElementById('fetchHubspotFieldsBtn');
                if (fetchFieldsBtn) {
                    fetchFieldsBtn.disabled = false;
                }
                
                const objectTypeLabel = document.getElementById('hubspotObjectTypeLabel');
                if (objectTypeLabel) {
                    objectTypeLabel.textContent = selectedType;
                }
            } else {
                const fetchFieldsBtn = document.getElementById('fetchHubspotFieldsBtn');
                if (fetchFieldsBtn) {
                    fetchFieldsBtn.disabled = true;
                }
            }
        });
    }
    
    // Handle field fetch button
    const fetchFieldsBtn = document.getElementById('fetchHubspotFieldsBtn');
    if (fetchFieldsBtn) {
        fetchFieldsBtn.addEventListener('click', function() {
            const objectTypeSelect = document.getElementById('hubspotObjectType');
            if (objectTypeSelect && objectTypeSelect.value) {
                fetchHubSpotFields(objectTypeSelect.value);
            }
        });
    }
    
    // Override save button for HubSpot
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            saveHubSpotIntegration();
        });
    }
});

// Setup HubSpot specific UI elements
function setupHubSpotUI() {
    // Add HubSpot object type selection
    const hubspotConfig = document.getElementById('hubspotConfig');
    
    if (hubspotConfig) {
        // Check if validate button already exists
        if (!document.getElementById('validateHubspotBtn')) {
            // Add validate button (now handled by the HTML)
            console.log('Adding validate button UI');
        }
        
        // Add HubSpot object type selection
        if (!document.getElementById('hubspotObjectContainer')) {
            // Create element container
            const objectContainer = document.createElement('div');
            objectContainer.id = 'hubspotObjectContainer';
            objectContainer.className = 'mt-4';
            objectContainer.style.display = 'none';
            
            objectContainer.innerHTML = `
                <h5 class="mb-3">HubSpot Object Type</h5>
                <div class="mb-3">
                    <label for="hubspotObjectType" class="form-label">Select Object Type</label>
                    <div class="input-group">
                        <select class="form-select" id="hubspotObjectType" disabled>
                            <option value="">-- Select Object Type --</option>
                        </select>
                        <button class="btn btn-outline-secondary" type="button" id="fetchHubspotObjectsBtn" disabled>
                            <i class="fas fa-sync-alt me-2"></i>Refresh Object Types
                        </button>
                    </div>
                    <div class="form-text">
                        Select the HubSpot object type to map with Alchemy records
                    </div>
                </div>
                <div id="hubspotObjectStatus" class="alert mt-3" style="display: none;"></div>
            `;
            
            hubspotConfig.appendChild(objectContainer);
        }
        
        // Add fields section
        if (!document.getElementById('hubspotFieldContainer')) {
            const fieldContainer = document.createElement('div');
            fieldContainer.id = 'hubspotFieldContainer';
            fieldContainer.className = 'mt-4';
            fieldContainer.style.display = 'none';
            
            fieldContainer.innerHTML = `
                <h5 class="mb-3">HubSpot Fields</h5>
                <div class="mb-3">
                    <p>Fetch fields for object type: <strong id="hubspotObjectTypeLabel">None Selected</strong></p>
                    <button class="btn btn-primary" type="button" id="fetchHubspotFieldsBtn" disabled>
                        <i class="fas fa-list me-2"></i>Fetch Fields
                    </button>
                </div>
                <div id="hubspotFieldStatus" class="alert mt-3" style="display: none;"></div>
            `;
            
            hubspotConfig.appendChild(fieldContainer);
        }
        
        // Add sync options
        if (!document.getElementById('syncOptionsContainer')) {
            const syncContainer = document.createElement('div');
            syncContainer.id = 'syncOptionsContainer';
            syncContainer.className = 'mt-4';
            
            syncContainer.innerHTML = `
                <h5 class="mb-3">Synchronization Options</h5>
                <div class="row g-3">
                    <div class="col-md-6">
                        <label for="syncFrequency" class="form-label">Sync Frequency</label>
                        <select class="form-select" id="syncFrequency">
                            <option value="realtime">Real-time</option>
                            <option value="hourly">Hourly</option>
                            <option value="daily" selected>Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="manual">Manual Only</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label for="syncDirection" class="form-label">Sync Direction</label>
                        <select class="form-select" id="syncDirection">
                            <option value="alchemy_to_hubspot">Alchemy to HubSpot</option>
                            <option value="hubspot_to_alchemy">HubSpot to Alchemy</option>
                            <option value="bidirectional" selected>Bidirectional</option>
                        </select>
                    </div>
                </div>
            `;
            
            hubspotConfig.appendChild(syncContainer);
        }
    }
    
    // Add script to load HubSpot fields in Step 2
    const step2 = document.getElementById('step2');
    if (step2 && !document.getElementById('hubspotStep2Info')) {
        const infoDiv = document.createElement('div');
        infoDiv.id = 'hubspotStep2Info';
        infoDiv.className = 'mt-4';
        infoDiv.style.display = 'none';
        
        infoDiv.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                After fetching Alchemy fields, you'll be asked to select a HubSpot object type and fetch its fields for mapping.
            </div>
        `;
        
        step2.appendChild(infoDiv);
        
        // Show this info for HubSpot
        if (window.location.href.includes('platform=hubspot')) {
            infoDiv.style.display = 'block';
        }
    }
}

// Validate HubSpot credentials
function validateHubSpotCredentials() {
    // Get credentials from input fields - support both API key and OAuth tokens
    const accessTokenInput = document.getElementById('hubspotApiKey');
    const clientSecretInput = document.getElementById('hubspotPortalId');
    
    if (!accessTokenInput || !clientSecretInput) {
        console.error('HubSpot credential inputs not found');
        return;
    }
    
    const accessToken = accessTokenInput.value.trim();
    const clientSecret = clientSecretInput.value.trim();
    
    console.log("Validating credentials:", accessToken ? "Token provided" : "No token", 
                                         clientSecret ? "Secret provided" : "No secret");
    
    if (!accessToken) {
        showHubSpotStatus('error', 'Please enter HubSpot Access Token');
        showToast('error', 'Please enter HubSpot Access Token');
        return;
    }
    
    // Show loading state
    const validateBtn = document.getElementById('validateHubspotBtn');
    if (validateBtn) {
        validateBtn.disabled = true;
        validateBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Validating...';
    }
    
    // Show status
    showHubSpotStatus('info', 'Validating HubSpot credentials...');
    
    // Use fetch API for the request
    fetch('/hubspot/validate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            access_token: accessToken,
            client_secret: clientSecret,
            oauth_mode: true
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Validation response:", data);
        
        // Reset button
        if (validateBtn) {
            validateBtn.disabled = false;
            validateBtn.innerHTML = '<i class="fas fa-check-circle me-2"></i>Validate Credentials';
        }
        
        if (data.status === 'success') {
            // Show success message
            showHubSpotStatus('success', data.message || 'Credentials validated successfully');
            
            // Enable fetching object types
            const fetchObjectsBtn = document.getElementById('fetchHubspotObjectsBtn');
            if (fetchObjectsBtn) {
                fetchObjectsBtn.disabled = false;
            }
            
            // Show toast
            showToast('success', 'HubSpot credentials validated successfully');
            
            // Fetch object types automatically
            fetchHubSpotObjectTypes();
        } else {
            // Show error message
            showHubSpotStatus('error', data.message || 'Validation failed');
            
            // Disable object type button
            const fetchObjectsBtn = document.getElementById('fetchHubspotObjectsBtn');
            if (fetchObjectsBtn) {
                fetchObjectsBtn.disabled = true;
            }
            
            // Show toast
            showToast('error', 'HubSpot credential validation failed');
        }
    })
    .catch(error => {
        console.error("Validation error:", error);
        
        // Reset button
        if (validateBtn) {
            validateBtn.disabled = false;
            validateBtn.innerHTML = '<i class="fas fa-check-circle me-2"></i>Validate Credentials';
        }
        
        // Show error message
        showHubSpotStatus('error', 'Error: ' + error.message);
        
        // Show toast
        showToast('error', 'Error: ' + error.message);
    });
}

// Show HubSpot status
function showHubSpotStatus(type, message) {
    const statusDiv = document.getElementById('hubspotStatus');
    if (!statusDiv) {
        console.error('HubSpot status div not found');
        return;
    }
    
    let alertClass = 'alert-info';
    let icon = '<i class="fas fa-info-circle me-2"></i>';
    
    if (type === 'success') {
        alertClass = 'alert-success';
        icon = '<i class="fas fa-check-circle me-2"></i>';
    } else if (type === 'error') {
        alertClass = 'alert-danger';
        icon = '<i class="fas fa-exclamation-circle me-2"></i>';
    } else if (type === 'warning') {
        alertClass = 'alert-warning';
        icon = '<i class="fas fa-exclamation-triangle me-2"></i>';
    }
    
    statusDiv.className = `alert ${alertClass} mt-3`;
    statusDiv.innerHTML = icon + message;
    statusDiv.style.display = 'block';
}

// Show object status
function showObjectStatus(type, message) {
    const statusDiv = document.getElementById('hubspotObjectStatus');
    if (!statusDiv) {
        console.error('HubSpot object status div not found');
        return;
    }
    
    let alertClass = 'alert-info';
    let icon = '<i class="fas fa-info-circle me-2"></i>';
    
    if (type === 'success') {
        alertClass = 'alert-success';
        icon = '<i class="fas fa-check-circle me-2"></i>';
    } else if (type === 'error') {
        alertClass = 'alert-danger';
        icon = '<i class="fas fa-exclamation-circle me-2"></i>';
    } else if (type === 'warning') {
        alertClass = 'alert-warning';
        icon = '<i class="fas fa-exclamation-triangle me-2"></i>';
    }
    
    statusDiv.className = `alert ${alertClass} mt-3`;
    statusDiv.innerHTML = icon + message;
    statusDiv.style.display = 'block';
}

// Show field status
function showFieldStatus(type, message) {
    const statusDiv = document.getElementById('hubspotFieldStatus');
    if (!statusDiv) {
        console.error('HubSpot field status div not found');
        return;
    }
    
    let alertClass = 'alert-info';
    let icon = '<i class="fas fa-info-circle me-2"></i>';
    
    if (type === 'success') {
        alertClass = 'alert-success';
        icon = '<i class="fas fa-check-circle me-2"></i>';
    } else if (type === 'error') {
        alertClass = 'alert-danger';
        icon = '<i class="fas fa-exclamation-circle me-2"></i>';
    } else if (type === 'warning') {
        alertClass = 'alert-warning';
        icon = '<i class="fas fa-exclamation-triangle me-2"></i>';
    }
    
    statusDiv.className = `alert ${alertClass} mt-3`;
    statusDiv.innerHTML = icon + message;
    statusDiv.style.display = 'block';
}

// Show toast notification
function showToast(type, message) {
    // First try to use jQuery if available
    if (typeof $ !== 'undefined') {
        const toast = $('<div>').addClass('toast');
        
        if (type === 'success') {
            toast.addClass('success');
            toast.html('<i class="fas fa-check-circle me-2"></i>' + message);
        } else if (type === 'error') {
            toast.addClass('error');
            toast.html('<i class="fas fa-exclamation-circle me-2"></i>' + message);
        } else if (type === 'warning') {
            toast.addClass('warning');
            toast.html('<i class="fas fa-exclamation-triangle me-2"></i>' + message);
        } else {
            toast.html('<i class="fas fa-info-circle me-2"></i>' + message);
        }
        
        $('#toastContainer').append(toast);
        
        // Auto-remove after 3 seconds
        setTimeout(function() {
            toast.fadeOut(300, function() {
                $(this).remove();
            });
        }, 3000);
    } else {
        // Fallback to direct DOM manipulation
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        
        let icon = '<i class="fas fa-info-circle me-2"></i>';
        
        if (type === 'success') {
            toast.classList.add('success');
            icon = '<i class="fas fa-check-circle me-2"></i>';
        } else if (type === 'error') {
            toast.classList.add('error');
            icon = '<i class="fas fa-exclamation-circle me-2"></i>';
        } else if (type === 'warning') {
            toast.classList.add('warning');
            icon = '<i class="fas fa-exclamation-triangle me-2"></i>';
        }
        
        toast.innerHTML = icon + message;
        toastContainer.appendChild(toast);
        
        // Auto-remove after 3 seconds
        setTimeout(function() {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(function() {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Fetch HubSpot object types
function fetchHubSpotObjectTypes() {
    const accessTokenInput = document.getElementById('hubspotApiKey');
    if (!accessTokenInput) {
        console.error('HubSpot API Key input not found');
        return;
    }
    
    const accessToken = accessTokenInput.value.trim();
    
    if (!accessToken) {
        showToast('error', 'Please enter and validate your HubSpot Access Token first');
        return;
    }
    
    // Show loading state
    const fetchBtn = document.getElementById('fetchHubspotObjectsBtn');
    if (fetchBtn) {
        fetchBtn.disabled = true;
        fetchBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Fetching...';
    }
    
    // Show status
    showObjectStatus('info', 'Fetching HubSpot object types...');
    
    // Show object container
    const objectContainer = document.getElementById('hubspotObjectContainer');
    if (objectContainer) {
        objectContainer.style.display = 'block';
    }
    
    // Make API call with OAuth credentials
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
    .then(response => response.json())
    .then(data => {
        console.log("Object types response:", data);
        
        // Reset button
        if (fetchBtn) {
            fetchBtn.disabled = false;
            fetchBtn.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Refresh Object Types';
        }
        
        if (data.status === 'success' || data.status === 'warning') {
            // Store object types
            hubspotObjectTypes = data.object_types || [];
            
            // Update object type select
            const select = document.getElementById('hubspotObjectType');
            if (select) {
                // Clear existing options
                select.innerHTML = '<option value="">-- Select Object Type --</option>';
                
                // Add new options
                hubspotObjectTypes.forEach(function(obj) {
                    const option = document.createElement('option');
                    option.value = obj.id;
                    option.textContent = obj.name;
                    select.appendChild(option);
                });
                
                // Enable select
                select.disabled = false;
            }
            
            // Show field container
            const fieldContainer = document.getElementById('hubspotFieldContainer');
            if (fieldContainer) {
                fieldContainer.style.display = 'block';
            }
            
            // Show success message
            showObjectStatus(
                data.status === 'warning' ? 'warning' : 'success', 
                data.message || `Found ${hubspotObjectTypes.length} object types`
            );
            
            // Show toast
            showToast('success', `Found ${hubspotObjectTypes.length} HubSpot object types`);
        } else {
            // Show error message
            showObjectStatus('error', data.message || 'Failed to fetch object types');
            
            // Show toast
            showToast('error', 'Failed to fetch HubSpot object types');
        }
    })
    .catch(error => {
        console.error("Object types error:", error);
        
        // Reset button
        if (fetchBtn) {
            fetchBtn.disabled = false;
            fetchBtn.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Refresh Object Types';
        }
        
        // Show error message
        showObjectStatus('error', 'Error: ' + error.message);
        
        // Show toast
        showToast('error', 'Error: ' + error.message);
    });
}

// Fetch HubSpot fields for a selected object type
function fetchHubSpotFields(objectType) {
    const accessTokenInput = document.getElementById('hubspotApiKey');
    if (!accessTokenInput) {
        console.error('HubSpot API Key input not found');
        return;
    }
    
    const accessToken = accessTokenInput.value.trim();
    
    if (!accessToken) {
        showToast('error', 'Please enter and validate your HubSpot Access Token first');
        return;
    }
    
    if (!objectType) {
        showToast('error', 'Please select a HubSpot object type');
        return;
    }
    
    // Show loading state
    const fetchBtn = document.getElementById('fetchHubspotFieldsBtn');
    if (fetchBtn) {
        fetchBtn.disabled = true;
        fetchBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Fetching Fields...';
    }
    
    // Show status
    showFieldStatus('info', `Fetching fields for ${objectType}...`);
    
    // Make API call using OAuth credentials
    fetch('/hubspot/fields', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            access_token: accessToken,
            object_type: objectType,
            oauth_mode: true
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Fields response:", data);
        
        // Reset button
        if (fetchBtn) {
            fetchBtn.disabled = false;
            fetchBtn.innerHTML = '<i class="fas fa-list me-2"></i>Refresh Fields';
        }
        
        if (data.status === 'success' || data.status === 'warning') {
            // Store fields
            hubspotFields = data.fields || [];
            
            // Show success message
            showFieldStatus(
                data.status === 'warning' ? 'warning' : 'success',
                data.message || `Retrieved ${hubspotFields.length} fields for mapping`
            );
            
            // Proceed to field mapping if we have Alchemy fields
            if (window.alchemyFields && window.alchemyFields.length > 0) {
                prepareFieldMapping(hubspotFields);
                
                // Move to next step
                if (typeof updateProgressUI === 'function') {
                    currentStep = 3;
                    updateProgressUI();
                } else {
                    // Manually update UI
                    const step2 = document.getElementById('step2');
                    const step3 = document.getElementById('step3');
                    if (step2 && step3) {
                        step2.style.display = 'none';
                        step3.style.display = 'block';
                    }
                    
                    const nextBtn = document.getElementById('nextBtn');
                    const saveBtn = document.getElementById('saveBtn');
                    if (nextBtn && saveBtn) {
                        nextBtn.style.display = 'none';
                        saveBtn.style.display = 'inline-block';
                    }
                }
            } else {
                showToast('warning', 'Please fetch Alchemy fields first');
            }
            
            // Show toast
            showToast('success', `Retrieved ${hubspotFields.length} fields for mapping`);
        } else {
            // Show error message
            showFieldStatus('error', data.message || 'Failed to fetch fields');
            
            // Show toast
            showToast('error', 'Failed to fetch HubSpot fields');
        }
    })
    .catch(error => {
        console.error("Fields error:", error);
        
        // Reset button
        if (fetchBtn) {
            fetchBtn.disabled = false;
            fetchBtn.innerHTML = '<i class="fas fa-list me-2"></i>Refresh Fields';
        }
        
        // Show error message
        showFieldStatus('error', 'Error: ' + error.message);
        
        // Show toast
        showToast('error', 'Error: ' + error.message);
    });
}

// Prepare field mapping UI
function prepareFieldMapping(hubspotFields) {
    // Check if we have both Alchemy fields and HubSpot fields
    if (!window.alchemyFields || window.alchemyFields.length === 0) {
        showToast('warning', 'Please fetch Alchemy fields first');
        return;
    }
    
    if (!hubspotFields || hubspotFields.length === 0) {
        showToast('warning', 'No HubSpot fields available for mapping');
        return;
    }
    
    // Get mapping container
    const mappingContainer = document.getElementById('fieldMappings');
    
    if (!mappingContainer) {
        console.error('Field mapping container not found');
        return;
    }
    
    // Clear existing content
    mappingContainer.innerHTML = '';
    
    // Add header
    const headerDiv = document.createElement('div');
    headerDiv.className = 'alert alert-info mb-3';
    headerDiv.innerHTML = '<i class="fas fa-info-circle me-2"></i>Map fields between Alchemy and HubSpot';
    mappingContainer.appendChild(headerDiv);
    
    // Create table for mapping
    const table = document.createElement('table');
    table.className = 'table table-bordered table-hover';
    
    // Add header row
    const thead = document.createElement('thead');
    thead.className = 'table-light';
    
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th>Alchemy Field</th>
        <th>HubSpot Field</th>
        <th width="100">Required</th>
        <th width="80">Actions</th>
    `;
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    tbody.id = 'mappingTableBody';
    table.appendChild(tbody);
    
    // Add table to container
    mappingContainer.appendChild(table);
    
    // Create a few default mappings based on field names
    const commonMappings = createCommonMappings(window.alchemyFields, hubspotFields);
    
    // Add mappings to table
    commonMappings.forEach(function(mapping) {
        addMappingRow(tbody, mapping.alchemyField, mapping.hubspotField);
    });
    
    // Add button to add more mappings
    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'btn btn-outline-primary';
    addButton.id = 'addMappingBtn';
    addButton.innerHTML = '<i class="fas fa-plus me-2"></i>Add Field Mapping';
    
    // Add event handler
    addButton.addEventListener('click', function() {
        addMappingRow(tbody);
    });
    
    mappingContainer.appendChild(addButton);
    
    // Show mapping section
    mappingContainer.style.display = 'block';
}

// Add a mapping row to the table
function addMappingRow(tableBody, alchemyField = null, hubspotField = null) {
    if (!tableBody) {
        console.error('Table body element not found');
        return;
    }
    
    // Create row
    const row = document.createElement('tr');
    row.className = 'mapping-row';
    
    // Create Alchemy field cell
    const alchemyCell = document.createElement('td');
    const alchemySelect = document.createElement('select');
    alchemySelect.className = 'form-select alchemy-field';
    
    // Add default option
    let option = document.createElement('option');
    option.value = '';
    option.textContent = '-- Select Alchemy Field --';
    alchemySelect.appendChild(option);
    
    // Add Alchemy field options
    if (window.alchemyFields) {
        window.alchemyFields.forEach(function(field) {
            option = document.createElement('option');
            option.value = field.identifier;
            option.textContent = field.name || field.identifier;
            alchemySelect.appendChild(option);
        });
    }
    
    // Set selected value if provided
    if (alchemyField) {
        alchemySelect.value = alchemyField.identifier;
    }
    
    alchemyCell.appendChild(alchemySelect);
    row.appendChild(alchemyCell);
    
    // Create HubSpot field cell
    const hubspotCell = document.createElement('td');
    const hubspotSelect = document.createElement('select');
    hubspotSelect.className = 'form-select hubspot-field';
    
    // Add default option
    option = document.createElement('option');
    option.value = '';
    option.textContent = '-- Select HubSpot Field --';
    hubspotSelect.appendChild(option);
    
    // Add HubSpot field options
    if (hubspotFields) {
        hubspotFields.forEach(function(field) {
            option = document.createElement('option');
            option.value = field.identifier;
            option.textContent = field.name;
            hubspotSelect.appendChild(option);
        });
    }
    
    // Set selected value if provided
    if (hubspotField) {
        hubspotSelect.value = hubspotField.identifier;
    }
    
    hubspotCell.appendChild(hubspotSelect);
    row.appendChild(hubspotCell);
    
    // Create required cell
    const requiredCell = document.createElement('td');
    requiredCell.className = 'text-center';
    
    const checkboxDiv = document.createElement('div');
    checkboxDiv.className = 'form-check form-switch d-flex justify-content-center';
    
    const checkbox = document.createElement('input');
    checkbox.className = 'form-check-input is-required';
    checkbox.type = 'checkbox';
    
    // Set checked if field is required
    if (hubspotField && hubspotField.required) {
        checkbox.checked = true;
    }
    
    checkboxDiv.appendChild(checkbox);
    requiredCell.appendChild(checkboxDiv);
    row.appendChild(requiredCell);
    
    // Create action cell
    const actionCell = document.createElement('td');
    actionCell.className = 'text-center';
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-sm btn-outline-danger remove-mapping';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    
    // Add event handler
    removeBtn.addEventListener('click', function() {
        tableBody.removeChild(row);
    });
    
    actionCell.appendChild(removeBtn);
    row.appendChild(actionCell);
    
    // Add to table body
    tableBody.appendChild(row);
}

// Find common field mappings automatically
function createCommonMappings(alchemyFields, hubspotFields) {
    if (!alchemyFields || !hubspotFields) {
        console.error('Missing field arrays for mapping');
        return [];
    }
    
    const mappings = [];
    const mappedAlchemyFields = new Set();
    const mappedHubspotFields = new Set();
    
    // Define common field mappings
    const fieldMappings = [
        { alchemy: ['name', 'Name'], hubspot: ['name'] },
        { alchemy: ['firstname', 'FirstName', 'first_name', 'First Name', 'firstName'], hubspot: ['firstname', 'firstName'] },
        { alchemy: ['lastname', 'LastName', 'last_name', 'Last Name', 'lastName'], hubspot: ['lastname', 'lastName'] },
        { alchemy: ['email', 'Email', 'emailaddress', 'EmailAddress', 'email_address'], hubspot: ['email'] },
        { alchemy: ['phone', 'Phone', 'phonenumber', 'PhoneNumber', 'phone_number'], hubspot: ['phone'] },
        { alchemy: ['address', 'Address'], hubspot: ['address'] },
        { alchemy: ['company', 'Company', 'companyname', 'CompanyName', 'company_name'], hubspot: ['company'] },
        { alchemy: ['description', 'Description'], hubspot: ['description'] }
    ];
    
    // Try to map based on common field patterns
    fieldMappings.forEach(function(mapping) {
        // Find matching Alchemy field
        const alchemyField = alchemyFields.find(field => 
            mapping.alchemy.includes(field.identifier) || 
            mapping.alchemy.includes(field.name)
        );
        
        // Find matching HubSpot field
        const hubspotField = hubspotFields.find(field => 
            mapping.hubspot.includes(field.identifier) || 
            mapping.hubspot.includes(field.name)
        );
        
        // If both found and not already mapped, add mapping
        if (alchemyField && hubspotField && 
            !mappedAlchemyFields.has(alchemyField.identifier) && 
            !mappedHubspotFields.has(hubspotField.identifier)) {
            
            mappings.push({
                alchemyField: alchemyField,
                hubspotField: hubspotField
            });
            
            mappedAlchemyFields.add(alchemyField.identifier);
            mappedHubspotFields.add(hubspotField.identifier);
        }
    });
    
    // Add required HubSpot fields that weren't mapped yet
    hubspotFields.forEach(function(hubspotField) {
        if (hubspotField.required && !mappedHubspotFields.has(hubspotField.identifier)) {
            // Try to find a suitable Alchemy field
            const alchemyField = alchemyFields.find(field => 
                !mappedAlchemyFields.has(field.identifier) &&
                (field.identifier.toLowerCase().includes(hubspotField.identifier.toLowerCase()) ||
                hubspotField.identifier.toLowerCase().includes(field.identifier.toLowerCase()))
            );
            
            if (alchemyField) {
                mappings.push({
                    alchemyField: alchemyField,
                    hubspotField: hubspotField
                });
                
                mappedAlchemyFields.add(alchemyField.identifier);
                mappedHubspotFields.add(hubspotField.identifier);
            } else {
                // Add mapping with just the HubSpot field
                mappings.push({
                    alchemyField: null,
                    hubspotField: hubspotField
                });
                
                mappedHubspotFields.add(hubspotField.identifier);
            }
        }
    });
    
    // Add a few more common fields that aren't required
    const maxExtraMappings = 3;
    let extraMappingsCount = 0;
    
    alchemyFields.forEach(function(alchemyField) {
        if (!mappedAlchemyFields.has(alchemyField.identifier) && extraMappingsCount < maxExtraMappings) {
            const hubspotField = hubspotFields.find(field => 
                !mappedHubspotFields.has(field.identifier) &&
                (field.identifier.toLowerCase().includes(alchemyField.identifier.toLowerCase()) ||
                alchemyField.identifier.toLowerCase().includes(field.identifier.toLowerCase()))
            );
            
            if (hubspotField) {
                mappings.push({
                    alchemyField: alchemyField,
                    hubspotField: hubspotField
                });
                
                mappedAlchemyFields.add(alchemyField.identifier);
                mappedHubspotFields.add(hubspotField.identifier);
                extraMappingsCount++;
            }
        }
    });
    
    return mappings;
}

// Get mapped fields
function getFieldMappings() {
    const mappings = [];
    const rows = document.querySelectorAll('.mapping-row');
    
    rows.forEach(function(row) {
        const alchemyField = row.querySelector('.alchemy-field');
        const hubspotField = row.querySelector('.hubspot-field');
        const isRequired = row.querySelector('.is-required');
        
        if (alchemyField && hubspotField && alchemyField.value && hubspotField.value) {
            mappings.push({
                alchemy_field: alchemyField.value,
                hubspot_field: hubspotField.value,
                required: isRequired ? isRequired.checked : false
            });
        }
    });
    
    return mappings;
}

// Save HubSpot integration configuration
function saveHubSpotIntegration() {
    // Get field mappings
    const fieldMappings = getFieldMappings();
    
    if (fieldMappings.length === 0) {
        showToast('error', 'Please create at least one field mapping');
        return;
    }
    
    // Get HubSpot configuration - adjusted for OAuth credentials
    const accessToken = document.getElementById('hubspotApiKey').value.trim();
    const clientSecret = document.getElementById('hubspotPortalId').value.trim();
    const objectTypeSelect = document.getElementById('hubspotObjectType');
    const objectType = objectTypeSelect ? objectTypeSelect.value : '';
    
    if (!accessToken || !objectType) {
        showToast('error', 'Please fill in all HubSpot configuration fields');
        return;
    }
    
    // Get Alchemy configuration
    let tenantId, refreshToken;
    const authMethodAuto = document.getElementById('authMethodAuto');
    
    if (authMethodAuto && authMethodAuto.checked) {
        tenantId = document.getElementById('alchemyTenantId').value.trim();
        refreshToken = "session"; // Use token from session
    } else {
        tenantId = document.getElementById('alchemyTenantIdDirect').value.trim();
        refreshToken = document.getElementById('alchemyRefreshToken').value.trim();
    }
    
    if (!tenantId) {
        showToast('error', 'Please provide Alchemy Tenant ID');
        return;
    }
    
    // Get record type
    const recordType = document.getElementById('recordTypeInput').value.trim();
    
    if (!recordType) {
        showToast('error', 'Please provide Alchemy Record Type');
        return;
    }
    
    // Get sync settings
    const syncFrequencySelect = document.getElementById('syncFrequency');
    const syncDirectionSelect = document.getElementById('syncDirection');
    
    const syncFrequency = syncFrequencySelect ? syncFrequencySelect.value : 'daily';
    const syncDirection = syncDirectionSelect ? syncDirectionSelect.value : 'bidirectional';
    
    // Prepare data for saving - adjusted for OAuth
    const integrationData = {
        platform: 'hubspot',
        alchemy: {
            tenant_id: tenantId,
            refresh_token: refreshToken,
            record_type: recordType
        },
        hubspot: {
            access_token: accessToken,
            client_secret: clientSecret,
            object_type: objectType
        },
        sync_config: {
            frequency: syncFrequency,
            direction: syncDirection,
            is_active: true
        },
        field_mappings: fieldMappings
    };
    
    // Show saving state
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';
    }
    
    // Make API call
    fetch('/save-integration', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(integrationData)
    })
    .then(response => response.json())
    .then(data => {
        // Reset button
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save Configuration';
        }
        
        if (data.status === 'success') {
            // Show success toast
            showToast('success', 'Integration saved successfully!');
            
            // Update UI to show success
            const step3 = document.getElementById('step3');
            if (step3) {
                step3.innerHTML = `
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle me-2"></i>
                        HubSpot integration saved successfully! Integration ID: ${data.integration_id}
                    </div>
                    <p>The integration between Alchemy and HubSpot has been configured successfully.</p>
                    <a href="/" class="btn btn-primary">
                        <i class="fas fa-home me-2"></i>Return to Dashboard
                    </a>
                `;
            }
        } else {
            // Show error toast
            showToast('error', data.message || 'Failed to save integration');
        }
    })
    .catch(error => {
        console.error("Save error:", error);
        
        // Reset button
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save Configuration';
        }
        
        // Show error toast
        showToast('error', 'Error: ' + error.message);
    });
}
