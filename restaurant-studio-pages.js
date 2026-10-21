
/* PageForge Restaurant Studio V3 Navigation Fix */
(() => {
  const pages = [
    'restaurants',
    'settings',
    'design',
    'categories',
    'products',
    'qr'
  ];

  const $ = id => document.getElementById(id);

  function navigate(page) {
    if (!pages.includes(page)) page = 'restaurants';

    const editor = $('editor');

    // Make the editor visible before opening its screens.
    if (page !== 'restaurants' && editor) {
      editor.hidden = false;
    }

    document.querySelectorAll('.studio-screen[data-page]')
      .forEach(section => {
        const active = section.dataset.page === page;
        section.hidden = !active;
        section.style.display = active ? '' : 'none';
      });

    document.querySelectorAll('[data-screen]')
      .forEach(button => {
        const active = button.dataset.screen === page;
        button.classList.toggle('active', active);

        if (active) {
          button.setAttribute('aria-current', 'page');
        } else {
          button.removeAttribute('aria-current');
        }
      });

    if (location.hash !== '#' + page) {
      history.replaceState(null, '', '#' + page);
    }

    window.scrollTo(0, 0);
  }

  function setup() {
    // Main navigation and Next buttons
    document.addEventListener('click', event => {
      const navButton = event.target.closest(
        '[data-screen], [data-go]'
      );

      if (navButton) {
        navigate(
          navButton.dataset.screen || navButton.dataset.go
        );
        return;
      }

      // Manage buttons are created dynamically by builder.js.
      const restaurantsBox = $('restaurants');
      const clickedButton = event.target.closest('button');

      if (
        restaurantsBox &&
        clickedButton &&
        restaurantsBox.contains(clickedButton) &&
        clickedButton.textContent.trim() === 'Manage'
      ) {
        // Allow the original Manage handler to select the restaurant.
        setTimeout(() => navigate('settings'), 0);
      }

      if (clickedButton && clickedButton.id === 'newRestaurant') {
        setTimeout(() => navigate('settings'), 0);
      }
    });

    $('saveDesignShortcut')?.addEventListener('click', () => {
      $('saveRestaurant')?.click();
    });

    window.addEventListener('hashchange', () => {
      navigate(location.hash.slice(1));
    });

    navigate(location.hash.slice(1) || 'restaurants');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }

  window.pfNavigate = navigate;
})();
