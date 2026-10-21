here
/* PageForge Restaurant Studio - Multi-screen Navigation */

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

  function navigate(page, updateHash = true) {
    if (!pages.includes(page)) {
      page = 'restaurants';
    }

    document.querySelectorAll('[data-page]').forEach(section => {
      section.hidden = section.dataset.page !== page;
    });

    document.querySelectorAll('[data-screen]').forEach(button => {
      const selected = button.dataset.screen === page;

      button.classList.toggle('active', selected);

      button.setAttribute(
        'aria-current',
        selected ? 'page' : 'false'
      );
    });

    if (updateHash && location.hash !== '#' + page) {
      history.replaceState(null, '', '#' + page);
    }

    window.scrollTo({
      top: 0,
      behavior: 'auto'
    });
  }

  function setup() {
    // Navigation buttons
    document
      .querySelectorAll('[data-screen], [data-go]')
      .forEach(button => {
        button.addEventListener('click', () => {
          navigate(
            button.dataset.screen || button.dataset.go
          );
        });
      });

    // Save design using the existing restaurant save function
    $('saveDesignShortcut')?.addEventListener('click', () => {
      $('saveRestaurant')?.click();
    });

    // Open settings when creating a restaurant
    $('newRestaurant')?.addEventListener('click', () => {
      navigate('settings');
    });

    // Open settings when managing a restaurant
    $('restaurants')?.addEventListener('click', event => {
      if (event.target.closest('button')) {
        navigate('settings');
      }
    });

    // Browser back / hash navigation
    window.addEventListener('hashchange', () => {
      navigate(location.hash.slice(1), false);
    });

    // Initial screen
    navigate(
      location.hash.slice(1) || 'restaurants',
      false
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
