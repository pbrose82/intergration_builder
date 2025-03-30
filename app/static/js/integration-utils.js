/**
 * Integration Utilities
 * Shared utility functions for the integration platform
 */

const IntegrationUtils = {
  /**
   * Show a toast notification
   * @param {string} type - The type of toast (success, error, warning, info)
   * @param {string} message - The message to show
   */
  showToast: function(type, message) {
    console.log(`Toast: ${type} - ${message}`);
    
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toastContainer';
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Choose icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    toast.innerHTML = `<i class="fas fa-${icon} me-2"></i>${message}`;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Auto remove after delay
    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(function() {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  },
  
  /**
   * Show a status message in a specified element
   * @param {string} elementId - The ID of the element to show the status in
   * @param {string} type - The type of status (success, error, warning, info)
   * @param {string} message - The message to show
   */
  showStatus: function(elementId, type, message) {
    const statusEl = document.getElementById(elementId);
    if (!statusEl) {
      console.error(`Status element #${elementId} not found`);
      return;
    }
    
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
    
    statusEl.className = `alert ${alertClass} mt-3`;
    statusEl.innerHTML = icon + message;
    statusEl.style.display = 'block';
  },
  
  /**
   * Toggle password/token field visibility
   * @param {string} inputId - The ID of the input field
   * @param {string} toggleId - The ID of the toggle button
   */
  toggleVisibility: function(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    
    if (!input || !toggle) {
      console.error(`Input #${inputId} or toggle #${toggleId} not found`);
      return;
    }
    
    const icon = toggle.querySelector('i');
    
    if (input.type === 'password') {
      input.type = 'text';
      if (icon) {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      }
    } else {
      input.type = 'password';
      if (icon) {
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    }
  },
  
  /**
   * Make an API request with proper error handling
   * @param {string} url - The API endpoint URL
   * @param {Object} options - Fetch options
   * @returns {Promise} - Promise that resolves to the response data
   */
  fetchAPI: async function(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Server returned ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`API error: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Authenticate with Alchemy
   * @param {Object} credentials - Authentication credentials
   * @returns {Promise} - Promise that resolves when authentication completes
   */
  authenticateWithAlchemy: async function(credentials) {
    const { tenantId, email, password } = credentials;
    
    if (!tenantId || !email || !password) {
      this.showToast('error', 'Please provide all required credentials');
      return { success: false, message: 'Missing credentials' };
    }
    
    const authenticateBtn = document.getElementById('authenticateBtn');
    if (authenticateBtn) {
      authenticateBtn.disabled = true;
      authenticateBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Authenticating...';
    }
    
    // Show status
    this.showStatus('authStatus', 'info', 'Authenticating with Alchemy...');
    
    try {
      const data = await this.fetchAPI('/authenticate-alchemy', {
        method: 'POST',
        body: JSON.stringify({
          tenant_id: tenantId,
          email: email,
          password: password
        })
      });
      
      if (data.status === 'success') {
        // Authentication succeeded
        this.showStatus('authStatus', 'success', 'Authentication successful! You can proceed to the next step.');
        
        // Keep tenant ID in sync across inputs
        const directTenantInput = document.getElementById('alchemyTenantIdDirect');
        if (directTenantInput) {
          directTenantInput.value = tenantId;
        }
        
        return { success: true, message: data.message || 'Authentication successful' };
      } else {
        // Authentication failed
        this.showStatus('authStatus', 'error', data.message || 'Authentication failed');
        return { success: false, message: data.message || 'Authentication failed' };
      }
    } catch (error) {
      this.showStatus('authStatus', 'error', `Error: ${error.message}`);
      return { success: false, message: error.message };
    } finally {
      // Reset button state
      if (authenticateBtn) {
        authenticateBtn.disabled = false;
        authenticateBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Authenticate with Alchemy';
      }
    }
  },
  
  /**
   * Fetch fields for an Alchemy record type
   * @param {Object} params - Parameters for fetching fields
   * @returns {Promise} - Promise that resolves to the fields data
   */
  fetchAlchemyFields: async function(params) {
    const { tenantId, refreshToken, recordType } = params;
    
    const fetchButton = document.getElementById('fetchFieldsBtn');
    if (fetchButton) {
      fetchButton.disabled = true;
      fetchButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Fetching...';
    }
    
    this.showStatus('recordTypeStatus', 'info', `Fetching fields for record type: ${recordType}...`);
    
    try {
      const data = await this.fetchAPI('/get-alchemy-fields', {
        method: 'POST',
        body: JSON.stringify({
          tenant_id: tenantId,
          refresh_token: refreshToken,
          record_type: recordType
        })
      });
      
      // Update global fields array
      if (data.fields && data.fields.length > 0) {
        window.alchemyFields = data.fields;
        
        if (data.status === 'warning') {
          this.showStatus('recordTypeStatus', 'warning', data.message || 'Using fallback fields');
        } else {
          this.showStatus('recordTypeStatus', 'success', `Successfully retrieved ${data.fields.length} fields for record type: ${recordType}`);
        }
        
        return { success: true, fields: data.fields, message: data.message };
      } else {
        this.showStatus('recordTypeStatus', 'warning', data.message || `No fields found for record type: ${recordType}`);
        return { success: false, fields: [], message: data.message };
      }
    } catch (error) {
      this.showStatus('recordTypeStatus', 'error', `Error: ${error.message}`);
      return { success: false, fields: [], message: error.message };
    } finally {
      // Reset button state
      if (fetchButton) {
        fetchButton.disabled = false;
        fetchButton.innerHTML = '<i class="fas fa-search me-2"></i>Fetch Fields';
      }
    }
  },
  
  /**
   * Format a date string for display
   * @param {string} dateStr - ISO date string
   * @returns {string} - Formatted date string
   */
  formatDate: function(dateStr) {
    if (!dateStr) return 'Unknown';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch (e) {
      return dateStr;
    }
  },
  
  /**
   * Capitalize the first letter of a string
   * @param {string} str - String to capitalize
   * @returns {string} - Capitalized string
   */
  capitalize: function(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
};

// Expose the utility globally
window.IntegrationUtils = IntegrationUtils;

console.log('Integration utilities loaded');
