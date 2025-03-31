// This script injects the sidebar into existing pages
document.addEventListener('DOMContentLoaded', function() {
  // Create the sidebar HTML
  const sidebarHTML = `
    <div class="alchemy-sidebar">
      <div class="sidebar-header">
        <img src="/static/Alchemy-logo.svg" alt="Alchemy Cloud" class="sidebar-logo">
        <button class="sidebar-toggle" id="sidebarToggle">
          <i class="fas fa-bars"></i>
        </button>
      </div>
      
      <div class="sidebar-content">
        <nav class="sidebar-nav">
          <a href="/" class="nav-item">
            <i class="fas fa-home"></i>
            <span class="nav-text">Home</span>
          </a>
          
          <!-- Integration Section -->
          <div class="nav-section">
            <div class="section-header">
              <span>Integrations</span>
            </div>
            
            <a href="/" class="nav-item">
              <i class="fas fa-exchange-alt"></i>
              <span class="nav-text">Manage Integrations</span>
            </a>
            
            <a href="/select-platform.html" class="nav-item">
              <i class="fas fa-plug"></i>
              <span class="nav-text">Select Platform</span>
            </a>
          </div>
        </nav>
      </div>
    </div>
  `;
  
  // Create the CSS for the sidebar
  const sidebarCSS = `
    :root {
      --alchemy-blue: #0047BB;
      --alchemy-sidebar-width: 240px;
      --alchemy-sidebar-collapsed-width: 60px;
    }
    
    body {
      padding-left: var(--alchemy-sidebar-width);
      transition: padding-left 0.3s ease;
    }
    
    body.sidebar-collapsed {
      padding-left: var(--alchemy-sidebar-collapsed-width);
    }
    
    .alchemy-sidebar {
      width: var(--alchemy-sidebar-width);
      background-color: var(--alchemy-blue);
      color: white;
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      z-index: 1000;
      transition: width 0.3s ease;
      overflow-x: hidden;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
    
    body.sidebar-collapsed .alchemy-sidebar {
      width: var(--alchemy-sidebar-collapsed-width);
    }
    
    .header, .container {
      width: 100%;
      transition: width 0.3s ease;
    }
    
    /* Sidebar Header */
    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .sidebar-logo {
      height: 30px;
      transition: opacity 0.3s ease;
    }
    
    body.sidebar-collapsed .sidebar-logo {
      opacity: 0;
    }
    
    .sidebar-toggle {
      background: none;
      border: none;
      color: white;
      font-size: 16px;
      cursor: pointer;
      padding: 5px;
      border-radius: 3px;
      transition: background-color 0.2s ease;
    }
    
    .sidebar-toggle:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    /* Sidebar Content */
    .sidebar-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }
    
    /* Navigation Items */
    .sidebar-nav {
      padding: 10px 0;
      flex: 1;
    }
    
    .nav-item {
      display: flex;
      align-items: center;
      padding: 10px 16px;
      color: rgba(255, 255, 255, 0.9);
      text-decoration: none;
      transition: background-color 0.2s ease;
      white-space: nowrap;
      overflow: hidden;
      margin: 2px 5px;
      border-radius: 4px;
    }
    
    .nav-item:hover, .nav-item.active {
      background-color: rgba(255, 255, 255, 0.1);
      color: white;
    }
    
    .nav-item i {
      font-size: 16px;
      min-width: 20px;
      text-align: center;
      margin-right: 12px;
    }
    
    body.sidebar-collapsed .nav-text {
      display: none;
    }
    
    /* Section Styles */
    .nav-section {
      margin-top: 15px;
    }
    
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      font-size: 12px;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.7);
      letter-spacing: 0.5px;
    }
    
    body.sidebar-collapsed .section-header span {
      display: none;
    }
    
    /* Fix for footer */
    .footer {
      position: relative;
      padding: 15px 0;
      width: 100%;
      transition: width 0.3s ease;
    }
    
    @media (max-width: 768px) {
      body {
        padding-left: var(--alchemy-sidebar-collapsed-width);
      }
      
      .alchemy-sidebar {
        width: var(--alchemy-sidebar-collapsed-width);
      }
      
      .sidebar-logo {
        opacity: 0;
      }
      
      .nav-text, 
      .section-header span {
        display: none;
      }
      
      body.sidebar-expanded {
        overflow: hidden;
      }
      
      body.sidebar-expanded .alchemy-sidebar {
        width: var(--alchemy-sidebar-width);
      }
      
      body.sidebar-expanded .sidebar-logo,
      body.sidebar-expanded .nav-text,
      body.sidebar-expanded .section-header span {
        display: block;
      }
      
      body.sidebar-expanded .sidebar-logo {
        opacity: 1;
      }
    }
  `;
  
  // Inject the CSS
  const styleElement = document.createElement('style');
  styleElement.textContent = sidebarCSS;
  document.head.appendChild(styleElement);
  
  // Inject the sidebar
  const sidebarElement = document.createElement('div');
  sidebarElement.innerHTML = sidebarHTML;
  document.body.insertBefore(sidebarElement.firstElementChild, document.body.firstChild);
  
  // Set up toggle functionality
  const sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function() {
      document.body.classList.toggle('sidebar-collapsed');
      
      // On mobile, toggle expanded class
      if (window.innerWidth <= 768) {
        document.body.classList.toggle('sidebar-expanded');
      }
      
      // Save preference
      localStorage.setItem(
        'alchemy-sidebar-collapsed', 
        document.body.classList.contains('sidebar-collapsed')
      );
    });
  }
  
  // Check for saved preference
  const sidebarCollapsed = localStorage.getItem('alchemy-sidebar-collapsed') === 'true';
  if (sidebarCollapsed) {
    document.body.classList.add('sidebar-collapsed');
  }
  
  // Set active menu item
  const currentPath = window.location.pathname;
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    const href = item.getAttribute('href');
    if (href === currentPath || 
        (currentPath.includes(href) && href !== '/')) {
      item.classList.add('active');
    }
  });
});
