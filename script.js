
/* ==========================================
   PAGEFORGE - COMPLETE SCRIPT.JS V6
   Supabase Authentication + Page Builder
========================================== */

// ==========================================
// 1. SUPABASE CONFIGURATION
// ==========================================

const SUPABASE_URL =
  'https://uzrdwnfvdanaohrwrybt.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_SndQ_tuEBtqvIGMSmdiQ-Q_vg8-zJWP';

const $ = id => document.getElementById(id);

let db = null;

if (
  window.supabase &&
  typeof window.supabase.createClient === 'function'
) {
  db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
}

// ==========================================
// 2. APPLICATION STATE
// ==========================================

const keys = [
  'title',
  'subtitle',
  'description',
  'buttonText',
  'buttonUrl',
  'background',
  'accent',
  'textColor'
];

let user = null;
let editingId = null;

let imageFile = null;
let imageUrl = '';
let imagePath = '';
let localImage = '';

let authRefreshBusy = false;

// ==========================================
// 3. HELPERS
// ==========================================

function setStatus(message) {
  if ($('status')) {
    $('status').textContent = message;
  }
}

function setAuthStatus(message) {
  if ($('authStatus')) {
    $('authStatus').textContent = message;
  }
}

function errorMessage(error) {
  if (!error) return 'Unknown error';

  const message = error.message || String(error);

  if (/failed to fetch/i.test(message)) {
    return (
      'Cannot connect to Supabase. Check your ' +
      'internet connection, project URL and ' +
      'Supabase project status.'
    );
  }

  return message;
}

function cleanUrl(value) {
  if (!value) return '';

  try {
    const url = new URL(value.trim());

    if (
      url.protocol === 'https:' ||
      url.protocol === 'http:'
    ) {
      return url.href;
    }
  } catch (error) {
    return '';
  }

  return '';
}

function element(tag, className = '', content) {
  const el = document.createElement(tag);

  if (className) el.className = className;

  if (content !== undefined) {
    el.textContent = content;
  }

  return el;
}

function dataFromForm() {
  const result = {};

  for (const key of keys) {
    result[key] = $(key).value;
  }

  return result;
}

function clearLocalImage() {
  if (localImage) {
    URL.revokeObjectURL(localImage);
    localImage = '';
  }
}

// ==========================================
// 4. AUTH REDIRECT URL
// ==========================================

function getRedirectUrl() {
  // Return to the same website, without
  // an old page ID or auth error fragment.
  const url = new URL(window.location.href);

  url.search = '';
  url.hash = '';

  return url.href;
}

function handleAuthRedirectError() {
  const params = new URLSearchParams(
    window.location.hash.substring(1)
  );

  const errorCode = params.get('error_code');
  const errorDescription =
    params.get('error_description');

  if (!errorCode && !errorDescription) {
    return;
  }

  if (errorCode === 'otp_expired') {
    setAuthStatus(
      'Your confirmation link has expired ' +
      'or was already used. Enter your email ' +
      'and tap Resend confirmation email.'
    );
  } else {
    setAuthStatus(
      errorDescription ||
      'Email confirmation failed.'
    );
  }

  // Remove error from URL.
  history.replaceState(
    null,
    '',
    window.location.pathname +
    window.location.search
  );
}

// ==========================================
// 5. RENDER WEBSITE
// ==========================================

function render(target, data, image) {
  if (!target) return;

  target.replaceChildren();

  const shell = element('article', 'rendered');

  shell.style.background =
    data.background || '#0b1020';

  shell.style.color =
    data.textColor || '#ffffff';

  const inner = element('div', 'renderedInner');

  if (image) {
    const img = element('img');

    img.src = image;
    img.alt = data.title || 'Cover image';
    img.loading = 'lazy';

    inner.append(img);
  }

  const title = element(
    'h1',
    '',
    data.title || 'Untitled Page'
  );

  inner.append(title);

  if (data.subtitle) {
    inner.append(
      element('h3', '', data.subtitle)
    );
  }

  if (data.description) {
    inner.append(
      element('p', '', data.description)
    );
  }

  const url = cleanUrl(data.buttonUrl);

  if (url) {
    const button = element(
      'a',
      '',
      data.buttonText || 'Learn More'
    );

    button.href = url;
    button.target = '_blank';
    button.rel = 'noopener noreferrer';

    button.style.background =
      data.accent || '#8b5cf6';

    button.style.color = '#ffffff';

    inner.append(button);
  }

  shell.append(inner);
  target.append(shell);
}

// ==========================================
// 6. LIVE PREVIEW
// ==========================================

function preview() {
  render(
    $('preview'),
    dataFromForm(),
    localImage || imageUrl
  );
}

// ==========================================
// 7. PUBLIC PAGE URL
// ==========================================

function publicUrl(id) {
  const url = new URL(window.location.href);

  url.search = '';
  url.hash = '';

  url.searchParams.set('page', id);

  return url.href;
}

// ==========================================
// 8. RESET EDITOR
// ==========================================

function clearEditor() {
  editingId = null;
  imageFile = null;
  imageUrl = '';
  imagePath = '';

  clearLocalImage();

  $('image').value = '';

  $('title').value = 'Welcome to my page';

  $('subtitle').value =
    'Everything you need, in one place';

  $('description').value =
    'A beautiful page made with PageForge.';

  $('buttonText').value = 'Contact us';
  $('buttonUrl').value = '';

  $('background').value = '#0b1020';
  $('accent').value = '#8b5cf6';
  $('textColor').value = '#ffffff';

  $('result').hidden = true;

  setStatus('');
  preview();
}

// ==========================================
// 9. IMAGE SELECTION
// ==========================================

function handleImage(event) {
  const file = event.target.files[0];

  if (!file) return;

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ];

  if (!allowedTypes.includes(file.type)) {
    alert('Only JPG, PNG and WEBP are supported.');
    event.target.value = '';
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('Image must be smaller than 5 MB.');
    event.target.value = '';
    return;
  }

  imageFile = file;

  clearLocalImage();

  localImage = URL.createObjectURL(file);

  preview();
}

// ==========================================
// 10. AUTHENTICATION
// ==========================================

async function authenticate(mode) {
  if (!db) {
    setAuthStatus('Supabase library is not loaded.');
    return;
  }

  const email = $('email').value.trim();
  const password = $('password').value;

  if (!email || !password) {
    setAuthStatus(
      'Please enter your email and password.'
    );
    return;
  }

  if (password.length < 6) {
    setAuthStatus(
      'Password must contain at least 6 characters.'
    );
    return;
  }

  $('signin').disabled = true;
  $('signup').disabled = true;

  setAuthStatus(
    mode === 'signup'
      ? 'Creating account...'
      : 'Signing in...'
  );

  try {
    let result;

    if (mode === 'signup') {
      result = await db.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getRedirectUrl()
        }
      });
    } else {
      result = await db.auth.signInWithPassword({
        email,
        password
      });
    }

    if (result.error) {
      throw result.error;
    }

    if (mode === 'signup') {
      if (!result.data.session) {
        setAuthStatus(
          'Check your inbox for the confirmation ' +
          'email. Open the newest link to activate ' +
          'your account.'
        );

        $('resendConfirmation').hidden = false;
      } else {
        setAuthStatus('Account created successfully!');
      }
    } else {
      setAuthStatus('Signed in successfully!');
    }

    if (result.data.session) {
      await refreshAuth();
    }

  } catch (error) {
    setAuthStatus(
      'Authentication failed: ' +
      errorMessage(error)
    );

    console.error('Auth error:', error);
  } finally {
    $('signin').disabled = false;
    $('signup').disabled = false;
  }
}

// ==========================================
// 11. RESEND CONFIRMATION EMAIL
// ==========================================

async function resendConfirmation() {
  if (!db) return;

  const email = $('email').value.trim();

  if (!email) {
    setAuthStatus(
      'Enter your email address first.'
    );
    return;
  }

  const button = $('resendConfirmation');

  button.disabled = true;

  setAuthStatus(
    'Requesting a new confirmation email...'
  );

  try {
    const { error } = await db.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: getRedirectUrl()
      }
    });

    if (error) throw error;

    setAuthStatus(
      'If your account needs confirmation, ' +
      'a new email will be sent. Check your inbox ' +
      'and use the newest confirmation link.'
    );

  } catch (error) {
    setAuthStatus(
      'Unable to resend email: ' +
      errorMessage(error)
    );
  } finally {
    button.disabled = false;
  }
}

// ==========================================
// 12. AUTH SESSION
// ==========================================

async function refreshAuth() {
  if (!db || authRefreshBusy) return;

  authRefreshBusy = true;

  try {
    const {
      data: { user: currentUser },
      error
    } = await db.auth.getUser();

    if (error) throw error;

    user = currentUser;

    $('auth').hidden = !!user;
    $('editor').hidden = !user;
    $('logout').hidden = !user;

    if (user) {
      $('resendConfirmation').hidden = true;
      await loadPages();
    } else {
      $('myPages').replaceChildren();
    }

  } catch (error) {
    console.error('Session error:', error);

    user = null;

    $('auth').hidden = false;
    $('editor').hidden = true;
    $('logout').hidden = true;

    setAuthStatus(
      'Session error: ' + errorMessage(error)
    );
  } finally {
    authRefreshBusy = false;
  }
}

// ==========================================
// 13. LOGOUT
// ==========================================

async function logout() {
  if (!db) return;

  const { error } = await db.auth.signOut();

  if (error) {
    alert(error.message);
    return;
  }

  user = null;

  clearEditor();
  await refreshAuth();

  setAuthStatus('You have signed out.');
}

// ==========================================
// 14. LOAD SAVED PAGES
// ==========================================

async function loadPages() {
  if (!user) return;

  const wrap = $('myPages');

  wrap.textContent = 'Loading your pages...';

  try {
    const { data, error } = await db
      .from('pages')
      .select('id,title,created_at')
      .eq('user_id', user.id)
      .order('created_at', {
        ascending: false
      });

    if (error) throw error;

    wrap.replaceChildren();

    if (!data || data.length === 0) {
      wrap.textContent =
        'No pages yet. Create your first page!';
      return;
    }

    for (const page of data) {
      const row = element('div', 'pageRow');

      const link = element(
        'a',
        '',
        page.title || 'Untitled page'
      );

      link.href = publicUrl(page.id);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      const actions = element(
        'div',
        'pageButtons'
      );

      const editButton = element(
        'button',
        'ghost',
        'Edit'
      );

      editButton.type = 'button';
      editButton.onclick = () => editPage(page.id);

      const deleteButton = element(
        'button',
        'ghost',
        'Delete'
      );

      deleteButton.type = 'button';
      deleteButton.onclick = () =>
        deletePage(page.id);

      actions.append(editButton, deleteButton);
      row.append(link, actions);
      wrap.append(row);
    }

  } catch (error) {
    wrap.textContent =
      'Unable to load pages: ' +
      errorMessage(error);
  }
}

// ==========================================
// 15. EDIT PAGE
// ==========================================

async function editPage(id) {
  if (!user) return;

  setStatus('Loading page...');

  try {
    const { data, error } = await db
      .from('pages')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;

    editingId = id;

    imageUrl = data.image_url || '';
    imagePath = data.image_path || '';
    imageFile = null;

    clearLocalImage();

    $('image').value = '';

    const defaults = {
      background: '#0b1020',
      accent: '#8b5cf6',
      textColor: '#ffffff'
    };

    for (const key of keys) {
      $('' + key).value =
        data[key] || defaults[key] || '';
    }

    $('result').hidden = true;

    preview();

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    setStatus('Editing page.');

  } catch (error) {
    setStatus(
      'Unable to edit: ' + errorMessage(error)
    );
  }
}

// ==========================================
// 16. DELETE PAGE
// ==========================================

async function deletePage(id) {
  if (!user) return;

  if (!confirm('Delete this page permanently?')) {
    return;
  }

  setStatus('Deleting page...');

  try {
    const { data: page, error: readError } =
      await db
        .from('pages')
        .select('image_path')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (readError) throw readError;

    const { error } = await db
      .from('pages')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    if (page.image_path) {
      const { error: storageError } =
        await db.storage
          .from('page-images')
          .remove([page.image_path]);

      if (storageError) {
        console.warn(storageError.message);
      }
    }

    if (editingId === id) {
      clearEditor();
    }

    await loadPages();

    setStatus('Page deleted successfully.');

  } catch (error) {
    setStatus(
      'Delete failed: ' + errorMessage(error)
    );
  }
}

// ==========================================
// 17. PUBLISH / UPDATE PAGE
// ==========================================

async function publish() {
  if (!user) {
    setStatus('Please sign in first.');
    return;
  }

  const title = $('title').value.trim();

  if (!title) {
    setStatus('Please enter a page title.');
    return;
  }

  const button = $('publish');
  button.disabled = true;

  let uploadedPath = '';
  let databaseSaved = false;

  setStatus('Publishing page...');

  try {
    let nextImageUrl = imageUrl;
    let nextImagePath = imagePath;

    if (imageFile) {
      const extensions = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp'
      };

      const extension = extensions[imageFile.type];

      if (!extension) {
        throw new Error('Unsupported image format.');
      }

      if (imageFile.size > 5 * 1024 * 1024) {
        throw new Error('Image exceeds 5 MB.');
      }

      uploadedPath =
        user.id + '/' +
        crypto.randomUUID() +
        '.' + extension;

      setStatus('Uploading image...');

      const { error: uploadError } =
        await db.storage
          .from('page-images')
          .upload(
            uploadedPath,
            imageFile,
            {
              contentType: imageFile.type,
              upsert: false
            }
          );

      if (uploadError) throw uploadError;

      const { data: publicData } =
        db.storage
          .from('page-images')
          .getPublicUrl(uploadedPath);

      nextImageUrl = publicData.publicUrl;
      nextImagePath = uploadedPath;
    }

    setStatus('Saving page...');

    const payload = {
      ...dataFromForm(),
      user_id: user.id,
      image_url: nextImageUrl,
      image_path: nextImagePath
    };

    let result;

    if (editingId) {
      result = await db
        .from('pages')
        .update(payload)
        .eq('id', editingId)
        .eq('user_id', user.id)
        .select('id')
        .single();
    } else {
      result = await db
        .from('pages')
        .insert(payload)
        .select('id')
        .single();
    }

    if (result.error) throw result.error;

    databaseSaved = true;

    const pageId = result.data.id;
    const oldImagePath = imagePath;

    editingId = pageId;

    imageUrl = nextImageUrl;
    imagePath = nextImagePath;
    imageFile = null;

    clearLocalImage();
    $('image').value = '';

    if (
      uploadedPath &&
      oldImagePath &&
      oldImagePath !== nextImagePath
    ) {
      const { error: cleanupError } =
        await db.storage
          .from('page-images')
          .remove([oldImagePath]);

      if (cleanupError) {
        console.warn(cleanupError.message);
      }
    }

    const url = publicUrl(pageId);

    $('shareUrl').value = url;
    $('openPage').href = url;
    $('result').hidden = false;

    // QR code generation
    if (
      window.QRCode &&
      typeof window.QRCode.toCanvas === 'function'
    ) {
      try {
        await window.QRCode.toCanvas(
          $('qr'),
          url,
          {
            width: 220,
            margin: 2
          }
        );

        $('downloadQR').href =
          $('qr').toDataURL('image/png');

        $('downloadQR').download =
          'pageforge-qr.png';

      } catch (qrError) {
        console.warn(
          'QR generation error:',
          qrError
        );
      }
    }

    setStatus('Page published successfully!');

    await loadPages();

  } catch (error) {
    if (uploadedPath && !databaseSaved) {
      const { error: cleanupError } =
        await db.storage
          .from('page-images')
          .remove([uploadedPath]);

      if (cleanupError) {
        console.warn(cleanupError.message);
      }
    }

    setStatus(
      'Publishing failed: ' + errorMessage(error)
    );

    console.error('Publish error:', error);

  } finally {
    button.disabled = false;
  }
}

// ==========================================
// 18. PUBLIC PAGE
// ==========================================

async function showPublic(id) {
  $('builder').hidden = true;
  $('publicPage').hidden = false;

  const target = $('publishedContent');

  target.textContent = 'Loading webpage...';

  try {
    const { data, error } = await db
      .from('pages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    document.title =
      (data.title || 'Page') + ' | PageForge';

    render(
      target,
      data,
      data.image_url || ''
    );

  } catch (error) {
    target.textContent =
      'Unable to load webpage: ' +
      errorMessage(error);
  }
}

// ==========================================
// 19. INITIALIZE APPLICATION
// ==========================================

async function init() {
  if (!db) {
    const errorBox = $('libraryError');

    errorBox.hidden = false;
    errorBox.textContent =
      'Supabase could not load. Check your ' +
      'internet connection and script URL.';

    return;
  }

  // Public pages don't require login.
  const pageId = new URLSearchParams(
    window.location.search
  ).get('page');

  if (pageId) {
    await showPublic(pageId);
    return;
  }

  // Authentication buttons
  $('signin').onclick = () =>
    authenticate('signin');

  $('signup').onclick = () =>
    authenticate('signup');

  $('resendConfirmation').onclick =
    resendConfirmation;

  // Keep resend available for users
  // who need another confirmation link.
  $('resendConfirmation').hidden = false;

  $('logout').onclick = logout;

  // Editor buttons
  $('publish').onclick = publish;
  $('reset').onclick = clearEditor;

  // Copy public URL
  $('copy').onclick = async () => {
    const url = $('shareUrl').value;

    try {
      await navigator.clipboard.writeText(url);

      setStatus('URL copied!');
    } catch (error) {
      $('shareUrl').select();

      setStatus(
        'Select the URL and copy it manually.'
      );
    }
  };

  // Live preview
  for (const key of keys) {
    $(key).addEventListener('input', preview);
  }

  $('image').addEventListener(
    'change',
    handleImage
  );

  // Render default preview
  preview();

  // Show expired-link messages
  handleAuthRedirectError();

  // Restore login session
  await refreshAuth();

  // React to authentication changes
  db.auth.onAuthStateChange(() => {
    setTimeout(() => {
      refreshAuth();
    }, 0);
  });
}

// ==========================================
// 20. START PAGEFORGE
// ==========================================

window.addEventListener(
  'DOMContentLoaded',
  init
);
