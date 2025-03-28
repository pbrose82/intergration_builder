/**
 * Main index page JavaScript file
 * Handles integration listing and management
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Index page initialized');
    
    // Load integrations if on index page
    const integrationsContainer = document.getElementById('integrationsContainer');
    if (integrationsContainer) {
        loadIntegrations();
    }
    
    // Add event listener for adding new integration
    const addIntegrationBtn = document.getElementById('addIntegrationBtn');
    if (addIntegrationBtn) {
        addIntegrationBtn.addEventListener('click', function() {
            window.location.href = '/platform-select.html';
        });
    }
});

/**
 * Load integrations from the API
 */
function loadIntegrations() {
    const integrationsContainer = document.getElementById('integrationsContainer');
    if (!integrationsContainer) return;
    
    // Show loading
    integrationsContainer.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading integrations...</p>
        </div>
    `;
    
    // Fetch integrations
    fetch('/integrations')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                displayIntegrations(data.integrations);
            } else {
                showError(data.message || 'Failed to load integrations');
            }
        })
        .catch(error => {
            console.error('Error loading integrations:', error);
            showError('Error loading integrations. Please try again later.');
        });
}

/**
 * Display integrations in the container
 */
function displayIntegrations(integrations) {
    const integrationsContainer = document.getElementById('integrationsContainer');
    if (!integrationsContainer) return;
    
    if (!integrations || integrations.length === 0) {
        integrationsContainer.innerHTML = `
            <div class="text-center py-5">
                <div class="empty-state">
                    <i class="fas fa-plug fa-3x text-muted mb-3"></i>
                    <h4>No Integrations Yet</h4>
                    <p class="text-muted">You haven't created any integrations yet. Click the button below to get started.</p>
                    <button id="addFirstIntegrationBtn" class="btn btn-primary mt-3">
                        <i class="fas fa-plus me-2"></i>Create Integration
                    </button>
                </div>
            </div>
        `;
        
        // Add event listener to the new button
        const addFirstIntegrationBtn = document.getElementById('addFirstIntegrationBtn');
        if (addFirstIntegrationBtn) {
            addFirstIntegrationBtn.addEventListener('click', function() {
                window.location.href = '/platform-select.html';
            });
        }
        
        return;
    }
    
    // Create integrations table
    let html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead class="table-light">
                    <tr>
                        <th>Platform</th>
                        <th>Details</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Add each integration
    integrations.forEach(integration => {
        const platformIcon = getPlatformIcon(integration.platform);
        const statusBadge = integration.is_active 
            ? '<span class="badge bg-success">Active</span>' 
            : '<span class="badge bg-secondary">Inactive</span>';
        
        // Format created date
        const createdDate = integration.created_at 
            ? new Date(integration.created_at).toLocaleString() 
            : 'Unknown';
        
        // Determine details text based on platform
        let detailsText = '';
        
        if (integration.platform === 'hubspot') {
            detailsText = `Alchemy <strong>${integration.details.alchemy_record_type}</strong> ↔ HubSpot <strong>${integration.details.platform_object_type || 'Object'}</strong>`;
        } else if (integration.platform === 'salesforce') {
            detailsText = `Alchemy <strong>${integration.details.alchemy_record_type}</strong> ↔ Salesforce Object`;
        } else if (integration.platform === 'sap') {
            detailsText = `Alchemy <strong>${integration.details.alchemy_record_type}</strong> ↔ SAP Object`;
        } else {
            detailsText = `Alchemy <strong>${integration.details.alchemy_record_type}</strong> ↔ Unknown`;
        }
        
        html += `
            <tr data-integration-id="${integration.id}">
                <td>
                    <div class="d-flex align-items-center">
                        ${platformIcon}
                        <span class="ms-2">${capitalize(integration.platform)}</span>
                    </div>
                </td>
                <td>${detailsText}</td>
                <td>${statusBadge}</td>
                <td>${createdDate}</td>
                <td>
                    <div class="btn-group">
                        <button type="button" class="btn btn-sm btn-outline-primary view-integration" data-id="${integration.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger delete-integration" data-id="${integration.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    // Close table
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    // Update container
    integrationsContainer.innerHTML = html;
    
    // Add event listeners to buttons
    document.querySelectorAll('.view-integration').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            viewIntegration(id);
        });
    });
    
    document.querySelectorAll('.delete-integration').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            confirmDeleteIntegration(id);
        });
    });
}

/**
 * Show error message
 */
function showError(message) {
    const integrationsContainer = document.getElementById('integrationsContainer');
    if (!integrationsContainer) return;
    
    integrationsContainer.innerHTML = `
        <div class="alert alert-danger">
            <i class="fas fa-exclamation-circle me-2"></i>
            ${message}
        </div>
        <div class="text-center mt-3">
            <button id="retryBtn" class="btn btn-primary">
                <i class="fas fa-sync-alt me-2"></i>Retry
            </button>
        </div>
    `;
    
    // Add event listener to retry button
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
        retryBtn.addEventListener('click', loadIntegrations);
    }
}

/**
 * Get platform icon HTML
 */
function getPlatformIcon(platform) {
    switch (platform.toLowerCase()) {
        case 'salesforce':
            return '<div class="platform-icon salesforce"><i class="fas fa-cloud"></i></div>';
        case 'hubspot':
            return '<div class="platform-icon hubspot"><i class="fas fa-h-square"></i></div>';
        case 'sap':
            return '<div class="platform-icon sap"><i class="fas fa-database"></i></div>';
        default:
            return '<div class="platform-icon"><i class="fas fa-plug"></i></div>';
    }
}

/**
 * Capitalize first letter of string
 */
function capitalize(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * View integration details
 */
function viewIntegration(id) {
    console.log('Viewing integration', id);
    // Navigate to view page
    window.location.href = `/view-integration.html?id=${id}`;
}

/**
 * Confirm deletion of integration
 */
function confirmDeleteIntegration(id) {
    if (confirm('Are you sure you want to delete this integration? This action cannot be undone.')) {
        deleteIntegration(id);
    }
}

/**
 * Delete integration
 */
function deleteIntegration(id) {
    // Show loading on the row
    const row = document.querySelector(`tr[data-integration-id="${id}"]`);
    if (row) {
        row.classList.add('table-secondary');
        row.innerHTML = `
            <td colspan="5" class="text-center">
                <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                Deleting...
            </td>
        `;
    }
    
    // Delete integration
    fetch(`/integration/${id}`, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Remove row with animation
                if (row) {
                    row.style.transition = 'opacity 0.5s';
                    row.style.opacity = '0';
                    setTimeout(() => {
                        row.remove();
                        // If no more integrations, reload to show empty state
                        if (document.querySelectorAll('tr[data-integration-id]').length === 0) {
                            loadIntegrations();
                        }
                    }, 500);
                } else {
                    // Reload all integrations if we couldn't find the row
                    loadIntegrations();
                }
                
                // Show success message
                showToast('success', 'Integration deleted successfully');
            } else {
                // Show error message
                showToast('error', data.message || 'Failed to delete integration');
                // Reload integrations to reset UI
                loadIntegrations();
            }
        })
        .catch(error => {
            console.error('Error deleting integration:', error);
            showToast('error', 'Error deleting integration. Please try again.');
            loadIntegrations();
        });
}

/**
 * Show toast notification
 */
function showToast(type, message) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.id = toastId;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    // Set icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    // Add content
    toast.innerHTML = `
        <div class="toast-header">
            <i class="fas fa-${icon} me-2"></i>
            <strong class="me-auto">${capitalize(type)}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Initialize Bootstrap toast
    if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 5000
        });
        bsToast.show();
    } else {
        // Fallback if Bootstrap JS is not available
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                toast.remove();
            }, 500);
        }, 5000);
    }
}
