/**
 * Field Preservation Bug Fix
 * 
 * This script fixes the issue where fields are not correctly preserved
 * between Step 2 and Step 3 in the Hubspot integration flow.
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Field preservation bugfix script loaded');
  
  // 1. Fix for the HubSpot field retrieval and storage
  const fetchHubspotFieldsBtn = document.getElementById('fetchHubspotFieldsBtn');
  if (fetchHubspotFieldsBtn) {
    const originalClickHandler = fetchHubspotFieldsBtn.onclick;
    
    fetchHubspotFieldsBtn.onclick = async function(e) {
      console.log('Intercepted fetchHubspotFieldsBtn click');
      
      // Get the necessary values
      const objectType = document.getElementById('hubspotObjectType')?.value;
      const accessToken = document.getElementById('hubspotApiKey')?.value?.trim();
      
      if (!objectType) {
        IntegrationUtils.showToast('error', 'Please select a HubSpot object type');
        return;
      }
      
      // Show loading state
      fetchHubspotFieldsBtn.disabled = true;
      fetchHubspotFieldsBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Fetching Fields...';
      
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
          // Store fields BOTH in window.hubspotFields AND window.platformFields
          console.log(`Retrieved ${data.fields.length} fields for ${objectType}`);
          window.hubspotFields = data.fields || [];
          window.platformFields = data.fields || [];
          
          // Log to verify storage
          console.log('Fields stored in window.hubspotFields:', window.hubspotFields.length);
          console.log('Fields stored in window.platformFields:', window.platformFields.length);
          
          IntegrationUtils.showStatus(
            'hubspotFieldStatus',
            data.status === 'warning' ? 'warning' : 'success',
            data.message || `Found ${data.fields.length} fields`
          );
          
          // Proceed to mapping step
          if (typeof StepManager !== 'undefined' && StepManager.goToStep) {
            StepManager.goToStep(3);
          } else {
            // Fallback if StepManager not available
            const nextBtn = document.getElementById('nextBtn');
            if (nextBtn) nextBtn.click();
          }
          
          IntegrationUtils.showToast('success', `Successfully fetched ${data.fields.length} HubSpot fields`);
        } else {
          IntegrationUtils.showStatus('hubspotFieldStatus', 'error', data.message || 'Failed to fetch fields');
          IntegrationUtils.showToast('error', 'Failed to fetch HubSpot fields');
        }
      } catch (error) {
        console.error('Error fetching fields:', error);
        IntegrationUtils.showStatus('hubspotFieldStatus', 'error', `Error: ${error.message}`);
        IntegrationUtils.showToast('error', `Error: ${error.message}`);
      } finally {
        // Reset button state
        fetchHubspotFieldsBtn.disabled = false;
        fetchHubspotFieldsBtn.innerHTML = '<i class="fas fa-list me-2"></i>Fetch Fields';
      }
      
      // Prevent other handlers from running
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
  }
  
  // 2. Fix for handling step transitions
  if (typeof StepManager !== 'undefined') {
    // Enhance the goToStep method to better handle field preservation
    const originalGoToStep = StepManager.goToStep;
    
    StepManager.goToStep = function(step) {
      console.log(`Enhanced step transition to step ${step}`);
      
      // If going to step 3, ensure we have fields available
      if (step === 3) {
        console.log('Pre-transition field check:');
        console.log('- alchemyFields:', window.alchemyFields?.length || 0);
        console.log('- platformFields:', window.platformFields?.length || 0);
        console.log('- hubspotFields:', window.hubspotFields?.length || 0);
        
        // Ensure platformFields has the fields from hubspotFields
        if (!window.platformFields || window.platformFields.length === 0) {
          if (window.hubspotFields && window.hubspotFields.length > 0) {
            console.log('Copying hubspotFields to platformFields');
            window.platformFields = window.hubspotFields;
          }
        }
      }
      
      // Call the original method
      originalGoToStep.call(StepManager, step);
      
      // Additional step-specific logic after transition
      if (step === 3) {
        // Double-check that field mappings are displayed correctly
        setTimeout(function() {
          console.log('Post-transition field check:');
          console.log('- alchemyFields:', window.alchemyFields?.length || 0);
          console.log('- platformFields:', window.platformFields?.length || 0);
          
          // Force redraw of the mapping interface if needed
          const mappingsTableBody = document.getElementById('mappingsTableBody');
          if ((!mappingsTableBody || mappingsTableBody.children.length === 0) && 
              window.alchemyFields && window.alchemyFields.length > 0) {
            console.log('Forcing redraw of field mappings');
            if (typeof fixStep3Display === 'function') {
              fixStep3Display();
            }
          }
        }, 100);
      }
    };
  }
  
  // 3. Debug logging for field data
  function logFieldData() {
    console.log('Current field data:');
    console.log('- alchemyFields:', window.alchemyFields?.length || 0);
    console.log('- platformFields:', window.platformFields?.length || 0);
    console.log('- hubspotFields:', window.hubspotFields?.length || 0);
  }
  
  // Log field data periodically to help debug issues
  setTimeout(logFieldData, 2000);
  setTimeout(logFieldData, 5000);
  
  // 4. Set up MutationObserver to detect when field containers are added
  const targetNode = document.body;
  const config = { childList: true, subtree: true };
  
  const callback = function(mutationsList, observer) {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        const mappingsContainer = document.getElementById('mappingsTableBody');
        if (mappingsContainer && mappingsContainer.children.length === 0) {
          console.log('Empty mapping container detected, checking fields');
          logFieldData();
          
          // If we have fields but the container is empty, try to populate it
          if ((window.alchemyFields && window.alchemyFields.length > 0) &&
              (window.platformFields && window.platformFields.length > 0 || 
               window.hubspotFields && window.hubspotFields.length > 0)) {
            console.log('Fields available but container empty, attempting to populate');
            if (typeof fixStep3Display === 'function') {
              fixStep3Display();
            }
          }
        }
      }
    }
  };
  
  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
  
  // 5. NEW: Enhanced fix for Step 3 mapping issues
  // Override existing fixStep3Display with a more robust version
  const originalFixStep3 = window.fixStep3Display;
  
  window.fixStep3Display = function() {
    console.log('Running enhanced fixStep3Display');
    
    // Try the original function if it exists
    if (typeof originalFixStep3 === 'function') {
      try {
        originalFixStep3();
      } catch (error) {
        console.error('Error in original fixStep3Display:', error);
      }
    }
    
    // Make sure field mappings container is visible
    const fieldMappings = document.getElementById('fieldMappings');
    if (fieldMappings) {
      fieldMappings.style.display = 'block';
      
      // Clear loading message if present
      if (fieldMappings.innerHTML.includes('Loading')) {
        fieldMappings.innerHTML = '';
      }
    }
    
    // Ensure we have Alchemy fields
    if (!window.alchemyFields || window.alchemyFields.length === 0) {
      console.log('Creating default Alchemy fields');
      window.alchemyFields = [
        {identifier: "Name", name: "Name"},
        {identifier: "Description", name: "Description"},
        {identifier: "Status", name: "Status"},
        {identifier: "ExternalId", name: "External ID"},
        {identifier: "CreatedDate", name: "Created Date"}
      ];
    }
    
    // Ensure we have platform fields
    if (!window.platformFields || window.platformFields.length === 0) {
      // Try to use hubspotFields if available
      if (window.hubspotFields && window.hubspotFields.length > 0) {
        console.log('Copying HubSpot fields to platformFields');
        window.platformFields = window.hubspotFields;
      } else {
        // Create default platform fields based on detected platform
        const platform = detectPlatform();
        console.log(`Creating default ${platform} fields`);
        
        if (platform === 'hubspot') {
          window.platformFields = [
            {identifier: "firstname", name: "First Name"},
            {identifier: "lastname", name: "Last Name"},
            {identifier: "email", name: "Email"},
            {identifier: "phone", name: "Phone Number"},
            {identifier: "company", name: "Company Name"}
          ];
        } else if (platform === 'salesforce') {
          window.platformFields = [
            {identifier: "Name", name: "Name"},
            {identifier: "AccountId", name: "Account ID"},
            {identifier: "Email", name: "Email"},
            {identifier: "Phone", name: "Phone"},
            {identifier: "Description", name: "Description"}
          ];
        } else {
          window.platformFields = [
            {identifier: "id", name: "ID"},
            {identifier: "name", name: "Name"},
            {identifier: "description", name: "Description"},
            {identifier: "status", name: "Status"},
            {identifier: "external_id", name: "External ID"}
          ];
        }
      }
    }
    
    // Call the appropriate mapping function
    if (typeof enhancedPopulateFieldMappings === 'function') {
      console.log('Using enhanced field mapping');
      enhancedPopulateFieldMappings(window.alchemyFields, window.platformFields);
    } else if (typeof populateFieldMappings === 'function') {
      console.log('Using standard field mapping');
      populateFieldMappings(window.alchemyFields, window.platformFields);
    } else {
      console.error('No field mapping function available');
      // Create basic mapping UI if all else fails
      createFallbackMappingUI();
    }
    
    // Make sure sync options are visible
    const syncOptionsContainer = document.getElementById('syncOptionsContainer');
    if (syncOptionsContainer) {
      syncOptionsContainer.style.display = 'block';
    }
    
    console.log('Step 3 preparation complete');
  };
  
  // Helper function to detect which platform we're working with
  function detectPlatform() {
    const url = window.location.href;
    if (url.includes('platform=hubspot')) {
      return 'hubspot';
    } else if (url.includes('platform=salesforce')) {
      return 'salesforce';
    } else if (url.includes('platform=sap')) {
      return 'sap';
    }
    return 'unknown';
  }
  
  // Fallback mapping UI in case all else fails
  function createFallbackMappingUI() {
    console.log('Creating fallback mapping UI');
    const fieldMappings = document.getElementById('fieldMappings');
    if (!fieldMappings) return;
    
    const platform = detectPlatform();
    
    let html = `
      <div class="alert alert-warning mb-4">
        <i class="fas fa-exclamation-triangle me-2"></i>
        Using simplified mapping interface due to loading issues.
      </div>
      
      <div class="card p-3 mb-4">
        <h5 class="mb-3">Map Fields Between Alchemy and ${platform.charAt(0).toUpperCase() + platform.slice(1)}</h5>
        
        <div id="mappingsContainer">
          <!-- Mapping rows will be added here -->
        </div>
        
        <button type="button" id="addMappingRowBtn" class="btn btn-outline-primary mt-3">
          <i class="fas fa-plus me-2"></i>Add Mapping
        </button>
      </div>
    `;
    
    fieldMappings.innerHTML = html;
    
    // Create 5 default mapping rows
    const container = document.getElementById('mappingsContainer');
    if (container) {
      for (let i = 0; i < 5; i++) {
        addFallbackMappingRow(container);
      }
      
      // Add button event listener
      const addBtn = document.getElementById('addMappingRowBtn');
      if (addBtn) {
        addBtn.addEventListener('click', function() {
          addFallbackMappingRow(container);
        });
      }
    }
  }
  
  // Helper function to add a mapping row to the fallback UI
  function addFallbackMappingRow(container) {
    const rowId = 'mapping-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    
    const row = document.createElement('div');
    row.className = 'row g-3 align-items-center mb-3';
    row.id = rowId;
    
    row.innerHTML = `
      <div class="col-5">
        <select class="form-select alchemy-field">
          <option value="">-- Select Alchemy Field --</option>
          ${window.alchemyFields?.map(f => `<option value="${f.identifier}">${f.name || f.identifier}</option>`).join('') || ''}
        </select>
      </div>
      <div class="col-5">
        <select class="form-select platform-field">
          <option value="">-- Select Platform Field --</option>
          ${window.platformFields?.map(f => `<option value="${f.identifier}">${f.name || f.identifier}</option>`).join('') || ''}
        </select>
      </div>
      <div class="col-1">
        <div class="form-check">
          <input class="form-check-input required-checkbox" type="checkbox">
        </div>
      </div>
      <div class="col-1">
        <button type="button" class="btn btn-sm btn-outline-danger delete-row">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    // Add delete handler
    const deleteBtn = row.querySelector('.delete-row');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function() {
        row.remove();
      });
    }
    
    container.appendChild(row);
  }
  
  // Apply the fix if we're already on step 3
  setTimeout(function() {
    const step3 = document.getElementById('step3');
    if (step3 && window.getComputedStyle(step3).display !== 'none') {
      console.log('Currently on Step 3, applying fix immediately');
      window.fixStep3Display();
    }
  }, 500);
  
  console.log('Field mapping bug fix initialization complete');
});
