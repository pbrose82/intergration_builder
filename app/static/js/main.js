document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM ready. Initializing Main Integration Platform Script');

  // Global Integration Manager object
  const IntegrationManager = {
    initialized: false,
    platform: null,
    alchemyFields: [],
    platformFields: [],
    tenantId: null, // to store the tenant id after auth

    /**
     * Initialize the integration manager
     */
    init: function() {
      if (this.initialized) return;

      console.log('Initializing Integration Manager');

      // Detect platform
      this.platform = this.detectPlatform();
      console.log(`Detected platform: ${this.platform}`);

      // Set up event listeners
      this.setupEventListeners();

      // Mark as initialized
      this.initialized = true;
    },

    /**
     * Detect which platform we're integrating with
     */
    detectPlatform: function() {
      const url = window.location.href;
      if (url.includes('platform=hubspot')) {
        return 'hubspot';
      } else if (url.includes('platform=salesforce')) {
        return 'salesforce';
      } else if (url.includes('platform=sap')) {
        return 'sap';
      }
      return 'unknown';
    },

    /**
     * Set up event listeners for the integration flow
     */
    setupEventListeners: function() {
      // Authentication events
      const authenticateBtn = document.getElementById('authenticateBtn');
      if (authenticateBtn) {
        authenticateBtn.addEventListener('click', this.handleAuthentication.bind(this));
      }

      // Platform-specific validations
      const validateHubspotBtn = document.getElementById('validateHubspotBtn');
      if (validateHubspotBtn && this.platform === 'hubspot') {
        validateHubspotBtn.addEventListener('click', this.validateHubSpotCredentials.bind(this));
      }

      // Field fetching
      const fetchFieldsBtn = document.getElementById('fetchFieldsBtn');
      if (fetchFieldsBtn) {
        fetchFieldsBtn.addEventListener('click', this.fetchAlchemyFields.bind(this));
      }

      // HubSpot objects fetching
      const fetchHubspotObjectsBtn = document.getElementById('fetchHubspotObjectsBtn');
      if (fetchHubspotObjectsBtn && this.platform === 'hubspot') {
        fetchHubspotObjectsBtn.addEventListener('click', this.fetchHubSpotObjects.bind(this));
      }

      // HubSpot fields fetching
      const fetchHubspotFieldsBtn = document.getElementById('fetchHubspotFieldsBtn');
      if (fetchHubspotFieldsBtn && this.platform === 'hubspot') {
        fetchHubspotFieldsBtn.addEventListener('click', this.fetchHubSpotFields.bind(this));
      }

      // Save button
      const saveBtn = document.getElementById('saveBtn');
      if (saveBtn) {
        saveBtn.addEventListener('click', this.saveIntegration.bind(this));
      }

      // Register for step change events
      document.addEventListener('stepChanged', this.handleStepChange.bind(this));

      console.log('Event listeners set up');
    },

    /**
     * Handle step changes
     */
    handleStepChange: function(event) {
      const step = event.detail.step;
      console.log(`Step changed to: ${step}`);

      if (step === 2 && this.platform === 'hubspot') {
        // Show HubSpot object container in step 2
        const hubspotObjectContainer = document.getElementById('hubspotObjectContainer');
        if (hubspotObjectContainer) {
          hubspotObjectContainer.style.display = 'block';
        }
      } else if (step === 3) {
        // Initialize field mapping
        if (typeof fixStep3Display === 'function') {
          fixStep3Display();
        }
      }
    },

    /**
     * Handle authentication with Alchemy
     */
    handleAuthentication: async function() {
      const tenantId = document.getElementById('alchemyTenantId')?.value?.trim();
      const email = document.getElementById('alchemyEmail')?.value?.trim();
      const password = document.getElementById('alchemyPassword')?.value?.trim();

      if (!tenantId || !email || !password) {
        IntegrationUtils.showToast('error', 'Please provide all required credentials');
        return;
      }

      // Authenticate with IntegrationUtils
      const result = await IntegrationUtils.authenticateWithAlchemy({
        tenantId,
        email,
        password
      });

      if (result.success) {
        // Store tenant ID for later use and sync it to the direct input field
        this.tenantId = tenantId;
        const directTenantInput = document.getElementById('alchemyTenantIdDirect');
        if (directTenantInput) {
          directTenantInput.value = tenantId;
        }
      }
    },

    /**
     * Validate HubSpot credentials
     */
    validateHubSpotCredentials: async function() {
      const accessToken = document.getElementById('hubspotApiKey')?.value?.trim();
      const clientSecret = document.getElementById('hubspotPortalId')?.value?.trim();

      if (!accessToken) {
        IntegrationUtils.showToast('error', 'Please enter HubSpot Access Token');
        return;
      }

      const validateBtn = document.getElementById('validateHubspotBtn');
      if (validateBtn) {
        validateBtn.disabled = true;
        validateBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Validating...';
      }

      IntegrationUtils.showStatus('hubspotStatus', 'info', 'Validating HubSpot credentials...');

      try {
        const response = await fetch('/hubspot/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: accessToken,
            client_secret: clientSecret,
            oauth_mode: true
          })
        });

        const data = await response.json();

        if (data.status === 'success') {
          IntegrationUtils.showStatus('hubspotStatus', 'success', data.message || 'Credentials validated successfully');
          IntegrationUtils.showToast('success', 'HubSpot credentials validated successfully');

          // Enable object fetching
          const fetchObjectsBtn = document.getElementById('fetchHubspotObjectsBtn');
          if (fetchObjectsBtn) {
            fetchObjectsBtn.disabled = false;
          }

          // Automatically fetch HubSpot objects
          this.fetchHubSpotObjects();
        } else {
          IntegrationUtils.showStatus('hubspotStatus', 'error', data.message || 'Validation failed');
          IntegrationUtils.showToast('error', 'HubSpot credential validation failed');
        }
      } catch (error) {
        IntegrationUtils.showStatus('hubspotStatus', 'error', `Error: ${error.message}`);
        IntegrationUtils.showToast('error', `Error: ${error.message}`);
      } finally {
        if (validateBtn) {
          validateBtn.disabled = false;
          validateBtn.innerHTML = '<i class="fas fa-check-circle me-2"></i>Validate Credentials';
        }
      }
    },

    /**
     * Fetch Alchemy fields
     */
    fetchAlchemyFields: async function() {
      const recordType = document.getElementById('recordTypeInput')?.value?.trim();

      if (!recordType) {
        IntegrationUtils.showToast('error', 'Please enter a record type');
        return;
      }

      // Determine which credentials to use
      let tenantId, refreshToken;
      const authMethodAuto = document.getElementById('authMethodAuto');

      if (authMethodAuto && authMethodAuto.checked) {
        tenantId = document.getElementById('alchemyTenantId')?.value?.trim();
        refreshToken = "session"; // Use token from session
      } else {
        tenantId = document.getElementById('alchemyTenantIdDirect')?.value?.trim();
        refreshToken = document.getElementById('alchemyRefreshToken')?.value?.trim();
      }

      if (!tenantId) {
        IntegrationUtils.showToast('error', 'Missing tenant ID');
        return;
      }

      const result = await IntegrationUtils.fetchAlchemyFields({
        tenantId,
        refreshToken,
        recordType
      });

      if (result.success) {
        // Store fields globally for later use
        this.alchemyFields = result.fields;
        window.alchemyFields = result.fields;

        // For HubSpot, show object selection in step 2 and enable object fetching if token exists
        if (this.platform === 'hubspot') {
          const hubspotObjectContainer = document.getElementById('hubspotObjectContainer');
          if (hubspotObjectContainer) {
            hubspotObjectContainer.style.display = 'block';
          }
          const hubspotApiKey = document.getElementById('hubspotApiKey');
          if (hubspotApiKey && hubspotApiKey.value.trim()) {
            const fetchObjectsBtn = document.getElementById('fetchHubspotObjectsBtn');
            if (fetchObjectsBtn) {
              fetchObjectsBtn.disabled = false;
            }
          }
        } else {
          // For other platforms, proceed to mapping step
          StepManager.goToStep(3);
        }
      }
    },

    /**
     * Fetch HubSpot object types
     */
    fetchHubSpotObjects: async function() {
      const accessToken = document.getElementById('hubspotApiKey')?.value?.trim();

      if (!accessToken) {
        IntegrationUtils.showToast('error', 'Please enter HubSpot Access Token');
        return;
      }

      const fetchBtn = document.getElementById('fetchHubspotObjectsBtn');
      if (fetchBtn) {
        fetchBtn.disabled = true;
        fetchBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Fetching...';
      }

      IntegrationUtils.showStatus('hubspotObjectStatus', 'info', 'Fetching HubSpot object types...');

      try {
        const response = await fetch('/hubspot/object-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: accessToken, oauth_mode: true })
        });

        const data = await response.json();

        if (data.status === 'success' || data.status === 'warning') {
          // Store object types globally
          window.hubspotObjectTypes = data.object_types || [];

          // Update the select options
          const select = document.getElementById('hubspotObjectType');
          if (select) {
            select.innerHTML = '<option value="">-- Select Object Type --</option>';
            data.object_types.forEach(obj => {
              const option = document.createElement('option');
              option.value = obj.id;
              option.textContent = obj.name;
              select.appendChild(option);
            });
            select.disabled = false;
          }

          IntegrationUtils.showStatus(
            'hubspotObjectStatus',
            data.status === 'warning' ? 'warning' : 'success',
            data.message || `Found ${data.object_types.length} object types`
          );
          IntegrationUtils.showToast('success', `Successfully loaded ${data.object_types.length} HubSpot object types`);
        } else {
          IntegrationUtils.showStatus('hubspotObjectStatus', 'error', data.message || 'Failed to fetch object types');
          IntegrationUtils.showToast('error', 'Failed to fetch HubSpot object types');
        }
      } catch (error) {
        IntegrationUtils.showStatus('hubspotObjectStatus', 'error', `Error: ${error.message}`);
        IntegrationUtils.showToast('error', `Error: ${error.message}`);
      } finally {
        if (fetchBtn) {
          fetchBtn.disabled = false;
          fetchBtn.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Refresh';
        }
      }
    },

    /**
     * Fetch HubSpot fields for the selected object type
     */
    fetchHubSpotFields: async function() {
      const objectType = document.getElementById('hubspotObjectType')?.value;
      const accessToken = document.getElementById('hubspotApiKey')?.value?.trim();

      if (!objectType) {
        IntegrationUtils.showToast('error', 'Please select a HubSpot object type');
        return;
      }

      const fetchBtn = document.getElementById('fetchHubspotFieldsBtn');
      if (fetchBtn) {
        fetchBtn.disabled = true;
        fetchBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Fetching Fields...';
      }

      IntegrationUtils.showStatus('hubspotFieldStatus', 'info', `Fetching fields for ${objectType}...`);

      try {
        const response = await fetch('/hubspot/fields', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: accessToken,
            object_type: objectType,
            oauth_mode: true
          })
        });

        const data = await response.json();

        if (data.status === 'success' || data.status === 'warning') {
          // Store fields globally
          window.hubspotFields = data.fields || [];
          this.platformFields = data.fields || [];

          IntegrationUtils.showStatus(
            'hubspotFieldStatus',
            data.status === 'warning' ? 'warning' : 'success',
            data.message || `Found ${data.fields.length} fields`
          );

          // Proceed to mapping step
          StepManager.goToStep(3);

          IntegrationUtils.showToast('success', `Successfully fetched ${data.fields.length} HubSpot fields`);
        } else {
          IntegrationUtils.showStatus('hubspotFieldStatus', 'error', data.message || 'Failed to fetch fields');
          IntegrationUtils.showToast('error', 'Failed to fetch HubSpot fields');
        }
      } catch (error) {
        IntegrationUtils.showStatus('hubspotFieldStatus', 'error', `Error: ${error.message}`);
        IntegrationUtils.showToast('error', `Error: ${error.message}`);
      } finally {
        if (fetchBtn) {
          fetchBtn.disabled = false;
          fetchBtn.innerHTML = '<i class="fas fa-list me-2"></i>Fetch Fields';
        }
      }
    },

    /**
     * Save the integration
     */
    saveIntegration: function() {
      if (typeof saveIntegration === 'function') {
        saveIntegration();
      } else {
        console.error('saveIntegration function not found');
        IntegrationUtils.showToast('error', 'Cannot save integration: Implementation not found');
      }
    }
  };

  // Initialize the Integration Manager
  IntegrationManager.init();

  // Additional event listeners outside the IntegrationManager object:

  // Set up authentication method toggle
  const authMethodRadios = document.querySelectorAll('input[name="authMethod"]');
  authMethodRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      const autoAuthForm = document.getElementById('autoAuthForm');
      const tokenAuthForm = document.getElementById('tokenAuthForm');

      if (this.value === 'auto') {
        if (autoAuthForm) autoAuthForm.style.display = 'block';
        if (tokenAuthForm) tokenAuthForm.style.display = 'none';
      } else {
        if (autoAuthForm) autoAuthForm.style.display = 'none';
        if (tokenAuthForm) tokenAuthForm.style.display = 'block';
      }
    });
  });

  // Set up password toggles
  const togglePairs = [
    { toggleId: 'togglePassword', inputId: 'alchemyPassword' },
    { toggleId: 'toggleRefreshToken', inputId: 'alchemyRefreshToken' },
    { toggleId: 'toggleHubspotApiKey', inputId: 'hubspotApiKey' },
    { toggleId: 'toggleHubspotSecret', inputId: 'hubspotPortalId' },
    { toggleId: 'toggleSalesforceSecret', inputId: 'salesforceClientSecret' },
    { toggleId: 'toggleSapSecret', inputId: 'sapClientSecret' }
  ];

  togglePairs.forEach(pair => {
    const toggle = document.getElementById(pair.toggleId);
    if (toggle) {
      toggle.addEventListener('click', function() {
        IntegrationUtils.toggleVisibility(pair.inputId, pair.toggleId);
      });
    }
  });

  // Set up HubSpot object type change handler
  const hubspotObjectType = document.getElementById('hubspotObjectType');
  if (hubspotObjectType) {
    hubspotObjectType.addEventListener('change', function() {
      const objectTypeLabel = document.getElementById('hubspotObjectTypeLabel');
      const fetchFieldsBtn = document.getElementById('fetchHubspotFieldsBtn');

      if (objectTypeLabel) {
        objectTypeLabel.textContent = this.options[this.selectedIndex].text || 'None Selected';
      }

      if (fetchFieldsBtn) {
        fetchFieldsBtn.disabled = !this.value;
      }
    });
  }

  console.log('Main.js initialization complete');
});
