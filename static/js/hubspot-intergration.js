/**
 * HubSpot Integration JavaScript
 * Handles HubSpot-specific integration logic
 */

// Global variables
let hubspotObjectTypes = [];
let hubspotFields = [];

// Initialize HubSpot integration
$(document).ready(function() {
    console.log('HubSpot integration script loaded');
    
    // Check if on HubSpot configuration page
    const isHubSpotConfig = window.location.href.includes('platform=hubspot');
    if (!isHubSpotConfig) return;
    
    console.log('Initializing HubSpot integration UI');
    
    // Add HubSpot specific elements to the UI
    setupHubSpotUI();
    
    // Set up event handlers
    $(document).on('click', '#validateHubspotBtn', function() {
        validateHubSpotCredentials();
    });
    
    $(document).on('click', '#fetchHubspotObjectsBtn', function() {
        fetchHubSpotObjectTypes();
    });
    
    // Handle object type selection
    $(document).on('change', '#hubspotObjectType', function() {
        const selectedType = $(this).val();
        if (selectedType) {
            $('#fetchHubspotFieldsBtn').prop('disabled', false);
            $('#hubspotObjectTypeLabel').text(selectedType);
        } else {
            $('#fetchHubspotFieldsBtn').prop('disabled', true);
        }
    });
    
    // Handle field fetch button
    $(document).on('click', '#fetchHubspotFieldsBtn', function() {
        const selectedType = $('#hubspotObjectType').val();
        if (selectedType) {
            fetchHubSpotFields(selectedType);
        }
    });
    
    // Override save button for HubSpot
    $('#saveBtn').off('click').on('click', function() {
        saveHubSpotIntegration();
    });
});

// Setup HubSpot specific UI elements
function setupHubSpotUI() {
    // Add HubSpot object type selection
    const hubspotConfig = $('#hubspotConfig');
    
    if (hubspotConfig.length) {
        // Add validate button
        hubspotConfig.append(`
            <div class="text-end mb-3">
                <button type="button" id="validateHubspotBtn" class="btn btn-outline-primary">
                    <i class="fas fa-check-circle me-2"></i>Validate Credentials
                </button>
            </div>
            <div id="hubspotStatus" class="alert mt-3" style="display: none;"></div>
        `);
        
        // Add HubSpot object type selection
        hubspotConfig.append(`
            <div id="hubspotObjectContainer" class="mt-4" style="display: none;">
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
            </div>
        `);
        
        // Add fields section
        hubspotConfig.append(`
            <div id="hubspotFieldContainer" class="mt-4" style="display: none;">
                <h5 class="mb-3">HubSpot Fields</h5>
                <div class="mb-3">
                    <p>Fetch fields for object type: <strong id="hubspotObjectTypeLabel">None Selected</strong></p>
                    <button class="btn btn-primary" type="button" id="fetchHubspotFieldsBtn" disabled>
                        <i class="fas fa-list me-2"></i>Fetch Fields
                    </button>
                </div>
                <div id="hubspotFieldStatus" class="alert mt-3" style="display: none;"></div>
            </div>
        `);
        
        // Add sync options
        hubspotConfig.append(`
            <div id="syncOptionsContainer" class="mt-4">
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
            </div>
        `);
    }
    
    // Add script to load HubSpot fields in Step 2
    const step2 = $('#step2');
    if (step2.length) {
        step2.append(`
            <div class="mt-4" id="hubspotStep2Info" style="display: none;">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    After fetching Alchemy fields, you'll be asked to select a HubSpot object type and fetch its fields for mapping.
                </div>
            </div>
        `);
        
        // Show this info for HubSpot
        $('#hubspotStep2Info').show();
    }
}

// Validate HubSpot credentials
function validateHubSpotCredentials() {
    // Get credentials from input fields - support both API key and OAuth tokens
    const accessToken = $('#hubspotApiKey').val().trim();
    const clientSecret = $('#hubspotPortalId').val().trim();
    
    if (!accessToken) {
        showToast('error', 'Please enter HubSpot Access Token');
        return false;
    }
    
    // Show loading state
    $('#validateHubspotBtn').prop('disabled', true)
        .html('<i class="fas fa-spinner fa-spin me-2"></i>Validating...');
    
    // Call API to validate credentials - update to support OAuth tokens
    $.ajax({
        url: '/hubspot/validate',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            access_token: accessToken,
            client_secret: clientSecret,
            oauth_mode: true
        }),
        success: function(response) {
            // Reset button
            $('#validateHubspotBtn').prop('disabled', false)
                .html('<i class="fas fa-check-circle me-2"></i>Validate Credentials');
            
            if (response.status === 'success') {
                // Show success message
                $('#hubspotStatus').removeClass('alert-danger alert-warning')
                    .addClass('alert-success')
                    .html('<i class="fas fa-check-circle me-2"></i>' + response.message)
                    .show();
                
                // Enable fetching object types
                $('#fetchHubspotObjectsBtn').prop('disabled', false);
                
                // Store credentials in session if needed
                // (this would require backend support)
                
                // Show toast
                showToast('success', 'HubSpot credentials validated successfully');
                
                // Fetch object types automatically
                fetchHubSpotObjectTypes();
                
                return true;
            } else {
                // Show error message
                $('#hubspotStatus').removeClass('alert-success alert-warning')
                    .addClass('alert-danger')
                    .html('<i class="fas fa-exclamation-circle me-2"></i>' + response.message)
                    .show();
                
                // Disable object type button
                $('#fetchHubspotObjectsBtn').prop('disabled', true);
                
                // Show toast
                showToast('error', 'HubSpot credential validation failed');
                
                return false;
            }
        },
        error: function(xhr, status, error) {
            // Reset button
            $('#validateHubspotBtn').prop('disabled', false)
                .html('<i class="fas fa-check-circle me-2"></i>Validate Credentials');
            
            // Parse error message
            let errorMessage = 'Failed to validate credentials';
            try {
                const response = JSON.parse(xhr.responseText);
                errorMessage = response.message || response.error || errorMessage;
            } catch (e) {
                errorMessage = `Error: ${error}`;
            }
            
            // Show error message
            $('#hubspotStatus').removeClass('alert-success alert-warning')
                .addClass('alert-danger')
                .html('<i class="fas fa-exclamation-circle me-2"></i>' + errorMessage)
                .show();
            
            // Show toast
            showToast('error', errorMessage);
            
            return false;
        }
    });
}

// Fetch HubSpot object types
function fetchHubSpotObjectTypes() {
    const accessToken = $('#hubspotApiKey').val().trim();
    
    if (!accessToken) {
        showToast('error', 'Please enter and validate your HubSpot Access Token first');
        return;
    }
    
    // Show loading state
    $('#fetchHubspotObjectsBtn').prop('disabled', true)
        .html('<i class="fas fa-spinner fa-spin me-2"></i>Fetching...');
    
    // Show status
    $('#hubspotObjectStatus').html('<i class="fas fa-info-circle me-2"></i>Fetching HubSpot object types...')
        .removeClass('alert-success alert-danger')
        .addClass('alert-info')
        .show();
    
    // Make API call with OAuth credentials
    $.ajax({
        url: '/hubspot/object-types',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            access_token: accessToken,
            oauth_mode: true
        }),
        success: function(response) {
            // Reset button
            $('#fetchHubspotObjectsBtn').prop('disabled', false)
                .html('<i class="fas fa-sync-alt me-2"></i>Refresh Object Types');
            
            if (response.status === 'success' || response.status === 'warning') {
                // Store object types
                hubspotObjectTypes = response.object_types || [];
                
                // Update object type select
                const select = $('#hubspotObjectType');
                select.empty().append('<option value="">-- Select Object Type --</option>');
                
                hubspotObjectTypes.forEach(function(obj) {
                    select.append(`<option value="${obj.id}">${obj.name}</option>`);
                });
                
                // Show container
                $('#hubspotObjectContainer').show();
                
                // Show success message
                $('#hubspotObjectStatus').removeClass('alert-info alert-danger')
                    .addClass(response.status === 'warning' ? 'alert-warning' : 'alert-success')
                    .html('<i class="fas fa-check-circle me-2"></i>' + response.message)
                    .show();
                
                // Enable select
                select.prop('disabled', false);
                
                // Show toast
                showToast('success', `Found ${hubspotObjectTypes.length} HubSpot object types`);
            } else {
                // Show error message
                $('#hubspotObjectStatus').removeClass('alert-info alert-success')
                    .addClass('alert-danger')
                    .html('<i class="fas fa-exclamation-circle me-2"></i>' + response.message)
                    .show();
                
                // Show toast
                showToast('error', 'Failed to fetch HubSpot object types');
            }
        },
        error: function(xhr, status, error) {
            // Reset button
            $('#fetchHubspotObjectsBtn').prop('disabled', false)
                .html('<i class="fas fa-sync-alt me-2"></i>Refresh Object Types');
            
            // Parse error message
            let errorMessage = 'Failed to fetch object types';
            try {
                const response = JSON.parse(xhr.responseText);
                errorMessage = response.message || response.error || errorMessage;
            } catch (e) {
                errorMessage = `Error: ${error}`;
            }
            
            // Show error message
            $('#hubspotObjectStatus').removeClass('alert-info alert-success')
                .addClass('alert-danger')
                .html('<i class="fas fa-exclamation-circle me-2"></i>' + errorMessage)
                .show();
            
            // Show toast
            showToast('error', errorMessage);
        }
    });
}

// Fetch HubSpot fields for a selected object type
function fetchHubSpotFields(objectType) {
    const accessToken = $('#hubspotApiKey').val().trim();
    
    if (!accessToken) {
        showToast('error', 'Please enter and validate your HubSpot Access Token first');
        return;
    }
    
    if (!objectType) {
        showToast('error', 'Please select a HubSpot object type');
        return;
    }
    
    // Show loading state
    $('#fetchHubspotFieldsBtn').prop('disabled', true)
        .html('<i class="fas fa-spinner fa-spin me-2"></i>Fetching Fields...');
    
    // Show status
    $('#hubspotFieldStatus').html(`<i class="fas fa-info-circle me-2"></i>Fetching fields for ${objectType}...`)
        .removeClass('alert-success alert-danger')
        .addClass('alert-info')
        .show();
    
    // Make API call using OAuth credentials
    $.ajax({
        url: '/hubspot/fields',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            access_token: accessToken,
            object_type: objectType,
            oauth_mode: true
        }),
        success: function(response) {
            // Reset button
            $('#fetchHubspotFieldsBtn').prop('disabled', false)
                .html('<i class="fas fa-sync-alt me-2"></i>Refresh Fields');
            
            if (response.status === 'success' || response.status === 'warning') {
                // Store fields
                hubspotFields = response.fields || [];
                
                // Show success message
                $('#hubspotFieldStatus').removeClass('alert-info alert-danger')
                    .addClass(response.status === 'warning' ? 'alert-warning' : 'alert-success')
                    .html('<i class="fas fa-check-circle me-2"></i>' + response.message)
                    .show();
                
                // Proceed to field mapping
                prepareFieldMapping(hubspotFields);
                
                // Show toast
                showToast('success', `Retrieved ${hubspotFields.length} fields for mapping`);
                
                // Enable next step
                $('#nextBtn').prop('disabled', false);
            } else {
                // Show error message
                $('#hubspotFieldStatus').removeClass('alert-info alert-success')
                    .addClass('alert-danger')
                    .html('<i class="fas fa-exclamation-circle me-2"></i>' + response.message)
                    .show();
                
                // Show toast
                showToast('error', 'Failed to fetch HubSpot fields');
            }
        },
        error: function(xhr, status, error) {
            // Reset button
            $('#fetchHubspotFieldsBtn').prop('disabled', false)
                .html('<i class="fas fa-sync-alt me-2"></i>Refresh Fields');
            
            // Parse error message
            let errorMessage = 'Failed to fetch fields';
            try {
                const response = JSON.parse(xhr.responseText);
                errorMessage = response.message || response.error || errorMessage;
            } catch (e) {
                errorMessage = `Error: ${error}`;
            }
            
            // Show error message
            $('#hubspotFieldStatus').removeClass('alert-info alert-success')
                .addClass('alert-danger')
                .html('<i class="fas fa-exclamation-circle me-2"></i>' + errorMessage)
                .show();
            
            // Show toast
            showToast('error', errorMessage);
        }
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
    const mappingContainer = $('#fieldMappings');
    
    if (mappingContainer.length === 0) {
        console.error('Field mapping container not found');
        return;
    }
    
    // Clear existing content
    mappingContainer.empty();
    
    // Add header
    mappingContainer.append(`
        <div class="alert alert-info mb-3">
            <i class="fas fa-info-circle me-2"></i>
            Map fields between Alchemy and HubSpot
        </div>
    `);
    
    // Create table for mapping
    const table = $(`
        <table class="table table-bordered table-hover">
            <thead class="table-light">
                <tr>
                    <th>Alchemy Field</th>
                    <th>HubSpot Field</th>
                    <th width="100">Required</th>
                    <th width="80">Actions</th>
                </tr>
            </thead>
            <tbody id="mappingTableBody">
            </tbody>
        </table>
    `);
    
    // Add table to container
    mappingContainer.append(table);
    
    // Create a few default mappings based on field names
    const commonMappings = createCommonMappings(window.alchemyFields, hubspotFields);
    
    // Add mappings to table
    const tableBody = $('#mappingTableBody');
    
    commonMappings.forEach(function(mapping) {
        addMappingRow(tableBody, mapping.alchemyField, mapping.hubspotField);
    });
    
    // Add button to add more mappings
    mappingContainer.append(`
        <button type="button" class="btn btn-outline-primary" id="addMappingBtn">
            <i class="fas fa-plus me-2"></i>Add Field Mapping
        </button>
    `);
    
    // Add event handler for the button
    $('#addMappingBtn').off('click').on('click', function() {
        addMappingRow(tableBody);
    });
    
    // Show mapping section
    mappingContainer.show();
}

// Add a mapping row to the table
function addMappingRow(tableBody, alchemyField = null, hubspotField = null) {
    // Create row
    const row = $(`
        <tr class="mapping-row">
            <td>
                <select class="form-select alchemy-field">
                    <option value="">-- Select Alchemy Field --</option>
                </select>
            </td>
            <td>
                <select class="form-select hubspot-field">
                    <option value="">-- Select HubSpot Field --</option>
                </select>
            </td>
            <td class="text-center">
                <div class="form-check form-switch d-flex justify-content-center">
                    <input class="form-check-input is-required" type="checkbox">
                </div>
            </td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-danger remove-mapping">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        </tr>
    `);
    
    // Add Alchemy field options
    const alchemySelect = row.find('.alchemy-field');
    window.alchemyFields.forEach(function(field) {
        const option = $(`<option value="${field.identifier}">${field.name || field.identifier}</option>`);
        alchemySelect.append(option);
    });
    
    // Add HubSpot field options
    const hubspotSelect = row.find('.hubspot-field');
    hubspotFields.forEach(function(field) {
        const option = $(`<option value="${field.identifier}">${field.name}</option>`);
        hubspotSelect.append(option);
        
        // Set required attribute based on field metadata
        if (field.required && hubspotField && field.identifier === hubspotField.identifier) {
            row.find('.is-required').prop('checked', true);
        }
    });
    
    // Set selected values if provided
    if (alchemyField) {
        alchemySelect.val(alchemyField.identifier);
    }
    
    if (hubspotField) {
        hubspotSelect.val(hubspotField.identifier);
    }
    
    // Add remove button handler
    row.find('.remove-mapping').click(function() {
        row.remove();
    });
    
    // Add to table body
    tableBody.append(row);
}

// Find common field mappings automatically
function createCommonMappings(alchemyFields, hubspotFields) {
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
    
    $('.mapping-row').each(function() {
        const alchemyField = $(this).find('.alchemy-field').val();
        const hubspotField = $(this).find('.hubspot-field').val();
        const isRequired = $(this).find('.is-required').prop('checked');
        
        if (alchemyField && hubspotField) {
            mappings.push({
                alchemy_field: alchemyField,
                hubspot_field: hubspotField,
                required: isRequired
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
    const accessToken = $('#hubspotApiKey').val().trim();
    const clientSecret = $('#hubspotPortalId').val().trim();
    const objectType = $('#hubspotObjectType').val();
    
    if (!accessToken || !objectType) {
        showToast('error', 'Please fill in all HubSpot configuration fields');
        return;
    }
    
    // Get Alchemy configuration
    let tenantId, refreshToken;
    
    if ($('#authMethodAuto').is(':checked')) {
        tenantId = $('#alchemyTenantId').val().trim();
        refreshToken = "session"; // Use token from session
    } else {
        tenantId = $('#alchemyTenantIdDirect').val().trim();
        refreshToken = $('#alchemyRefreshToken').val().trim();
    }
    
    if (!tenantId) {
        showToast('error', 'Please provide Alchemy Tenant ID');
        return;
    }
    
    // Get record type
    const recordType = $('#recordTypeInput').val().trim();
    
    if (!recordType) {
        showToast('error', 'Please provide Alchemy Record Type');
        return;
    }
    
    // Get sync settings
    const syncFrequency = $('#syncFrequency').val() || 'daily';
    const syncDirection = $('#syncDirection').val() || 'bidirectional';
    
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
            object_type: objectType,
            oauth_mode: true
        },
        sync_config: {
            frequency: syncFrequency,
            direction: syncDirection,
            is_active: true
        },
        field_mappings: fieldMappings
    };
    
    // Show saving state
    $('#saveBtn').prop('disabled', true)
        .html('<i class="fas fa-spinner fa-spin me-2"></i>Saving...');
    
    // Make API call
    $.ajax({
        url: '/save-integration',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(integrationData),
        success: function(response) {
            // Reset button
            $('#saveBtn').prop('disabled', false)
                .html('<i class="fas fa-save me-2"></i>Save Configuration');
            
            if (response.status === 'success') {
                // Show success toast
                showToast('success', 'Integration saved successfully!');
                
                // Show success message
                $('#step3').html(`
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle me-2"></i>
                        HubSpot integration saved successfully! Integration ID: ${response.integration_id}
                    </div>
                    <p>The integration between Alchemy and HubSpot has been configured successfully.</p>
                    <a href="/" class="btn btn-primary">
                        <i class="fas fa-home me-2"></i>Return to Dashboard
                    </a>
                `);
            } else {
                // Show error toast
                showToast('error', response.message || 'Failed to save integration');
            }
        },
        error: function(xhr, status, error) {
            // Reset button
            $('#saveBtn').prop('disabled', false)
                .html('<i class="fas fa-save me-2"></i>Save Configuration');
            
            // Parse error message
            let errorMessage = 'Failed to save integration';
            try {
                const response = JSON.parse(xhr.responseText);
                errorMessage = response.message || response.error || errorMessage;
            } catch (e) {
                errorMessage = `Error: ${error}`;
            }
            
            // Show error toast
            showToast('error', errorMessage);
        }
    });
}

// Show toast notification
function showToast(type, message) {
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
}
