// Exact Alchemy Cloud sidebar injector script
document.addEventListener('DOMContentLoaded', function() {
  // Create the sidebar HTML with correct structure
  const sidebarHTML = `
    <div class="alchemy-sidebar">
      <!-- Logo Section -->
      <div class="sidebar-logo-container">
        <img src="/static/alchemy-white-logo.svg" alt="Alchemy" class="sidebar-logo" onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MCA1MCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik00MC4yNSwxNS41bDEzLjEsMjguMWMtNC42LTIuMS0xMC4xLTMuMS0xNS42LTMuMWMtNS41LDAtMTAuOSwxLTE1LjUsM0wzNi41LDE1YzAuNC0wLjksMS4zLTEsMS44LTAuMyBDMzkuMiwxNS4yLDM5LjgsMTUuMiw0MC4yNSwxNS41eiIvPjxwYXRoIGQ9Ik00MCwxNi40NWwtMTIuMSwyNmMzLjEtMC43LDYuMy0xLjEsOS43LTEuMWM0LjcsMCw4LjksMC43LDEyLjMsMS43TDQwLDE2LjQ1eiIvPjwvc3ZnPg=='">
      </div>
      
      <!-- INTEGRATIONS Label -->
      <div class="sidebar-section-title">INTEGRATIONS</div>
      
      <!-- Navigation Links -->
      <div class="sidebar-content">
        <nav class="sidebar-nav">
          <!-- Home link -->
          <a href="/" class="nav-item">
            <i class="fas fa-home"></i>
            <span class="nav-text">Home</span>
          </a>
          
          <!-- Integration Links -->
          <a href="/" class="nav-item">
            <i class="fas fa-exchange-alt"></i>
            <span class="nav-text">Manage Integrations</span>
          </a>
          
          <a href="/select-platform.html" class="nav-item">
            <i class="fas fa-plug"></i>
            <span class="nav-text">Select Platform</span>
          </a>
        </nav>
      </div>
      
      <!-- Footer with copyright -->
      <div class="sidebar-footer">
        <div class="copyright">© Alchemy Cloud, Inc. All Rights Reserved.</div>
      </div>
    </div>
  `;
  
  // Create the CSS for the sidebar - exactly matching the screenshot
  const sidebarCSS = `
    :root {
      --alchemy-blue: #0047CC;
      --alchemy-sidebar-width: 240px;
      --alchemy-sidebar-collapsed-width: 60px;
    }
    
    body {
      padding-left: var(--alchemy-sidebar-width);
      transition: padding-left 0.3s ease;
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
      border-right: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .header, .container {
      width: 100%;
    }
    
    /* Logo section */
    .sidebar-logo-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .sidebar-logo {
      width: 60px;
      height: auto;
    }
    
    /* Section title */
    .sidebar-section-title {
      color: rgba(255, 255, 255, 0.7);
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 1px;
      padding: 15px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    
    /* Sidebar Content */
    .sidebar-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    /* Navigation Items */
    .sidebar-nav {
      padding: 0;
    }
    
    .nav-item {
      display: flex;
      align-items: center;
      padding: 15px 20px;
      color: white;
      text-decoration: none;
      transition: background-color 0.2s ease;
      white-space: nowrap;
      font-size: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    
    .nav-item:hover, .nav-item.active {
      background-color: rgba(0, 0, 0, 0.1);
    }
    
    .nav-item i {
      font-size: 18px;
      margin-right: 15px;
      min-width: 24px;
      text-align: center;
    }
    
    /* Footer with copyright */
    .sidebar-footer {
      padding: 15px;
      color: rgba(255, 255, 255, 0.6);
      font-size: 12px;
      text-align: center;
      margin-top: auto;
    }
    
    /* Fix for your existing footer */
    .footer {
      position: relative !important;
      margin-left: var(--alchemy-sidebar-width);
      width: calc(100% - var(--alchemy-sidebar-width));
    }
    
    @media (max-width: 768px) {
      body {
        padding-left: 0;
      }
      
      .alchemy-sidebar {
        width: var(--alchemy-sidebar-width);
        transform: translateX(-100%);
        transition: transform 0.3s ease;
      }
      
      body.sidebar-visible .alchemy-sidebar {
        transform: translateX(0);
      }
      
      .footer {
        margin-left: 0;
        width: 100%;
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
  
  // Set active menu item based on current page
  const currentPath = window.location.pathname;
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    const href = item.getAttribute('href');
    if (href === currentPath || 
        (currentPath.includes(href) && href !== '/')) {
      item.classList.add('active');
    }
  });
  
  // Add mobile toggle button if needed
  if (window.innerWidth <= 768) {
    const toggleButton = document.createElement('button');
    toggleButton.className = 'mobile-sidebar-toggle';
    toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
    document.body.appendChild(toggleButton);
    
    toggleButton.addEventListener('click', function() {
      document.body.classList.toggle('sidebar-visible');
    });
  }
});
