
(() => {
  'use strict';

  const $ = id => document.getElementById(id);

  let db, form;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

  // ------------------------------------------
  // Anonymous visitor ID
  // ------------------------------------------
  function getVisitorId() {
    const key = 'pf_contact_visitor_id';

    try {
      let id = localStorage.getItem(key);

      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(key, id);
      }

      return id;
    } catch (_) {
      return crypto.randomUUID();
    }
  }

  // ------------------------------------------
  // Device detection
  // ------------------------------------------
  function detectDevice() {
    const ua = navigator.userAgent || '';

    if (/iPad|Tablet/i.test(ua)) return 'tablet';

    if (/Android/i.test(ua) && !/Mobile/i.test(ua))
      return 'tablet';

    if (/Mobile|Android|iPhone|iPod/i.test(ua))
      return 'mobile';

    return 'desktop';
  }

  // ------------------------------------------
  // Operating system
  // ------------------------------------------
  function detectOS() {
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';

    if (/Windows/i.test(ua)) return 'Windows';

    if (/Android/i.test(ua)) return 'Android';

    if (/iPhone|iPad|iPod/i.test(ua))
      return 'iOS';

    if (/Mac OS X|Macintosh/i.test(ua) ||
        /Mac/i.test(platform))
      return 'macOS';

    if (/Linux/i.test(ua)) return 'Linux';

    return 'Unknown';
  }

  // ------------------------------------------
  // Browser detection
  // ------------------------------------------
  function detectBrowser() {
    const ua = navigator.userAgent || '';

    if (/Edg\//i.test(ua)) return 'Microsoft Edge';

    if (/OPR\/|Opera/i.test(ua)) return 'Opera';

    if (/SamsungBrowser/i.test(ua)) return 'Samsung Internet';

    if (/Firefox\//i.test(ua)) return 'Firefox';

    if (/CriOS/i.test(ua)) return 'Chrome (iOS)';

    if (/Chrome\//i.test(ua)) return 'Chrome';

    if (/Safari\//i.test(ua) && !/Chrome/i.test(ua))
      return 'Safari';

    if (/MSIE|Trident/i.test(ua))
      return 'Internet Explorer';

    return 'Unknown';
  }

  // ------------------------------------------
  // Record visit in Supabase
  // No country lookup or IP API is used.
  // ------------------------------------------
  async function trackVisit() {
    try {
      const { error } = await db.rpc(
        'track_contact_form_view',
        {
          p_form_id: form.id,
          p_visitor_id: getVisitorId(),
          p_page_url: location.href,
          p_referrer: document.referrer || null,
          p_device_type: detectDevice(),
          p_operating_system: detectOS(),
          p_browser: detectBrowser()
        }
      );

      if (error) {
        console.warn(
          'Analytics tracking failed:',
          error.message
        );
      }
    } catch (error) {
      console.warn('Analytics unavailable:', error);
    }
  }

  // ------------------------------------------
  // Load template styles
  // ------------------------------------------
  async function loadTemplate() {
    const file = form.template || 'PureMinimal.html';

    const res = await fetch(
      './Templates/' + encodeURIComponent(file)
    );

    if (!res.ok) return;

    const doc = new DOMParser().parseFromString(
      await res.text(),
      'text/html'
    );

    const css = doc.querySelector('style')?.textContent || '';

    const style = document.createElement('style');
    style.textContent = css;

    document.head.appendChild(style);
  }

  // ------------------------------------------
  // Render form fields
  // ------------------------------------------
  function renderField(f) {
    const id = 'f_' + f.id;
    const req = f.required ? 'required' : '';
    let c = '';

    if (f.type === 'long') {
      c = `<textarea id="${id}" ${req}
        placeholder="${esc(f.placeholder || '')}"></textarea>`;
    }

    else if (['choice', 'checkbox', 'multi'].includes(f.type)) {
      c = (f.options || []).map(o =>
        `<label class="option">
          <input type="${f.type === 'choice' ? 'radio' : 'checkbox'}"
          name="${id}" value="${esc(o)}">
          ${esc(o)}
        </label>`
      ).join('');
    }

    else if (f.type === 'dropdown') {
      c = `<select id="${id}" ${req}>
        <option value="">Choose…</option>
        ${(f.options || []).map(o =>
          `<option value="${esc(o)}">${esc(o)}</option>`
        ).join('')}
      </select>`;
    }

    else if (f.type === 'rating') {
      c = `<select id="${id}" ${req}>
        ${[1, 2, 3, 4, 5].map(n =>
          `<option value="${n}">${n} / 5</option>`
        ).join('')}
      </select>`;
    }

    else {
      const types = {
        short: 'text',
        number: 'number',
        email: 'email',
        phone: 'tel',
        link: 'url',
        date: 'date',
        time: 'time',
        linear: 'range'
      };

      c = `<input id="${id}"
        type="${types[f.type] || 'text'}"
        ${req}
        placeholder="${esc(f.placeholder || '')}">`;
    }

    return `<label class="pf-field">
      ${esc(f.label)}${f.required ? ' *' : ''}
      ${c}
    </label>`;
  }

  // ------------------------------------------
  // Load published form
  // ------------------------------------------
  async function init() {
    try {
      db = window.pfDb;

      if (!db) {
        throw Error('Supabase configuration did not load.');
      }

      const id = new URLSearchParams(location.search).get('id');

      if (!id) {
        throw Error('Form link is incomplete.');
      }

      const { data, error } = await db
        .from('contact_forms')
        .select(
          'id,title,description,fields,design,template,published,google_script_url'
        )
        .eq('id', id)
        .eq('published', true)
        .single();

      if (error) throw error;

      form = data;

      await loadTemplate();

      const d = form.design || {};
      const el = $('publicForm');

      el.classList.add('pf-form-card');

      el.style.background = d.bg || '#fff';
      el.style.color = d.text || '#222';
      el.style.fontFamily = d.font || 'system-ui';
      el.style.maxWidth = d.width || '680px';
      el.style.borderRadius = (d.radius || 16) + 'px';

      el.style.boxShadow = d.shadow === false
        ? 'none'
        : '0 15px 45px #0002';

      el.style.setProperty(
        '--accent',
        d.accent || '#6557d8'
      );

      $('publicTitle').textContent = form.title;

      $('publicDescription').textContent =
        form.description || '';

      $('publicFields').innerHTML =
        (form.fields || []).map(renderField).join('');

      const btn = el.querySelector('button[type=submit]');

      btn.textContent = d.submitText || 'Submit response →';

      el.hidden = false;
      $('publicStatus').hidden = true;

      el.onsubmit = submit;

      // Track visits independently of submissions.
      // Analytics failure never blocks form functionality.
      trackVisit();

    } catch (e) {
      $('publicStatus').textContent =
        'This form is unavailable: ' + e.message;
    }
  }

  // ------------------------------------------
  // Submit response
  // ------------------------------------------
  async function submit(e) {
    e.preventDefault();

    const answers = {};

    for (const f of form.fields || []) {
      const id = 'f_' + f.id;
      let value;

      if (['choice', 'checkbox', 'multi'].includes(f.type)) {
        value = [
          ...document.querySelectorAll(
            `[name="${CSS.escape(id)}"]:checked`
          )
        ].map(x => x.value);

        if (f.type === 'choice') {
          value = value[0] || '';
        }
      } else {
        value = document.getElementById(id)?.value || '';
      }

      if (f.required &&
          (!value || (Array.isArray(value) && !value.length))) {
        alert('Please answer: ' + f.label);
        return;
      }

      answers[f.id] = value;
    }

    const btn = $('publicForm').querySelector('button[type=submit]');

    btn.disabled = true;
    btn.textContent = 'Sending…';

    try {
      const { error } = await db
        .from('contact_form_submissions')
        .insert({
          form_id: form.id,
          answers
        });

      if (error) throw error;

      // Preserve Google Sheets integration.
      if (form.google_script_url) {
        try {
          fetch(form.google_script_url, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify({
              form_id: form.id,
              form_title: form.title,
              submitted_at: new Date().toISOString(),
              answers
            })
          }).catch(() => {});
        } catch (_) {}
      }

      $('publicForm').innerHTML = `
        <div class="pf-success">
          <h1>Thank you!</h1>
          <p>${esc(
            form.design?.successText ||
            'Your response has been submitted successfully.'
          )}</p>
        </div>
      `;

    } catch (err) {
      btn.disabled = false;

      btn.textContent =
        form.design?.submitText || 'Submit response →';

      alert('Could not submit: ' + err.message);
    }
  }

  document.addEventListener('DOMContentLoaded', init);

})();
