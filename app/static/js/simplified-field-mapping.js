/**
 * Simplified Field Mapping for Alchemy Integrations
 * Primary implementation for field mapping with no record identifier
 */

// Main function to populate field mappings
function populateFieldMappings(alchemyFields, hubspotFields) {
  console.log('Populating field mappings with Alchemy fields:', alchemyFields);
  
  // Get the container for field mappings
  const mappingContainer = document.getElementById('fieldMappings');
  if (!mappingContainer) {
    console.error('Field mapping container not found');
    return;
  }
  
  // Clear existing content
  mappingContainer.innerHTML = '';
  
  // Add header
  const headerHtml = `
    <div class="alert alert-info mb-3">
      <i class="fas fa-info-circle me-2"></i>
      Map fields between Alchemy and the selected platform
    </div>
  `;
  mappingContainer.innerHTML += headerHtml;
  
  // Detect platform
  const platform = detectPlatform();
  
  // Use appropriate fields based on platform
  let platformFields = hubspotFields || [];
  if (platformFields.length === 0) {
    // Use default fields as fallback
    if (platform === 'hubspot') {
      platformFields = [
        {identifier: 'firstname', name: 'First Name'},
        {identifier: 'lastname', name: 'Last Name'},
        {identifier: 'email', name: 'Email'},
        {identifier: 'phone', name: 'Phone Number'},
        {identifier: 'company', name: 'Company Name'},
        {identifier: 'website', name: 'Website'}
      ];
    } else if (platform === 'salesforce') {
      platformFields = [
        {identifier: 'name', name: 'Name'},
        {identifier: 'account', name: 'Account'},
        {identifier: 'opportunity', name: 'Opportunity'},
        {identifier: 'contact', name: 'Contact'},
        {identifier: 'email', name: 'Email'},
        {identifier: 'phone', name: 'Phone'}
      ];
    } else if (platform === 'sap') {
      platformFields = [
        {identifier: 'material', name: 'Material'},
        {identifier: 'vendor', name: 'Vendor'},
        {identifier: 'purchase_order', name: 'Purchase Order'},
        {identifier: 'delivery', name: 'Delivery'},
        {identifier: 'invoice', name: 'Invoice'},
        {identifier: 'customer', name: 'Customer'}
      ];
    }
    
    console.log(`Using default ${platform} fields:`, platformFields);
  }
  
  // Store platform fields globally for later use
  window.platformFields = platformFields;
  
  // Create table for mappings
  const tableHtml = `
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Alchemy Field</th>
          <th>${IntegrationUtils.capitalize(platform)} Field</th>
          <th width="80">Required</th>
          <th width="80">Actions</th>
        </tr>
      </thead>
      <tbody id="mappingsTableBody">
        <!-- Mapping rows will be added here -->
      </tbody>
    </table>
  `;
  
  mappingContainer.innerHTML += tableHtml;
  const tableBody = document.getElementById('mappingsTableBody');
  
  // Generate automatic mappings based on field name similarity
  const commonFieldMappings = [
    {alchemyPattern: ['name', 'Name'], platformPattern: ['name', 'Name']},
    {alchemyPattern: ['id', 'ID', 'Id', 'identifier'], platformPattern: ['id', 'ID', 'Id']},
    {alchemyPattern: ['firstName', 'first_name', 'firstname'], platformPattern: ['firstname', 'firstName']},
    {alchemyPattern: ['lastName', 'last_name', 'lastname'], platformPattern: ['lastname', 'lastName']},
    {alchemyPattern: ['email', 'Email'], platformPattern: ['email', 'Email']},
    {alchemyPattern: ['phone', 'Phone'], platformPattern: ['phone', 'Phone']},
    {alchemyPattern: ['address', 'Address'], platformPattern: ['address', 'Address']},
    {alchemyPattern: ['description', 'Description'], platformPattern: ['description', 'Description']},
    {alchemyPattern: ['company', 'Company'], platformPattern: ['company', 'Company']}
  ];
  
  // Keep track of used fields
  const usedAlchemyFields = new Set();
  const usedPlatformFields = new Set();
  let mappingCount = 0;
  
  // Add auto-mapped fields
  commonFieldMappings.forEach(mapping => {
    // Find matching Alchemy field that isn't already used
    const alchemyField = alchemyFields.find(field => 
      mapping.alchemyPattern.some(pattern => 
        (field.identifier && field.identifier.toLowerCase().includes(pattern.toLowerCase())) ||
        (field.name && field.name.toLowerCase().includes(pattern.toLowerCase()))
      ) && !usedAlchemyFields.has(field.identifier)
    );
    
    // Find matching platform field that isn't already used
    const platformField = platformFields.find(field => 
      mapping.platformPattern.some(pattern => 
        (field.identifier && field.identifier.toLowerCase().includes(pattern.toLowerCase())) ||
        (field.name && field.name.toLowerCase().includes(pattern.toLowerCase()))
      ) && !usedPlatformFields.has(field.identifier)
    );
    
    // Add row if both fields found
    if (alchemyField && platformField) {
      addMappingRow(tableBody, alchemyField, platformField, alchemyFields, platformFields);
      usedAlchemyFields.add(alchemyField.identifier);
      usedPlatformFields.add(platformField.identifier);
      mappingCount++;
    }
  });
  
  // Add required fields from platform if not already mapped
  platformFields.forEach(platformField => {
    if (platformField.required && !usedPlatformFields.has(platformField.identifier)) {
      // Find best matching Alchemy field
      const alchemyField = alchemyFields.find(field => 
        !usedAlchemyFields.has(field.identifier) && (
          field.identifier.toLowerCase().includes(platformField.identifier.toLowerCase()) ||
          platformField.identifier.toLowerCase().includes(field.identifier.toLowerCase()) ||
          (field.name && field.name.toLowerCase().includes(platformField.name.toLowerCase())) ||
          (platformField.name && platformField.name.toLowerCase().includes(field.name.toLowerCase()))
        )
      );
      
      // Add mapping row
      if (alchemyField) {
        addMappingRow(tableBody, alchemyField, platformField, alchemyFields, platformFields);
        usedAlchemyFields.add(alchemyField.identifier);
      } else {
        // If no match, just add with empty Alchemy field
        addMappingRow(tableBody, null, platformField, alchemyFields, platformFields);
      }
      
      usedPlatformFields.add(platformField.identifier);
      mappingCount++;
    }
  });
  
  // Ensure we have at least 3 rows
  while (mappingCount < 3) {
    addMappingRow(tableBody, null, null, alchemyFields, platformFields);
    mappingCount++;
  }
  
  // Add 'Add Mapping' button
  const addButtonHtml = `
    <div class="text-end mt-3">
      <button id="addMappingBtn" class="btn btn-outline-primary">
        <i class="fas fa-plus me-2"></i>Add Mapping
      </button>
    </div>
  `;
  
  mappingContainer.innerHTML += addButtonHtml;
  
  // Attach event handler for add button
  const addMappingBtn = document.getElementById('addMappingBtn');
  if (addMappingBtn) {
    addMappingBtn.addEventListener('click', function() {
      addMappingRow(tableBody, null, null, alchemyFields, platformFields);
    });
  }
  
  // Add sync options if they're hidden
  const syncOptionsContainer = document.getElementById('syncOptionsContainer');
  if (syncOptionsContainer && syncOptionsContainer.style.display === 'none') {
    syncOptionsContainer.style.display = 'block';
  }
  
  console.log('Field mapping UI populated successfully');
}

function addMappingRow(tableBody, alchemyField = null, platformField = null, alchemyFields, platformFields) {
  if (!tableBody) {
    console.error('Table body element not found');
    return;
  }
  
  const row = document.createElement('tr');
  row.className = 'mapping-row';
  
  // Create Alchemy field cell
  const alchemyCell = document.createElement('td');
  const alchemySelect = document.createElement('select');
  alchemySelect.className = 'form-select alchemy-field mapping-select';
  
  // Add default option
  let option = document.createElement('option');
  option.value = '';
  option.textContent = '-- Select Alchemy Field --';
  alchemySelect.appendChild(option);
  
  // Add Alchemy field options
  if (alchemyFields && alchemyFields.length > 0) {
    alchemyFields.forEach(function(field) {
      option = document.createElement('option');
      option.value = field.identifier;
      option.textContent = field.name || field.identifier;
      alchemySelect.appendChild(option);
    });
  }
  
  // Set selected value if provided
  if (alchemyField) {
    alchemySelect.value = alchemyField.identifier;
  }
  
  alchemyCell.appendChild(alchemySelect);
  row.appendChild(alchemyCell);
  
  // Create platform field cell
  const platformCell = document.createElement('td');
  const platformSelect = document.createElement('select');
  platformSelect.className = 'form-select platform-field mapping-select';
  
  // Add default option
  option = document.createElement('option');
  option.value = '';
  option.textContent = `-- Select ${IntegrationUtils.capitalize(detectPlatform())} Field --`;
  platformSelect.appendChild(option);
  
  // Add platform field options
  if (platformFields && platformFields.length > 0) {
    platformFields.forEach(function(field) {
      option = document.createElement('option');
      option.value = field.identifier;
      option.textContent = field.name + (field.required ? ' (Required)' : '');
      
      // Add data attribute for required fields
      if (field.required) {
        option.dataset.required = 'true';
      }
      
      platformSelect.appendChild(option);
    });
  }
  
  // Set selected value if provided
  if (platformField) {
    platformSelect.value = platformField.identifier;
  }
  
  platformCell.appendChild(platformSelect);
  row.appendChild(platformCell);
  
  // Create required cell with checkbox
  const requiredCell = document.createElement('td');
  requiredCell.className = 'text-center';
  
  const requiredCheckbox = document.createElement('input');
  requiredCheckbox.type = 'checkbox';
  requiredCheckbox.className = 'form-check-input required-checkbox';
  requiredCheckbox.checked = platformField && platformField.required;
  requiredCheckbox.disabled = platformField && platformField.required;
  
  requiredCell.appendChild(requiredCheckbox);
  row.appendChild(requiredCell);
  
  // Create action cell with delete button
  const actionCell = document.createElement('td');
  actionCell.className = 'text-center';
  
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn delete-mapping';
  deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
  deleteBtn.addEventListener('click', function() {
    row.remove();
  });
  
  actionCell.appendChild(deleteBtn);
  row.appendChild(actionCell);
  
  // Add to table
  tableBody.appendChild(row);
  
  // Rest of the code...

    });
  }
  
  // Set selected value if provided
  if (platformField) {
    platformSelect.value = platformField.identifier;
  }
  
  platformCell.appendChild(platformSelect);
  row.appendChild(platformCell);
  
  // Create required cell with checkbox
  const requiredCell = document.createElement('td');
  requiredCell.className = 'text-center';
  
  const requiredCheckbox = document.createElement('input');
  requiredCheckbox.type = 'checkbox';
  requiredCheckbox.className = 'form-check-input';
  requiredCheckbox.checked = platformField && platformField.required;
  requiredCheckbox.disabled = platformField && platformField.required;
  
  requiredCell.appendChild(requiredCheckbox);
  row.appendChild(requiredCell);
  
  // Create action cell with delete button
  const actionCell = document.createElement('td');
  actionCell.className = 'text-center';
  
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-sm btn-outline-danger';
  deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
  deleteBtn.addEventListener('click', function() {
    row.remove();
  });
  
  actionCell.appendChild(deleteBtn);
  row.appendChild(actionCell);
  
  // Add to table
  tableBody.appendChild(row);
  
  // Add change handler for platform field to update required checkbox
  platformSelect.addEventListener('change', function() {
    const selectedOption = this.options[this.selectedIndex];
    const isRequired = selectedOption.hasAttribute('data-required');
    
    requiredCheckbox.checked = isRequired;
    requiredCheckbox.disabled = isRequired;
  });
}

// Function to fix Step 3 display issues
function fixStep3Display() {
  console.log('Fixing Step 3 display');
  
  // Make sure field mappings container is visible
  const fieldMappings = document.getElementById('fieldMappings');
  if (fieldMappings) {
    fieldMappings.style.display = 'block';
  }
  
  // If we have Alchemy fields but no mapping table, populate it
  if (window.alchemyFields && window.alchemyFields.length > 0) {
    const mappingsTableBody = document.getElementById('mappingsTableBody');
    if (!mappingsTableBody || mappingsTableBody.children.length === 0) {
      populateFieldMappings(window.alchemyFields, window.platformFields || []);
    }
  }
  
  // Make sure sync options are visible
  const syncOptionsContainer = document.getElementById('syncOptionsContainer');
  if (syncOptionsContainer) {
    syncOptionsContainer.style.display = 'block';
  }
}

// Function to get mapped fields for saving
function getFieldMappings() {
  const mappings = [];
  const rows = document.querySelectorAll('.mapping-row');
  
  rows.forEach(function(row) {
    const alchemySelect = row.querySelector('.alchemy-field');
    const platformSelect = row.querySelector('.platform-field');
    const requiredCheckbox = row.querySelector('input[type="checkbox"]');
    
    if (alchemySelect && platformSelect && alchemySelect.value && platformSelect.value) {
      mappings.push({
        alchemy_field: alchemySelect.value,
        platform_field: platformSelect.value,
        required: requiredCheckbox ? requiredCheckbox.checked : false
      });
    }
  });
  
  return mappings;
}

// Function to detect which platform is being used
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

// Function to save the integration configuration
function saveIntegration() {
  const platform = detectPlatform();
  
  // Get field mappings
  const fieldMappings = getFieldMappings();
  
  if (fieldMappings.length === 0) {
    IntegrationUtils.showToast('error', 'Please create at least one field mapping');
    return;
  }
  
  // Get platform-specific configuration
  let platformConfig = {};
  
  if (platform === 'hubspot') {
    // HubSpot configuration
    const accessToken = document.getElementById('hubspotApiKey').value.trim();
    const clientSecret = document.getElementById('hubspotPortalId').value.trim();
    const objectTypeSelect = document.getElementById('hubspotObjectType');
    const objectType = objectTypeSelect ? objectTypeSelect.value : '';
    
    if (!accessToken || !objectType) {
      IntegrationUtils.showToast('error', 'Missing HubSpot access token or object type');
      return;
    }
    
    platformConfig = {
      access_token: accessToken,
      client_secret: clientSecret,
      object_type: objectType
      // No record_identifier field needed
    };
  } else if (platform === 'salesforce') {
    // Salesforce configuration
    const instanceUrl = document.getElementById('salesforceInstanceUrl').value.trim();
    const clientId = document.getElementById('salesforceClientId').value.trim();
    const clientSecret = document.getElementById('salesforceClientSecret').value.trim();
    
    if (!instanceUrl || !clientId || !clientSecret) {
      IntegrationUtils.showToast('error', 'Missing Salesforce credentials');
      return;
    }
    
    platformConfig = {
      instance_url: instanceUrl,
      client_id: clientId,
      client_secret: clientSecret
    };
  } else if (platform === 'sap') {
    // SAP configuration
    const baseUrl = document.getElementById('sapBaseUrl').value.trim();
    const clientId = document.getElementById('sapClientId').value.trim();
    const clientSecret = document.getElementById('sapClientSecret').value.trim();
    
    if (!baseUrl || !clientId || !clientSecret) {
      IntegrationUtils.showToast('error', 'Missing SAP credentials');
      return;
    }
    
    platformConfig = {
      base_url: baseUrl,
      client_id: clientId,
      client_secret: clientSecret
    };
  }
  
  // Get Alchemy configuration
  let tenantId, refreshToken;
  const authMethodAuto = document.getElementById('authMethodAuto');
  
  if (authMethodAuto && authMethodAuto.checked) {
    tenantId = document.getElementById('alchemyTenantId').value.trim();
    refreshToken = "session"; // Use token from session
  } else {
    tenantId = document.getElementById('alchemyTenantIdDirect').value.trim();
    refreshToken = document.getElementById('alchemyRefreshToken').value.trim();
  }
  
  if (!tenantId) {
    IntegrationUtils.showToast('error', 'Missing Alchemy tenant ID');
    return;
  }
  
  // Get record type
  const recordType = document.getElementById('recordTypeInput').value.trim();
  
  if (!recordType) {
    IntegrationUtils.showToast('error', 'Missing Alchemy record type');
    return;
  }
  
  // Get sync options
  const syncFrequency = document.getElementById('syncFrequency') ? 
    document.getElementById('syncFrequency').value : 'daily';
  const syncDirection = document.getElementById('syncDirection') ? 
    document.getElementById('syncDirection').value : 'bidirectional';
  
  // Prepare data
  const integrationData = {
    platform: platform,
    alchemy: {
      tenant_id: tenantId,
      refresh_token: refreshToken,
      record_type: recordType
    },
    [platform]: platformConfig,
    sync_config: {
      frequency: syncFrequency,
      direction: syncDirection,
      is_active: true
    },
    field_mappings: fieldMappings
  };
  
  console.log('Saving integration with data:', integrationData);
  
  // Show saving state
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';
  }
  
  // Send to server
  fetch('/save-integration', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(integrationData)
  })
  .then(response => response.json())
  .then(data => {
    // Reset button
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save Configuration';
    }
    
    if (data.status === 'success') {
      IntegrationUtils.showToast('success', 'Integration saved successfully!');
      
      // Show success message and redirect option
      const step3 = document.getElementById('step3');
      if (step3) {
        step3.innerHTML = `
          <div class="alert alert-success">
            <i class="fas fa-check-circle me-2"></i>
            ${platform.charAt(0).toUpperCase() + platform.slice(1)} integration saved successfully! Integration ID: ${data.integration_id}
          </div>
          <p>The integration between Alchemy and ${platform.charAt(0).toUpperCase() + platform.slice(1)} has been configured successfully.</p>
          <a href="/" class="btn btn-primary">
            <i class="fas fa-home me-2"></i>Return to Dashboard
          </a>
        `;
      }
    } else {
      IntegrationUtils.showToast('error', data.message || 'Failed to save integration');
    }
  })
  .catch(error => {
    console.error("Save error:", error);
    
    // Reset button
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save Configuration';
    }
    
    IntegrationUtils.showToast('error', 'Error: ' + error.message);
  });
}

// Attach to DOM Ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('Simplified field mapping script loaded');
  
  // Attach to saveBtn click to use our save function
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveIntegration);
  }
  
  // Create a global event listener for step changes
  document.addEventListener('stepChanged', function(e) {
    if (e.detail && e.detail.step === 3) {
      fixStep3Display();
    }
  });
});

// Make functions globally available
window.populateFieldMappings = populateFieldMappings;
window.fixStep3Display = fixStep3Display;
window.getFieldMappings = getFieldMappings;
window.saveIntegration = saveIntegration;
