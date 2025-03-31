/**
 * Enhanced field mapping layout with better spacing and organization
 * This script improves the field mapping UI with a cleaner layout and exactly 5 initial fields
 */

// Modify populateFieldMappings function to improve layout and start with exactly 5 fields
function enhancedPopulateFieldMappings(alchemyFields, platformFields) {
  console.log('Populating improved field mappings with Alchemy fields:', alchemyFields?.length || 0);
  console.log('Platform fields:', platformFields?.length || 0);
  
  // Get the container for field mappings
  const mappingContainer = document.getElementById('fieldMappings');
  if (!mappingContainer) {
    console.error('Field mapping container not found');
    return;
  }
  
  // Clear existing content
  mappingContainer.innerHTML = '';
  
  // Add improved header with field counts
  const headerHtml = `
    <div class="mapping-info mb-4">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <i class="fas fa-exchange-alt me-2"></i>
          <strong>Field Mapping</strong>
          <span class="text-muted ms-2">Connect data between systems</span>
        </div>
        <div>
          <span class="badge bg-primary me-2">${alchemyFields?.length || 0} Alchemy Fields</span>
          <span class="badge bg-secondary">${platformFields?.length || 0} ${detectPlatform().charAt(0).toUpperCase() + detectPlatform().slice(1)} Fields</span>
        </div>
      </div>
      <p class="text-muted mt-2 mb-0">
        <small>Use the search box to quickly find fields from either system. Map the fields that should be synchronized.</small>
      </p>
    </div>
  `;
  mappingContainer.innerHTML += headerHtml;
  
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
        {identifier: 'company', name: 'Company Name'},
        {identifier: 'website', name: 'Website'}
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
  
  // Create improved table for mappings
  const tableHtml = `
    <div class="mapping-container card shadow-sm mb-4">
      <div class="card-body p-0">
        <table class="mapping-table table table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th class="ps-3">Alchemy Field</th>
              <th>${IntegrationUtils.capitalize(platform)} Field</th>
              <th width="100" class="text-center">Required</th>
              <th width="80" class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody id="mappingsTableBody">
            <!-- Mapping rows will be added here -->
          </tbody>
        </table>
      </div>
    </div>
    
    <div class="d-flex justify-content-center mb-4">
      <button type="button" id="addMappingBtn" class="btn btn-outline-primary">
        <i class="fas fa-plus me-2"></i>Add Field Mapping
      </button>
    </div>
  `;
  
  mappingContainer.innerHTML += tableHtml;
  const tableBody = document.getElementById('mappingsTableBody');
  
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
      addEnhancedMappingRow(tableBody, alchemyField, platformField, alchemyFields, platformFieldsToUse);
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
        addEnhancedMappingRow(tableBody, alchemyField, platformField, alchemyFields, platformFieldsToUse);
        usedAlchemyFields.add(alchemyField.identifier);
      } else {
        // If no match, just add with empty Alchemy field
        addEnhancedMappingRow(tableBody, null, platformField, alchemyFields, platformFieldsToUse);
      }
      
      usedPlatformFields.add(platformField.identifier);
      mappingCount++;
    }
  }
  
  // Add additional empty rows until we have exactly 5
  while (mappingCount < 5) {
    addEnhancedMappingRow(tableBody, null, null, alchemyFields, platformFieldsToUse);
    mappingCount++;
  }
  
  // Set up the add mapping button event handler
  const addMappingBtn = document.getElementById('addMappingBtn');
  if (addMappingBtn) {
    addMappingBtn.addEventListener('click', function() {
      addEnhancedMappingRow(tableBody, null, null, alchemyFields, platformFieldsToUse);
    });
  }
  
  // Add sync options if they're hidden
  const syncOptionsContainer = document.getElementById('syncOptionsContainer');
  if (syncOptionsContainer) {
    // Update sync options UI for better appearance
    syncOptionsContainer.innerHTML = `
      <div class="card shadow-sm">
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
                <option value="alchemy_to_platform">Alchemy to ${platform.charAt(0).toUpperCase() + platform.slice(1)}</option>
                <option value="platform_to_alchemy">${platform.charAt(0).toUpperCase() + platform.slice(1)} to Alchemy</option>
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
  
  console.log('Enhanced field mapping UI populated successfully with 5 fields');
}

// Function to add a mapping row with typeahead functionality (improved layout)
function addEnhancedMappingRow(tableBody, alchemyField = null, platformField = null, alchemyFields, platformFields) {
  if (!tableBody) {
    console.error('Table body element not found');
    return;
  }
  
  const row = document.createElement('tr');
  row.className = 'mapping-row';
  
  // Create Alchemy field cell with typeahead
  const alchemyCell = document.createElement('td');
  alchemyCell.className = 'ps-3';
  const alchemyFieldContainer = document.createElement('div');
  alchemyFieldContainer.className = 'field-typeahead-container';
  
  // Add HTML for improved typeahead
  alchemyFieldContainer.innerHTML = `
    <div class="typeahead-control">
      <input type="text" class="form-control alchemy-search" placeholder="Search Alchemy fields..." autocomplete="off">
      <div class="typeahead-input-group">
        <select class="form-select alchemy-field mapping-select" style="display: none;">
          <option value="">-- Select Alchemy Field --</option>
          ${alchemyFields?.map(field => `<option value="${field.identifier}">${field.name || field.identifier}</option>`).join('') || ''}
        </select>
        <span class="typeahead-selected text-muted">Select Alchemy field...</span>
        <button type="button" class="typeahead-toggle-btn"><i class="fas fa-search"></i></button>
      </div>
      <div class="typeahead-dropdown" style="display: none;">
        <div class="typeahead-dropdown-content">
          <!-- Dropdown options will be populated dynamically -->
        </div>
      </div>
    </div>
  `;
  
  alchemyCell.appendChild(alchemyFieldContainer);
  row.appendChild(alchemyCell);
  
  // Create platform field cell with typeahead
  const platformCell = document.createElement('td');
  const platformFieldContainer = document.createElement('div');
  platformFieldContainer.className = 'field-typeahead-container';
  
  // Add HTML for improved typeahead
  platformFieldContainer.innerHTML = `
    <div class="typeahead-control">
      <input type="text" class="form-control platform-search" placeholder="Search ${IntegrationUtils.capitalize(detectPlatform())} fields..." autocomplete="off">
      <div class="typeahead-input-group">
        <select class="form-select platform-field mapping-select" style="display: none;">
          <option value="">-- Select ${IntegrationUtils.capitalize(detectPlatform())} Field --</option>
          ${platformFields?.map(field => {
            const requiredText = field.required ? ' (Required)' : '';
            const dataRequired = field.required ? 'data-required="true"' : '';
            return `<option value="${field.identifier}" ${dataRequired}>${field.name || field.identifier}${requiredText}</option>`;
          }).join('') || ''}
        </select>
        <span class="typeahead-selected text-muted">Select ${IntegrationUtils.capitalize(detectPlatform())} field...</span>
        <button type="button" class="typeahead-toggle-btn"><i class="fas fa-search"></i></button>
      </div>
      <div class="typeahead-dropdown" style="display: none;">
        <div class="typeahead-dropdown-content">
          <!-- Dropdown options will be populated dynamically -->
        </div>
      </div>
    </div>
  `;
  
  platformCell.appendChild(platformFieldContainer);
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
  deleteBtn.className = 'btn btn-sm btn-outline-danger delete-mapping';
  deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
  deleteBtn.addEventListener('click', function() {
    row.remove();
  });
  
  actionCell.appendChild(deleteBtn);
  row.appendChild(actionCell);
  
  // Add to table
  tableBody.appendChild(row);
  
  // Set up typeahead functionality for Alchemy field
  const alchemySelect = alchemyCell.querySelector('.alchemy-field');
  const alchemySearchInput = alchemyCell.querySelector('.alchemy-search');
  const alchemyDropdown = alchemyCell.querySelector('.typeahead-dropdown');
  const alchemyDropdownContent = alchemyCell.querySelector('.typeahead-dropdown-content');
  const alchemySelected = alchemyCell.querySelector('.typeahead-selected');
  const alchemyToggleBtn = alchemyCell.querySelector('.typeahead-toggle-btn');
  
  // Set initial selected value if provided
  if (alchemyField) {
    alchemySelect.value = alchemyField.identifier;
    alchemySelected.textContent = alchemyField.name || alchemyField.identifier;
    alchemySelected.classList.remove('text-muted');
  }
  
  // Set up typeahead functionality for platform field
  const platformSelect = platformCell.querySelector('.platform-field');
  const platformSearchInput = platformCell.querySelector('.platform-search');
  const platformDropdown = platformCell.querySelector('.typeahead-dropdown');
  const platformDropdownContent = platformCell.querySelector('.typeahead-dropdown-content');
  const platformSelected = platformCell.querySelector('.typeahead-selected');
  const platformToggleBtn = platformCell.querySelector('.typeahead-toggle-btn');
  
  // Set initial selected value if provided
  if (platformField) {
    platformSelect.value = platformField.identifier;
    platformSelected.textContent = platformField.name + (platformField.required ? ' (Required)' : '');
    platformSelected.classList.remove('text-muted');
  }
  
  // Helper function to set up typeahead for a field
  function setupTypeahead(searchInput, select, dropdown, dropdownContent, selectedSpan, toggleBtn, fields) {
    // Toggle dropdown on button click or input group click
    toggleBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
      if (dropdown.style.display === 'block') {
        searchInput.focus();
        populateDropdown('', fields, dropdownContent, select, selectedSpan, dropdown);
      }
    });
    
    // Also open dropdown when clicking the input group
    const inputGroup = toggleBtn.closest('.typeahead-input-group');
    inputGroup.addEventListener('click', function() {
      dropdown.style.display = 'block';
      searchInput.focus();
      populateDropdown('', fields, dropdownContent, select, selectedSpan, dropdown);
    });
    
    // Handle search input
    searchInput.addEventListener('focus', function() {
      dropdown.style.display = 'block';
      populateDropdown(this.value, fields, dropdownContent, select, selectedSpan, dropdown);
    });
    
    searchInput.addEventListener('input', function() {
      populateDropdown(this.value, fields, dropdownContent, select, selectedSpan, dropdown);
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!searchInput.contains(e.target) && !dropdown.contains(e.target) && 
          !toggleBtn.contains(e.target) && !inputGroup.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
    
    // Update dropdown content and handle selection
    function populateDropdown(searchText, fields, dropdownContent, select, selectedSpan, dropdown) {
      dropdownContent.innerHTML = '';
      
      if (!fields || fields.length === 0) {
        dropdownContent.innerHTML = '<div class="typeahead-no-results">No fields available</div>';
        return;
      }
      
      const filteredFields = fields.filter(field => {
        const fieldName = (field.name || field.identifier || '').toLowerCase();
        const fieldId = (field.identifier || '').toLowerCase();
        const searchLower = searchText.toLowerCase();
        
        return fieldName.includes(searchLower) || fieldId.includes(searchLower);
      });
      
      if (filteredFields.length === 0) {
        dropdownContent.innerHTML = '<div class="typeahead-no-results">No fields match your search</div>';
        return;
      }
      
      filteredFields.forEach(field => {
        const item = document.createElement('div');
        item.className = 'typeahead-item';
        const requiredText = field.required ? ' <span class="required-field">*</span>' : '';
        item.innerHTML = (field.name || field.identifier) + requiredText;
        item.dataset.value = field.identifier;
        
        item.addEventListener('click', function() {
          select.value = field.identifier;
          selectedSpan.innerHTML = (field.name || field.identifier) + requiredText;
          selectedSpan.classList.remove('text-muted');
          dropdown.style.display = 'none';
          searchInput.value = '';
          
          // Trigger change event on the select
          const changeEvent = new Event('change', { bubbles: true });
          select.dispatchEvent(changeEvent);
        });
        
        dropdownContent.appendChild(item);
      });
    }
  }
  
  // Set up typeahead for both fields
  setupTypeahead(alchemySearchInput, alchemySelect, alchemyDropdown, alchemyDropdownContent, alchemySelected, alchemyToggleBtn, alchemyFields || []);
  setupTypeahead(platformSearchInput, platformSelect, platformDropdown, platformDropdownContent, platformSelected, platformToggleBtn, platformFields || []);
  
  // Add change handler for platform field to update required checkbox
  platformSelect.addEventListener('change', function() {
    const selectedOption = this.options[this.selectedIndex];
    const isRequired = selectedOption && selectedOption.hasAttribute('data-required');
    
    requiredCheckbox.checked = isRequired;
    requiredCheckbox.disabled = isRequired;
  });
}

// Function to fix Step 3 display issues with enhanced layout
function enhancedFixStep3Display() {
  console.log('Fixing Step 3 display with enhanced layout');
  
  // Make sure field mappings container is visible
  const fieldMappings = document.getElementById('fieldMappings');
  if (fieldMappings) {
    fieldMappings.style.display = 'block';
  }
  
  // If we have Alchemy fields but no mapping table, populate it with enhanced layout
  if (window.alchemyFields && window.alchemyFields.length > 0) {
    const mappingsTableBody = document.getElementById('mappingsTableBody');
    if (!mappingsTableBody || mappingsTableBody.children.length === 0) {
      // Use enhanced layout with exactly 5 fields
      enhancedPopulateFieldMappings(window.alchemyFields, window.platformFields || window.hubspotFields || []);
    }
  }
  
  // Make sure sync options are visible with enhanced styling
  const syncOptionsContainer = document.getElementById('syncOptionsContainer');
  if (syncOptionsContainer) {
    syncOptionsContainer.style.display = 'block';
  }
  
  // Add improved CSS styles
  addEnhancedMappingStyles();
}

// Function to add enhanced styles
function addEnhancedMappingStyles() {
  // Check if styles already exist
  if (document.getElementById('enhanced-mapping-styles')) {
    return;
  }
  
  const styleElement = document.createElement('style');
  styleElement.id = 'enhanced-mapping-styles';
  styleElement.textContent = `
    /* Enhanced mapping container styles */
    .mapping-container {
      border-radius: 8px;
      overflow: hidden;
    }
    
    .mapping-info {
      background-color: #f8f9fa;
      border-left: 4px solid #0047BB;
      padding: 15px;
      border-radius: 4px;
    }
    
    /* Table styling improvements */
    .mapping-table th {
      font-weight: 600;
      padding: 12px 8px;
    }
    
    .mapping-table td {
      padding: 12px 8px;
      vertical-align: middle;
    }
    
    /* Improved typeahead styles */
    .typeahead-input-group {
      height: 38px;
      transition: all 0.2s ease;
    }
    
    .typeahead-input-group:hover {
      border-color: #0047BB;
    }
    
    .typeahead-toggle-btn {
      color: #0047BB;
    }
    
    .typeahead-item {
      transition: all 0.15s ease;
    }
    
    /* Badge styles */
    .badge {
      font-weight: 500;
      padding: 5px 8px;
    }
    
    /* Delete button styling */
    .delete-mapping {
      width: 32px;
      height: 32px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    /* Add field button */
    #addMappingBtn {
      border-style: dashed;
      padding: 8px 20px;
      font-weight: 500;
    }
    
    /* Required field indicator */
    .required-field {
      color: #dc3545;
      font-weight: bold;
    }
  `;
  
  document.head.appendChild(styleElement);
}

// Function to detect platform
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

// Override the existing functions with our enhanced versions
window.populateFieldMappings = enhancedPopulateFieldMappings;
window.fixStep3Display = enhancedFixStep3Display;

// Override getFieldMappings to ensure it works with our enhanced layout
window.getFieldMappings = function() {
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
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('Enhanced field mapping script with improved layout loaded');
  
  // Add the enhanced styles
  addEnhancedMappingStyles();
  
  // Make sure Step 3 uses the enhanced layout
  const originalStepChanged = document.dispatchEvent;
  document.dispatchEvent = function(event) {
    if (event.type === 'stepChanged' && event.detail && event.detail.step === 3) {
      setTimeout(enhancedFixStep3Display, 50);
    }
    return originalStepChanged.apply(this, arguments);
  };
});

console.log("Improved field mapping layout loaded successfully");
