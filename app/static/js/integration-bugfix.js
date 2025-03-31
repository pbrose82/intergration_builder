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
  
  // Set up MutationObserver to detect when field containers are added
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
  
  console.log('Field preservation bugfix script initialized');
});
