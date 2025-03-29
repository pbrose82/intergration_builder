// This function creates the field mapping UI in Step 3
function populateFieldMappings(alchemyFields) {
    console.log('Populating field mappings with Alchemy fields:', alchemyFields);
    
    const mappingContainer = $('#fieldMappings');
    if (!mappingContainer.length) {
        console.error('Field mapping container not found');
        return;
    }
    
    // Clear existing content
    mappingContainer.empty();
    
    // Add header
    const headerHtml = `
        <div class="alert alert-info mb-3">
            <i class="fas fa-info-circle me-2"></i>
            Map fields between Alchemy and HubSpot
        </div>
    `;
    mappingContainer.append(headerHtml);
    
    // Get HubSpot fields (use either from window global or fetch them if needed)
    let hubspotFields = [];
    
    // If we have fields from HubSpot already loaded, use those
    if (window.hubspotFields && window.hubspotFields.length > 0) {
        hubspotFields = window.hubspotFields;
    } else {
        // Otherwise, use default fields as fallback
        hubspotFields = [
            {identifier: 'firstname', name: 'First Name'},
            {identifier: 'lastname', name: 'Last Name'},
            {identifier: 'email', name: 'Email'},
            {identifier: 'phone', name: 'Phone Number'},
            {identifier: 'company', name: 'Company Name'},
            {identifier: 'website', name: 'Website'}
        ];
    }
    
    console.log('Using HubSpot fields:', hubspotFields);
    
    // Create mapping rows for auto-mapped fields (if available) or a few empty rows
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
    
    mappingContainer.append(tableHtml);
    const tableBody = $('#mappingsTableBody');
    
    // Generate some automatic field mappings
    const commonFieldMappings = [
        {alchemyPattern: ['name', 'Name'], hubspotPattern: ['name', 'Name']},
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
            addMappingRow(alchemyField, hubspotField);
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
                addMappingRow(alchemyField, hubspotField);
                usedAlchemyFields.add(alchemyField.identifier);
            } else {
                // If no match, just add with empty Alchemy field
                addMappingRow(null, hubspotField);
            }
            
            usedHubspotFields.add(hubspotField.identifier);
            mappingCount++;
        }
    });
    
    // Ensure we have at least 3 rows
    while (mappingCount < 3) {
        addMappingRow();
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
    
    mappingContainer.append(addButtonHtml);
    
    // Attach event handler for add button
    $('#addMappingBtn').on('click', function() {
        addMappingRow();
    });
    
    // Function to add a mapping row
    function addMappingRow(alchemyField = null, hubspotField = null) {
        const rowHtml = `
            <tr class="mapping-row">
                <td>
                    <select class="form-select alchemy-field">
                        <option value="">-- Select Alchemy Field --</option>
                        ${alchemyFields.map(field => `
                            <option value="${field.identifier}" ${alchemyField && alchemyField.identifier === field.identifier ? 'selected' : ''}>
                                ${field.name || field.identifier}
                            </option>
                        `).join('')}
                    </select>
                </td>
                <td>
                    <select class="form-select hubspot-field">
                        <option value="">-- Select HubSpot Field --</option>
                        ${hubspotFields.map(field => `
                            <option value="${field.identifier}" ${hubspotField && hubspotField.identifier === field.identifier ? 'selected' : ''}>
                                ${field.name} ${field.required ? '(Required)' : ''}
                            </option>
                        `).join('')}
                    </select>
                </td>
                <td class="text-center">
                    <div class="form-check form-switch">
                        <input type="checkbox" class="form-check-input" 
                               ${hubspotField && hubspotField.required ? 'checked disabled' : ''}>
                    </div>
                </td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-danger remove-mapping">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            </tr>
        `;
        
        tableBody.append(rowHtml);
        
        // Add event listener to the remove button
        tableBody.find('.remove-mapping').last().on('click', function() {
            $(this).closest('tr').remove();
        });
    }
}

// Fix for Step 3 rendering - call this when going to Step 3
function fixStep3Display() {
    console.log('Fixing Step 3 display');
    
    // Make sure field mappings container is visible first
    $('#fieldMappings').show();
    
    // Make sure the syncOptionsContainer is positioned after field mappings
    const syncOptionsContainer = $('#syncOptionsContainer');
    if (syncOptionsContainer.length && $('#fieldMappings').length) {
        $('#step3').append(syncOptionsContainer.detach());
    }
    
    // If the mapping table is empty, try to populate it
    if ($('#mappingsTableBody').length === 0 || $('#mappingsTableBody tr').length === 0) {
        populateFieldMappings(window.alchemyFields || []);
    }
}

// Add a hook to ensure step 3 is properly displayed when shown
$(document).ready(function() {
    // Override or extend the existing updateProgressUI function
    if (typeof updateProgressUI === 'function') {
        const originalUpdateProgressUI = updateProgressUI;
        
        window.updateProgressUI = function() {
            originalUpdateProgressUI();
            
            // Check if we're now on step 3
            if (window.currentStep === 3 || $('#step3').is(':visible')) {
                fixStep3Display();
            }
        };
    }
    
    // Also attach to nextBtn click if updateProgressUI isn't accessible
    $('#nextBtn').on('click', function() {
        setTimeout(function() {
            if ($('#step3').is(':visible')) {
                fixStep3Display();
            }
        }, 100);
    });
});

// Call when page loads to ensure field mappings show up if step 3 is active
$(document).ready(function() {
    if ($('#step3').is(':visible')) {
        fixStep3Display();
    }
});
