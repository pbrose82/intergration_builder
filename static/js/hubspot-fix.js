/**
 * HubSpot Integration Fix - Object Type Population
 * 
 * This script fixes issues with HubSpot integration in the configuration flow.
 */

// Execute when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('HubSpot integration fix loaded');
    
    // Check if we're on the HubSpot integration page
    if (!window.location.href.includes('platform=hubspot')) {
        return;
    }
    
    // Fix Next button to ensure it properly triggers object type loading
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        // Preserve any existing click handler
        const originalClickHandler = nextBtn.onclick;
        
        // Add our enhanced click handler
        nextBtn.addEventListener('click', function(e) {
            console.log('Enhanced next button clicked for HubSpot');
            
            // Get current step
            const progressStep = document.getElementById('progressStep');
            const currentStep = progressStep ? 
                parseInt(progressStep.textContent.match(/\d+/)[0]) : 1;
            
            // If moving from Step 1 to Step 2, ensure we fetch object types
            if (currentStep === 1) {
                console.log('Moving from Step 1 to Step 2, checking HubSpot objects');
                
                // Short delay to allow step transition to complete
                setTimeout(function() {
                    // Show HubSpot object container
                    const objectContainer = document.getElementById('hubspotObjectContainer');
                    if (objectContainer) {
                        objectContainer.style.display = 'block';
                        console.log('HubSpot object container displayed');
                    }
                    
                    // Get credentials
                    const accessToken = document.getElementById('hubspotApiKey');
                    if (accessToken && accessToken.value.trim()) {
                        console.log('Access token found, fetching object types');
                        
                        // Fetch object types directly
                        fetchHubSpotObjectTypes();
                    } else {
                        console.log('No HubSpot access token found');
                    }
                }, 300);
            }
            
            // Call original handler if it exists
            if (typeof originalClickHandler === 'function') {
                originalClickHandler.call(this, e);
            }
        });
    }
    
    // Fix object type selection
    const objectTypeSelect = document.getElementById('hubspotObjectType');
    if (objectTypeSelect) {
        objectTypeSelect.addEventListener('change', function() {
            // Update the object type label
            const selectedText = this.options[this.selectedIndex].text;
            const objectTypeLabel = document.getElementById('hubspotObjectTypeLabel');
            if (objectTypeLabel) {
                objectTypeLabel.textContent = selectedText;
            }
            
            // Enable the fetch fields button
            const fetchFieldsBtn = document.getElementById('fetchHubspotFieldsBtn');
            if (fetchFieldsBtn) {
                fetchFieldsBtn.disabled = false;
            }
            
            // Update "None Selected" labels
            const fetchFieldsLabel = document.querySelector('strong:contains("None Selected")');
            if (fetchFieldsLabel) {
                fetchFieldsLabel.textContent = selectedText;
            }
        });
    }
    
    // Fix the fetch fields button
    const fetchHubspotFieldsBtn = document.getElementById('fetchHubspotFieldsBtn');
    if (fetchHubspotFieldsBtn) {
        fetchHubspotFieldsBtn.addEventListener('click', function() {
            const objectType = document.getElementById('hubspotObjectType').value;
            const accessToken = document.getElementById('hubspotApiKey').value;
            
            if (!objectType) {
                alert('Please select a HubSpot object type first');
                return;
            }
            
            // Show loading
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Fetching Fields...';
            
            // Fetch fields for the selected object type
            fetch('/hubspot/fields', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    access_token: accessToken,
                    object_type: objectType,
                    oauth_mode: true
                })
            })
            .then(response => response.json())
            .then(data => {
                // Reset button
                this.disabled = false;
                this.innerHTML = '<i class="fas fa-list me-2"></i>Fetch Fields';
                
                if (data.status === 'success' || data.status === 'warning') {
                    // Store the fields
                    window.hubspotFields = data.fields || [];
                    console.log('HubSpot fields loaded:', window.hubspotFields);
                    
                    // Move to Step 3
                    window.currentStep = 3;
                    
                    // Hide step 2, show step 3
                    document.getElementById('step2').style.display = 'none';
                    document.getElementById('step3').style.display = 'block';
                    
                    // Update progress bar
                    document.getElementById('progressBar').style.width = '100%';
                    document.getElementById('progressStep').textContent = 'Step 3 of 3';
                    
                    // Update buttons
                    document.getElementById('nextBtn').style.display = 'none';
                    document.getElementById('saveBtn').style.display = 'inline-block';
                    
                    // Transfer record identifier value
                    const step2Identifier = document.getElementById('hubspotRecordIdentifier');
                    const step3Identifier = document.getElementById('hubspotRecordIdentifierStep3');
                    if (step2Identifier && step3Identifier) {
                        step3Identifier.value = step2Identifier.value;
                    }
                    
                    // Generate field mappings with both Alchemy and HubSpot fields
                    populateFieldMappingsWithHubspot(window.alchemyFields, window.hubspotFields);
                } else {
                    alert('Failed to fetch HubSpot fields: ' + (data.message || 'Unknown error'));
                }
            })
            .catch(error => {
                // Reset button
                this.disabled = false;
                this.innerHTML = '<i class="fas fa-list me-2"></i>Fetch Fields';
                
                alert('Error fetching HubSpot fields: ' + error.message);
            });
        });
    }
    
    console.log('HubSpot integration fix applied');
});

// Fetch HubSpot object types
function fetchHubSpotObjectTypes() {
    const accessToken = document.getElementById('hubspotApiKey').value.trim();
    
    if (!accessToken) {
        console.log('No access token available');
        return;
    }
    
    // Show loading state
    const fetchBtn = document.getElementById('fetchHubspotObjectsBtn');
    if (fetchBtn) {
        fetchBtn.disabled = true;
        fetchBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Fetching...';
    }
    
    // Create request
    fetch('/hubspot/object-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            access_token: accessToken,
            oauth_mode: true
        })
    })
    .then(response => response.json())
    .then(data => {
        // Reset button
        if (fetchBtn) {
            fetchBtn.disabled = false;
            fetchBtn.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Refresh';
        }
        
        if (data.status === 'success' || data.status === 'warning') {
            // Store object types
            window.hubspotObjectTypes = data.object_types || [];
            
            // Update object type select
            const select = document.getElementById('hubspotObjectType');
            if (select) {
                // Clear existing options
                select.innerHTML = '<option value="">-- Select Object Type --</option>';
                
                // Add new options
                window.hubspotObjectTypes.forEach(function(obj) {
                    const option = document.createElement('option');
                    option.value = obj.id;
                    option.textContent = obj.name;
                    select.appendChild(option);
                });
                
                // Enable select
                select.disabled = false;
            }
            
            console.log('Successfully loaded object types: ', window.hubspotObjectTypes);
        } else {
            console.error('Failed to fetch object types: ', data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching object types: ', error);
        
        // Reset button
        if (fetchBtn) {
            fetchBtn.disabled = false;
            fetchBtn.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Refresh';
        }
    });
}

// New function to populate field mappings with HubSpot fields
function populateFieldMappingsWithHubspot(alchemyFields, hubspotFields) {
    const mappingContainer = document.getElementById('fieldMappings');
    if (!mappingContainer) return;
    
    // Clear existing content
    mappingContainer.innerHTML = '';
    
    // Add header
    mappingContainer.innerHTML = `
        <div class="alert alert-info mb-3">
            <i class="fas fa-info-circle me-2"></i>
            Map fields between Alchemy and HubSpot
        </div>
    `;
    
    // Create table for mappings
    const table = document.createElement('table');
    table.className = 'table table-hover';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Alchemy Field</th>
                <th></th>
                <th>HubSpot Field</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody id="mappingTableBody"></tbody>
    `;
    
    mappingContainer.appendChild(table);
    const tableBody = document.getElementById('mappingTableBody');
    
    // Generate some automatic field mappings
    const commonFieldPairs = [
        { alchemy: ['name', 'Name', 'RecordName'], hubspot: ['name', 'Name'] },
        { alchemy: ['description', 'Description', 'ShortDescription'], hubspot: ['description', 'Description'] },
        { alchemy: ['email', 'Email'], hubspot: ['email', 'Email'] },
        { alchemy: ['phone', 'Phone'], hubspot: ['phone', 'Phone'] }
    ];
    
    // Track used fields
    const usedAlchemyFields = new Set();
    const usedHubspotFields = new Set();
    
    // Add initial mappings based on common names
    commonFieldPairs.forEach(pair => {
        // Find matching Alchemy field
        const alchemyField = alchemyFields.find(field => 
            pair.alchemy.some(pattern => 
                (field.identifier && field.identifier.toLowerCase().includes(pattern.toLowerCase())) ||
                (field.name && field.name.toLowerCase().includes(pattern.toLowerCase()))
            ) && !usedAlchemyFields.has(field.identifier)
        );
        
        // Find matching HubSpot field
        const hubspotField = hubspotFields.find(field => 
            pair.hubspot.some(pattern => 
                (field.identifier && field.identifier.toLowerCase().includes(pattern.toLowerCase())) ||
                (field.name && field.name.toLowerCase().includes(pattern.toLowerCase()))
            ) && !usedHubspotFields.has(field.identifier)
        );
        
        // Add mapping if both fields found
        if (alchemyField && hubspotField) {
            addMapping(tableBody, alchemyField, hubspotField);
            usedAlchemyFields.add(alchemyField.identifier);
            usedHubspotFields.add(hubspotField.identifier);
        }
    });
    
    // Add button to add more mappings
    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'btn btn-outline-primary mt-3';
    addButton.innerHTML = '<i class="fas fa-plus me-2"></i>Add Field Mapping';
    addButton.onclick = function() {
        addMapping(tableBody);
    };
    
    mappingContainer.appendChild(addButton);
}

// Function to add a mapping row
function addMapping(tableBody, alchemyField = null, hubspotField = null) {
    const row = document.createElement('tr');
    
    // Alchemy field dropdown
    const alchemyCell = document.createElement('td');
    const alchemySelect = document.createElement('select');
    alchemySelect.className = 'form-select';
    
    // Add empty option
    let option = document.createElement('option');
    option.value = '';
    option.textContent = '-- Select Alchemy Field --';
    alchemySelect.appendChild(option);
    
    // Add all Alchemy fields
    if (window.alchemyFields) {
        window.alchemyFields.forEach(field => {
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
    
    // Arrow icon
    const arrowCell = document.createElement('td');
    arrowCell.className = 'text-center';
    arrowCell.innerHTML = '<i class="fas fa-arrows-alt-h"></i>';
    
    // HubSpot field dropdown
    const hubspotCell = document.createElement('td');
    const hubspotSelect = document.createElement('select');
    hubspotSelect.className = 'form-select';
    
    // Add empty option
    option = document.createElement('option');
    option.value = '';
    option.textContent = '-- Select HubSpot Field --';
    hubspotSelect.appendChild(option);
    
    // Add all HubSpot fields
    if (window.hubspotFields) {
        window.hubspotFields.forEach(field => {
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
    
    // Actions cell with remove button
    const actionsCell = document.createElement('td');
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-sm btn-outline-danger';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.onclick = function() {
        row.remove();
    };
    
    actionsCell.appendChild(removeBtn);
    
    // Add all cells to the row
    row.appendChild(alchemyCell);
    row.appendChild(arrowCell);
    row.appendChild(hubspotCell);
    row.appendChild(actionsCell);
    
    // Add row to table
    tableBody.appendChild(row);
}
