// Improved Alchemy Cloud sidebar injector script
// Includes collapsing sidebar, simplified design, and brand-aligned style

document.addEventListener('DOMContentLoaded', function() {
  // Sidebar HTML
  const sidebarHTML = `
    <div class="alchemy-sidebar">
      <div class="sidebar-header">
        <div class="alchemy-text">Alchemy Cloud</div>
        <button class="collapse-button" aria-label="Collapse sidebar"></button>
      </div>

      <div class="sidebar-section-title">INTEGRATIONS</div>
      <div class="sidebar-content">
        <nav class="sidebar-nav">
          <a href="/" class="nav-item">
            <span class="nav-text">Home</span>
          </a>
          <a href="/" class="nav-item">
            <span class="nav-text">Manage Integrations</span>
          </a>
          <a href="/select-platform.html" class="nav-item">
            <span class="nav-text">Select Platform</span>
          </a>
        </nav>
      </div>

      <div class="sidebar-collapsible-section">
        <div class="section-header">
          <i class="section-icon"></i>
          <span>Alchemy Cloud</span>
          <i class="chevron-down"></i>
        </div>
      </div>
    </div>
  `;

  // Sidebar CSS
  const sidebarCSS = `
    :root {
      --alchemy-blue: #0047CC;
      --alchemy-sidebar-width: 256px;
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
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      overflow-y: auto;
      transition: transform 0.3s ease;
    }

    .alchemy-sidebar.collapsed {
      transform: translateX(-100%);
    }

    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
    }

    .alchemy-text {
      color: white;
      font-size: 24px;
      font-weight: 400;
    }

    .collapse-button {
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      width: 24px;
      height: 24px;
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath d='M64 64h384v32H64zm0 160h384v32H64zm0 160h384v32H64z'/%3E%3C/svg%3E");
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath d='M64 64h384v32H64zm0 160h384v32H64zm0 160h384v32H64z'/%3E%3C/svg%3E");
      background-color: white;
      mask-size: contain;
      -webkit-mask-size: contain;
      mask-repeat: no-repeat;
      -webkit-mask-repeat: no-repeat;
      mask-position: center;
      -webkit-mask-position: center;
    }

    .sidebar-section-title {
      color: white;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 1px;
      padding: 12px 16px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      color: white;
      text-decoration: none;
      font-size: 16px;
    }

    .nav-item:hover, .nav-item.active {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .nav-icon {
      display: none;
    }

    .section-header {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      font-size: 14px;
      color: white;
      font-weight: 400;
      cursor: pointer;
    }

    .section-icon {
      width: 16px;
      height: 16px;
      margin-right: 12px;
      background-color: white;
    }

    .chevron-down {
      width: 12px;
      height: 12px;
      margin-left: auto;
      background-color: white;
    }
  `;

  // Inject CSS
  const styleElement = document.createElement('style');
  styleElement.textContent = sidebarCSS;
  document.head.appendChild(styleElement);

  // Inject sidebar
  const sidebarElement = document.createElement('div');
  sidebarElement.innerHTML = sidebarHTML;
  document.body.insertBefore(sidebarElement.firstElementChild, document.body.firstChild);

  // Collapsible section functionality (basic)
  document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', function() {
      const items = this.nextElementSibling;
      if (items) items.classList.toggle('active');
    });
  });

  // Highlight current nav item
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-item').forEach(item => {
    const href = item.getAttribute('href');
    if (href === currentPath || (currentPath.includes(href) && href !== '/')) {
      item.classList.add('active');
    }
  });

  // Collapsing the entire sidebar
  const collapseBtn = document.querySelector('.collapse-button');
  collapseBtn.addEventListener('click', function() {
    document.querySelector('.alchemy-sidebar').classList.toggle('collapsed');
    document.body.classList.toggle('sidebar-collapsed');
  });
});
