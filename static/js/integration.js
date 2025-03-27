/**
 * Alchemy Integration Manager
 * JavaScript for managing the integration configuration workflow
 */

// Diagnostic helper
function logToConsole(message) {
    console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
}

logToConsole('Integration.js is loading...');

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    logToConsole('DOM is ready, initializing application...');
    initializeApp();
});

// Main application initialization
function initializeApp() {
    // Variables
    let selectedPlatform = null;
    let currentStep = 1;
    let alchemyFields = [];
    let platformFields = [];
    let recordTypes = [];
    
    // DOM Elements
    const platformSelection = document.getElementById('platformSelection');
    const integrationForm = document.getElementById('integrationForm');
    const progressBar = document.getElementById('progressBar');
    const progressStep = document.getElementById('progressStep');
    const backBtn = document.getElementById('backBtn');
    const nextBtn = document.getElementById('nextBtn');
    const saveBtn = document.getElementById('saveBtn');
    const backToStep2Btn = document.getElementById('backToStep2Btn');
    const addMappingBtn = document.getElementById('addMappingBtn');
    const fieldMappingContainer = document.getElementById('fieldMappingContainer');
    
    // Step Elements
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    
    // Platform specific elements
    const salesforceConfig = document.getElementById('salesforceConfig');
    const sapConfig = document.getElementById('sapConfig');
    const hubspotConfig = document.getElementById('hubspotConfig');
    
    // Form Field Elements
    const alchemyTenantId = document.getElementById('alchemyTenantId');
    const alchemyRefreshToken = document.getElementById('alchemyRefreshToken');
    const recordTypeSelect = document.getElementById('recordTypeSelect');
    const recordTypeInput = document.getElementById('recordTypeInput');
    const recordTypeDescription = document.getElementById('recordTypeDescription');
    const fetchFieldsBtn = document.getElementById('fetchFieldsBtn');
    
    // Initialize Select2 for enhanced dropdowns (if available)
    try {
        if ($.fn.select2) {
            $('.form-select').select2({
                width: '100%'
            });
            logToConsole('Select2 initialized for dropdowns');
        }
    } catch (e) {
        logToConsole('Select2 initialization skipped: ' + e.message);
    }
    
    // Set up authentication handlers
    setupAuthenticationHandlers();
    
    // Toggle password visibility handlers
    setupPasswordToggleHandlers();
    
    // Setup platform selection
    const platformButtons = document.querySelectorAll('.select-platform, .direct-platform-btn');
    platformButtons.forEach(button => {
        button.addEventListener('click', function() {
            selectPlatform(this);
        });
    });
    
    // Set up navigation buttons
    backBtn.addEventListener('click', function() {
        if (currentStep === 1) {
            // Go back to platform selection
            integrationForm.style.display = 'none';
            platformSelection.style.display = 'block';
        } else {
            // Go to previous step
            showStep(currentStep - 1);
        }
    });
    
    nextBtn.addEventListener('click', function() {
        if (validateCurrentStep()) {
            showStep(currentStep + 1);
        }
    });
    
    backToStep2Btn.addEventListener('click', function() {
        showStep(2);
    });
    
    // Set up field fetching
    if (fetchFieldsBtn) {
        fetchFieldsBtn.addEventListener('click', function() {
            const recordTypeId = recordTypeInput.value.trim();
            logToConsole('Fetch fields button clicked for record type: ' + recordTypeId);
            
            if (recordTypeId) {
                fetchFieldsForRecordType(recordTypeId);
            } else {
                showToast('Please enter a record type ID', 'error');
            }
        });
    }
    
    // Set up field mapping
    if (addMappingBtn) {
        addMappingBtn.addEventListener('click', function() {
            addFieldMappingRow();
        });
    }
    
    // Save configuration
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            saveConfiguration();
        });
    }
    
    // Select a platform
    function selectPlatform(buttonElement) {
        selectedPlatform = buttonElement.closest('.platform-card').dataset.platform || 
                         buttonElement.dataset.platform;
        
        logToConsole('Selected platform: ' + selectedPlatform);
        
        platformSelection.style.display = 'none';
        integrationForm.style.display = 'block';
        
        // Set platform-specific UI elements
        document.getElementById('platformConfigTitle').textContent = 
            capitalize(selectedPlatform) + ' Credentials';
        
        // Show relevant configuration panel
        salesforceConfig.style.display = 'none';
        sapConfig.style.display = 'none';
        hubspotConfig.style.display = 'none';
        
        if (selectedPlatform === 'salesforce') salesforceConfig.style.display = 'block';
        if (selectedPlatform === 'sap') sapConfig.style.display = 'block';
        if (selectedPlatform === 'hubspot') hubspotConfig.style.display = 'block';
        
        // Reset to first step
        showStep(1);
    }
    
    // Show a specific step
    function showStep(step) {
        currentStep = step;
        
        // Hide all steps
        step1.style.display = 'none';
        step2.style.display = 'none';
        step3.style.display = 'none';
        
        // Show the current step
        if (step === 1) {
            step1.style.display = 'block';
            backBtn.textContent = 'Back';
            nextBtn.style.display = 'inline-block';
            progressBar.style.width = '33%';
            progressStep.textContent = 'Step 1 of 3';
        } else if (step === 2) {
            step2.style.display = 'block';
            backBtn.textContent = 'Back';
            nextBtn.style.display = 'inline-block';
            progressBar.style.width = '66%';
            progressStep.textContent = 'Step 2 of 3';
        } else if (step === 3) {
            step3.style.display = 'block';
            nextBtn.style.display = 'none';
            progressBar.style.width = '100%';
            progressStep.textContent = 'Step 3 of 3';
        }
        
        logToConsole('Navigated to step ' + step);
    }
    
    // Validate current step
    function validateCurrentStep() {
        if (currentStep === 1) {
            // Check if using auto authentication or direct token
            const isAutoAuth = document.getElementById('authMethodAuto') && 
                             document.getElementById('authMethodAuto').checked;
            
            // For auto auth, check session token or require authentication
            if (isAutoAuth) {
                const authStatus = document.getElementById('authStatus');
                
                // If no success message is visible, require authentication
                if (!authStatus || authStatus.style.display === 'none' || 
                    !authStatus.classList.contains('alert-success')) {
                    showToast('Please authenticate with Alchemy first', 'error');
                    return false;
                }
            } else {
                // For direct token input, validate tenant ID and refresh token
                const tenantId = document.getElementById('alchemyTenantIdDirect').value;
                const refreshToken = document.getElementById('alchemyRefreshToken').value;
                
                if (!tenantId) {
                    showToast('Please enter Alchemy Tenant ID', 'error');
                    return false;
                }
                
                if (!refreshToken) {
                    showToast('Please enter Alchemy Refresh Token', 'error');
                    return false;
                }
            }
            
            // Validate platform-specific fields
            if (selectedPlatform === 'salesforce') {
                if (!document.getElementById('salesforceInstanceUrl').value) {
                    showToast('Please enter Salesforce Instance URL', 'error');
                    return false;
                }
            } else if (selectedPlatform === 'sap') {
                if (!document.getElementById('sapBaseUrl').value) {
                    showToast('Please enter SAP Base URL', 'error');
                    return false;
                }
            } else if (selectedPlatform === 'hubspot') {
                if (!document.getElementById('hubspotApiKey').value) {
                    showToast('Please enter HubSpot API Key', 'error');
                    return false;
                }
            }
            
            return true;
        } else if (currentStep === 2) {
            // Either a record type must be selected or entered
            const recordType = recordTypeSelect ? recordTypeSelect.value : '';
            const inputRecordType = recordTypeInput ? recordTypeInput.value : '';
            
            if (!recordType && !inputRecordType) {
                showToast('Please enter or select a record type', 'error');
                return false;
            }
            
            return true;
        }
        
        return true;
    }
    
    // Fetch record types from Alchemy API
    function fetchRecordTypes() {
        showToast('Fetching record types...', 'info');
        
        let tenantId, refreshToken;
        
        // Get credentials based on authentication method
        const isAutoAuth = document.getElementById('authMethodAuto') && 
                         document.getElementById('authMethodAuto').checked;
        
        if (isAutoAuth) {
            tenantId = document.getElementById('alchemyTenantId').value;
            // Refresh token is stored on server side
            refreshToken = "session"; // Just a placeholder, server will use session token
        } else {
            tenantId = document.getElementById('alchemyTenantIdDirect').value;
            refreshToken = document.getElementById('alchemyRefreshToken').value;
        }
        
        // Clear existing record types
        if (recordTypeSelect) {
            recordTypeSelect.innerHTML = '<option value="">-- Select Record Type --</option>';
        }
        
        fetch('/get-alchemy-record-types', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tenant_id: tenantId,
                refresh_token: refreshToken
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`API returned status code ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.recordTypes && data.recordTypes.length > 0) {
                recordTypes = data.recordTypes;
                
                // Sort record types alphabetically
                recordTypes.sort((a, b) => a.name.localeCompare(b.name));
                
                // Add record types to dropdown
                if (recordTypeSelect) {
                    recordTypes.forEach(function(type) {
                        const option = document.createElement('option');
                        option.value = type.identifier;
                        option.textContent = type.name;
                        recordTypeSelect.appendChild(option);
                    });
                    
                    // Show record type select
                    recordTypeSelect.style.display = 'block';
                    
                    // Refresh Select2 if available
                    try {
                        if ($.fn.select2) {
                            $(recordTypeSelect).trigger('change');
                        }
                    } catch (e) {
                        logToConsole('Error refreshing Select2: ' + e.message);
                    }
                }
                
                showToast(`Successfully loaded ${recordTypes.length} record types`, 'success');
            } else {
                showToast('No record types found', 'warning');
            }
        })
        .catch(error => {
            logToConsole('Error fetching record types: ' + error.message);
            showToast('Error fetching record types: ' + error.message, 'error');
        });
    }
    
    // Fetch fields for a record type
    function fetchFieldsForRecordType(recordTypeId) {
        logToConsole('Fetching fields for record type: ' + recordTypeId);
        
        // Get tenant and token information
        let tenantId, refreshToken;
        
        // Get credentials based on authentication method
        const isAutoAuth = document.getElementById('authMethodAuto') && 
                         document.getElementById('authMethodAuto').checked;
        
        if (isAutoAuth) {
            tenantId = document.getElementById('alchemyTenantId').value;
            // Refresh token is stored on server side
            refreshToken = "session"; // Just a placeholder, server will use session token
        } else {
            tenantId = document.getElementById('alchemyTenantIdDirect').value;
            refreshToken = document.getElementById('alchemyRefreshToken').value;
        }
        
        if (!tenantId) {
            showToast('Please enter Alchemy tenant ID', 'error');
            return;
        }
        
        showToast('Fetching fields for ' + recordTypeId + '...', 'info');
        
        // Make API request
        fetch('/get-alchemy-fields', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tenant_id: tenantId,
                refresh_token: refreshToken,
                record_type: recordTypeId
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('API returned status ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            logToConsole('Received API response for fields');
            
            if (data.fields && data.fields.length > 0) {
                processFieldsResponse(data.fields, recordTypeId);
            } else {
                // Handle empty response - try to fetch sample record data
                logToConsole('No fields returned from API, trying to fetch sample record data');
                
                showToast('Fetching sample record data to extract fields...', 'info');
                
                fetch('/get-sample-record', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        tenant_id: tenantId,
                        refresh_token: refreshToken,
                        record_type: recordTypeId
                    })
                })
                .then(response => response.json())
                .then(sampleData => {
                    if (sampleData.status === 'success' && sampleData.record_data) {
                        logToConsole('Successfully got sample record data');
                        // Extract fields from the sample record
                        const extractedFields = extractFieldsFromSampleData(sampleData.record_data);
                        processFieldsResponse(extractedFields, recordTypeId);
                    } else {
                        logToConsole('Failed to get sample data: ' + sampleData.message);
                        showToast('Failed to get sample data: ' + sampleData.message, 'error');
                        // Fall back to using example structure
                        const fallbackFields = extractFieldsFromFallbackData();
                        processFieldsResponse(fallbackFields, recordTypeId);
                    }
                })
                .catch(error => {
                    logToConsole('Error fetching sample data: ' + error.message);
                    showToast('Error fetching sample data: ' + error.message, 'error');
                    
                    // Fall back to using example structure
                    const fallbackFields = extractFieldsFromFallbackData();
                    processFieldsResponse(fallbackFields, recordTypeId);
                });
            }
        })
        .catch(error => {
            logToConsole('Error fetching fields: ' + error.message);
            showToast('Error fetching fields: ' + error.message, 'error');
            
            // Fall back to using example structure
            const fallbackFields = extractFieldsFromFallbackData();
            processFieldsResponse(fallbackFields, recordTypeId);
        });
    }
    
    // Extract fields from sample record data
    function extractFieldsFromSampleData(recordData) {
        logToConsole('Extracting fields from sample record data');
        
        const fields = [];
        
        // Process the records array
        if (recordData.records && recordData.records.length > 0) {
            const firstRecord = recordData.records[0];
            
            // Process main fields
            if (firstRecord.fields) {
                firstRecord.fields.forEach(field => {
                    fields.push({ 
                        identifier: field.identifier,
                        name: field.identifier  // Using identifier as name since no display name is provided
                    });
                });
            }
            
            // Process field groups
            if (firstRecord.fieldGroups) {
                firstRecord.fieldGroups.forEach(group => {
                    // Add the group identifier itself
                    fields.push({
                        identifier: group.identifier,
                        name: group.identifier + ' (Group)'
                    });
                    
                    // Add fields within the group
                    if (group.fields) {
                        group.fields.forEach(field => {
                            fields.push({
                                identifier: field.identifier,
                                name: group.identifier + '.' + field.identifier
                            });
                        });
                    }
                });
            }
            
            // Process fieldValues if available
            if (firstRecord.fieldValues) {
                Object.keys(firstRecord.fieldValues).forEach(key => {
                    // Check if we already have this field to avoid duplicates
                    if (!fields.some(f => f.identifier === key)) {
                        fields.push({
                            identifier: key,
                            name: key
                        });
                    }
                });
            }
        }
        
        logToConsole('Extracted ' + fields.length + ' fields from sample data');
        return fields;
    }
    
    // Extract fields from fallback data structure
    function extractFieldsFromFallbackData() {
        logToConsole('Extracting fields from fallback data structure');
        
        // This is a generic structure based on common Alchemy fields
        return [
            { identifier: "Item", name: "Item" },
            { identifier: "LocationName", name: "LocationName" },
            { identifier: "Company", name: "Company" },
            { identifier: "LocationType", name: "LocationType" },
            { identifier: "LocatedAt", name: "LocatedAt" },
            { identifier: "Street", name: "Street" },
            { identifier: "City", name: "City" },
            { identifier: "Country", name: "Country" },
            { identifier: "State", name: "State" },
            { identifier: "PostalCode", name: "PostalCode" },
            { identifier: "StorageType", name: "StorageType" },
            { identifier: "RecordName", name: "RecordName" },
            { identifier: "Phone", name: "Phone" },
            { identifier: "Email", name: "Email" },
            { identifier: "ExternalCode", name: "ExternalCode" },
            { identifier: "Description", name: "Description" },
            { identifier: "Status", name: "Status" }
        ];
    }
    
    // Process fields response data
    function processFieldsResponse(fields, recordTypeId) {
        // Store fields globally
        alchemyFields = fields;
        
        // Update record type description
        if (recordTypeDescription) {
            recordTypeDescription.textContent = 
                'Record Type: ' + recordTypeId + ' (' + fields.length + ' fields found)';
        }
        
        // Generate platform fields based on selected platform
        generatePlatformFields();
        
        // Navigate to step 3 for field mapping
        showStep(3);
        
        // Prepare field mapping UI
        prepareFieldMapping();
        
        showToast('Successfully loaded ' + fields.length + ' fields from Alchemy', 'success');
    }
    
    // Generate platform fields for mapping
    function generatePlatformFields() {
        logToConsole('Generating platform fields for ' + selectedPlatform);
        
        if (selectedPlatform === 'salesforce') {
            platformFields = [
                { identifier: 'name', name: 'Name' },
                { identifier: 'account', name: 'Account' },
                { identifier: 'opportunity', name: 'Opportunity' },
                { identifier: 'contact', name: 'Contact' },
                { identifier: 'email', name: 'Email' },
                { identifier: 'phone', name: 'Phone' },
                { identifier: 'address', name: 'Address' },
                { identifier: 'description', name: 'Description' }
            ];
        } else if (selectedPlatform === 'sap') {
            platformFields = [
                { identifier: 'material', name: 'Material' },
                { identifier: 'vendor', name: 'Vendor' },
                { identifier: 'purchase_order', name: 'Purchase Order' },
                { identifier: 'delivery', name: 'Delivery' },
                { identifier: 'invoice', name: 'Invoice' },
                { identifier: 'customer', name: 'Customer' },
                { identifier: 'cost_center', name: 'Cost Center' }
            ];
        } else if (selectedPlatform === 'hubspot') {
            platformFields = [
                { identifier: 'first_name', name: 'First Name' },
                { identifier: 'last_name', name: 'Last Name' },
                { identifier: 'email', name: 'Email' },
                { identifier: 'company', name: 'Company' },
                { identifier: 'website', name: 'Website' },
                { identifier: 'phone', name: 'Phone' },
                { identifier: 'address', name: 'Address' }
            ];
        }
    }
    
    // Prepare field mapping UI
    function prepareFieldMapping() {
        if (!fieldMappingContainer) return;
        
        fieldMappingContainer.innerHTML = ''; // Clear existing mappings
        
        // Add initial mapping row
        addFieldMappingRow();
    }
    
    // Add a field mapping row
    function addFieldMappingRow() {
        if (!fieldMappingContainer) return;
        
        const mappingRow = document.createElement('div');
        mappingRow.className = 'mapping-row d-flex align-items-center gap-2';
        
        // Create Alchemy field select
        const alchemySelect = document.createElement('select');
        alchemySelect.className = 'form-select me-2';
        
        // Default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select Alchemy Field';
        alchemySelect.appendChild(defaultOption);
        
        // Add options from alchemyFields
        if (alchemyFields && alchemyFields.length) {
            alchemyFields.forEach(field => {
                const option = document.createElement('option');
                option.value = field.identifier;
                option.textContent = field.name || field.identifier;
                alchemySelect.appendChild(option);
            });
        }
        
        // Create platform field select
        const platformSelect = document.createElement('select');
        platformSelect.className = 'form-select me-2';
        
        // Default option
        const platformDefaultOption = document.createElement('option');
        platformDefaultOption.value = '';
        platformDefaultOption.textContent = 'Select Platform Field';
        platformSelect.appendChild(platformDefaultOption);
        
        // Add options from platformFields
        if (platformFields && platformFields.length) {
            platformFields.forEach(field => {
                const option = document.createElement('option');
                option.value = field.identifier;
                option.textContent = field.name;
                platformSelect.appendChild(option);
            });
        }
        
        // Create remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-remove-mapping ms-auto';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.addEventListener('click', function() {
            mappingRow.remove();
        });
        
        // Append all elements
        mappingRow.appendChild(alchemySelect);
        mappingRow.appendChild(platformSelect);
        mappingRow.appendChild(removeBtn);
        
        // Add to container
        fieldMappingContainer.appendChild(mappingRow);
        
        // Initialize Select2 if available
        try {
            if ($.fn.select2) {
                $(alchemySelect).select2({
                    width: '100%'
                });
                
                $(platformSelect).select2({
                    width: '100%'
                });
            }
        } catch (e) {
            logToConsole('Error initializing Select2 for mapping row: ' + e.message);
        }
    }
    
    // Save the complete configuration
    function saveConfiguration() {
        logToConsole('Saving integration configuration');
        
        // Validate if we have at least one field mapping
        if (fieldMappingContainer.children.length === 0) {
            showToast('Please add at least one field mapping', 'error');
            return;
        }
        
        // Collect field mappings
        const mappings = [];
        const mappingRows = fieldMappingContainer.querySelectorAll('.mapping-row');
        
        mappingRows.forEach(row => {
            const alchemyField = row.querySelector('.form-select:nth-child(1)').value;
            const platformField = row.querySelector('.form-select:nth-child(2)').value;
            
            if (alchemyField && platformField) {
                mappings.push({
                    alchemy_field: alchemyField,
                    platform_field: platformField
                });
            }
        });
        
        if (mappings.length === 0) {
            showToast('Please complete at least one field mapping', 'error');
            return;
        }
        
        // Get tenant ID and refresh token based on authentication method
        let tenantId, refreshToken;
        
        const isAutoAuth = document.getElementById('authMethodAuto') && 
                         document.getElementById('authMethodAuto').checked;
        
        if (isAutoAuth) {
            tenantId = document.getElementById('alchemyTenantId').value;
            // Server will use the token from session
            refreshToken = "session";
        } else {
            tenantId = document.getElementById('alchemyTenantIdDirect').value;
            refreshToken = document.getElementById('alchemyRefreshToken').value;
        }
        
        // Collect platform-specific configuration
        let platformConfig = {};
        
        if (selectedPlatform === 'salesforce') {
            platformConfig = {
                instance_url: document.getElementById('salesforceInstanceUrl').value,
                client_id: document.getElementById('salesforceClientId').value,
                client_secret: document.getElementById('salesforceClientSecret').value
            };
        } else if (selectedPlatform === 'sap') {
            platformConfig = {
                base_url: document.getElementById('sapBaseUrl').value,
                client_id: document.getElementById('sapClientId').value,
                client_secret: document.getElementById('sapClientSecret').value
            };
        } else if (selectedPlatform === 'hubspot') {
            platformConfig = {
                api_key: document.getElementById('hubspotApiKey').value,
                portal_id: document.getElementById('hubspotPortalId').value
            };
        }
        
        // Get record type ID
        let recordTypeId;
        
        if (recordTypeSelect && recordTypeSelect.value) {
            recordTypeId = recordTypeSelect.value;
        } else if (recordTypeInput && recordTypeInput.value) {
            recordTypeId = recordTypeInput.value;
        }
        
        // Prepare complete configuration data
        const configData = {
            platform: selectedPlatform,
            alchemy: {
                tenant_id: tenantId,
                refresh_token: refreshToken
            },
            platform_config: platformConfig,
            record_type: recordTypeId,
            sync_frequency: document.getElementById('syncFrequency').value,
            sync_direction: document.getElementById('syncDirection').value,
            field_mappings: mappings
        };
        
        logToConsole('Sending configuration to server');
        
        // Send to backend
        fetch('/save-integration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(configData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showToast('Integration saved successfully!', 'success');
                
                // Show success alert with integration ID
                const successAlert = document.createElement('div');
                successAlert.className = 'alert alert-success mt-4';
                successAlert.innerHTML = `
                    <i class="fas fa-check-circle me-2"></i>
                    Integration configured successfully! ID: ${data.id}
                `;
                
                // Add a button to go back to the platform selection
                const returnBtn = document.createElement('button');
                returnBtn.className = 'btn btn-success mt-3';
                returnBtn.innerHTML = '<i class="fas fa-plus me-2"></i>Create Another Integration';
                returnBtn.addEventListener('click', function() {
                    // Reset form and go back to platform selection
                    resetForm();
                    integrationForm.style.display = 'none';
                    platformSelection.style.display = 'block';
                });
                
                // Replace step 3 content with success message
                step3.innerHTML = '';
                
                const titleDiv = document.createElement('div');
                titleDiv.className = 'form-title';
                titleDiv.textContent = 'Integration Successful';
                
                step3.appendChild(titleDiv);
                step3.appendChild(successAlert);
                step3.appendChild(returnBtn);
                
            } else {
                showToast(data.message || 'Error saving integration', 'error');
            }
        })
        .catch(error => {
            logToConsole('Error saving configuration: ' + error.message);
            showToast('Error saving configuration: ' + error.message, 'error');
        });
    }
    
    // Reset the form
    function resetForm() {
        // Reset current step
        currentStep = 1;
        
        // Clear form fields
        const formInputs = document.querySelectorAll('input, select');
        formInputs.forEach(input => {
            input.value = '';
        });
        
        // Clear field mappings
        if (fieldMappingContainer) {
            fieldMappingContainer.innerHTML = '';
        }
        
        // Reset variables
        alchemyFields = [];
        platformFields = [];
        
        // Reset to step 1
        showStep(1);
    }
}

// Setup authentication handlers
function setupAuthenticationHandlers() {
    logToConsole('Setting up authentication handlers');
    
    // Elements
    const authMethodAuto = document.getElementById('authMethodAuto');
    const authMethodToken = document.getElementById('authMethodToken');
    const autoAuthForm = document.getElementById('autoAuthForm');
    const tokenAuthForm = document.getElementById('tokenAuthForm');
    const authenticateBtn = document.getElementById('authenticateBtn');
    const authStatus = document.getElementById('authStatus');
    
    // Toggle between authentication methods
    if (authMethodAuto && authMethodToken) {
        authMethodAuto.addEventListener('change', function() {
            if (this.checked) {
                autoAuthForm.style.display = 'block';
                tokenAuthForm.style.display = 'none';
                logToConsole('Switched to auto authentication');
            }
        });
        
        authMethodToken.addEventListener('change', function() {
            if (this.checked) {
                autoAuthForm.style.display = 'none';
                tokenAuthForm.style.display = 'block';
                logToConsole('Switched to token authentication');
            }
        });
    }
    
    // Handle authentication button click
    if (authenticateBtn) {
        authenticateBtn.addEventListener('click', function() {
            const tenantId = document.getElementById('alchemyTenantId').value.trim();
            const email = document.getElementById('alchemyEmail').value.trim();
            const password = document.getElementById('alchemyPassword').value.trim();
            
            if (!tenantId || !email || !password) {
                showAuthStatus('error', 'Please provide all required credentials');
                return;
            }
            
            // Disable button during authentication
            authenticateBtn.disabled = true;
            authenticateBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin me-2"></i>Authenticating...';
            
            // Clear previous status
            showAuthStatus('info', 'Authenticating with Alchemy...');
            
            // Send authentication request
            authenticateWithAlchemy(tenantId, email, password);
        });
    }
    
    // Check if we already have a token in the session
    checkExistingToken();
}

// Setup password toggle handlers
function setupPasswordToggleHandlers() {
    // Toggle password visibility
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('alchemyPassword');
            toggleFieldVisibility(passwordInput, this.querySelector('i'));
        });
    }
    
    // Toggle refresh token visibility
    const toggleRefreshToken = document.getElementById('toggleRefreshToken');
    if (toggleRefreshToken) {
        toggleRefreshToken.addEventListener('click', function() {
            const tokenInput = document.getElementById('alchemyRefreshToken');
            toggleFieldVisibility(tokenInput, this.querySelector('i'));
        });
    }
}

// Toggle field visibility (password/token)
function toggleFieldVisibility(input, icon) {
    if (!input || !icon) return;
    
    const type = input.type === 'password' ? 'text' : 'password';
    input.type = type;
    
    if (type === 'text') {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Display authentication status
function showAuthStatus(type, message) {
    const authStatus = document.getElementById('authStatus');
    if (!authStatus) return;
    
    let statusClass = '';
    let icon = '';
    
    if (type === 'success') {
        statusClass = 'alert-success';
        icon = '<i class="fas fa-check-circle me-2"></i>';
    } else if (type === 'error') {
        statusClass = 'alert-danger';
        icon = '<i class="fas fa-exclamation-circle me-2"></i>';
    } else {
        statusClass = 'alert-info';
        icon = '<i class="fas fa-info-circle me-2"></i>';
    }
    
    authStatus.className = `alert ${statusClass} mt-2`;
    authStatus.innerHTML = `${icon}${message}`;
    authStatus.style.display = 'block';
}

// Authenticate with Alchemy API
function authenticateWithAlchemy(tenantId, email, password) {
    logToConsole(`Authenticating with tenant: ${tenantId}`);
    
    fetch('/authenticate-alchemy', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            tenant_id: tenantId,
            email: email,
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {
        const authenticateBtn = document.getElementById('authenticateBtn');
        
        // Reset button state
        if (authenticateBtn) {
            authenticateBtn.disabled = false;
            authenticateBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Authenticate with Alchemy';
        }
        
        if (data.status === 'success') {
            // Authentication succeeded
            logToConsole('Authentication successful');
            showAuthStatus('success', 'Authentication successful! You can now proceed.');
            
            // If there's a different tenant ID input field for direct token method,
            // keep it in sync
            const directTenantInput = document.getElementById('alchemyTenantIdDirect');
            if (directTenantInput) {
                directTenantInput.value = tenantId;
            }
            
            // Enable steps to continue
            const nextBtn = document.getElementById('nextBtn');
            if (nextBtn) {
                nextBtn.disabled = false;
            }
            
            // Optionally proceed to next step
            setTimeout(() => {
                const nextBtn = document.getElementById('nextBtn');
                if (nextBtn) {
                    nextBtn.click();
                }
            }, 1500);
            
        } else {
            // Authentication failed
            logToConsole('Authentication failed: ' + data.message);
            
            let errorMessage = data.message;
            
            // If there are available tenants, suggest them
            if (data.available_tenants && data.available_tenants.length > 0) {
                errorMessage += '<br><br>Available tenants:<ul>';
                data.available_tenants.forEach(tenant => {
                    errorMessage += `<li><a href="#" class="tenant-suggestion" data-tenant="${tenant}">${tenant}</a></li>`;
                });
                errorMessage += '</ul>';
            }
            
            showAuthStatus('error', errorMessage);
            
            // Add click handlers for tenant suggestions
            setTimeout(() => {
                document.querySelectorAll('.tenant-suggestion').forEach(link => {
                    link.addEventListener('click', function(e) {
                        e.preventDefault();
                        const suggestedTenant = this.getAttribute('data-tenant');
                        document.getElementById('alchemyTenantId').value = suggestedTenant;
                        logToConsole(`Selected suggested tenant: ${suggestedTenant}`);
                    });
                });
            }, 100);
        }
    })
    .catch(error => {
        logToConsole('Error authenticating: ' + error.message);
        
        const authenticateBtn = document.getElementById('authenticateBtn');
        if (authenticateBtn) {
            authenticateBtn.disabled = false;
            authenticateBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Authenticate with Alchemy';
        }
        
        showAuthStatus('error', `Error: ${error.message}`);
    });
}

// Check if we already have a token in session
function checkExistingToken() {
    const tenantInput = document.getElementById('alchemyTenantId');
    if (!tenantInput || !tenantInput.value) return;
    
    const tenantId = tenantInput.value.trim();
    if (!tenantId) return;
    
    logToConsole(`Checking for existing token for tenant: ${tenantId}`);
    
    fetch('/get-session-token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            tenant_id: tenantId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success' && data.authenticated) {
            logToConsole('Found existing token in session');
            showAuthStatus('success', 'You are already authenticated with this tenant.');
            
            // Copy to direct tenant input if it exists
            const directTenantInput = document.getElementById('alchemyTenantIdDirect');
            if (directTenantInput) {
                directTenantInput.value = tenantId;
            }
        }
    })
    .catch(error => {
        logToConsole('Error checking token: ' + error.message);
    });
}

// Show toast notification
function showToast(message, type) {
    logToConsole(`Toast: ${type} - ${message}`);
    
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Set icon based on type
    let icon = '';
    if (type === 'success') icon = '<i class="fas fa-check-circle me-2"></i>';
    else if (type === 'error') icon = '<i class="fas fa-exclamation-circle me-2"></i>';
    else if (type === 'warning') icon = '<i class="fas fa-exclamation-triangle me-2"></i>';
    else icon = '<i class="fas fa-info-circle me-2"></i>';
    
    toast.innerHTML = icon + message;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Auto-remove after delay
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 3000);
}

// Helper function to capitalize first letter
function capitalize(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}
