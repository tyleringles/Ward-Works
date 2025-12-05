// public/js/main.js

document.addEventListener('DOMContentLoaded', () => {
  const drawer = document.getElementById('ww-nav-drawer');
  const toggle = document.querySelector('.ww-nav-toggle');
  const groupToggles = document.querySelectorAll('.ww-nav-group-toggle');

  if (!drawer || !toggle) {
    return; // nav not present on this page
  }

  // Helper: open/close drawer
  const setDrawerOpen = (open) => {
    if (open) {
      drawer.classList.add('ww-nav-drawer--open');
      drawer.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
    } else {
      drawer.classList.remove('ww-nav-drawer--open');
      drawer.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
    }
  };

  // Toggle drawer when hamburger clicked
  toggle.addEventListener('click', () => {
    const isOpen = drawer.classList.contains('ww-nav-drawer--open');
    setDrawerOpen(!isOpen);
  });

  // Close drawer when a nav link is clicked (nice on mobile)
  drawer.querySelectorAll('a.ww-nav-link, a.ww-nav-link-sub').forEach((link) => {
    link.addEventListener('click', () => {
      setDrawerOpen(false);
    });
  });

  // Toggle submenus (Directory, Church Info)
  groupToggles.forEach((btn) => {
    const targetId = btn.getAttribute('data-target');
    if (!targetId) return;

    const sublist = document.getElementById(targetId);
    if (!sublist) return;

    btn.addEventListener('click', () => {
      const isOpen = sublist.classList.contains('ww-nav-sublist--open');
      if (isOpen) {
        sublist.classList.remove('ww-nav-sublist--open');
        btn.setAttribute('aria-expanded', 'false');
      } else {
        sublist.classList.add('ww-nav-sublist--open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
});
