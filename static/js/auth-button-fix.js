/**
 * Event handler fix for authentication buttons
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('Auth button fix loaded');
  
  // Fix Alchemy authentication button
  const authenticateBtn = document.getElementById('authenticateBtn');
  if (authenticateBtn) {
    console.log('Found Alchemy auth button, adding click handler');
    authenticateBtn.onclick = function() {
      const tenantId = document.getElementById('alchemyTenantId').value.trim();
      const email = document.getElementById('alchemyEmail').value.trim();
      const password = document.getElementById('alchemyPassword').value.trim();
      
      if (!tenantId || !email || !password) {
        alert('Please fill in all Alchemy credentials');
        return;
      }
      
      // Show loading state
      authenticateBtn.disabled = true;
      authenticateBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Authenticating...';
      
      // Show status
      const authStatus = document.getElementById('authStatus');
      if (authStatus) {
        authStatus.className = 'alert alert-info mt-3';
        authStatus.innerHTML = '<i class="fas fa-info-circle me-2"></i>Authenticating with Alchemy...';
        authStatus.style.display = 'block';
      }
      
      // Call API
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
        // Reset button
        authenticateBtn.disabled = false;
        authenticateBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Authenticate with Alchemy';
        
        if (data.status === 'success') {
          // Show success status
          if (authStatus) {
            authStatus.className = 'alert alert-success mt-3';
            authStatus.innerHTML = '<i class="fas fa-check-circle me-2"></i>Authentication successful!';
          }
          
          // Keep tenant ID in sync across inputs
          const directTenantInput = document.getElementById('alchemyTenantIdDirect');
          if (directTenantInput) {
            directTenantInput.value = tenantId;
          }
        } else {
          // Show error status
          if (authStatus) {
            authStatus.className = 'alert alert-danger mt-3';
            authStatus.innerHTML = '<i class="fas fa-exclamation-circle me-2"></i>' + 
              (data.message || 'Authentication failed');
          }
        }
      })
      .catch(error => {
        // Reset button
        authenticateBtn.disabled = false;
        authenticateBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Authenticate with Alchemy';
        
        // Show error
        if (authStatus) {
          authStatus.className = 'alert alert-danger mt-3';
          authStatus.innerHTML = '<i class="fas fa-exclamation-circle me-2"></i>Error: ' + error.message;
        }
      });
    };
  }
  
  // Fix HubSpot validation button
  const validateHubspotBtn = document.getElementById('validateHubspotBtn');
  if (validateHubspotBtn) {
    console.log('Found HubSpot validate button, adding click handler');
    validateHubspotBtn.onclick = function() {
      const accessToken = document.getElementById('hubspotApiKey').value.trim();
      const clientSecret = document.getElementById('hubspotPortalId').value.trim();
      
      if (!accessToken) {
        alert('Please enter HubSpot access token');
        return;
      }
      
      // Show loading state
      validateHubspotBtn.disabled = true;
      validateHubspotBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Validating...';
      
      // Show status
      const hubspotStatus = document.getElementById('hubspotStatus');
      if (hubspotStatus) {
        hubspotStatus.className = 'alert alert-info mt-3';
        hubspotStatus.innerHTML = '<i class="fas fa-info-circle me-2"></i>Validating HubSpot credentials...';
        hubspotStatus.style.display = 'block';
      }
      
      // Call API
      fetch('/hubspot/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          access_token: accessToken,
          client_secret: clientSecret,
          oauth_mode: true
        })
      })
      .then(response => response.json())
      .then(data => {
        // Reset button
        validateHubspotBtn.disabled = false;
        validateHubspotBtn.innerHTML = '<i class="fas fa-check-circle me-2"></i>Validate Credentials';
        
        if (data.status === 'success') {
          // Show success status
          if (hubspotStatus) {
            hubspotStatus.className = 'alert alert-success mt-3';
            hubspotStatus.innerHTML = '<i class="fas fa-check-circle me-2"></i>' + 
              (data.message || 'Credentials validated successfully');
          }
        } else {
          // Show error status
          if (hubspotStatus) {
            hubspotStatus.className = 'alert alert-danger mt-3';
            hubspotStatus.innerHTML = '<i class="fas fa-exclamation-circle me-2"></i>' + 
              (data.message || 'Validation failed');
          }
        }
      })
      .catch(error => {
        // Reset button
        validateHubspotBtn.disabled = false;
        validateHubspotBtn.innerHTML = '<i class="fas fa-check-circle me-2"></i>Validate Credentials';
        
        // Show error
        if (hubspotStatus) {
          hubspotStatus.className = 'alert alert-danger mt-3';
          hubspotStatus.innerHTML = '<i class="fas fa-exclamation-circle me-2"></i>Error: ' + error.message;
        }
      });
    };
  }
});
