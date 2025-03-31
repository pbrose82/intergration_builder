/* 
  Updated Alchemy Cloud Sidebar Injector Script
  - Collapsible sidebar
  - Hamburger on left
  - Lighter "Alchemy Cloud"
  - Copyright at bottom
  - No boxes
  - Only icons on collapse
*/

document.addEventListener('DOMContentLoaded', function () {
  const sidebarHTML = \`
    <div class="alchemy-sidebar expanded">
      <div class="sidebar-header">
        <button class="collapse-btn" aria-label="Collapse Sidebar">
          <span class="arrow-left"></span>
        </button>
        <span class="alchemy-title">Alchemy Cloud</span>
      </div>
      <div class="sidebar-section-title">INTEGRATIONS</div>
      <nav class="sidebar-nav">
        <a href="/" class="nav-item">
          <i class="nav-icon home-icon"></i>
          <span class="nav-text">Home</span>
        </a>
        <a href="/" class="nav-item">
          <span class="nav-text">Manage Integrations</span>
        </a>
        <a href="/select-platform.html" class="nav-item">
          <i class="nav-icon platform-icon"></i>
          <span class="nav-text">Select Platform</span>
        </a>
      </nav>
      <div class="sidebar-footer">
        © Alchemy Cloud, Inc. All Rights Reserved.
      </div>
      <div class="expand-btn hidden" aria-label="Expand Sidebar">
        <span class="arrow-right"></span>
      </div>
    </div>
  \`;

  const sidebarCSS = \`
    :root {
      --sidebar-width: 256px;
      --sidebar-collapsed-width: 60px;
      --alchemy-blue: #0047CC;
    }

    body {
      padding-left: var(--sidebar-width);
      transition: padding-left 0.3s ease;
    }

    .alchemy-sidebar {
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      background-color: var(--alchemy-blue);
      color: white;
      width: var(--sidebar-width);
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      z-index: 1000;
      overflow: hidden;
      transition: width 0.3s ease;
    }

    .alchemy-sidebar.collapsed {
      width: var(--sidebar-collapsed-width);
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      padding: 16px;
      gap: 8px;
    }

    .alchemy-title {
      font-size: 20px;
      font-weight: 400;
    }

    .collapse-btn, .expand-btn {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
    }

    .arrow-left::before {
      content: '\25C0';
    }

    .arrow-right::before {
      content: '\25B6';
    }

    .expand-btn {
      margin: auto 0 16px 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .expand-btn.hidden {
      display: none;
    }

    .sidebar-section-title {
      padding: 12px 16px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 1px;
    }

    .sidebar-nav {
      flex-grow: 1;
    }

    .nav-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      text-decoration: none;
      color: white;
      font-size: 16px;
    }

    .nav-icon {
      width: 20px;
      height: 20px;
      margin-right: 12px;
      background-color: white;
      mask-size: contain;
      mask-repeat: no-repeat;
      mask-position: center;
    }

    .home-icon {
      mask-image: url('data:image/svg+xml;base64,...');
    }

    .platform-icon {
      mask-image: url('data:image/svg+xml;base64,...');
    }

    .sidebar-footer {
      font-size: 12px;
      padding: 12px 16px;
      text-align: center;
      color: white;
      border-top: 1px solid rgba(255,255,255,0.2);
    }

    .alchemy-sidebar.collapsed .nav-text,
    .alchemy-sidebar.collapsed .alchemy-title,
    .alchemy-sidebar.collapsed .sidebar-section-title,
    .alchemy-sidebar.collapsed .sidebar-footer {
      display: none;
    }

    .alchemy-sidebar.collapsed .expand-btn {
      display: flex;
    }

    .alchemy-sidebar.expanded .expand-btn {
      display: none;
    }
  \`;

  const styleEl = document.createElement('style');
  styleEl.textContent = sidebarCSS;
  document.head.appendChild(styleEl);

  const container = document.createElement('div');
  container.innerHTML = sidebarHTML;
  document.body.insertBefore(container.firstElementChild, document.body.firstChild);

  const sidebar = document.querySelector('.alchemy-sidebar');
  const collapseBtn = sidebar.querySelector('.collapse-btn');
  const expandBtn = sidebar.querySelector('.expand-btn');

  collapseBtn.addEventListener('click', () => {
    sidebar.classList.remove('expanded');
    sidebar.classList.add('collapsed');
    document.body.style.paddingLeft = '60px';
  });

  expandBtn.addEventListener('click', () => {
    sidebar.classList.remove('collapsed');
    sidebar.classList.add('expanded');
    document.body.style.paddingLeft = '256px';
  });
});
