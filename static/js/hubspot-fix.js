/**
 * HubSpot Integration Fix - Object Type Population
 * 
 * This script fixes the issue where HubSpot object types aren't being populated
 * in Step 2 after clicking Continue from Step 1.
 * 
 * Add this script to your config.html page before the closing </body> tag.
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
    
    // Define the fetchHubSpotObjectTypes function if it doesn't exist
    if (typeof window.fetchHubSpotObjectTypes !== 'function') {
        window.fetchHubSpotObjectTypes = function() {
            console.log('Executing fallback fetchHubSpotObjectTypes function');
            
            const accessToken = document.getElementById('hubspotApiKey').value.trim();
            if (!accessToken) {
                console.error('No HubSpot API Key/Token found');
                return;
            }
            
            // Show loading state for fetch button
            const fetchBtn = document.getElementById('fetchHubspotObjectsBtn');
            if (fetchBtn) {
                fetchBtn.disabled = true;
                fetchBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Fetching...';
            }
            
            // Make API call to get object types
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
                console.log('Object types response:', data);
                
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
                        
                        console.log('Object type select populated with ' + window.hubspotObjectTypes.length + ' options');
                    }
                    
                    // Show record identifier field
                    const recordIdentifierContainer = document.getElementById('hubspotRecordIdentifierContainer');
                    if (recordIdentifierContainer) {
                        recordIdentifierContainer.style.display = 'block';
                    }
                    
                    // Enable object fetch button
                    const fetchObjectsBtn = document.getElementById('fetchHubspotObjectsBtn');
                    if (fetchObjectsBtn) {
                        fetchObjectsBtn.disabled = false;
                    }
                    
                    // Add success alert
                    const objectStatus = document.getElementById('hubspotObjectStatus');
                    if (objectStatus) {
                        objectStatus.innerHTML = '<i class="fas fa-check-circle me-2"></i>Successfully loaded ' + 
                            window.hubspotObjectTypes.length + ' object types';
                        objectStatus.className = 'alert alert-success mt-3';
                        objectStatus.style.display = 'block';
                    }
                } else {
                    console.error('Failed to fetch object types:', data.message);
                    
                    // Show error message
                    const objectStatus = document.getElementById('hubspotObjectStatus');
                    if (objectStatus) {
                        objectStatus.innerHTML = '<i class="fas fa-exclamation-circle me-2"></i>' + 
                            (data.message || 'Failed to fetch object types');
                        objectStatus.className = 'alert alert-danger mt-3';
                        objectStatus.style.display = 'block';
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching object types:', error);
                
                // Reset button
                if (fetchBtn) {
                    fetchBtn.disabled = false;
                    fetchBtn.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Refresh';
                }
                
                // Show error message
                const objectStatus = document.getElementById('hubspotObjectStatus');
                if (objectStatus) {
                    objectStatus.innerHTML = '<i class="fas fa-exclamation-circle me-2"></i>Error: ' + error.message;
                    objectStatus.className = 'alert alert-danger mt-3';
                    objectStatus.style.display = 'block';
                }
            });
        };
    }
    
    // Add manual object types button for direct interaction
    const objectContainer = document.getElementById('hubspotObjectContainer');
    if (objectContainer) {
        // Add a direct fetch button at the top of the container
        const directFetchButton = document.createElement('button');
        directFetchButton.className = 'btn btn-primary mb-3';
        directFetchButton.textContent = 'Load HubSpot Object Types';
        directFetchButton.addEventListener('click', function() {
            window.fetchHubSpotObjectTypes();
        });
        
        // Insert as first child
        if (objectContainer.firstChild) {
            objectContainer.insertBefore(directFetchButton, objectContainer.firstChild);
        } else {
            objectContainer.appendChild(directFetchButton);
        }
    }
    
    console.log('HubSpot integration fix applied');
});
