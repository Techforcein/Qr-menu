/* Restaurant Studio - Save + Continue (compatible with builder.js V3) */
(() => {
  'use strict';
  let busy = false;
  const byId = id => document.getElementById(id);

  function openPage(page) {
    if (typeof window.pfNavigate === 'function') {
      window.pfNavigate(page);
    } else {
      const editor = byId('editor');
      if (editor) { editor.hidden = false; editor.style.display = 'block'; }
      document.querySelectorAll('.studio-screen[data-page]').forEach(section => {
        const active = section.dataset.page === page;
        section.hidden = !active;
        section.style.display = active ? 'block' : 'none';
      });
    }
  }

  async function saveAndContinue(button, page) {
    if (busy) return;
    busy = true;
    const oldLabel = button.innerHTML;
    button.disabled = true;
    button.textContent = 'Saving…';
    try {
      if (typeof saveRestaurant !== 'function') {
        throw new Error('Restaurant builder script is not loaded.');
      }
      // The existing builder saveRestaurant catches its own errors and
      // reports the result through #message, so inspect its final status.
      await saveRestaurant();
      const status = (byId('message')?.textContent || '').trim();
      if (status !== 'Restaurant and design saved.') {
        // Keep the user on this screen if the save failed.
        if (!status || status.startsWith('Error:')) {
          if (!status) throw new Error('Save did not complete.');
        }
        return;
      }
      openPage(page);
    } catch (error) {
      const message = byId('message');
      if (message) message.textContent = 'Error: ' + (error.message || error);
      console.error(error);
    } finally {
      busy = false;
      button.disabled = false;
      button.innerHTML = oldLabel;
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
