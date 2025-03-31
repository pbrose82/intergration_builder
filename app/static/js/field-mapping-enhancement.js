/**
 * Complete Field Mapping Redesign with Typeahead
 * Enhanced field mapping interface with typeahead functionality
 */

// Function to create typeahead field selector
function createTypeaheadField(fieldType, fields, initialValue = null) {
  // Create container
  const container = document.createElement('div');
  container.className = 'field-typeahead-container';
  
  // Create control
  const control = document.createElement('div');
  control.className = 'typeahead-control';
  
  // Create input group
  const inputGroup = document.createElement('div');
  inputGroup.className = 'typeahead-input-group';
  
  // Create selected text display
  const selectedText = document.createElement('div');
  selectedText.className = 'typeahead-selected';
  
  // Set initial text
  if (initialValue) {
    const field = fields.find(f => f.identifier === initialValue);
    selectedText.textContent = field ? (field.name || field.identifier) : initialValue;
  } else {
    selectedText.textContent = `Select ${fieldType} field...`;
  }
  
  // Create toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'typeahead-toggle-btn';
  toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
  
  // Hidden input to store the value
  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'hidden';
  hiddenInput.className = fieldType === 'Alchemy' ? 'alchemy-field' : 'platform-field';
  if (initialValue) {
    hiddenInput.value = initialValue;
  }
  
  // Add elements to input group
  inputGroup.appendChild(selectedText);
  inputGroup.appendChild(toggleBtn);
  
  // Add input group to control
  control.appendChild(inputGroup);
  control.appendChild(hiddenInput);
  
  // Create dropdown
  const dropdown = document.createElement('div');
  dropdown.className = 'typeahead-dropdown';
  dropdown.style.display = 'none';
  
  // Create search box
  const searchBox = document.createElement('input');
  searchBox.type = 'text';
  searchBox.className = fieldType === 'Alchemy' ? 'alchemy-search' : 'platform-search';
  searchBox.placeholder = `Search ${fieldType} fields...`;
  
  // Create dropdown content
  const dropdownContent = document.createElement('div');
  dropdownContent.className = 'typeahead-dropdown-content';
  
  // Add search box and dropdown content to dropdown
  dropdown.appendChild(searchBox);
  dropdown.appendChild(dropdownContent);
  
  // Populate dropdown with fields
  populateDropdown(dropdownContent, fields, selectedText, hiddenInput, dropdown);
  
  // Add dropdown to control
  control.appendChild(dropdown);
  
  // Add search functionality
  searchBox.addEventListener('input', function() {
    const query = this.value.toLowerCase();
    
    // Filter fields based on search query
    const filteredFields = fields.filter(field => 
      (field.name && field.name.toLowerCase().includes(query)) || 
      (field.identifier && field.identifier.toLowerCase().includes(query))
    );
    
    // Update dropdown
    populateDropdown(dropdownContent, filteredFields, selectedText, hiddenInput, dropdown);
  });
  
  // Toggle dropdown on click
  inputGroup.addEventListener('click', function(e) {
    e.stopPropagation();
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    
    if (dropdown.style.display === 'block') {
      searchBox.focus();
    }
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function() {
    dropdown.style.display = 'none';
  });
  
  // Prevent dropdown from closing when clicking inside it
  dropdown.addEventListener('click', function(e) {
    e.stopPropagation();
  });
  
  // Add everything to container
  container.appendChild(control);
  
  return container;
}

// Function to populate dropdown with fields
function populateDropdown(dropdownContent, fields, selectedText, hiddenInput, dropdown) {
  // Clear existing content
  dropdownContent.innerHTML = '';
  
  if (fields.length === 0) {
    const noResults = document.createElement('div');
    noResults.className = 'typeahead-no-results';
    noResults.textContent = 'No matching fields found';
    dropdownContent.appendChild(noResults);
    return;
  }
  
  // Add fields to dropdown
  fields.forEach(field => {
    const item = document.createElement('div');
    item.className = 'typeahead-item';
    item.textContent = field.name || field.identifier;
    
    // Handle item selection
    item.addEventListener('click', function() {
      selectedText.textContent = field.name || field.identifier;
      hiddenInput.value = field.identifier;
      
      // Dispatch change event on the hidden input
      const event = new Event('change', { bubbles: true });
      hiddenInput.dispatchEvent(event);
      
      // Close dropdown
      dropdown.style.display = 'none';
    });
    
    dropdownContent.appendChild(item);
  });
}

// Main function to create a field mapping interface with typeahead
function createFieldMapping(alchemyFields, platformFields) {
  console.log('Creating field mapping with Alchemy fields:', alchemyFields?.length || 0);
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
  
  console.log('Field mapping interface created with 5 field rows');
}

// Function to add a mapping row using typeahead
function addMappingRow(alchemyField = null, platformField = null, alchemyFields, platformFields) {
  const mappingRows = document.getElementById('mappingRows');
  if (!mappingRows) {
    console.error('Mapping rows container not found');
    return;
  }
  
  const row = document.createElement('div');
  row.className = 'mapping-row row g-0 py-2';
  
  // Create Alchemy field cell with typeahead
  const alchemyCol = document.createElement('div');
  alchemyCol.className = 'col-5 ps-3 pe-2';
  
  // Create typeahead for Alchemy field
  const alchemyTypeahead = createTypeaheadField('Alchemy', alchemyFields, alchemyField ? alchemyField.identifier : null);
  alchemyCol.appendChild(alchemyTypeahead);
  row.appendChild(alchemyCol);
  
  // Create platform field cell with typeahead
  const platformCol = document.createElement('div');
  platformCol.className = 'col-5 px-2';
  
  // Create typeahead for platform field
  const platformTypeahead = createTypeaheadField('Platform', platformFields, platformField ? platformField.identifier : null);
  platformCol.appendChild(platformTypeahead);
  row.appendChild(platformCol);
  
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
  row.appendChild(requiredCol);
  
  // Create action cell with delete button
  const actionCol = document.createElement('div');
  actionCol.className = 'col-1';
  
  const actionWrapper = document.createElement('div');
  actionWrapper.className = 'action-centered h-100';
  
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-sm btn-outline-danger delete-mapping';
  deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
  deleteBtn.addEventListener('click', function() {
    row.remove();
  });
  
  actionWrapper.appendChild(deleteBtn);
  actionCol.appendChild(actionWrapper);
  row.appendChild(actionCol);
  
  // Add to container
  mappingRows.appendChild(row);
  
  // Add hidden input change handler to update required checkbox
  const platformHiddenInput = row.querySelector('.platform-field');
  if (platformHiddenInput) {
    platformHiddenInput.addEventListener('change', function() {
      // Find the selected platform field
      const fieldId = this.value;
      const field = platformFields.find(f => f.identifier === fieldId);
      
      // Update required checkbox
      if (field && field.required) {
        requiredCheckbox.checked = true;
        requiredCheckbox.disabled = true;
      } else {
        requiredCheckbox.disabled = false;
      }
    });
  }
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
  
  // If we have Alchemy fields but no mapping interface, create it
  if (window.alchemyFields && window.alchemyFields.length > 0) {
    if (!document.querySelector('.mapping-grid')) {
      // Use redesigned layout with typeahead fields
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
    const alchemyInput = row.querySelector('.alchemy-field');
    const platformInput = row.querySelector('.platform-field');
    const requiredCheckbox = row.querySelector('.required-checkbox');
    
    if (alchemyInput && platformInput && alchemyInput.value && platformInput.value) {
      mappings.push({
        alchemy_field: alchemyInput.value,
        platform_field: platformInput.value,
        required: requiredCheckbox ? requiredCheckbox.checked : false
      });
    }
  });
  
  return mappings;
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('Field mapping script loaded');
  
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
