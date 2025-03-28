/**
 * Alchemy Integration Manager - Simplified JS
 */

// Simple logging helper
function log(message) {
    console.log(`[Integration] ${message}`);
}

// Show toast notification
function showToast(message, type = 'info') {
    log(`Toast: ${type} - ${message}`);
    
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

// Authenticate with Alchemy
function authenticateWithAlchemy(tenantId, email, password) {
    log(`Authenticating with tenant: ${tenantId}`);

    const authenticateBtn = document.getElementById('authenticateBtn');
    if (authenticateBtn) {
        authenticateBtn.disabled = true;
        authenticateBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin me-2"></i>Authenticating...';
    }
    
    // Show status
    showAuthStatus('info', 'Authenticating with Alchemy...');

    // Make API request
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
        // Reset button state
        if (authenticateBtn) {
            authenticateBtn.disabled = false;
            authenticateBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Authenticate with Alchemy';
        }
        
        if (data.status === 'success') {
            // Authentication succeeded
            log('Authentication successful');
            showAuthStatus('success', 'Authentication successful! You can proceed to the next step.');
            
            // If there's a different tenant ID input field for direct token method, keep it in sync
            const directTenantInput = document.getElementById('alchemyTenantIdDirect');
            if (directTenantInput) {
                directTenantInput.value = tenantId;
            }
        } else {
            // Authentication failed
            log('Authentication failed: ' + data.message);
            showAuthStatus('error', data.message || 'Authentication failed');
        }
    })
    .catch(error => {
        log('Error authenticating: ' + error.message);
        
        if (authenticateBtn) {
            authenticateBtn.disabled = false;
            authenticateBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Authenticate with Alchemy';
        }
        
        showAuthStatus('error', `Error: ${error.message}`);
    });
}

// Fetch record types from API
function fetchRecordTypes() {
    log('Fetching record types');
    showToast('Fetching record types...', 'info');
    
    // Get credentials
    let tenantId, refreshToken;
    const authMethodAuto = document.getElementById('authMethodAuto');
    
    if (authMethodAuto && authMethodAuto.checked) {
        tenantId = document.getElementById('alchemyTenantId').value;
        refreshToken = "session"; // Just a placeholder, server will use session token
    } else {
        tenantId = document.getElementById('alchemyTenantIdDirect').value;
        refreshToken = document.getElementById('alchemyRefreshToken').value;
    }
    
    const recordTypeSelect = document.getElementById('recordTypeSelect');
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
            const recordTypes = data.recordTypes;
            
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
                
                recordTypeSelect.style.display = 'block';
            }
            
            showToast(`Successfully loaded ${recordTypes.length} record types`, 'success');
        } else {
            showToast('No record types found', 'warning');
        }
    })
    .catch(error => {
        log('Error fetching record types: ' + error.message);
        showToast('Error fetching record types: ' + error.message, 'error');
    });
}

function fetchFieldsForRecordType(recordTypeId) {
    console.log('Fetching fields for record type:', recordTypeId);
    
    // Get tenant info - in new approach we only support session auth
    let tenantId = document.getElementById('alchemyTenantId').value.trim();
    let refreshToken = "session"; // Server will use credentials from session
    
    if (!tenantId) {
        showToast('Please provide tenant ID', 'error');
        return;
    }
    
    // Show loading status
    showRecordTypeStatus('info', `Fetching fields for record type: ${recordTypeId}...`);
    
    // Disable the fetch button to prevent multiple clicks
    const fetchButton = document.getElementById('fetchFieldsBtn');
    if (fetchButton) {
        fetchButton.disabled = true;
        fetchButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Fetching...';
    }
    
    // Make the API call
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
        // Re-enable the button regardless of response
        if (fetchButton) {
            fetchButton.disabled = false;
            fetchButton.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Fetch Fields';
        }
        
        // Check if the response is successful
        if (!response.ok) {
            // If it's an authentication error (401)
            if (response.status === 401) {
                throw new Error('Authentication failed. Please authenticate with Alchemy again.');
            }
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Fields response:', data);
        
        // Check if fields exist and we have at least one
        if (data.fields && data.fields.length > 0) {
            // Store the fields
            alchemyFields = data.fields;
            
            // Show appropriate message
            if (data.status === 'warning') {
                showRecordTypeStatus('warning', `${data.message || 'Using fallback fields'}`);
            } else {
                showRecordTypeStatus('success', `Successfully retrieved ${data.fields.length} fields for record type: ${recordTypeId}`);
            }
            
            // Enable continuing to next step
            setTimeout(() => {
                showStep(3);
                prepareFieldMappings();
            }, 1000);
        } else {
            // Handle empty fields response
            let errorMessage = data.message || `No fields found for record type: ${recordTypeId}`;
            showRecordTypeStatus('warning', errorMessage);
        }
    })
    .catch(error => {
        console.error('Error fetching fields:', error);
        
        // Re-enable the button
        if (fetchButton) {
            fetchButton.disabled = false;
            fetchButton.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Fetch Fields';
        }
        
        // Show error message
        showRecordTypeStatus('error', `Error: ${error.message}`);
        
        // If it's an authentication error, show a more helpful message
        if (error.message.includes('Authentication failed')) {
            // Suggest re-authenticating
            const authStatus = document.getElementById('authStatus');
            if (authStatus) {
                authStatus.className = 'alert alert-danger mt-2';
                authStatus.innerHTML = '<i class="fas fa-exclamation-circle me-2"></i>Your authentication has expired. Please go back and authenticate again.';
                authStatus.style.display = 'block';
            }
            
            // Add a back button to return to step 1
            const backToAuthBtn = document.createElement('button');
            backToAuthBtn.className = 'btn btn-outline-primary mt-3';
            backToAuthBtn.innerHTML = '<i class="fas fa-arrow-left me-2"></i>Return to Authentication';
            backToAuthBtn.onclick = function() {
                showStep(1);
            };
            
            const statusContainer = document.getElementById('recordTypeStatus');
            if (statusContainer) {
                statusContainer.appendChild(document.createElement('br'));
                statusContainer.appendChild(backToAuthBtn);
            }
        }
    });
}
// Generate platform fields based on selected platform
function generatePlatformFields() {
    // Determine the selected platform
    const url = window.location.href;
    let platform = 'salesforce'; // Default
    
    if (url.includes('platform=sap')) {
        platform = 'sap';
    } else if (url.includes('platform=hubspot')) {
        platform = 'hubspot';
    }
    
    log('Generating platform fields for ' + platform);
    
    if (platform === 'salesforce') {
        window.platformFields = [
            { identifier: 'name', name: 'Name' },
            { identifier: 'account', name: 'Account' },
            { identifier: 'opportunity', name: 'Opportunity' },
            { identifier: 'contact', name: 'Contact' },
            { identifier: 'email', name: 'Email' },
            { identifier: 'phone', name: 'Phone' },
            { identifier: 'address', name: 'Address' },
            { identifier: 'description', name: 'Description' }
        ];
    } else if (platform === 'sap') {
        window.platformFields = [
            { identifier: 'material', name: 'Material' },
            { identifier: 'vendor', name: 'Vendor' },
            { identifier: 'purchase_order', name: 'Purchase Order' },
            { identifier: 'delivery', name: 'Delivery' },
            { identifier: 'invoice', name: 'Invoice' },
            { identifier: 'customer', name: 'Customer' },
            { identifier: 'cost_center', name: 'Cost Center' }
        ];
    } else if (platform === 'hubspot') {
        window.platformFields = [
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
    const fieldMappingContainer = document.getElementById('fieldMappingContainer');
    if (!fieldMappingContainer) return;
    
    fieldMappingContainer.innerHTML = ''; // Clear existing mappings
    
    // Add initial mapping row
    addFieldMappingRow();
}

// Add a field mapping row
function addFieldMappingRow() {
    const fieldMappingContainer = document.getElementById('fieldMappingContainer');
    if (!fieldMappingContainer) return;
    
    const mappingRow = document.createElement('div');
    mappingRow.className = 'mapping-row';
    
    // Create Alchemy field select
    const alchemySelect = document.createElement('select');
    alchemySelect.className = 'form-select me-2';
    
    // Default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select Alchemy Field';
    alchemySelect.appendChild(defaultOption);
    
    // Add options from alchemyFields
    if (window.alchemyFields && window.alchemyFields.length) {
        window.alchemyFields.forEach(field => {
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
    if (window.platformFields && window.platformFields.length) {
        window.platformFields.forEach(field => {
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
}

// Save configuration
function saveConfiguration() {
    log('Saving integration configuration');
    
    // Validate if we have at least one field mapping
    const fieldMappingContainer = document.getElementById('fieldMappingContainer');
    if (!fieldMappingContainer || fieldMappingContainer.children.length === 0) {
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
    
    // Get credentials
    let tenantId, refreshToken;
    const authMethodAuto = document.getElementById('authMethodAuto');
    
    if (authMethodAuto && authMethodAuto.checked) {
        tenantId = document.getElementById('alchemyTenantId').value;
        refreshToken = "session"; // Server will use session token
    } else {
        tenantId = document.getElementById('alchemyTenantIdDirect').value;
        refreshToken = document.getElementById('alchemyRefreshToken').value;
    }
    
    // Determine the selected platform
    const url = window.location.href;
    let platform = 'salesforce'; // Default
    
    if (url.includes('platform=sap')) {
        platform = 'sap';
    } else if (url.includes('platform=hubspot')) {
        platform = 'hubspot';
    }
    
    // Collect platform-specific configuration
    let platformConfig = {};
    
    if (platform === 'salesforce') {
        platformConfig = {
            instance_url: document.getElementById('salesforceInstanceUrl').value,
            client_id: document.getElementById('salesforceClientId').value,
            client_secret: document.getElementById('salesforceClientSecret').value
        };
    } else if (platform === 'sap') {
        platformConfig = {
            base_url: document.getElementById('sapBaseUrl').value,
            client_id: document.getElementById('sapClientId').value,
            client_secret: document.getElementById('sapClientSecret').value
        };
    } else if (platform === 'hubspot') {
        platformConfig = {
            api_key: document.getElementById('hubspotApiKey').value,
            portal_id: document.getElementById('hubspotPortalId').value
        };
    }
    
    // Get record type
    let recordTypeId;
    const recordTypeSelect = document.getElementById('recordTypeSelect');
    const recordTypeInput = document.getElementById('recordTypeInput');
    
    if (recordTypeSelect && recordTypeSelect.value) {
        recordTypeId = recordTypeSelect.value;
    } else if (recordTypeInput && recordTypeInput.value) {
        recordTypeId = recordTypeInput.value;
    }
    
    // Get sync settings
    const syncFrequency = document.getElementById('syncFrequency').value;
    const syncDirection = document.getElementById('syncDirection').value;
    
    // Prepare configuration data
    const configData = {
        platform: platform,
        alchemy: {
            tenant_id: tenantId,
            refresh_token: refreshToken
        },
        platform_config: platformConfig,
        record_type: recordTypeId,
        sync_frequency: syncFrequency,
        sync_direction: syncDirection,
        field_mappings: mappings
    };
    
    log('Sending configuration to server');
    
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
            
            // Show success message
            const step3 = document.getElementById('step3');
            if (step3) {
                // Create success message
                const successAlert = document.createElement('div');
                successAlert.className = 'alert alert-success mt-4';
                successAlert.innerHTML = `
                    <i class="fas fa-check-circle me-2"></i>
                    Integration configured successfully! ID: ${data.id}
                `;
                
                // Add a button to go back to home
                const returnBtn = document.createElement('button');
                returnBtn.className = 'btn btn-success mt-3';
                returnBtn.innerHTML = '<i class="fas fa-home me-2"></i>Return to Home';
                returnBtn.addEventListener('click', function() {
                    window.location.href = '/';
                });
                
                // Replace content
                step3.innerHTML = '';
                step3.appendChild(successAlert);
                step3.appendChild(returnBtn);
            }
        } else {
            showToast(data.message || 'Error saving integration', 'error');
        }
    })
    .catch(error => {
        log('Error saving configuration: ' + error.message);
        showToast('Error saving configuration: ' + error.message, 'error');
    });
}

// Show a specific step
function showStep(step) {
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const backBtn = document.getElementById('backBtn');
    const nextBtn = document.getElementById('nextBtn');
    const saveBtn = document.getElementById('saveBtn');
    const progressBar = document.getElementById('progressBar');
    const progressStep = document.getElementById('progressStep');
    
    if (!step1 || !step2 || !step3) return;
    
    // Hide all steps
    step1.style.display = 'none';
    step2.style.display = 'none';
    step3.style.display = 'none';
    
    // Show the current step
    if (step === 1) {
        step1.style.display = 'block';
        if (nextBtn) nextBtn.style.display = 'inline-block';
        if (saveBtn) saveBtn.style.display = 'none';
        if (progressBar) progressBar.style.width = '33%';
        if (progressStep) progressStep.textContent = 'Step 1 of 3';
    } else if (step === 2) {
        step2.style.display = 'block';
        if (nextBtn) nextBtn.style.display = 'inline-block';
        if (saveBtn) saveBtn.style.display = 'none';
        if (progressBar) progressBar.style.width = '66%';
        if (progressStep) progressStep.textContent = 'Step 2 of 3';
    } else if (step === 3) {
        step3.style.display = 'block';
        if (nextBtn) nextBtn.style.display = 'none';
        if (saveBtn) saveBtn.style.display = 'inline-block';
        if (progressBar) progressBar.style.width = '100%';
        if (progressStep) progressStep.textContent = 'Step 3 of 3';
    }
    
    window.currentStep = step;
    log('Navigated to step ' + step);
}

// Validate current step
function validateCurrentStep() {
    const currentStep = window.currentStep || 1;
    
    if (currentStep === 1) {
        // Check if using auto authentication or direct token
        const authMethodAuto = document.getElementById('authMethodAuto');
        
        if (authMethodAuto && authMethodAuto.checked) {
            const authStatus = document.getElementById('authStatus');
            
            // If no success message is visible, require authentication
            if (!authStatus || authStatus.style.display === 'none' || !authStatus.classList.contains('alert-success')) {
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
        
        return true;
    } else if (currentStep === 2) {
        // Either a record type must be selected or entered
        const recordType = document.getElementById('recordTypeSelect') ? 
                          document.getElementById('recordTypeSelect').value : '';
        const inputRecordType = document.getElementById('recordTypeInput') ? 
                              document.getElementById('recordTypeInput').value : '';
        
        if (!recordType && !inputRecordType) {
            showToast('Please enter or select a record type', 'error');
            return false;
        }
        
        return true;
    }
    
    return true;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    log('DOM is ready, initializing application...');
    
    // Initialize global variables
    window.currentStep = 1;
    window.alchemyFields = [];
    window.platformFields = [];
    
    // Set up authentication method toggle
    const authMethodAuto = document.getElementById('authMethodAuto');
    const authMethodToken = document.getElementById('authMethodToken');
    const autoAuthForm = document.getElementById('autoAuthForm');
    const tokenAuthForm = document.getElementById('tokenAuthForm');
    
    if (authMethodAuto && authMethodToken) {
        authMethodAuto.addEventListener('change', function() {
            if (this.checked) {
                autoAuthForm.style.display = 'block';
                tokenAuthForm.style.display = 'none';
                log('Switched to auto authentication');
            }
        });
        
        authMethodToken.addEventListener('change', function() {
            if (this.checked) {
                autoAuthForm.style.display = 'none';
                tokenAuthForm.style.display = 'block';
                log('Switched to token authentication');
            }
        });
    }
    
    // Set up authentication button
    const authenticateBtn = document.getElementById('authenticateBtn');
    if (authenticateBtn) {
        authenticateBtn.addEventListener('click', function() {
            const tenantId = document.getElementById('alchemyTenantId').value.trim();
            const email = document.getElementById('alchemyEmail').value.trim();
            const password = document.getElementById('alchemyPassword').value.trim();
            
            if (!tenantId || !email || !password) {
                showAuthStatus('error', 'Please provide all required credentials');
                return;
            }
            
            authenticateWithAlchemy(tenantId, email, password);
        });
    }
    
    // Set up password toggle handlers
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('alchemyPassword');
            toggleFieldVisibility(passwordInput, this.querySelector('i'));
        });
    }
    
    const toggleRefreshToken = document.getElementById('toggleRefreshToken');
    if (toggleRefreshToken) {
        toggleRefreshToken.addEventListener('click', function() {
            const tokenInput = document.getElementById('alchemyRefreshToken');
            toggleFieldVisibility(tokenInput, this.querySelector('i'));
        });
    }
    
    // Set up navigation buttons
    const backBtn = document.getElementById('backBtn');
    const nextBtn = document.getElementById('nextBtn');
    const saveBtn = document.getElementById('saveBtn');
    
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            if (window.currentStep === 1) {
                // Go back to platform selection
                window.location.href = '/';
            } else {
                // Go to previous step
                showStep(window.currentStep - 1);
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            if (validateCurrentStep()) {
                showStep(window.currentStep + 1);
            }
        });
    }
    
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            saveConfiguration();
        });
    }
    
    // Set up record type fetching
    const fetchRecordTypesBtn = document.getElementById('fetchRecordTypesBtn');
    if (fetchRecordTypesBtn) {
        fetchRecordTypesBtn.addEventListener('click', function() {
            fetchRecordTypes();
        });
    }
    
    // Set up field fetching
    const fetchFieldsBtn = document.getElementById('fetchFieldsBtn');
    if (fetchFieldsBtn) {
        fetchFieldsBtn.addEventListener('click', function() {
            const recordTypeId = document.getElementById('recordTypeInput').value.trim();
            
            if (recordTypeId) {
                fetchFieldsForRecordType(recordTypeId);
            } else {
                // Try selected record type
                const recordTypeSelect = document.getElementById('recordTypeSelect');
                if (recordTypeSelect && recordTypeSelect.value) {
                    fetchFieldsForRecordType(recordTypeSelect.value);
                } else {
                    showToast('Please enter or select a record type', 'error');
                }
            }
        });
    }
    
    // Set up field mapping
    const addMappingBtn = document.getElementById('addMappingBtn');
    if (addMappingBtn) {
        addMappingBtn.addEventListener('click', function() {
            addFieldMappingRow();
        });
    }
    
    log('Initialization complete');
});
