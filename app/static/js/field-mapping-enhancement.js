/**
 * Enhanced field mapping script with typeahead search
 * 
 * This script updates the field mapping functionality to:
 * 1. Properly maintain all fields between steps
 * 2. Add typeahead search to field select elements
 */

// Function to populate field mappings with all available fields
function populateFieldMappings(alchemyFields, platformFields) {
  console.log('Populating field mappings with Alchemy fields:', alchemyFields?.length || 0);
  console.log('Platform fields:', platformFields?.length || 0);
  
  // Get the container for field mappings
  const mappingContainer = document.getElementById('fieldMappings');
  if (!mappingContainer) {
    console.error('Field mapping container not found');
    return;
  }
  
  // Clear existing content
  mappingContainer.innerHTML = '';
  
  // Add header with improved styling
  const headerHtml = `
    <div class="mapping-info">
      <i class="fas fa-info-circle me-2"></i>
      Map fields between Alchemy and the selected platform
      <small class="d-block mt-2">${alchemyFields?.length || 0} Alchemy fields and ${platformFields?.length || 0} platform fields available. Use the search box to quickly find fields.</small>
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
        {identifier: 'opportunity', name: 'Opportunity'},
        {identifier: 'contact', name: 'Contact'},
        {identifier: 'email', name: 'Email'},
        {identifier: 'phone', name: 'Phone'}
      ];
    } else if (platform === 'sap') {
      platformFieldsToUse = [
        {identifier: 'material', name: 'Material'},
        {identifier: 'vendor', name: 'Vendor'},
        {identifier: 'purchase_order', name: 'Purchase Order'},
        {identifier: 'delivery', name: 'Delivery'},
        {identifier: 'invoice', name: 'Invoice'},
        {identifier: 'customer', name: 'Customer'}
      ];
    }
    
    console.log(`Using default ${platform} fields:`, platformFieldsToUse);
  }
  
  // Store platform fields globally for later use
  window.platformFields = platformFieldsToUse;
  
  // Create table for mappings with improved styling
  const tableHtml = `
    <div class="mapping-container">
      <table class="mapping-table">
        <thead>
          <tr>
            <th>Alchemy Field</th>
            <th>${IntegrationUtils.capitalize(platform)} Field</th>
            <th width="100" class="text-center">Required</th>
            <th width="80" class="text-center">Actions</th>
          </tr>
        </thead>
        <tbody id="mappingsTableBody">
          <!-- Mapping rows will be added here -->
        </tbody>
      </table>
      
      <button type="button" id="addMappingBtn" class="add-mapping-btn mt-3">
        <i class="fas fa-plus me-2"></i>Add Field Mapping
      </button>
    </div>
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
      addMappingRowWithTypeahead(tableBody, alchemyField, platformField, alchemyFields, platformFieldsToUse);
      usedAlchemyFields.add(alchemyField.identifier);
      usedPlatformFields.add(platformField.identifier);
      mappingCount++;
    }
  });
  
  // Add required fields from platform if not already mapped
  platformFieldsToUse.forEach(platformField => {
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
        addMappingRowWithTypeahead(tableBody, alchemyField, platformField, alchemyFields, platformFieldsToUse);
        usedAlchemyFields.add(alchemyField.identifier);
      } else {
        // If no match, just add with empty Alchemy field
        addMappingRowWithTypeahead(tableBody, null, platformField, alchemyFields, platformFieldsToUse);
      }
      
      usedPlatformFields.add(platformField.identifier);
      mappingCount++;
    }
  });
  
  // Ensure we have at least 3 rows
  while (mappingCount < 3) {
    addMappingRowWithTypeahead(tableBody, null, null, alchemyFields, platformFieldsToUse);
    mappingCount++;
  }
  
  // Set up the add mapping button event handler
  const addMappingBtn = document.getElementById('addMappingBtn');
  if (addMappingBtn) {
    addMappingBtn.addEventListener('click', function() {
      addMappingRowWithTypeahead(tableBody, null, null, alchemyFields, platformFieldsToUse);
    });
  }
  
  // Add sync options if they're hidden
  const syncOptionsContainer = document.getElementById('syncOptionsContainer');
  if (syncOptionsContainer && syncOptionsContainer.style.display === 'none') {
    syncOptionsContainer.style.display = 'block';
  }
  
  console.log('Field mapping UI populated successfully');
}

// Function to add a mapping row with typeahead functionality
function addMappingRowWithTypeahead(tableBody, alchemyField = null, platformField = null, alchemyFields, platformFields) {
  if (!tableBody) {
    console.error('Table body element not found');
    return;
  }
  
  const row = document.createElement('tr');
  row.className = 'mapping-row';
  
  // Create Alchemy field cell with typeahead
  const alchemyCell = document.createElement('td');
  const alchemyFieldContainer = document.createElement('div');
  alchemyFieldContainer.className = 'field-typeahead-container';
  
  // Add HTML for typeahead
  alchemyFieldContainer.innerHTML = `
    <div class="typeahead-control">
      <input type="text" class="form-control alchemy-search" placeholder="Search Alchemy fields..." autocomplete="off">
      <div class="typeahead-input-group">
        <select class="form-select alchemy-field mapping-select" style="display: none;">
          <option value="">-- Select Alchemy Field --</option>
          ${alchemyFields?.map(field => `<option value="${field.identifier}">${field.name || field.identifier}</option>`).join('') || ''}
        </select>
        <span class="typeahead-selected"></span>
        <button type="button" class="typeahead-toggle-btn"><i class="fas fa-chevron-down"></i></button>
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
  
  // Add HTML for typeahead
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
        <span class="typeahead-selected"></span>
        <button type="button" class="typeahead-toggle-btn"><i class="fas fa-chevron-down"></i></button>
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
  }
  
  // Helper function to set up typeahead for a field
  function setupTypeahead(searchInput, select, dropdown, dropdownContent, selectedSpan, toggleBtn, fields) {
    // Toggle dropdown on button click
    toggleBtn.addEventListener('click', function() {
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
      if (dropdown.style.display === 'block') {
        searchInput.focus();
        populateDropdown('', fields, dropdownContent, select, selectedSpan, dropdown);
      }
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
      if (!searchInput.contains(e.target) && !dropdown.contains(e.target) && !toggleBtn.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
    
    // Update dropdown content and handle selection
    function populateDropdown(searchText, fields, dropdownContent, select, selectedSpan, dropdown) {
      dropdownContent.innerHTML = '';
      
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
        const requiredText = field.required ? ' (Required)' : '';
        item.textContent = field.name || field.identifier + requiredText;
        item.dataset.value = field.identifier;
        
        item.addEventListener('click', function() {
          select.value = field.identifier;
          selectedSpan.textContent = field.name || field.identifier + requiredText;
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
      // Very important: Make sure we use ALL fields
      populateFieldMappings(window.alchemyFields, window.platformFields || window.hubspotFields || []);
    }
  }
  
  // Make sure sync options are visible
  const syncOptionsContainer = document.getElementById('syncOptionsContainer');
  if (syncOptionsContainer) {
    syncOptionsContainer.style.display = 'block';
  }
  
  // Add CSS for typeahead
  addTypeaheadStyles();
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

// Function to add typeahead styles to the document
function addTypeaheadStyles() {
  // Check if styles already exist
  if (document.getElementById('typeahead-styles')) {
    return;
  }
  
  const styleElement = document.createElement('style');
  styleElement.id = 'typeahead-styles';
  styleElement.textContent = `
    .field-typeahead-container {
      position: relative;
      width: 100%;
    }
    
    .typeahead-control {
      position: relative;
      width: 100%;
    }
    
    .typeahead-input-group {
      display: flex;
      width: 100%;
      align-items: center;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      padding: 8px 12px;
      background-color: white;
    }
    
    .typeahead-selected {
      flex-grow: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .typeahead-toggle-btn {
      background: none;
      border: none;
      color: #6c757d;
      padding: 0 0 0 8px;
      cursor: pointer;
    }
    
    .typeahead-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      width: 100%;
      max-height: 300px;
      overflow-y: auto;
      background-color: white;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      z-index: 1000;
      margin-top: 4px;
    }
    
    .typeahead-dropdown-content {
      padding: 4px 0;
    }
    
    .typeahead-item {
      padding: 8px 12px;
      cursor: pointer;
    }
    
    .typeahead-item:hover {
      background-color: #e9ecef;
    }
    
    .typeahead-no-results {
      padding: 8px 12px;
      color: #6c757d;
      font-style: italic;
    }
    
    .platform-search, .alchemy-search {
      display: block;
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      margin-bottom: 5px;
    }
  `;
  
  document.head.appendChild(styleElement);
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

// Override the existing functions with our enhanced versions
window.populateFieldMappings = populateFieldMappings;
window.fixStep3Display = fixStep3Display;
window.getFieldMappings = getFieldMappings;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('Enhanced field mapping script with typeahead loaded');
  
  // Add the typeahead styles
  addTypeaheadStyles();
  
  // Attach to saveBtn click to use our save function
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', window.saveIntegration || function(){
      console.error('saveIntegration function not found');
    });
  }
  
  // Override step3 initialization if needed
  const originalStepChanged = document.dispatchEvent;
  document.dispatchEvent = function(event) {
    if (event.type === 'stepChanged' && event.detail && event.detail.step === 3) {
      setTimeout(fixStep3Display, 50); // Ensure our improved version runs
    }
    return originalStepChanged.apply(this, arguments);
  };
});

// Fix for integration_routes.py
console.log("Field mapping enhancement loaded successfully");
