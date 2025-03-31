/**
 * Step Manager - Unified step navigation for integration workflows
 * Handles step transitions, progress updates, and step-specific initialization
 */

const StepManager = {
  currentStep: 1,
  
  /**
   * Navigate to a specific step
   * @param {number} step - The step number to go to (1-3)
   */
  goToStep: function(step) {
    console.log(`Navigating to step ${step}`);
    
    // Validate step number
    if (step < 1 || step > 3) {
      console.error(`Invalid step number: ${step}`);
      return;
    }
    
    // Hide all steps
    document.querySelectorAll('.step-content').forEach(el => {
      el.style.display = 'none';
    });
    
    // Show requested step
    const stepEl = document.getElementById(`step${step}`);
    if (stepEl) {
      stepEl.style.display = 'block';
    } else {
      console.error(`Step element #step${step} not found`);
      return;
    }
    
    // Update progress
    this.updateProgress(step);
    
    // Update buttons
    this.updateButtons(step);
    
    // Perform step-specific initializations
    this.initializeStep(step);
    
    this.currentStep = step;
    
    // Dispatch event for other scripts that might need to know about step change
    document.dispatchEvent(new CustomEvent('stepChanged', { 
      detail: { step: step }
    }));
  },
  
  /**
   * Navigate to the next step if current step is valid
   */
  goToNextStep: function() {
    if (this.validateCurrentStep()) {
      this.goToStep(this.currentStep + 1);
      return true;
    }
    return false;
  },
  
  /**
   * Navigate to the previous step
   */
  goToPreviousStep: function() {
    if (this.currentStep > 1) {
      this.goToStep(this.currentStep - 1);
      return true;
    }
    return false;
  },
  
  /**
   * Update the progress bar and text
   */
  updateProgress: function(step) {
    const progressBar = document.getElementById('progressBar');
    const progressStep = document.getElementById('progressStep');
    
    if (progressBar) {
      progressBar.style.width = `${(step / 3) * 100}%`;
    }
    
    if (progressStep) {
      progressStep.textContent = `Step ${step} of 3`;
    }
  },
  
  /**
   * Update navigation buttons based on current step
   */
  updateButtons: function(step) {
    const nextBtn = document.getElementById('nextBtn');
    const saveBtn = document.getElementById('saveBtn');
    const backBtn = document.getElementById('backBtn');
    
    if (step === 3) {
      // Final step - show save button instead of next
      if (nextBtn) nextBtn.style.display = 'none';
      if (saveBtn) saveBtn.style.display = 'inline-block';
    } else {
      // Intermediate steps - show next button
      if (nextBtn) nextBtn.style.display = 'inline-block';
      if (saveBtn) saveBtn.style.display = 'none';
    }
    
    // Back button is always visible but with different behavior on first step
    if (backBtn) {
      backBtn.disabled = false;
    }
  },
  
  /**
   * Validate the current step before proceeding to the next
   * @returns {boolean} True if the current step is valid
   */
  validateCurrentStep: function() {
    if (this.currentStep === 1) {
      // Validate authentication
      return this.validateAuthenticationStep();
    } else if (this.currentStep === 2) {
      // Validate record type selection
      return this.validateRecordTypeStep();
    }
    
    // All other steps are considered valid
    return true;
  },
  
  /**
   * Validate step 1 (Authentication)
   */
  validateAuthenticationStep: function() {
    // Check if using auto authentication or direct token
    const authMethodAuto = document.getElementById('authMethodAuto');
    
    if (authMethodAuto && authMethodAuto.checked) {
      const authStatus = document.getElementById('authStatus');
      
      // If no success message is visible, require authentication
      if (!authStatus || authStatus.style.display === 'none' || !authStatus.classList.contains('alert-success')) {
        IntegrationUtils.showToast('error', 'Please authenticate with Alchemy first');
        return false;
      }
    } else {
      // For direct token input, validate tenant ID and refresh token
      const tenantId = document.getElementById('alchemyTenantIdDirect');
      const refreshToken = document.getElementById('alchemyRefreshToken');
      
      if (!tenantId || !tenantId.value.trim()) {
        IntegrationUtils.showToast('error', 'Please enter Alchemy Tenant ID');
        return false;
      }
      
      if (!refreshToken || !refreshToken.value.trim()) {
        IntegrationUtils.showToast('error', 'Please enter Alchemy Refresh Token');
        return false;
      }
    }
    
    // Check platform-specific credentials
    const platform = this.detectPlatform();
    
    if (platform === 'hubspot') {
      const apiKey = document.getElementById('hubspotApiKey');
      if (!apiKey || !apiKey.value.trim()) {
        IntegrationUtils.showToast('error', 'Please enter HubSpot Access Token');
        return false;
      }
    } else if (platform === 'salesforce') {
      const instanceUrl = document.getElementById('salesforceInstanceUrl');
      if (!instanceUrl || !instanceUrl.value.trim()) {
        IntegrationUtils.showToast('error', 'Please enter Salesforce Instance URL');
        return false;
      }
    }
    
    return true;
  },
  
  /**
   * Validate step 2 (Record Type selection)
   */
  validateRecordTypeStep: function() {
    // Either a record type must be selected or entered
    const recordTypeInput = document.getElementById('recordTypeInput');
    
    if (!recordTypeInput || !recordTypeInput.value.trim()) {
      IntegrationUtils.showToast('error', 'Please enter an Alchemy record type');
      return false;
    }
    
    // For HubSpot, check object type selection
    const platform = this.detectPlatform();
    if (platform === 'hubspot') {
      const objectType = document.getElementById('hubspotObjectType');
      if (objectType && !objectType.value) {
        IntegrationUtils.showToast('error', 'Please select a HubSpot object type');
        return false;
      }
    }
    
    return true;
  },
  
  /**
   * Initialize a specific step with any required setup
   */
  initializeStep: function(step) {
    // Step-specific initialization
    if (step === 1) {
      // Nothing special to initialize for step 1
    } else if (step === 2) {
      // For HubSpot, show the object container
      const platform = this.detectPlatform();
      if (platform === 'hubspot') {
        const hubspotObjectContainer = document.getElementById('hubspotObjectContainer');
        if (hubspotObjectContainer) {
          hubspotObjectContainer.style.display = 'block';
        }
      }
    } else if (step === 3) {
      // Initialize field mapping
      if (typeof fixStep3Display === 'function') {
        fixStep3Display();
      }
    }
  },
  
  /**
   * Detect which platform is being integrated with
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
   * Attach event handlers to navigation buttons
   */
  setupEventHandlers: function() {
    const nextBtn = document.getElementById('nextBtn');
    const backBtn = document.getElementById('backBtn');
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.goToNextStep());
    }
    
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        // If we're on step 1, go back to platform selection
        if (this.currentStep === 1) {
          window.location.href = '/select-platform.html';
        } 
        // If we're on step 3, we want to go back to step 2
        else if (this.currentStep === 3) {
          this.goToStep(2);
        }
        // Otherwise just go to the previous step
        else {
          this.goToPreviousStep();
        }
      });
    }
  }
};  // <-- Closing the StepManager object literal properly

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  console.log('Step Manager initialized');
  StepManager.setupEventHandlers();
});
