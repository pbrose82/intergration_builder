/**
 * Alchemy HubSpot Integration Helper
 * 
 * This script ensures proper operation of the HubSpot integration flow,
 * particularly the object type selection in Step 2.
 */

(function() {
    // Set up logging
    const debug = true;
    function log(message, type = 'info') {
        if (!debug) return;
        console.log(`[Integration Helper] ${message}`);
    }

    // Execute when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Check if we're on HubSpot integration page
        if (!window.location.href.includes('platform=hubspot')) {
            return;
        }

        log('HubSpot Integration Helper loaded');

        // Track validation status
        let hubspotValidated = false;

        // Elements
        const hubspotApiKeyInput = document.getElementById('hubspotApiKey');
        const validateHubspotBtn = document.getElementById('validateHubspotBtn');
        const nextBtn = document.getElementById('nextBtn');
        const fetchHubspotObjectsBtn = document.getElementById('fetchHubspotObjectsBtn');
        const hubspotObjectType = document.getElementById('hubspotObjectType');
        const hubspotObjectContainer = document.getElementById('hubspotObjectContainer');
        const hubspotStatus = document.getElementById('hubspotStatus');
        const hubspotObjectStatus = document.getElementById('hubspotObjectStatus');

        // Override validateHubspotBtn click handler
        if (validateHubspotBtn) {
            validateHubspotBtn.addEventListener('click', function() {
                log('Validate button clicked');
                validateAndFetchObjects();
            });
        }

        // Override nextBtn click handler to ensure Step 2 gets proper setup
        if (nextBtn) {
            const originalNextHandler = nextBtn.onclick;
            nextBtn.addEventListener('click', function(e) {
                const progressStep = document.getElementById('progressStep');
                const currentStep = progressStep ? 
                    parseInt(progressStep.textContent.match(/Step (\d+) of/)[1]) : 1;
                
                log(`Next button clicked, current step: ${currentStep}`);
                
                // If moving to Step 2 and HubSpot validated, prepare for object types
                if (currentStep === 1 && hubspotValidated) {
                    log('Moving to Step 2 with validated HubSpot credentials');
                    
                    // Short delay to allow step transition
                    setTimeout(function() {
                        if (hubspotObjectContainer) {
                            hubspotObjectContainer.style.display = 'block';
                        }
                        
                        // Auto-fetch object types
                        fetchHubSpotObjects();
                    }, 300);
                }
                
                // Let original handler run if it exists
                if (typeof originalNextHandler === 'function') {
                    originalNextHandler.call(this, e);
                }
            });
        }

        // Function to validate credentials and fetch objects
        function validateAndFetchObjects() {
            const accessToken = hubspotApiKeyInput ? hubspotApiKeyInput.value.trim() : '';
            
            if (!accessToken) {
                showStatus(hubspotStatus, 'error', 'Please enter HubSpot access token');
                return;
            }
            
            // Show loading state
            if (validateHubspotBtn) {
                validateHubspotBtn.disabled = true;
                validateHubspotBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Validating...';
            }
            
            // Show status
            showStatus(hubspotStatus, 'info', 'Validating HubSpot credentials...');
            
            // Validate token
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
            .then(response => response.json())
            .then(data => {
                // Reset button
                if (validateHubspotBtn) {
                    validateHubspotBtn.disabled = false;
                    validateHubspotBtn.innerHTML = '<i class="fas fa-check-circle me-2"></i>Validate Credentials';
                }
                
                if (data.status === 'success') {
                    hubspotValidated = true;
                    showStatus(hubspotStatus, 'success', data.message || 'Credentials validated successfully');
                    showToast('success', 'HubSpot credentials are valid');
                    
                    // If we're already on Step 2, fetch object types immediately
                    const progressStep = document.getElementById('progressStep');
                    const currentStep = progressStep ? 
                        parseInt(progressStep.textContent.match(/Step (\d+) of/)[1]) : 1;
                    
                    if (currentStep === 2) {
                        log('Already on Step 2, fetching objects immediately');
                        fetchHubSpotObjects();
                    }
                } else {
                    hubspotValidated = false;
                    showStatus(hubspotStatus, 'error', data.message || 'Validation failed');
                    showToast('error', 'HubSpot validation failed');
                }
            })
            .catch(error => {
                log(`Validation error: ${error.message}`, 'error');
                
                // Reset button
                if (validateHubspotBtn) {
                    validateHubspotBtn.disabled = false;
                    validateHubspotBtn.innerHTML = '<i class="fas fa-check-circle me-2"></i>Validate Credentials';
                }
                
                // Show error message
                showStatus(hubspotStatus, 'error', `Error: ${error.message}`);
                showToast('error', `Error: ${error.message}`);
                
                hubspotValidated = false;
            });
        }

        // Function to fetch HubSpot object types
        function fetchHubSpotObjects() {
            log('Fetching HubSpot object types');
            
            const accessToken = hubspotApiKeyInput ? hubspotApiKeyInput.value.trim() : '';
            
            if (!accessToken) {
                showStatus(hubspotObjectStatus, 'error', 'No HubSpot access token available');
                return;
            }
            
            // Show loading state
            if (fetchHubspotObjectsBtn) {
                fetchHubspotObjectsBtn.disabled = true;
                fetchHubspotObjectsBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Fetching...';
            }
            
            // Show status
            showStatus(hubspotObjectStatus, 'info', 'Fetching HubSpot object types...');
            
            // Fetch object types from server
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
                log(`Object types response: ${data.status}`);
                
                // Reset button
                if (fetchHubspotObjectsBtn) {
                    fetchHubspotObjectsBtn.disabled = false;
                    fetchHubspotObjectsBtn.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Refresh';
                }
                
                if (data.status === 'success' || data.status === 'warning') {
                    // Store object types
                    window.hubspotObjectTypes = data.object_types || [];
                    
                    // Update object type select
                    if (hubspotObjectType) {
                        // Clear existing options
                        hubspotObjectType.innerHTML = '<option value="">-- Select Object Type --</option>';
                        
                        // Add new options
                        window.hubspotObjectTypes.forEach(function(obj) {
                            const option = document.createElement('option');
                            option.value = obj.id;
                            option.textContent = obj.name;
                            hubspotObjectType.appendChild(option);
                        });
                        
                        // Enable select
                        hubspotObjectType.disabled = false;
                        
                        log(`Populated select with ${window.hubspotObjectTypes.length} options`);
                    }
                    
                    // Show success message
                    showStatus(
                        hubspotObjectStatus, 
                        data.status === 'warning' ? 'warning' : 'success',
                        data.message || `Found ${window.hubspotObjectTypes.length} object types`
                    );
                    
                    // Show record identifier field
                    const recordIdentifierContainer = document.getElementById('hubspotRecordIdentifierContainer');
                    if (recordIdentifierContainer) {
                        recordIdentifierContainer.style.display = 'block';
                    }
                    
                    // Enable fields fetch button
                    const fetchHubspotFieldsBtn = document.getElementById('fetchHubspotFieldsBtn');
                    if (fetchHubspotFieldsBtn) {
                        fetchHubspotFieldsBtn.disabled = true; // Still need object type selection
                    }
                    
                    // Update object type label
                    const hubspotObjectTypeLabel = document.getElementById('hubspotObjectTypeLabel');
                    if (hubspotObjectTypeLabel) {
                        hubspotObjectTypeLabel.textContent = 'None Selected';
                    }
                    
                    // Add change handler to object type select if not already added
                    if (hubspotObjectType && !hubspotObjectType._changeHandlerAdded) {
                        hubspotObjectType.addEventListener('change', function() {
                            const selectedValue = this.value;
                            const selectedText = this.options[this.selectedIndex].text;
                            
                            // Update label
                            if (hubspotObjectTypeLabel) {
                                hubspotObjectTypeLabel.textContent = selectedText;
                            }
                            
                            // Enable/disable fields button
                            if (fetchHubspotFieldsBtn) {
                                fetchHubspotFieldsBtn.disabled = !selectedValue;
                            }
                        });
                        
                        hubspotObjectType._changeHandlerAdded = true;
                    }
                    
                    // Show toast
                    showToast('success', `Loaded ${window.hubspotObjectTypes.length} HubSpot object types`);
                } else {
                    // Show error message
                    showStatus(hubspotObjectStatus, 'error', data.message || 'Failed to fetch object types');
                    
                    // Show toast
                    showToast('error', 'Failed to fetch HubSpot object types');
                }
            })
            .catch(error => {
                log(`Error fetching object types: ${error.message}`, 'error');
                
                // Reset button
                if (fetchHubspotObjectsBtn) {
                    fetchHubspotObjectsBtn.disabled = false;
                    fetchHubspotObjectsBtn.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Refresh';
                }
                
                // Show error message
                showStatus(hubspotObjectStatus, 'error', `Error: ${error.message}`);
                
                // Show toast
                showToast('error', `Error: ${error.message}`);
            });
        }

        // Helper functions
        function showStatus(element, type, message) {
            if (!element) return;
            
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
            
            element.className = `alert ${alertClass} mt-3`;
            element.innerHTML = icon + message;
            element.style.display = 'block';
        }

        function showToast(type, message) {
            try {
                // Try jQuery method first
                if (typeof $ !== 'undefined' && typeof $.fn.toast !== 'undefined') {
                    const toast = $('<div>').addClass('toast ' + type);
                    
                    if (type === 'success') {
                        toast.html('<i class="fas fa-check-circle me-2"></i>' + message);
                    } else if (type === 'error') {
                        toast.html('<i class="fas fa-exclamation-circle me-2"></i>' + message);
                    } else if (type === 'warning') {
                        toast.html('<i class="fas fa-exclamation-triangle me-2"></i>' + message);
                    } else {
                        toast.html('<i class="fas fa-info-circle me-2"></i>' + message);
                    }
                    
                    $('#toastContainer').append(toast);
                    
                    setTimeout(function() {
                        toast.fadeOut(300, function() {
                            $(this).remove();
                        });
                    }, 3000);
                    
                    return;
                }
                
                // Fallback to vanilla JS
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
                
                setTimeout(function() {
                    toast.style.opacity = '0';
                    toast.style.transition = 'opacity 0.3s';
                    setTimeout(function() {
                        if (toast.parentNode) {
                            toast.parentNode.removeChild(toast);
                        }
                    }, 300);
                }, 3000);
            } catch (e) {
                console.error('Error showing toast:', e);
            }
        }

        // Expose helper functions to window for debugging
        window.hubspotHelper = {
            validateAndFetchObjects: validateAndFetchObjects,
            fetchHubSpotObjects: fetchHubSpotObjects
        };

        log('Integration helper initialized');
    });
})();
