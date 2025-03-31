// Accurate Alchemy Cloud sidebar injector script
document.addEventListener('DOMContentLoaded', function() {
  // Create the sidebar HTML with correct structure
  const sidebarHTML = `
    <div class="alchemy-sidebar">
      <!-- Logo Section at Top -->
      <div class="sidebar-logo-section">
        <svg class="sidebar-logo" width="150" height="40" viewBox="0 0 120 40">
          <path d="M15.8,9.2c0.2-0.4,0.8-0.4,1,0c0,0,8.6,17.5,10.4,21.6c-3.1-1.6-6.9-2.5-11-2.5c-4,0-7.7,0.9-10.7,2.4C4.2,25.7,15.8,9.2,15.8,9.2" fill="#ffffff"/>
          <path d="M39.1,22.7h-9.6l4.8-10.8L39.1,22.7z M48.7,33.1L35.5,4l-1-1.8h-0.4c-0.3,0-0.8,0.3-1,0.6l-18.8,30.3c-0.2,0.4-0.1,0.7,0,1.1c0.2,0.3,0.5,0.5,0.9,0.5h3c0.6,0,1.1-0.4,1.2-0.8c0.4-1,0.9-1.9,1.3-2.9c0.4-0.9,0.8-1.8,1.2-2.7h13.4l2.5,5.6c0.2,0.5,0.7,0.8,1.2,0.8h3c0.4,0,0.8-0.2,0.9-0.5C48.9,33.8,48.9,33.4,48.7,33.1L48.7,33.1z" fill="#ffffff"/>
        </svg>
        <div class="sidebar-section-title">INTEGRATIONS</div>
      </div>
      
      <!-- Navigation Links -->
      <div class="sidebar-content">
        <nav class="sidebar-nav">
          <!-- Home link -->
          <a href="/" class="nav-item">
            <i class="fas fa-home"></i>
            <span class="nav-text">Home</span>
          </a>
          
          <!-- Integration Links -->
          <a href="/" class="nav-item active">
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
  
  // Create the CSS for the sidebar - with more accurate colors and styling
  const sidebarCSS = `
    :root {
      --alchemy-blue: #0046C3;  /* More accurate blue color */
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
    }
    
    body.sidebar-collapsed .alchemy-sidebar {
      width: var(--alchemy-sidebar-collapsed-width);
    }
    
    .header, .container {
      width: 100%;
      transition: width 0.3s ease;
    }
    
    /* Logo section */
    .sidebar-logo-section {
      padding: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .sidebar-logo {
      margin-bottom: 24px;
    }
    
    .sidebar-section-title {
      color: rgba(255, 255, 255, 0.7);
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 1px;
    }
    
    body.sidebar-collapsed .sidebar-logo-section {
      padding: 16px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    body.sidebar-collapsed .sidebar-logo {
      transform: scale(0.7);
      margin-bottom: 10px;
    }
    
    body.sidebar-collapsed .sidebar-section-title {
      display: none;
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
    }
    
    .nav-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      color: rgba(255, 255, 255, 0.9);
      text-decoration: none;
      transition: background-color 0.2s ease;
      white-space: nowrap;
      overflow: hidden;
      border-left: 3px solid transparent;
    }
    
    .nav-item:hover, .nav-item.active {
      background-color: rgba(255, 255, 255, 0.08);
      color: white;
      border-left: 3px solid white;
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
    
    /* Footer with copyright */
    .sidebar-footer {
      padding: 16px;
      color: rgba(255, 255, 255, 0.7);
      font-size: 12px;
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    
    body.sidebar-collapsed .sidebar-footer {
      padding: 10px 0;
      font-size: 0;  /* Hide text when collapsed */
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
      
      .nav-text, 
      .sidebar-section-title,
      .copyright {
        display: none;
      }
      
      body.sidebar-expanded {
        overflow: hidden;
      }
      
      body.sidebar-expanded .alchemy-sidebar {
        width: var(--alchemy-sidebar-width);
      }
      
      body.sidebar-expanded .nav-text,
      body.sidebar-expanded .sidebar-section-title,
      body.sidebar-expanded .copyright {
        display: block;
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
