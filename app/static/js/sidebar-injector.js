// Improved Alchemy Cloud sidebar injector script
document.addEventListener('DOMContentLoaded', function() {
  // Create the sidebar HTML with structure matching the Alchemy Cloud interface
  const sidebarHTML = `
    <div class="alchemy-sidebar">
      <!-- Alchemy text header -->
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
            <i class="nav-icon home-icon"></i>
            <span class="nav-text">Home</span>
          </a>
          
          <!-- Integration Links -->
          <a href="/" class="nav-item">
            <i class="nav-icon integration-icon"></i>
            <span class="nav-text">Manage Integrations</span>
          </a>
          
          <a href="/select-platform.html" class="nav-item">
            <i class="nav-icon platform-icon"></i>
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
  
  // Create the CSS for the sidebar - refined to match Alchemy Cloud UI
  const sidebarCSS = `
    :root {
      --alchemy-blue: #0047CC;
      --alchemy-darker-blue: #003DAE;
      --alchemy-sidebar-width: 256px;
      --white-opacity-70: rgba(255, 255, 255, 0.7);
      --white-opacity-40: rgba(255, 255, 255, 0.4);
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
      overflow-y: auto;
    }
    
    /* Alchemy text header */
    .sidebar-header {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 25px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .alchemy-text {
      color: white;
      font-size: 30px;
      font-weight: 500;
    }
    
    /* Section title */
    .sidebar-section-title {
      color: white;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 1px;
      padding: 16px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    /* Navigation Items */
    .sidebar-nav {
      padding: 0;
    }
    
    .nav-item {
      display: flex;
      align-items: center;
      padding: 16px 24px;
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
    
    .nav-icon {
      width: 20px;
      height: 20px;
      margin-right: 16px;
      background-color: var(--white-opacity-70);
      mask-size: contain;
      mask-repeat: no-repeat;
      mask-position: center;
      -webkit-mask-size: contain;
      -webkit-mask-repeat: no-repeat;
      -webkit-mask-position: center;
    }
    
    .home-icon {
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 576 512'%3E%3Cpath d='M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40H456c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1H416 392c-22.1 0-40-17.9-40-40V448 384c0-17.7-14.3-32-32-32H256c-17.7 0-32 14.3-32 32v64 24c0 22.1-17.9 40-40 40H160 128.1c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2H104c-22.1 0-40-17.9-40-40V360c0-.9 0-1.9 .1-2.8V287.6H32c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z'/%3E%3C/svg%3E");
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 576 512'%3E%3Cpath d='M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40H456c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1H416 392c-22.1 0-40-17.9-40-40V448 384c0-17.7-14.3-32-32-32H256c-17.7 0-32 14.3-32 32v64 24c0 22.1-17.9 40-40 40H160 128.1c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2H104c-22.1 0-40-17.9-40-40V360c0-.9 0-1.9 .1-2.8V287.6H32c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z'/%3E%3C/svg%3E");
    }
    
    .integration-icon {
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath d='M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192H131.2c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6H344.3c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352H135.3zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6H493.4z'/%3E%3C/svg%3E");
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath d='M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192H131.2c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6H344.3c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352H135.3zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6H493.4z'/%3E%3C/svg%3E");
    }
    
    .platform-icon {
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 384 512'%3E%3Cpath d='M96 0C78.3 0 64 14.3 64 32v96h64V32c0-17.7-14.3-32-32-32zM288 0c-17.7 0-32 14.3-32 32v96h64V32c0-17.7-14.3-32-32-32zM32 160c-17.7 0-32 14.3-32 32s14.3 32 32 32v32c0 77.4 55 142 128 156.8V480c0 17.7 14.3 32 32 32s32-14.3 32-32V412.8C297 398 352 333.4 352 288V224c17.7 0 32-14.3 32-32s-14.3-32-32-32H32z'/%3E%3C/svg%3E");
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 384 512'%3E%3Cpath d='M96 0C78.3 0 64 14.3 64 32v96h64V32c0-17.7-14.3-32-32-32zM288 0c-17.7 0-32 14.3-32 32v96h64V32c0-17.7-14.3-32-32-32zM32 160c-17.7 0-32 14.3-32 32s14.3 32 32 32v32c0 77.4 55 142 128 156.8V480c0 17.7 14.3 32 32 32s32-14.3 32-32V412.8C297 398 352 333.4 352 288V224c17.7 0 32-14.3 32-32s-14.3-32-32-32H32z'/%3E%3C/svg%3E");
    }
    
    /* Collapsible Sections */
    .sidebar-collapsible-section {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .section-header {
      display: flex;
      align-items: center;
      padding: 16px 24px;
      cursor: pointer;
      font-size: 14px;
      color: var(--white-opacity-70);
      font-weight: 500;
    }
    
    .section-icon {
      width: 16px;
      height: 16px;
      margin-right: 16px;
      background-color: var(--white-opacity-70);
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath d='M64 64c0-17.7-14.3-32-32-32S0 46.3 0 64V400c0 44.2 35.8 80 80 80H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H80c-8.8 0-16-7.2-16-16V64zm406.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L320 210.7l-57.4-57.4c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L240 221.3l57.4 57.4c12.5 12.5 32.8 12.5 45.3 0l128-128z'/%3E%3C/svg%3E");
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath d='M64 64c0-17.7-14.3-32-32-32S0 46.3 0 64V400c0 44.2 35.8 80 80 80H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H80c-8.8 0-16-7.2-16-16V64zm406.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L320 210.7l-57.4-57.4c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L240 221.3l57.4 57.4c12.5 12.5 32.8 12.5 45.3 0l128-128z'/%3E%3C/svg%3E");
      mask-size: contain;
      mask-repeat: no-repeat;
      mask-position: center;
      -webkit-mask-size: contain;
      -webkit-mask-repeat: no-repeat;
      -webkit-mask-position: center;
    }
    
    .chevron-down {
      width: 12px;
      height: 12px;
      margin-left: auto;
      background-color: var(--white-opacity-70);
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath d='M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z'/%3E%3C/svg%3E");
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath d='M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z'/%3E%3C/svg%3E");
      mask-size: contain;
      mask-repeat: no-repeat;
      mask-position: center;
      -webkit-mask-size: contain;
      -webkit-mask-repeat: no-repeat;
      -webkit-mask-position: center;
    }
    
    .section-items {
      display: none; /* Initially hidden */
    }
    
    .section-items.active {
      display: block;
    }
    
    .submenu-item {
      padding-left: 56px;
      font-size: 14px;
      color: var(--white-opacity-70);
    }
    
    /* Footer with copyright */
    .sidebar-footer {
      padding: 16px;
      color: var(--white-opacity-40);
      font-size: 12px;
      text-align: center;
      margin-top: auto;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    /* Fix for existing content */
    .header, .container {
      width: calc(100% - var(--alchemy-sidebar-width));
      margin-left: var(--alchemy-sidebar-width);
    }
    
    /* Mobile adjustments */
    @media (max-width: 768px) {
      body {
        padding-left: 0;
      }
      
      .alchemy-sidebar {
        transform: translateX(-100%);
        transition: transform 0.3s ease;
      }
      
      body.sidebar-visible .alchemy-sidebar {
        transform: translateX(0);
      }
      
      .header, .container {
        width: 100%;
        margin-left: 0;
      }
      
      .mobile-sidebar-toggle {
        position: fixed;
        top: 12px;
        left: 12px;
        z-index: 1001;
        background-color: var(--alchemy-blue);
        color: white;
        border: none;
        border-radius: 4px;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
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
  
  // Add basic toggle functionality for sections (just for visual demonstration)
  document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', function() {
      const items = this.nextElementSibling;
      if (items) {
        items.classList.toggle('active');
      }
    });
  });
  
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
