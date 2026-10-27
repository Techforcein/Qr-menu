
/* Restaurant Studio — Save and Continue */
(() => {
  'use strict';

  let busy = false;

  async function saveAndContinue(button, destination) {
    if (busy) return;

    busy = true;
    const originalText = button.innerHTML;

    button.disabled = true;
    button.textContent = 'Saving…';

    try {
      if (typeof saveRestaurant !== 'function') {
        throw new Error('restaurant-builder.js did not load correctly.');
      }

      const message = document.getElementById('message');

      // Clear the previous message so an old error isn't mistaken
      // for the result of this save.
      if (message) message.textContent = '';

      await saveRestaurant();

      const status = (message?.textContent || '').trim();

      // Do not navigate when the latest save reports an error.
      if (/^(error|failed|unable to save)\b/i.test(status)) {
        return;
      }

      // Allow the original page navigation system to open Categories.
      if (typeof window.pfNavigate === 'function') {
        window.pfNavigate(destination);
      } else {
        location.hash = destination;
      }
    } catch (error) {
      const message = document.getElementById('message');
      if (message) {
        message.textContent = 'Error: ' + (error.message || error);
      }
      console.error('Save and Continue failed:', error);
    } finally {
      busy = false;
      button.disabled = false;
      button.innerHTML = originalText;
    }
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('button[data-save-next]');
    if (!button) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    saveAndContinue(button, button.dataset.saveNext);
  }, true);
})();
