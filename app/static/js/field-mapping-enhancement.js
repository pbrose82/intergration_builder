/**
 * Enhanced field mapping layout with better spacing and organization
 * This script improves the field mapping UI with a cleaner layout and properly aligned columns
 */

// Modify populateFieldMappings function to improve layout and fix column alignment
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
  
  // Create improved table for mappings with fixed column layout
  const tableHtml = `
    <div class="mapping-container card shadow-sm mb-4">
      <div class="card-body p-0">
        <table class="mapping-table table table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th class="ps-3" style="width: 40%">Alchemy Field</th>
              <th style="width: 40%">${IntegrationUtils.capitalize(platform)} Field</th>
              <th style="width: 10%" class="text-center">Required</th>
              <th style="width: 10%" class="text-center">Actions</th>
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

// Improved function to add a mapping row with dropdown selector instead of always-visible search
function addEnhancedMappingRow(tableBody, alchemyField = null, platformField = null, alchemyFields, platformFields) {
  if (!tableBody) {
    console.error('Table body element not found');
    return;
  }
  
  const row = document.createElement('tr');
  row.className = 'mapping-row';
  
  // Create Alchemy field cell with improved selector
  const alchemyCell = document.createElement('td');
  alchemyCell.className = 'ps-3';
  
  const alchemyFieldSelector = document.createElement('div');
  alchemyFieldSelector.className = 'dropdown-select alchemy-field-selector';
  alchemyFieldSelector.innerHTML = `
    <div class="selected-item form-control d-flex justify-content-between align-items-center">
      <span class="selected-text">${alchemyField ? (alchemyField.name || alchemyField.identifier) : 'Select Alchemy field...'}</span>
      <i class="fas fa-chevron-down"></i>
    </div>
    <input type="hidden" class="alchemy-field mapping-select" value="${alchemyField ? alchemyField.identifier : ''}">
    <div class="dropdown-menu" style="display:none;">
      <div class="dropdown-search p-2">
        <input type="text" class="form-control form-control-sm" placeholder="Search Alchemy fields...">
      </div>
      <div class="dropdown-items">
        <div class="dropdown-item" data-value="">-- Select Alchemy Field --</div>
        ${alchemyFields?.map(field => 
          `<div class="dropdown-item" data-value="${field.identifier}">${field.name || field.identifier}</div>`
        ).join('') || ''}
      </div>
    </div>
  `;
  
  alchemyCell.appendChild(alchemyFieldSelector);
  row.appendChild(alchemyCell);
  
  // Create platform field cell with improved selector
  const platformCell = document.createElement('td');
  
  const platformFieldSelector = document.createElement('div');
  platformFieldSelector.className = 'dropdown-select platform-field-selector';
  platformFieldSelector.innerHTML = `
    <div class="selected-item form-control d-flex justify-content-between align-items-center">
      <span class="selected-text">${platformField ? (platformField.name || platformField.identifier) : 'Select Platform field...'}</span>
      <i class="fas fa-chevron-down"></i>
    </div>
    <input type="hidden" class="platform-field mapping-select" value="${platformField ? platformField.identifier : ''}">
    <div class="dropdown-menu" style="display:none;">
      <div class="dropdown-search p-2">
        <input type="text" class="form-control form-control-sm" placeholder="Search Platform fields...">
      </div>
      <div class="dropdown-items">
        <div class="dropdown-item" data-value="">-- Select Platform Field --</div>
        ${platformFields?.map(field => {
          const requiredIcon = field.required ? ' <span class="required-icon text-danger">*</span>' : '';
          return `<div class="dropdown-item ${field.required ? 'required-field' : ''}" data-value="${field.identifier}" data-required="${field.required ? 'true' : 'false'}">${field.name || field.identifier}${requiredIcon}</div>`;
        }).join('') || ''}
      </div>
    </div>
  `;
  
  platformCell.appendChild(platformFieldSelector);
  row.appendChild(platformCell);
  
  // Create required cell with checkbox - centered in cell
  const requiredCell = document.createElement('td');
  requiredCell.className = 'text-center align-middle';
  
  const requiredWrapper = document.createElement('div');
  requiredWrapper.className = 'd-flex justify-content-center';
  
  const requiredCheckbox = document.createElement('input');
  requiredCheckbox.type = 'checkbox';
  requiredCheckbox.className = 'form-check-input required-checkbox';
  requiredCheckbox.checked = platformField && platformField.required;
  requiredCheckbox.disabled = platformField && platformField.required;
  
  requiredWrapper.appendChild(requiredCheckbox);
  requiredCell.appendChild(requiredWrapper);
  row.appendChild(requiredCell);
  
  // Create action cell with delete button - centered
  const actionCell = document.createElement('td');
  actionCell.className = 'text-center align-middle';
  
  const deleteWrapper = document.createElement('div');
  deleteWrapper.className = 'd-flex justify-content-center';
  
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-sm btn-outline-danger delete-mapping';
  deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
  deleteBtn.addEventListener('click', function() {
    row.remove();
  });
  
  deleteWrapper.appendChild(deleteBtn);
  actionCell.appendChild(deleteWrapper);
  row.appendChild(actionCell);
  
  // Add to table
  tableBody.appendChild(row);
  
  // Set up dropdown functionality
  setupDropdownSelect(alchemyFieldSelector, alchemyFields);
  setupDropdownSelect(platformFieldSelector, platformFields, function(selectedValue, isRequired) {
    requiredCheckbox.checked = isRequired === 'true';
    requiredCheckbox.disabled = isRequired === 'true';
  });
}

// Function to set up dropdown select behavior
function setupDropdownSelect(container, fieldsList, onSelectCallback) {
  if (!container) return;
  
  const selectedItem = container.querySelector('.selected-item');
  const selectedText = container.querySelector('.selected-text');
  const hiddenInput = container.querySelector('input[type="hidden"]');
  const dropdownMenu = container.querySelector('.dropdown-menu');
  const searchInput = container.querySelector('.dropdown-search input');
  const dropdownItems = container.querySelector('.dropdown-items');
  
  // Toggle dropdown when clicking the selected item
  selectedItem.addEventListener('click', function(e) {
    e.stopPropagation();
    
    // Close all other open dropdowns
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      if (menu !== dropdownMenu) {
        menu.style.display = 'none';
      }
    });
    
    // Toggle this dropdown
    if (dropdownMenu.style.display === 'none') {
      dropdownMenu.style.display = 'block';
      if (searchInput) {
        searchInput.focus();
        searchInput.value = '';
        filterDropdownItems('', dropdownItems);
      }
    } else {
      dropdownMenu.style.display = 'none';
    }
  });
  
  // Set up search filtering
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      filterDropdownItems(this.value, dropdownItems);
    });
    
    // Prevent clicks in search from closing dropdown
    searchInput.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  }
  
  // Handle item selection
  const items = container.querySelectorAll('.dropdown-item');
  items.forEach(item => {
    item.addEventListener('click', function(e) {
      e.stopPropagation();
      
      const value = this.getAttribute('data-value');
      const isRequired = this.getAttribute('data-required');
      const text = this.innerText;
      
      selectedText.textContent = value ? text : 'Select field...';
      hiddenInput.value = value;
      
      // Update UI
      if (value) {
        selectedItem.classList.add('has-value');
      } else {
        selectedItem.classList.remove('has-value');
      }
      
      // Close dropdown
      dropdownMenu.style.display = 'none';
      
      // Call callback if provided
      if (typeof onSelectCallback === 'function') {
        onSelectCallback(value, isRequired);
      }
    });
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function() {
    dropdownMenu.style.display = 'none';
  });
}

// Filter dropdown items based on search text
function filterDropdownItems(searchText, container) {
  if (!container) return;
  
  const items = container.querySelectorAll('.dropdown-item');
  const lowercaseSearch = searchText.toLowerCase();
  
  items.forEach(item => {
    const text = item.textContent.toLowerCase();
    
    if (item.getAttribute('data-value') === '' || text.includes(lowercaseSearch)) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
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
    
    /* Dropdown Select styling */
    .dropdown-select {
      position: relative;
    }
    
    .selected-item {
      cursor: pointer;
      user-select: none;
      transition: all 0.2s ease;
    }
    
    .selected-item:hover {
      border-color: #0047BB;
    }
    
    .selected-item.has-value {
      background-color: #f8f9fa;
    }
    
    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      width: 100%;
      z-index: 1000;
      background-color: white;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      max-height: 300px;
      overflow-y: auto;
    }
    
    .dropdown-search {
      border-bottom: 1px solid #eee;
    }
    
    .dropdown-items {
      max-height: 250px;
      overflow-y: auto;
    }
    
    .dropdown-item {
      padding: 8px 12px;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    
    .dropdown-item:hover {
      background-color: #e9ecef;
    }
    
    .dropdown-item.required-field {
      font-weight: 500;
    }
    
    .required-icon {
      font-weight: bold;
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
    const alchemyInput = row.querySelector('.alchemy-field');
    const platformInput = row.querySelector('.platform-field');
    const requiredCheckbox = row.querySelector('input[type="checkbox"]');
    
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
