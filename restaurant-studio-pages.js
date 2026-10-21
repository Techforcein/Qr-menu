
/* PageForge Restaurant Studio - Navigation V5 */
(() => {
  'use strict';

  const PAGES = [
    'restaurants',
    'settings',
    'design',
    'categories',
    'products',
    'qr'
  ];

  const $ = id => document.getElementById(id);

  let currentPage = 'restaurants';

  function navigate(page, updateHash = true) {
    if (!PAGES.includes(page)) page = 'restaurants';

    const studio = $('studio');
    const editor = $('editor');

    if (!studio) return;

    currentPage = page;

    // Keep editor visible when showing its screens.
    // Individual screens are hidden separately.
    if (editor) {
      editor.hidden = page === 'restaurants';
      editor.style.display =
        page === 'restaurants' ? 'none' : 'block';
    }

    document.querySelectorAll(
      '.studio-screen[data-page]'
    ).forEach(section => {
      const active = section.dataset.page === page;

      section.hidden = !active;
      section.style.display = active ? 'block' : 'none';
    });

    document.querySelectorAll(
      '.studio-nav [data-screen]'
    ).forEach(button => {
      const active = button.dataset.screen === page;

      button.classList.toggle('active', active);

      if (active) {
        button.setAttribute('aria-current', 'page');
      } else {
        button.removeAttribute('aria-current');
      }
    });

    if (updateHash) {
      history.replaceState(null, '', '#' + page);
    }

    window.scrollTo(0, 0);
  }

  // Make navigation accessible to restaurant-builder.js
  window.pfNavigate = navigate;

  function setup() {
    // Use one delegated click listener for all navigation.
    document.addEventListener('click', event => {
      const button = event.target.closest('button');

      if (!button) return;

      const targetPage =
        button.dataset.screen || button.dataset.go;

      if (targetPage) {
        navigate(targetPage);
        return;
      }

      // Existing Manage buttons are generated dynamically.
      const list = $('restaurants');

      if (
        list &&
        list.contains(button) &&
        button.textContent.trim() === 'Manage'
      ) {
        // The existing button handler selects the restaurant.
        // Navigate after the click handler has started.
        navigate('settings');
        return;
      }

      if (button.id === 'newRestaurant') {
        navigate('settings');
      }
    });

    // Reuse the original save handler.
    $('saveDesignShortcut')?.addEventListener(
      'click',
      () => $('saveRestaurant')?.click()
    );

    // Support navigation using browser history.
    window.addEventListener('hashchange', () => {
      navigate(location.hash.substring(1), false);
    });

    // Start on restaurant list, unless a valid screen
    // was requested in the URL.
    const requested = location.hash.substring(1);

    navigate(
      PAGES.includes(requested) ? requested : 'restaurants',
      false
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
