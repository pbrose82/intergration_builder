// Refined Alchemy Cloud sidebar injector script

document.addEventListener('DOMContentLoaded', function () {
  const sidebarHTML = `
    <div class="alchemy-sidebar">
      <div class="sidebar-header">
        <div class="alchemy-text">Alchemy</div>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-section-title">INTEGRATIONS</div>
        <nav class="sidebar-nav">
          <a href="/" class="nav-item">
            <i class="nav-icon home-icon"></i>
            <span class="nav-text">Home</span>
          </a>
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

      <div class="sidebar-section">
        <div class="section-header">
          <i class="section-icon"></i>
          <span class="section-title">Alchemy Support</span>
          <i class="chevron-down"></i>
        </div>
        <div class="section-items">
          <a href="#" class="nav-item submenu-item">Admin Feedback</a>
        </div>
      </div>

      <div class="sidebar-section">
        <div class="section-header">
          <i class="section-icon"></i>
          <span class="section-title">Customer Success</span>
          <i class="chevron-down"></i>
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="copyright">© Alchemy Cloud, Inc. All Rights Reserved.</div>
      </div>
    </div>
  `;

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
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      overflow-y: auto;
    }

    .sidebar-header {
      padding: 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;
    }

    .alchemy-text {
      font-size: 24px;
      font-weight: 600;
    }

    .sidebar-section {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .sidebar-section-title {
      font-size: 12px;
      letter-spacing: 0.08em;
      font-weight: 500;
      padding: 16px 24px 8px;
      text-transform: uppercase;
      color: var(--white-opacity-70);
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
    }

    .nav-item {
      display: flex;
      align-items: center;
      padding: 12px 24px;
      font-size: 15px;
      text-decoration: none;
      color: white;
      transition: background 0.2s ease;
    }

    .nav-item:hover, .nav-item.active {
      background-color: rgba(0, 0, 0, 0.1);
    }

    .nav-icon {
      width: 20px;
      height: 20px;
      margin-right: 12px;
      background-color: var(--white-opacity-70);
      mask-size: contain;
      mask-repeat: no-repeat;
      mask-position: center;
      -webkit-mask-size: contain;
      -webkit-mask-repeat: no-repeat;
      -webkit-mask-position: center;
    }

    .section-header {
      display: flex;
      align-items: center;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 500;
      color: var(--white-opacity-70);
      cursor: pointer;
    }

    .section-title {
      margin-left: 12px;
    }

    .section-items {
      display: none;
      padding-left: 56px;
    }

    .section-items.active {
      display: block;
    }

    .submenu-item {
      font-size: 14px;
      padding: 8px 0;
      color: var(--white-opacity-70);
      display: block;
      text-decoration: none;
    }

    .sidebar-footer {
      padding: 16px;
      font-size: 12px;
      text-align: center;
      margin-top: auto;
      color: var(--white-opacity-40);
    }
  `;

  const styleElement = document.createElement('style');
  styleElement.textContent = sidebarCSS;
  document.head.appendChild(styleElement);

  const sidebarElement = document.createElement('div');
  sidebarElement.innerHTML = sidebarHTML;
  document.body.insertBefore(sidebarElement.firstElementChild, document.body.firstChild);

  document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', function () {
      const items = this.nextElementSibling;
      if (items) items.classList.toggle('active');
    });
  });

  const currentPath = window.location.pathname;
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    const href = item.getAttribute('href');
    if (href === currentPath || (currentPath.includes(href) && href !== '/')) {
      item.classList.add('active');
    }
  });

  if (window.innerWidth <= 768) {
    const toggleButton = document.createElement('button');
    toggleButton.className = 'mobile-sidebar-toggle';
    toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
    document.body.appendChild(toggleButton);

    toggleButton.addEventListener('click', function () {
      document.body.classList.toggle('sidebar-visible');
    });
  }
});
