/**
 * Complete Field Mapping Redesign
 * This replaces the existing field mapping with a cleaner, more reliable grid-based layout
 * 
 * Replace your entire field-mapping-enhancement.js file with this code
 */

// Main function to create a completely redesigned field mapping interface
function createFieldMapping(alchemyFields, platformFields) {
  console.log('Creating redesigned field mapping with Alchemy fields:', alchemyFields?.length || 0);
  console.log('Platform fields:', platformFields?.length || 0);
  
  // Get the container for field mappings
  const mappingContainer = document.getElementById('fieldMappings');
  if (!mappingContainer) {
    console.error('Field mapping container not found');
    return;
  }
  
  // Clear existing content
  mappingContainer.innerHTML = '';
  
  // Detect platform
  const platform = detectPlatform();
  
  // Use appropriate fields based on platform
  let platformFieldsToUse = platformFields || [];
  if (platformFieldsToUse.length === 0) {
    // Use default fields as fallback
    if (platform === 'hubspot') {
      platformFieldsToUse = [
        {identifier: 'firstname', name: 'First Name'},
        {identifier: 'lastname', name: 'Last Name'},
        {identifier: 'email', name: 'Email'},
        {identifier: 'phone', name: 'Phone Number'},
        {identifier: 'company', name: 'Company Name'}
      ];
    } else if (platform === 'salesforce') {
      platformFieldsToUse = [
        {identifier: 'name', name: 'Name'},
        {identifier: 'account', name: 'Account'},
        {identifier: 'email', name: 'Email'},
        {identifier: 'phone', name: 'Phone'}
      ];
    } else if (platform === 'sap') {
      platformFieldsToUse = [
        {identifier: 'material', name: 'Material'},
        {identifier: 'vendor', name: 'Vendor'},
        {identifier: 'purchase_order', name: 'Purchase Order'},
        {identifier: 'customer', name: 'Customer'}
      ];
    }
    
    console.log(`Using default ${platform} fields:`, platformFieldsToUse);
  }
  
  // Store platform fields globally for later use
  window.platformFields = platformFieldsToUse;
  
  // Create header
  const headerEl = document.createElement('div');
  headerEl.className = 'mapping-header mb-4 p-3 bg-light border-start border-4 border-primary rounded';
  headerEl.innerHTML = `
    <div class="d-flex justify-content-between align-items-center">
      <div>
        <i class="fas fa-exchange-alt me-2"></i>
        <strong>Field Mapping</strong>
        <span class="ms-2 text-muted">Connect data between systems</span>
      </div>
      <div>
        <span class="badge bg-primary me-2">${alchemyFields?.length || 0} Alchemy Fields</span>
        <span class="badge bg-secondary">${platformFieldsToUse.length || 0} ${capitalize(platform)} Fields</span>
      </div>
    </div>
    <p class="text-muted mt-2 mb-0 small">
      Map the fields between Alchemy and ${capitalize(platform)} that should be synchronized.
    </p>
  `;
  mappingContainer.appendChild(headerEl);
  
  // Create the mapping container with headers
  const mappingGrid = document.createElement('div');
  mappingGrid.className = 'mapping-grid card';
  mappingGrid.innerHTML = `
    <div class="card-header bg-white">
      <div class="row g-0 fw-bold">
        <div class="col-5 py-2 ps-3">Alchemy Field</div>
        <div class="col-5 py-2">${capitalize(platform)} Field</div>
        <div class="col-1 py-2 text-center">Required</div>
        <div class="col-1 py-2 text-center">Actions</div>
      </div>
    </div>
    <div class="card-body p-0" id="mappingRows">
      <!-- Mapping rows will be inserted here -->
    </div>
  `;
  mappingContainer.appendChild(mappingGrid);
  
  // Create Add Field button
  const addButton = document.createElement('button');
  addButton.className = 'btn btn-outline-primary mt-3';
  addButton.innerHTML = '<i class="fas fa-plus me-2"></i>Add Field Mapping';
  addButton.addEventListener('click', function() {
    addMappingRow(null, null, alchemyFields, platformFieldsToUse);
  });
  
  const buttonWrapper = document.createElement('div');
  buttonWrapper.className = 'd-flex justify-content-center mb-4 mt-3';
  buttonWrapper.appendChild(addButton);
  mappingContainer.appendChild(buttonWrapper);
  
  // Generate automatic mappings based on field name similarity
  const commonFieldMappings = [
    {alchemyPattern: ['name', 'Name'], platformPattern: ['name', 'Name']},
    {alchemyPattern: ['firstName', 'first_name', 'firstname'], platformPattern: ['firstname', 'firstName']},
    {alchemyPattern: ['lastName', 'last_name', 'lastname'], platformPattern: ['lastname', 'lastName']},
    {alchemyPattern: ['email', 'Email'], platformPattern: ['email', 'Email']},
    {alchemyPattern: ['phone', 'Phone'], platformPattern: ['phone', 'Phone']}
  ];
  
  // Keep track of used fields
  const usedAlchemyFields = new Set();
  const usedPlatformFields = new Set();
  let mappingCount = 0;
  
  // Add auto-mapped fields (limit to 5 total)
  for (let i = 0; i < commonFieldMappings.length && mappingCount < 5; i++) {
    const mapping = commonFieldMappings[i];
    
    // Find matching Alchemy field that isn't already used
    const alchemyField = alchemyFields?.find(field => 
      mapping.alchemyPattern.some(pattern => 
        (field.identifier && field.identifier.toLowerCase().includes(pattern.toLowerCase())) ||
        (field.name && field.name.toLowerCase().includes(pattern.toLowerCase()))
      ) && !usedAlchemyFields.has(field.identifier)
    );
    
    // Find matching platform field that isn't already used
    const platformField = platformFieldsToUse.find(field => 
      mapping.platformPattern.some(pattern => 
        (field.identifier && field.identifier.toLowerCase().includes(pattern.toLowerCase())) ||
        (field.name && field.name.toLowerCase().includes(pattern.toLowerCase()))
      ) && !usedPlatformFields.has(field.identifier)
    );
    
    // Add row if both fields found
    if (alchemyField && platformField) {
      addMappingRow(alchemyField, platformField, alchemyFields, platformFieldsToUse);
      usedAlchemyFields.add(alchemyField.identifier);
      usedPlatformFields.add(platformField.identifier);
      mappingCount++;
    }
  }
  
  // Add required fields from platform if not already mapped (limit to 5 total)
  for (let i = 0; i < platformFieldsToUse.length && mappingCount < 5; i++) {
    const platformField = platformFieldsToUse[i];
    
    if (platformField.required && !usedPlatformFields.has(platformField.identifier)) {
      // Find best matching Alchemy field
      const alchemyField = alchemyFields?.find(field => 
        !usedAlchemyFields.has(field.identifier) && (
          field.identifier.toLowerCase().includes(platformField.identifier.toLowerCase()) ||
          platformField.identifier.toLowerCase().includes(field.identifier.toLowerCase()) ||
          (field.name && field.name.toLowerCase().includes(platformField.name.toLowerCase())) ||
          (platformField.name && platformField.name.toLowerCase().includes(field.name.toLowerCase()))
        )
      );
      
      // Add mapping row
      if (alchemyField) {
        addMappingRow(alchemyField, platformField, alchemyFields, platformFieldsToUse);
        usedAlchemyFields.add(alchemyField.identifier);
      } else {
        // If no match, just add with empty Alchemy field
        addMappingRow(null, platformField, alchemyFields, platformFieldsToUse);
      }
      
      usedPlatformFields.add(platformField.identifier);
      mappingCount++;
    }
  }
  
  // Add additional empty rows until we have exactly 5
  while (mappingCount < 5) {
    addMappingRow(null, null, alchemyFields, platformFieldsToUse);
    mappingCount++;
  }
  
  // Add sync options if they're hidden
  const syncOptionsContainer = document.getElementById('syncOptionsContainer');
  if (syncOptionsContainer) {
    // Update sync options UI for better appearance
    syncOptionsContainer.innerHTML = `
      <div class="card">
        <div class="card-header bg-light">
          <h5 class="mb-0"><i class="fas fa-cogs me-2"></i>Synchronization Options</h5>
        </div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-6">
              <label for="syncFrequency" class="form-label">Sync Frequency</label>
              <select class="form-select" id="syncFrequency">
                <option value="realtime">Real-time</option>
                <option value="hourly">Hourly</option>
                <option value="daily" selected>Daily</option>
                <option value="weekly">Weekly</option>
                <option value="manual">Manual Only</option>
              </select>
              <div class="form-text">How often should data be synchronized</div>
            </div>
            <div class="col-md-6">
              <label for="syncDirection" class="form-label">Sync Direction</label>
              <select class="form-select" id="syncDirection">
                <option value="alchemy_to_platform">Alchemy to ${capitalize(platform)}</option>
                <option value="platform_to_alchemy">${capitalize(platform)} to Alchemy</option>
                <option value="bidirectional" selected>Bidirectional</option>
              </select>
              <div class="form-text">Which direction should data flow</div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    syncOptionsContainer.style.display = 'block';
  }
  
  // Add custom CSS to ensure proper styling
  if (!document.getElementById('field-mapping-custom-css')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'field-mapping-custom-css';
    styleEl.textContent = `
      .mapping-row {
        border-bottom: 1px solid #f0f0f0;
      }
      .mapping-row:last-child {
        border-bottom: none;
      }
      .mapping-row:hover {
        background-color: #f8f9fa;
      }
      .checkbox-centered {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
      }
      .action-centered {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
      }
      .delete-mapping-btn {
        width: 32px;
        height: 32px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `;
    document.head.appendChild(styleEl);
  }
  
  console.log('Redesigned field mapping interface created with 5 field rows');
}

// Function to add a mapping row to the grid
function addMappingRow(alchemyField = null, platformField = null, alchemyFields, platformFields) {
  const mappingRows = document.getElementById('mappingRows');
  if (!mappingRows) {
    console.error('Mapping rows container not found');
    return;
  }
  
  const rowEl = document.createElement('div');
  rowEl.className = 'mapping-row row g-0 py-2';
  
  // Create Alchemy field select
  const alchemyCol = document.createElement('div');
  alchemyCol.className = 'col-5 ps-3 pe-2';
  
  const alchemySelect = document.createElement('select');
  alchemySelect.className = 'form-select alchemy-field';
  
  // Add default option
  let option = document.createElement('option');
  option.value = '';
  option.textContent = 'Select Alchemy field...';
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
  
  alchemyCol.appendChild(alchemySelect);
  rowEl.appendChild(alchemyCol);
  
  // Create platform field select
  const platformCol = document.createElement('div');
  platformCol.className = 'col-5 px-2';
  
  const platformSelect = document.createElement('select');
  platformSelect.className = 'form-select platform-field';
  
  // Add default option
  option = document.createElement('option');
  option.value = '';
  option.textContent = `Select ${capitalize(detectPlatform())} field...`;
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
  
  platformCol.appendChild(platformSelect);
  rowEl.appendChild(platformCol);
  
  // Create required checkbox cell
  const requiredCol = document.createElement('div');
  requiredCol.className = 'col-1';
  
  const checkboxWrapper = document.createElement('div');
  checkboxWrapper.className = 'checkbox-centered h-100';
  
  const requiredCheckbox = document.createElement('input');
  requiredCheckbox.type = 'checkbox';
  requiredCheckbox.className = 'form-check-input required-checkbox';
  requiredCheckbox.checked = platformField && platformField.required;
  requiredCheckbox.disabled = platformField && platformField.required;
  
  checkboxWrapper.appendChild(requiredCheckbox);
  requiredCol.appendChild(checkboxWrapper);
  rowEl.appendChild(requiredCol);
  
  // Create action cell with delete button
  const actionCol = document.createElement('div');
  actionCol.className = 'col-1';
  
  const actionWrapper = document.createElement('div');
  actionWrapper.className = 'action-centered h-100';
  
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-sm btn-outline-danger delete-mapping-btn';
  deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
  deleteBtn.addEventListener('click', function() {
    rowEl.remove();
  });
  
  actionWrapper.appendChild(deleteBtn);
  actionCol.appendChild(actionWrapper);
  rowEl.appendChild(actionCol);
  
  // Add to container
  mappingRows.appendChild(rowEl);
  
  // Add change handler for platform field to update required checkbox
  platformSelect.addEventListener('change', function() {
    const selectedOption = this.options[this.selectedIndex];
    const isRequired = selectedOption.hasAttribute('data-required');
    
    requiredCheckbox.checked = isRequired;
    requiredCheckbox.disabled = isRequired;
  });
}

// Function to fix Step 3 display issues with redesigned layout
function fixStep3Display() {
  console.log('Fixing Step 3 display with redesigned layout');
  
  // Make sure field mappings container is visible
  const fieldMappings = document.getElementById('fieldMappings');
  if (fieldMappings) {
    fieldMappings.style.display = 'block';
    
    // Clear loading message if present
    if (fieldMappings.innerHTML.includes('Loading')) {
      fieldMappings.innerHTML = '';
    }
  }
  
  // If we have Alchemy fields but no mapping interface, create it with redesigned layout
  if (window.alchemyFields && window.alchemyFields.length > 0) {
    if (!document.querySelector('.mapping-grid')) {
      // Use redesigned layout with exactly 5 fields
      createFieldMapping(window.alchemyFields, window.platformFields || window.hubspotFields || []);
    }
  } else {
    // Create default fields as fallback
    const defaultAlchemyFields = [
      {identifier: "Name", name: "Name"},
      {identifier: "Description", name: "Description"},
      {identifier: "Status", name: "Status"},
      {identifier: "ExternalId", name: "External ID"},
      {identifier: "CreatedDate", name: "Created Date"}
    ];
    
    window.alchemyFields = defaultAlchemyFields;
    createFieldMapping(defaultAlchemyFields, window.platformFields || window.hubspotFields || []);
  }
  
  // Make sure sync options are visible
  const syncOptionsContainer = document.getElementById('syncOptionsContainer');
  if (syncOptionsContainer) {
    syncOptionsContainer.style.display = 'block';
  }
}

// Helper function to detect platform
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

// Helper function to capitalize first letter
function capitalize(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Override the existing functions with our redesigned versions
window.populateFieldMappings = createFieldMapping;
window.fixStep3Display = fixStep3Display;
window.addEnhancedMappingRow = addMappingRow;

// Override getFieldMappings to ensure it works with our redesigned layout
window.getFieldMappings = function() {
  const mappings = [];
  const rows = document.querySelectorAll('.mapping-row');
  
  rows.forEach(function(row) {
    const alchemySelect = row.querySelector('.alchemy-field');
    const platformSelect = row.querySelector('.platform-field');
    const requiredCheckbox = row.querySelector('.required-checkbox');
    
    if (alchemySelect && platformSelect && alchemySelect.value && platformSelect.value) {
      mappings.push({
        alchemy_field: alchemySelect.value,
        platform_field: platformSelect.value,
        required: requiredCheckbox ? requiredCheckbox.checked : false
      });
    }
  });
  
  return mappings;
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('Redesigned field mapping script loaded');
  
  // Set up a listener for step changes
  document.addEventListener('stepChanged', function(e) {
    if (e.detail && e.detail.step === 3) {
      setTimeout(fixStep3Display, 50);
    }
  });
  
  // Apply the fix if we're already on step 3
  setTimeout(function() {
    const step3 = document.getElementById('step3');
    if (step3 && window.getComputedStyle(step3).display !== 'none') {
      console.log('Currently on Step 3, applying fix immediately');
      fixStep3Display();
    }
  }, 500);
});

console.log("Redesigned field mapping layout loaded successfully");
