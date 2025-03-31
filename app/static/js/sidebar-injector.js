// Refined Alchemy Cloud sidebar injector script
document.addEventListener('DOMContentLoaded', function() {
  // Create the sidebar HTML with correct structure
  const sidebarHTML = `
    <div class="alchemy-sidebar">
      <!-- Top Alchemy text instead of logo -->
      <div class="sidebar-header">
        <div class="alchemy-text">Alchemy</div>
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
  
  // Create the CSS for the sidebar - refined based on feedback
  const sidebarCSS = `
    :root {
      --alchemy-blue: #0047CC;
      --alchemy-sidebar-width: 240px;
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
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    
    .header, .container {
      width: 100%;
    }
    
    /* Alchemy text header */
    .sidebar-header {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .alchemy-text {
      color: white;
      font-size: 24px;
      font-weight: 500;
    }
    
    /* Section title */
    .sidebar-section-title {
      color: white;
      opacity: 0.8;
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
      color: white;
      font-size: 11px;
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
  
  // Helper function to adjust container positioning
  function adjustMainContent() {
    const container = document.querySelector('.container');
    if (container) {
      container.style.width = 'calc(100% - var(--alchemy-sidebar-width))';
      container.style.marginLeft = 'var(--alchemy-sidebar-width)';
    }
  }
  
  // Execute adjustments
  adjustMainContent();
  
  // Watch for future content changes
  window.addEventListener('resize', adjustMainContent);
});
