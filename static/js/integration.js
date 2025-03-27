/**
 * Alchemy Integration Manager
 * JavaScript for managing the integration configuration workflow
 */

console.log('Integration.js is loading...');

// Make sure to run the code after the document is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM is ready via DOMContentLoaded');
    
    // Verify jQuery is loaded correctly
    if (typeof jQuery !== 'undefined') {
        console.log('jQuery is loaded properly, version: ' + jQuery.fn.jquery);
    } else {
        console.error('jQuery is NOT loaded!');
        return; // Exit if jQuery is not loaded
    }
    
    // Manual initialization of buttons (without relying on jQuery)
    document.querySelectorAll('.select-platform').forEach(function(button) {
        console.log('Adding click handler to button:', button.textContent);
        
        button.addEventListener('click', function(e) {
            console.log('Platform button clicked via plain JS!', e.target.textContent);
            let platformCard = this.closest('.platform-card');
            let selectedPlatform = platformCard.dataset.platform;
            console.log('Selected platform:', selectedPlatform);
            
            // Rest of the button click handler
            document.getElementById('platformSelection').style.display = 'none';
            document.getElementById('integrationForm').style.display = 'block';
            
            // Set platform-specific UI elements
            document.getElementById('platformConfigTitle').textContent = 
                capitalize(selectedPlatform) + ' Credentials';
            
            // Hide all config panels
            document.getElementById('salesforceConfig').style.display = 'none';
            document.getElementById('sapConfig').style.display = 'none';
            document.getElementById('hubspotConfig').style.display = 'none';
            
            // Show relevant panel
            if (selectedPlatform === 'salesforce') {
                document.getElementById('salesforceConfig').style.display = 'block';
            } else if (selectedPlatform === 'sap') {
                document.getElementById('sapConfig').style.display = 'block';
            } else if (selectedPlatform === 'hubspot') {
                document.getElementById('hubspotConfig').style.display = 'block';
            }
            
            // Initialize to step 1
            showStep(1);
        });
    });
    
    // Initialize after jQuery is ready
    $(function() {
        console.log('jQuery document.ready triggered');
        initializeApp();
    });
});

function initializeApp() {
    console.log('Initializing app with jQuery');
    // Initialize Select2 for enhanced dropdowns
    try {
        $('.form-select').select2({
            width: '100%'
        });
        console.log('Select2 initialized');
    } catch (e) {
        console.error('Error initializing Select2:', e);
    }
    
    // Variables
    let selectedPlatform = null;
    let currentStep = 1;
    let alchemyFields = [];
    let platformFields = [];
    let recordTypes = [];
    
    // DOM Elements
    const platformSelection = $('#platformSelection');
    const integrationForm = $('#integrationForm');
    const progressBar = $('#progressBar');
    const progressStep = $('#progressStep');
    const backBtn = $('#backBtn');
    const nextBtn = $('#nextBtn');
    const saveBtn = $('#saveBtn');
    const backToStep2Btn = $('#backToStep2Btn');
    const addMappingBtn = $('#addMappingBtn');
    const fieldMappingContainer = $('#fieldMappingContainer');
    
    // Step Elements
    const step1 = $('#step1');
    const step2 = $('#step2');
    const step3 = $('#step3');
    
    // Platform specific elements
    const salesforceConfig = $('#salesforceConfig');
    const sapConfig = $('#sapConfig');
    const hubspotConfig = $('#hubspotConfig');
    
    // Form Field Elements
    const alchemyTenantId = $('#alchemyTenantId');
    const alchemyRefreshToken = $('#alchemyRefreshToken');
    const recordTypeSelect = $('#recordTypeSelect');
    const recordTypeDescription = $('#recordTypeDescription');
    
    // Toggle password visibility
    $('#toggleRefreshToken').on('click', function() {
        togglePasswordVisibility(alchemyRefreshToken, $(this).find('i'));
    });
    
    $('#toggleClientSecret').on('click', function() {
        togglePasswordVisibility($('#salesforceClientSecret'), $(this).find('i'));
    });
    
    // Navigation Buttons
    backBtn.on('click', function() {
        console.log('Back button clicked');
        if (currentStep === 1) {
            // Go back to platform selection
            integrationForm.hide();
            platformSelection.show();
        } else {
            // Go to previous step
            showStep(currentStep - 1);
        }
    });
    
    nextBtn.on('click', function() {
        console.log('Next button clicked');
        if (validateCurrentStep()) {
            showStep(currentStep + 1);
        }
    });
    
    backToStep2Btn.on('click', function() {
        showStep(2);
    });
    
    // Handle Alchemy credentials entered - fetch record types
    alchemyTenantId.on('change', function() {
        if (alchemyTenantId.val() && alchemyRefreshToken.val()) {
            fetchRecordTypes();
        }
    });
    
    alchemyRefreshToken.on('change', function() {
        if (alchemyTenantId.val() && alchemyRefreshToken.val()) {
            fetchRecordTypes();
        }
    });
    
    // Handle record type selection - fetch fields
    recordTypeSelect.on('change', function() {
        const recordType = $(this).val();
        
        if (recordType) {
            // Update description based on selected record type
            const selectedType = recordTypes.find(type => type.identifier === recordType);
            if (selectedType) {
                recordTypeDescription.text(selectedType.name || 'No description available');
            }
            
            // Fetch fields for the selected record type
            fetchAlchemyFields(recordType);
        } else {
            recordTypeDescription.text('Select a record type to view its description');
        }
    });
    
    // Add Field Mapping
    addMappingBtn.on('click', function() {
        addFieldMappingRow();
    });
    
    // Save Configuration
    saveBtn.on('click', function() {
        saveConfiguration();
    });
    
    // Fetch Alchemy Record Types
    function fetchRecordTypes() {
        showToast('Fetching record types...', 'info');
        
        // Clear existing record types
        recordTypeSelect.empty();
        recordTypeSelect.append('<option value="">-- Select Record Type --</option>');
        
        $.ajax({
            url: '/get-alchemy-record-types',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                tenant_id: alchemyTenantId.val(),
                refresh_token: alchemyRefreshToken.val()
            }),
            success: function(response) {
                if (response.recordTypes && response.recordTypes.length > 0) {
                    recordTypes = response.recordTypes;
                    
                    // Sort record types alphabetically
                    recordTypes.sort((a, b) => a.name.localeCompare(b.name));
                    
                    // Add record types to dropdown
                    recordTypes.forEach(function(type) {
                        recordTypeSelect.append(`<option value="${type.identifier}">${type.name}</option>`);
                    });
                    
                    showToast(`Successfully loaded ${recordTypes.length} record types`, 'success');
                } else {
                    showToast('No record types found', 'warning');
                }
                
                // Refresh the Select2 dropdown
                recordTypeSelect.trigger('change');
            },
            error: function(xhr) {
                let errorMsg = 'Failed to fetch record types';
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    errorMsg = xhr.responseJSON.error;
                }
                showToast(errorMsg, 'error');
            }
        });
    }
    
    // Fetch Alchemy Fields for a specific record type
    function fetchAlchemyFields(recordType) {
        showToast('Fetching fields...', 'info');
        
        $.ajax({
            url: '/get-alchemy-fields',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                tenant_id: alchemyTenantId.val(),
                refresh_token: alchemyRefreshToken.val(),
                record_type: recordType
            }),
            success: function(response) {
                if (response.fields && response.fields.length > 0) {
                    alchemyFields = response.fields;
                    
                    // Store platform fields based on selected platform
                    generatePlatformFields();
                    
                    showToast(`Successfully loaded ${alchemyFields.length} fields`, 'success');
                } else {
                    showToast('No fields found for this record type', 'warning');
                }
            },
            error: function(xhr) {
                let errorMsg = 'Failed to fetch fields';
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    errorMsg = xhr.responseJSON.error;
                }
                showToast(errorMsg, 'error');
            }
        });
    }
    
    // Generate mock platform fields based on selected platform
    function generatePlatformFields() {
        // In a real app, you would fetch these from the platform's API
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
        
        // Prepare field mapping UI with the fields
        fieldMappingContainer.empty();
        // Add initial mapping row
        addFieldMappingRow();
    }
    
    // Add a field mapping row
    function addFieldMappingRow() {
        const mappingRow = $('<div>').addClass('mapping-row d-flex align-items-center gap-2');
        
        // Create Alchemy field select
        const alchemySelect = $('<select>').addClass('form-select alchemy-field me-2');
        alchemySelect.append('<option value="">Select Alchemy Field</option>');
        
        alchemyFields.forEach(field => {
            alchemySelect.append(`<option value="${field.identifier}">${field.name}</option>`);
        });
        
        // Create platform field select
        const platformSelect = $('<select>').addClass('form-select platform-field me-2');
        platformSelect.append(`<option value="">Select ${capitalize(selectedPlatform)} Field</option>`);
        
        platformFields.forEach(field => {
            platformSelect.append(`<option value="${field.identifier}">${field.name}</option>`);
        });
        
        // Create remove button
        const removeBtn = $('<button>').addClass('btn-remove-mapping ms-auto')
            .html('<i class="fas fa-times"></i>')
            .on('click', function() {
                $(this).closest('.mapping-row').remove();
            });
        
        // Append elements to the row
        mappingRow.append(alchemySelect, platformSelect, removeBtn);
        
        // Add to container
        fieldMappingContainer.append(mappingRow);
        
        // Initialize Select2 for the new dropdowns
        alchemySelect.select2({
            width: '100%'
        });
        
        platformSelect.select2({
            width: '100%'
        });
    }
    
    // Save the complete configuration
    function saveConfiguration() {
        // Validate if we have at least one field mapping
        if (fieldMappingContainer.children().length === 0) {
            showToast('Please add at least one field mapping', 'error');
            return;
        }
        
        // Collect field mappings
        const mappings = [];
        $('.mapping-row').each(function() {
            const alchemyField = $(this).find('.alchemy-field').val();
            const platformField = $(this).find('.platform-field').val();
            
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
        
        // Collect platform-specific configuration
        let platformConfig = {};
        
        if (selectedPlatform === 'salesforce') {
            platformConfig = {
                instance_url: $('#salesforceInstanceUrl').val(),
                client_id: $('#salesforceClientId').val(),
                client_secret: $('#salesforceClientSecret').val()
            };
        } else if (selectedPlatform === 'sap') {
            platformConfig = {
                base_url: $('#sapBaseUrl').val(),
                client_id: $('#sapClientId').val(),
                client_secret: $('#sapClientSecret').val()
            };
        } else if (selectedPlatform === 'hubspot') {
            platformConfig = {
                api_key: $('#hubspotApiKey').val(),
                portal_id: $('#hubspotPortalId').val()
            };
        }
        
        // Prepare complete configuration data
        const configData = {
            platform: selectedPlatform,
            alchemy: {
                tenant_id: alchemyTenantId.val(),
                refresh_token: alchemyRefreshToken.val()
            },
            platform_config: platformConfig,
            record_type: recordTypeSelect.val(),
            sync_frequency: $('#syncFrequency').val(),
            sync_direction: $('#syncDirection').val(),
            field_mappings: mappings
        };
        
        // Send to backend
        $.ajax({
            url: '/save-integration',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(configData),
            beforeSend: function() {
                saveBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>Saving...');
            },
            success: function(response) {
                saveBtn.prop('disabled', false).html('<i class="fas fa-save me-2"></i>Save Configuration');
                
                if (response.status === 'success') {
                    showToast('Integration saved successfully!', 'success');
                    
                    // Show success alert with integration ID
                    const successAlert = $('<div>').addClass('alert alert-success mt-4')
                        .html(`<i class="fas fa-check-circle me-2"></i>Integration configured successfully! ID: ${response.id}`);
                    
                    // Add a button to go back to the platform selection
                    const returnBtn = $('<button>').addClass('btn btn-success mt-3')
                        .html('<i class="fas fa-plus me-2"></i>Create Another Integration')
                        .on('click', function() {
                            // Reset form and go back to platform selection
                            resetForm();
                            integrationForm.hide();
                            platformSelection.show();
                        });
                    
                    // Replace step 3 content with success message
                    step3.html('').append(
                        $('<div>').addClass('form-title').text('Integration Successful'),
                        successAlert,
                        returnBtn
                    );
                    
                } else {
                    showToast(response.message || 'Error saving integration', 'error');
                }
            },
            error: function(xhr) {
                saveBtn.prop('disabled', false).html('<i class="fas fa-save me-2"></i>Save Configuration');
                
                let errorMsg = 'Failed to save configuration';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                
                showToast(errorMsg, 'error');
            }
        });
    }
}

// Helper function to show a specific step (moved outside for access from plain JS)
function showStep(step) {
    const currentStep = step;
    
    // Hide all steps
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'none';
    
    // Show the current step
    if (step === 1) {
        document.getElementById('step1').style.display = 'block';
        document.getElementById('backBtn').textContent = 'Back';
        document.getElementById('nextBtn').style.display = 'block';
        document.getElementById('progressBar').style.width = '33%';
        document.getElementById('progressStep').textContent = 'Step 1 of 3';
    } else if (step === 2) {
        document.getElementById('step2').style.display = 'block';
        document.getElementById('backBtn').textContent = 'Back';
        document.getElementById('nextBtn').style.display = 'block';
        document.getElementById('progressBar').style.width = '66%';
        document.getElementById('progressStep').textContent = 'Step 2 of 3';
    } else if (step === 3) {
        document.getElementById('step3').style.display = 'block';
        document.getElementById('nextBtn').style.display = 'none';
        document.getElementById('progressBar').style.width = '100%';
        document.getElementById('progressStep').textContent = 'Step 3 of 3';
    }
}

// Helper functions moved outside for global access
function togglePasswordVisibility(inputField, icon) {
    const type = inputField.attr('type') === 'password' ? 'text' : 'password';
    inputField.attr('type', type);
    
    if (type === 'text') {
        icon.removeClass('fa-eye').addClass('fa-eye-slash');
    } else {
        icon.removeClass('fa-eye-slash').addClass('fa-eye');
    }
}

function showToast(message, type) {
    const toast = $('<div>').addClass(`toast toast-${type}`);
    
    // Set icon based on type
    let icon = '';
    if (type === 'success') icon = '<i class="fas fa-check-circle me-2"></i>';
    else if (type === 'error') icon = '<i class="fas fa-exclamation-circle me-2"></i>';
    else if (type === 'warning') icon = '<i class="fas fa-exclamation-triangle me-2"></i>';
    else if (type === 'info') icon = '<i class="fas fa-info-circle me-2"></i>';
    
    toast.html(`${icon}${message}`);
    
    // Add to container
    $('#toastContainer').append(toast);
    
    // Auto-remove after delay
    setTimeout(function() {
        toast.fadeOut(500, function() {
            $(this).remove();
        });
    }, 3000);
}

function capitalize(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}
