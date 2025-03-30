/**
 * Simplified Field Mapping for Alchemy-HubSpot Integration
 * Removes the unnecessary record identifier field
 */

// Main function to populate field mappings
function populateFieldMappings(alchemyFields, hubspotFields) {
    console.log('Populating field mappings with Alchemy fields:', alchemyFields);
    
    // Get the container for field mappings
    const mappingContainer = document.getElementById('fieldMappings');
    if (!mappingContainer) {
        console.error('Field mapping container not found');
        return;
    }
    
    // Clear existing content
    mappingContainer.innerHTML = '';
    
    // Add header
    const headerHtml = `
        <div class="alert alert-info mb-3">
            <i class="fas fa-info-circle me-2"></i>
            Map fields between Alchemy and HubSpot
        </div>
    `;
    mappingContainer.innerHTML += headerHtml;
    
    // Use HubSpot fields if available, otherwise use default fields
    if (!hubspotFields || hubspotFields.length === 0) {
        hubspotFields = [
            {identifier: 'firstname', name: 'First Name'},
            {identifier: 'lastname', name: 'Last Name'},
            {identifier: 'email', name: 'Email'},
            {identifier: 'phone', name: 'Phone Number'},
            {identifier: 'company', name: 'Company Name'},
            {identifier: 'website', name: 'Website'}
        ];
        console.log('Using default HubSpot fields');
    }
    
    // Create table for mappings
    const tableHtml = `
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>Alchemy Field</th>
                    <th>HubSpot Field</th>
                    <th width="80">Required</th>
                    <th width="80">Actions</th>
                </tr>
            </thead>
            <tbody id="mappingsTableBody">
                <!-- Mapping rows will be added here -->
            </tbody>
        </table>
    `;
    
    mappingContainer.innerHTML += tableHtml;
    const tableBody = document.getElementById('mappingsTableBody');
    
    // Generate automatic mappings based on field name similarity
    const commonFieldMappings = [
        {alchemyPattern: ['name', 'Name'], hubspotPattern: ['name', 'Name']},
        {alchemyPattern: ['id', 'ID', 'Id', 'identifier'], hubspotPattern: ['id', 'ID', 'Id']}, // Add ID mapping
        {alchemyPattern: ['firstName', 'first_name', 'firstname'], hubspotPattern: ['firstname', 'firstName']},
        {alchemyPattern: ['lastName', 'last_name', 'lastname'], hubspotPattern: ['lastname', 'lastName']},
        {alchemyPattern: ['email', 'Email'], hubspotPattern: ['email', 'Email']},
        {alchemyPattern: ['phone', 'Phone'], hubspotPattern: ['phone', 'Phone']},
        {alchemyPattern: ['address', 'Address'], hubspotPattern: ['address', 'Address']}
    ];
    
    // Keep track of used fields
    const usedAlchemyFields = new Set();
    const usedHubspotFields = new Set();
    let mappingCount = 0;
    
    // Add auto-mapped fields
    commonFieldMappings.forEach(mapping => {
        // Find matching Alchemy field that isn't already used
        const alchemyField = alchemyFields.find(field => 
            mapping.alchemyPattern.some(pattern => 
                (field.identifier && field.identifier.toLowerCase().includes(pattern.toLowerCase())) ||
                (field.name && field.name.toLowerCase().includes(pattern.toLowerCase()))
            ) && !usedAlchemyFields.has(field.identifier)
        );
        
        // Find matching HubSpot field that isn't already used
        const hubspotField = hubspotFields.find(field => 
            mapping.hubspotPattern.some(pattern => 
                (field.identifier && field.identifier.toLowerCase().includes(pattern.toLowerCase())) ||
                (field.name && field.name.toLowerCase().includes(pattern.toLowerCase()))
            ) && !usedHubspotFields.has(field.identifier)
        );
        
        // Add row if both fields found
        if (alchemyField && hubspotField) {
            addMappingRow(tableBody, alchemyField, hubspotField, alchemyFields, hubspotFields);
            usedAlchemyFields.add(alchemyField.identifier);
            usedHubspotFields.add(hubspotField.identifier);
            mappingCount++;
        }
    });
    
    // Add required fields from HubSpot if not already mapped
    hubspotFields.forEach(hubspotField => {
        if (hubspotField.required && !usedHubspotFields.has(hubspotField.identifier)) {
            // Find best matching Alchemy field
            const alchemyField = alchemyFields.find(field => 
                !usedAlchemyFields.has(field.identifier) && (
                    field.identifier.toLowerCase().includes(hubspotField.identifier.toLowerCase()) ||
                    hubspotField.identifier.toLowerCase().includes(field.identifier.toLowerCase()) ||
                    (field.name && field.name.toLowerCase().includes(hubspotField.name.toLowerCase())) ||
                    (hubspotField.name && hubspotField.name.toLowerCase().includes(field.name.toLowerCase()))
                )
            );
            
            // Add mapping row
            if (alchemyField) {
                addMappingRow(tableBody, alchemyField, hubspotField, alchemyFields, hubspotFields);
                usedAlchemyFields.add(alchemyField.identifier);
            } else {
                // If no match, just add with empty Alchemy field
                addMappingRow(tableBody, null, hubspotField, alchemyFields, hubspotFields);
            }
            
            usedHubspotFields.add(hubspotField.identifier);
            mappingCount++;
        }
    });
    
    // Ensure we have at least 3 rows
    while (mappingCount < 3) {
        addMappingRow(tableBody, null, null, alchemyFields, hubspotFields);
        mappingCount++;
    }
    
    // Add 'Add Mapping' button
    const addButtonHtml = `
        <div class="text-end mt-3">
            <button id="addMappingBtn" class="btn btn-outline-primary">
                <i class="fas fa-plus me-2"></i>Add Mapping
            </button>
        </div>
    `;
    
    mappingContainer.innerHTML += addButtonHtml;
    
    // Attach event handler for add button
    const addMappingBtn = document.getElementById('addMappingBtn');
    if (addMappingBtn) {
        addMappingBtn.addEventListener('click', function() {
            addMappingRow(tableBody, null, null, alchemyFields, hubspotFields);
        });
    }
    
    // Add sync options if they're hidden
    const syncOptionsContainer = document.getElementById('syncOptionsContainer');
    if (syncOptionsContainer && syncOptionsContainer.style.display === 'none') {
        syncOptionsContainer.style.display = 'block';
    }
    
    console.log('Field mapping UI populated successfully');
}

// Function to add a mapping row
function addMappingRow(tableBody, alchemyField = null, hubspotField = null, alchemyFields, hubspotFields) {
    if (!tableBody) {
        console.error('Table body element not found');
        return;
    }
    
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
    if (alchemyFields && alchemyFields.length > 0) {
        alchemyFields.forEach(function(field) {
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
    if (hubspotFields && hubspotFields.length > 0) {
        hubspotFields.forEach(function(field) {
            option = document.createElement('option');
            option.value = field.identifier;
            option.textContent = field.name + (field.required ? ' (Required)' : '');
            
            // Add data attribute for required fields
            if (field.required) {
                option.dataset.required = 'true';
            }
            
            hubspotSelect.appendChild(option);
        });
    }
    
    // Set selected value if provided
    if (hubspotField) {
        hubspotSelect.value = hubspotField.identifier;
    }
    
    hubspotCell.appendChild(hubspotSelect);
    row.appendChild(hubspotCell);
    
    // Create required cell with checkbox
    const requiredCell = document.createElement('td');
    requiredCell.className = 'text-center';
    
    const requiredCheckbox = document.createElement('input');
    requiredCheckbox.type = 'checkbox';
    requiredCheckbox.className = 'form-check-input';
    requiredCheckbox.checked = hubspotField && hubspotField.required;
    requiredCheckbox.disabled = hubspotField && hubspotField.required;
    
    requiredCell.appendChild(requiredCheckbox);
    row.appendChild(requiredCell);
    
    // Create action cell with delete button
    const actionCell = document.createElement('td');
    actionCell.className = 'text-center';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm btn-outline-danger';
    deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
    deleteBtn.addEventListener('click', function() {
        row.remove();
    });
    
    actionCell.appendChild(deleteBtn);
    row.appendChild(actionCell);
    
    // Add to table
    tableBody.appendChild(row);
    
    // Add change handler for HubSpot field to update required checkbox
    hubspotSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const isRequired = selectedOption.hasAttribute('data-required');
        
        requiredCheckbox.checked = isRequired;
        requiredCheckbox.disabled = isRequired;
    });
}

// Function to fix Step 3 display issues
function fixStep3Display() {
    console.log('Fixing Step 3 display');
    
    // Make sure field mappings container is visible
    const fieldMappings = document.getElementById('fieldMappings');
    if (fieldMappings) {
        fieldMappings.style.display = 'block';
    }
    
    // If we have Alchemy fields but no mapping table, populate it
    if (window.alchemyFields && window.alchemyFields.length > 0) {
        const mappingsTableBody = document.getElementById('mappingsTableBody');
        if (!mappingsTableBody || mappingsTableBody.children.length === 0) {
            populateFieldMappings(window.alchemyFields, window.hubspotFields || []);
        }
    }
    
    // Make sure sync options are visible
    const syncOptionsContainer = document.getElementById('syncOptionsContainer');
    if (syncOptionsContainer) {
        syncOptionsContainer.style.display = 'block';
    }
}

// Function to get mapped fields for saving
function getFieldMappings() {
    const mappings = [];
    const rows = document.querySelectorAll('.mapping-row');
    
    rows.forEach(function(row) {
        const alchemySelect = row.querySelector('.alchemy-field');
        const hubspotSelect = row.querySelector('.hubspot-field');
        const requiredCheckbox = row.querySelector('input[type="checkbox"]');
        
        if (alchemySelect && hubspotSelect && alchemySelect.value && hubspotSelect.value) {
            mappings.push({
                alchemy_field: alchemySelect.value,
                hubspot_field: hubspotSelect.value,
                required: requiredCheckbox ? requiredCheckbox.checked : false
            });
        }
    });
    
    return mappings;
}

// Function to save the integration configuration
function saveHubSpotIntegration() {
    // Get field mappings
    const fieldMappings = getFieldMappings();
    
    if (fieldMappings.length === 0) {
        showToast('error', 'Please create at least one field mapping');
        return;
    }
    
    // Get HubSpot configuration
    const accessToken = document.getElementById('hubspotApiKey').value.trim();
    const clientSecret = document.getElementById('hubspotPortalId').value.trim();
    const objectTypeSelect = document.getElementById('hubspotObjectType');
    const objectType = objectTypeSelect ? objectTypeSelect.value : '';
    
    if (!accessToken || !objectType) {
        showToast('error', 'Missing HubSpot access token or object type');
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
        showToast('error', 'Missing Alchemy tenant ID');
        return;
    }
    
    // Get record type
    const recordType = document.getElementById('recordTypeInput').value.trim();
    
    if (!recordType) {
        showToast('error', 'Missing Alchemy record type');
        return;
    }
    
    // Get sync options
    const syncFrequency = document.getElementById('syncFrequency').value;
    const syncDirection = document.getElementById('syncDirection').value;
    
    // Prepare data - now without explicit record identifier
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
            // No record_identifier field - system will use standard identifiers
        },
        sync_config: {
            frequency: syncFrequency,
            direction: syncDirection,
            is_active: true
        },
        field_mappings: fieldMappings
    };
    
    console.log('Saving integration with data:', integrationData);
    
    // Show saving state
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';
    }
    
    // Send to server
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
            showToast('success', 'Integration saved successfully!');
            
            // Show success message and redirect option
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
        
        showToast('error', 'Error: ' + error.message);
    });
}

// Attach to DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Simplified field mapping script loaded');
    
    // Override the updateProgressUI function to ensure Step 3 is properly displayed
    if (typeof updateProgressUI === 'function') {
        const originalUpdateProgressUI = updateProgressUI;
        
        window.updateProgressUI = function() {
            originalUpdateProgressUI();
            
            // Check if we're on step 3
            if (window.currentStep === 3) {
                fixStep3Display();
            }
        };
    }
    
    // Also attach to saveBtn click to use our enhanced save function
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveHubSpotIntegration);
    }
});
