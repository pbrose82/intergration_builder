document.addEventListener('DOMContentLoaded', function() {
  // Sidebar HTML
  const sidebarHTML = `
    <div class="alchemy-sidebar">
      <div class="sidebar-header">
        <button class="collapse-button" aria-label="Collapse sidebar"></button>
        <div class="alchemy-text">Alchemy Cloud</div>
      </div>

      <div class="sidebar-section-title">INTEGRATIONS</div>
      <div class="sidebar-content">
        <nav class="sidebar-nav">
          <a href="/" class="nav-item">
            <i class="nav-icon home-icon"></i>
            <span class="nav-text">Home</span>
          </a>
          <a href="/select-platform.html" class="nav-item">
            <i class="nav-icon platform-icon"></i>
            <span class="nav-text">Select Platform</span>
          </a>
        </nav>
      </div>

      <div class="sidebar-footer">
        © Alchemy Cloud, Inc.
      </div>
    </div>

    <button class="expand-button" aria-label="Expand sidebar"></button>
  `;

  // Sidebar CSS
  const sidebarCSS = `
    :root {
      --alchemy-blue: #0047CC;
      --sidebar-width: 256px;
    }

    body {
      padding-left: var(--sidebar-width);
      transition: padding-left 0.3s ease;
    }

    body.sidebar-collapsed {
      padding-left: 0;
    }

    .alchemy-sidebar {
      width: var(--sidebar-width);
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
      align-items: center;
      padding: 16px;
      gap: 12px;
    }

    .alchemy-text {
      font-size: 20px;
      font-weight: 400;
    }

    .collapse-button,
    .expand-button {
      background-color: white;
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 448 512'%3E%3Cpath d='M224 256L0 32V480L224 256zM448 256L224 480V32L448 256z'/%3E%3C/svg%3E");
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 448 512'%3E%3Cpath d='M224 256L0 32V480L224 256zM448 256L224 480V32L448 256z'/%3E%3C/svg%3E");
      mask-size: contain;
      -webkit-mask-size: contain;
      mask-repeat: no-repeat;
      -webkit-mask-repeat: no-repeat;
      mask-position: center;
      -webkit-mask-position: center;
      width: 20px;
      height: 20px;
      border: none;
      cursor: pointer;
    }

    .expand-button {
      display: none;
      position: fixed;
      top: 16px;
      left: 16px;
      z-index: 1001;
      transform: rotate(180deg);
    }

    body.sidebar-collapsed .expand-button {
      display: block;
    }

    .sidebar-section-title {
      padding: 12px 16px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 1px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      color: white;
      text-decoration: none;
      font-size: 15px;
    }

    .nav-item:hover, .nav-item.active {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .nav-icon {
      width: 16px;
      height: 16px;
      margin-right: 12px;
      background-color: white;
      mask-size: contain;
      -webkit-mask-size: contain;
      mask-repeat: no-repeat;
      -webkit-mask-repeat: no-repeat;
      mask-position: center;
      -webkit-mask-position: center;
    }

    .home-icon {
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 576 512'%3E%3Cpath d='M280.4 148.3L96 300.1V464a16 16 0 0016 16l112-.3a16 16 0 0016-15.7V368a16 16 0 0116-16h64a16 16 0 0116 16v96a16 16 0 0016 16l112 .3a16 16 0 0016-16V300L295.7 148.3a12.19 12.19 0 00-15.3 0zM571.6 251.5L488 182.6V44a12 12 0 00-12-12h-60a12 12 0 00-12 12v72.6L318.5 43a48 48 0 00-61 0L4.34 251.5a12 12 0 00-1.6 17l25.5 31.3a12 12 0 0017 1.6L64 271.9V464a48 48 0 0048 48h112a48 48 0 0048-48v-96h64v96a48 48 0 0048 48h112a48 48 0 0048-48V271.9l18.7 29.4a12 12 0 0017-1.6l25.5-31.3a12 12 0 00-1.6-17z'/%3E%3C/svg%3E");
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 576 512'%3E%3Cpath d='M280.4 148.3L96 300.1V464a16 16 0 0016 16l112-.3a16 16 0 0016-15.7V368a16 16 0 0116-16h64a16 16 0 0116 16v96a16 16 0 0016 16l112 .3a16 16 0 0016-16V300L295.7 148.3a12.19 12.19 0 00-15.3 0zM571.6 251.5L488 182.6V44a12 12 0 00-12-12h-60a12 12 0 00-12 12v72.6L318.5 43a48 48 0 00-61 0L4.34 251.5a12 12 0 00-1.6 17l25.5 31.3a12 12 0 0017 1.6L64 271.9V464a48 48 0 0048 48h112a48 48 0 0048-48v-96h64v96a48 48 0 0048 48h112a48 48 0 0048-48V271.9l18.7 29.4a12 12 0 0017-1.6l25.5-31.3a12 12 0 00-1.6-17z'/%3E%3C/svg%3E");
    }

    .platform-icon {
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 384 512'%3E%3Cpath d='M96 0C78.3 0 64 14.3 64 32v96h64V32c0-17.7-14.3-32-32-32zM288 0c-17.7 0-32 14.3-32 32v96h64V32c0-17.7-14.3-32-32-32zM32 160c-17.7 0-32 14.3-32 32s14.3 32 32 32v32c0 77.4 55 142 128 156.8V480c0 17.7 14.3 32 32 32s32-14.3 32-32V412.8C297 398 352 333.4 352 288V224c17.7 0 32-14.3 32-32s-14.3-32-32-32H32z'/%3E%3C/svg%3E");
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 384 512'%3E%3Cpath d='M96 0C78.3 0 64 14.3 64 32v96h64V32c0-17.7-14.3-32-32-32zM288 0c-17.7 0-32 14.3-32 32v96h64V32c0-17.7-14.3-32-32-32zM32 160c-17.7 0-32 14.3-32 32s14.3 32 32 32v32c0 77.4 55 142 128 156.8V480c0 17.7 14.3 32 32 32s32-14.3 32-32V412.8C297 398 352 333.4 352 288V224c17.7 0 32-14.3 32-32s-14.3-32-32-32H32z'/%3E%3C/svg%3E");
    }

    .sidebar-footer {
      padding: 16px;
      font-size: 12px;
      text-align: center;
      margin-top: auto;
      color: white;
    }
  `;

  // Inject CSS
  const styleEl = document.createElement('style');
  styleEl.textContent = sidebarCSS;
  document.head.appendChild(styleEl);

  // Inject Sidebar
  const container = document.createElement('div');
  container.innerHTML = sidebarHTML;
  document.body.insertBefore(container, document.body.firstChild);

  // Collapse and expand functionality
  const collapseBtn = document.querySelector('.collapse-button');
  const expandBtn = document.querySelector('.expand-button');
  const sidebar = document.querySelector('.alchemy-sidebar');

  collapseBtn.addEventListener('click', () => {
    sidebar.classList.add('collapsed');
    document.body.classList.add('sidebar-collapsed');
  });

  expandBtn.addEventListener('click', () => {
    sidebar.classList.remove('collapsed');
    document.body.classList.remove('sidebar-collapsed');
  });

  // Highlight active nav
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-item').forEach(item => {
    const href = item.getAttribute('href');
    if (href === currentPath || (currentPath !== '/' && currentPath.includes(href))) {
      item.classList.add('active');
    }
  });
});
