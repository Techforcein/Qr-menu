
/* ========================================
   PAGEFORGE - WEBSITE GENERATOR
   HTML + CSS + JAVASCRIPT + SUPABASE
======================================== */

// SUPABASE CONFIGURATION

const SUPABASE_URL =
  'https://uzrdwnfvdanaohrrwybt.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_SndQ_tuEBtqvIGMSmdiQ-Q_vg8-zJWP';

const configured =
  !SUPABASE_URL.includes('YOUR-PROJECT') &&
  !SUPABASE_PUBLISHABLE_KEY.includes('YOUR-SUPABASE');

const db = configured
  ? window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    )
  : null;

// HELPERS

const $ = id => document.getElementById(id);

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

// URL VALIDATION

const cleanUrl = value => {
  try {
    const u = new URL(value);

    return ['https:', 'http:'].includes(u.protocol)
      ? u.href
      : '';
  } catch {
    return '';
  }
};

// READ FORM DATA

function dataFromForm() {
  return Object.fromEntries(
    keys.map(k => [k, $(k).value])
  );
}

// CREATE ELEMENT

function element(tag, cls, content) {
  const el = document.createElement(tag);

  if (cls) el.className = cls;

  if (content !== undefined) {
    el.textContent = content;
  }

  return el;
}

// RENDER GENERATED WEBPAGE

function render(target, data, image) {
  target.replaceChildren();

  const shell = element('article', 'rendered');

  shell.style.background =
    data.background || '#0b1020';

  shell.style.color =
    data.textColor || '#fff';

  const inner = element('div', 'renderedInner');

  if (image) {
    const img = element('img');

    img.src = image;
    img.alt = data.title || 'Page cover';

    inner.append(img);
  }

  inner.append(
    element(
      'h1',
      '',
      data.title || 'Untitled page'
    )
  );

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
    const a = element(
      'a',
      '',
      data.buttonText || 'Learn more'
    );

    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';

    a.style.background =
      data.accent || '#8b5cf6';

    a.style.color = '#fff';

    inner.append(a);
  }

  shell.append(inner);
  target.append(shell);
}

// LIVE PREVIEW

function preview() {
  render(
    $('preview'),
    dataFromForm(),
    localImage || imageUrl
  );
}

// STATUS MESSAGE

function status(msg) {
  $('status').textContent = msg;
}

// GENERATE PUBLIC URL

function publicUrl(id) {
  const u = new URL(location.href);

  u.search = '';
  u.hash = '';

  u.searchParams.set('page', id);

  return u.href;
}

// RESET PAGE EDITOR

function clearEditor() {
  editingId = null;
  imageFile = null;
  imageUrl = '';
  imagePath = '';

  if (localImage) {
    URL.revokeObjectURL(localImage);
  }

  localImage = '';

  $('image').value = '';

  $('title').value =
    'Welcome to my page';

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

  status('');
  preview();
}

// LOAD SAVED WEBSITES

async function loadPages() {
  if (!user) return;

  const { data, error } = await db
    .from('pages')
    .select('id,title,created_at')
    .eq('user_id', user.id)
    .order('created_at', {
      ascending: false
    });

  const wrap = $('myPages');

  wrap.replaceChildren();

  if (error) {
    wrap.textContent = error.message;
    return;
  }

  if (!data.length) {
    wrap.textContent = 'No pages yet.';
    return;
  }

  for (const p of data) {
    const row = element('div', 'pageRow');

    const a = element('a', '', p.title);

    a.href = publicUrl(p.id);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';

    const actions = element(
      'div',
      'pageButtons'
    );

    const edit = element(
      'button',
      'ghost',
      'Edit'
    );

    edit.onclick = () => editPage(p.id);

    const del = element(
      'button',
      'ghost',
      'Delete'
    );

    del.onclick = () => deletePage(p.id);

    actions.append(edit, del);

    row.append(a, actions);

    wrap.append(row);
  }
}

// EDIT EXISTING WEBSITE

async function editPage(id) {
  if (!user) return;

  const { data, error } = await db
    .from('pages')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    status(error.message);
    return;
  }

  editingId = id;

  imageUrl = data.image_url || '';
  imagePath = data.image_path || '';

  if (localImage) {
    URL.revokeObjectURL(localImage);
  }

  localImage = '';
  imageFile = null;

  $('image').value = '';

  for (const k of keys) {
    $(k).value =
      data[k] ||
      ({
        background: '#0b1020',
        accent: '#8b5cf6',
        textColor: '#ffffff'
      }[k] || '');
  }

  $('result').hidden = true;

  preview();

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });

  status('Editing existing page');
}

// DELETE WEBSITE

async function deletePage(id) {
  if (!user) return;

  if (!confirm('Delete this page permanently?')) {
    return;
  }

  const { data: page } = await db
    .from('pages')
    .select('image_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  const { error } = await db
    .from('pages')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    status(error.message);
    return;
  }

  if (page?.image_path) {
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

  status('Website deleted successfully');
}

// PUBLISH WEBSITE

async function publish() {
  if (!user) {
    return status('Sign in first.');
  }

  if (!$('title').value.trim()) {
    return status('Enter a website title.');
  }

  const btn = $('publish');

  btn.disabled = true;

  status('Publishing your website...');

  let uploadedPath = '';
  let saved = false;

  try {
    let newUrl = imageUrl;
    let newPath = imagePath;

    // IMAGE UPLOAD

    if (imageFile) {
      const allowed = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp'
      };

      const ext = allowed[imageFile.type];

      if (!ext || imageFile.size > 5 * 1024 * 1024) {
        throw new Error(
          'Choose JPG, PNG or WEBP under 5 MB.'
        );
      }

      uploadedPath =
        `${user.id}/${crypto.randomUUID()}.${ext}`;

      const up = await db.storage
        .from('page-images')
        .upload(
          uploadedPath,
          imageFile,
          {
            contentType: imageFile.type,
            upsert: false
          }
        );

      if (up.error) {
        throw up.error;
      }

      newUrl = db.storage
        .from('page-images')
        .getPublicUrl(uploadedPath)
        .data.publicUrl;

      newPath = uploadedPath;
    }

    // PREPARE PAGE DATA

    const payload = {
      ...dataFromForm(),
      image_url: newUrl,
      image_path: newPath,
      user_id: user.id
    };

    let result;

    // UPDATE PAGE

    if (editingId) {
      result = await db
        .from('pages')
        .update(payload)
        .eq('id', editingId)
        .eq('user_id', user.id)
        .select('id')
        .single();
    } else {
      // CREATE NEW PAGE

      result = await db
        .from('pages')
        .insert(payload)
        .select('id')
        .single();
    }

    if (result.error) {
      throw result.error;
    }

    saved = true;

    const id = result.data.id;

    editingId = id;

    const oldImagePath = imagePath;

    imageUrl = newUrl;
    imagePath = newPath;
    imageFile = null;

    if (localImage) {
      URL.revokeObjectURL(localImage);
    }

    localImage = '';

    $('image').value = '';

    // DELETE REPLACED IMAGE

    if (
      uploadedPath &&
      oldImagePath &&
      oldImagePath !== newPath
    ) {
      const { error } = await db.storage
        .from('page-images')
        .remove([oldImagePath]);

      if (error) {
        console.warn(error.message);
      }
    }

    // PUBLIC URL

    const url = publicUrl(id);

    $('shareUrl').value = url;

    $('openPage').href = url;

    $('result').hidden = false;

    // GENERATE QR CODE

    if (window.QRCode) {
      await QRCode.toCanvas(
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
    }

    status('Website published successfully!');

    await loadPages();

  } catch (e) {
    if (uploadedPath && !saved) {
      await db.storage
        .from('page-images')
        .remove([uploadedPath]);
    }

    status('Error: ' + e.message);

  } finally {
    btn.disabled = false;
  }
}

// REFRESH LOGIN SESSION

async function refreshAuth() {
  const {
    data: { user: current },
    error
  } = await db.auth.getUser();

  if (error) {
    console.warn(error.message);
  }

  user = current;

  $('auth').hidden = !!user;
  $('editor').hidden = !user;
  $('logout').hidden = !user;

  if (user) {
    await loadPages();
  }
}

// SIGNUP AND LOGIN

async function authenticate(mode) {
  if (!db) return;

  const email = $('email').value.trim();
  const password = $('password').value;

  if (!email || !password) {
    alert('Enter email and password');
    return;
  }

  const { error, data } =
    mode === 'signup'
      ? await db.auth.signUp({
          email,
          password
        })
      : await db.auth.signInWithPassword({
          email,
          password
        });

  if (error) {
    alert(error.message);
    return;
  }

  if (
    mode === 'signup' &&
    !data.session
  ) {
    alert(
      'Check your email to confirm your account.'
    );
  }

  await refreshAuth();
}

// DISPLAY PUBLIC WEBSITE

async function showPublic(id) {
  $('builder').hidden = true;
  $('publicPage').hidden = false;

  const target = $('publishedContent');

  target.textContent = 'Loading webpage...';

  if (!db) {
    target.textContent =
      'Configure Supabase first.';
    return;
  }

  const { data, error } = await db
    .from('pages')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    target.textContent =
      'Page not found or not public.';
    return;
  }

  document.title =
    data.title + ' · PageForge';

  render(
    target,
    data,
    data.image_url
  );
}

// INITIALIZE APPLICATION

async function init() {
  const id = new URLSearchParams(
    location.search
  ).get('page');

  // PUBLIC PAGE MODE

  if (id) {
    await showPublic(id);
    return;
  }

  // CHECK SUPABASE CONFIGURATION

  if (!db) {
    $('auth').innerHTML = `
      <h2>Setup required</h2>
      <p>
        Configure Supabase in script.js.
      </p>
    `;

    return;
  }

  // SIGN IN

  $('signin').onclick = () =>
    authenticate('signin');

  // SIGN UP

  $('signup').onclick = () =>
    authenticate('signup');

  // LOGOUT

  $('logout').onclick = async () => {
    await db.auth.signOut();

    user = null;

    await refreshAuth();
  };

  // PUBLISH

  $('publish').onclick = publish;

  // RESET

  $('reset').onclick = clearEditor;

  // COPY URL

  $('copy').onclick = async () => {
    try {
      await navigator.clipboard.writeText(
        $('shareUrl').value
      );

      status('URL copied successfully!');
    } catch {
      $('shareUrl').select();
      status('Select and copy the URL.');
    }
  };

  // LIVE PREVIEW EVENTS

  for (const k of keys) {
    $(k).addEventListener(
      'input',
      preview
    );
  }

  // IMAGE SELECTION

  $('image').onchange = e => {
    const f = e.target.files[0];

    if (!f) return;

    if (
      ![
        'image/jpeg',
        'image/png',
        'image/webp'
      ].includes(f.type) ||
      f.size > 5 * 1024 * 1024
    ) {
      alert(
        'Choose a JPG, PNG or WEBP image under 5 MB'
      );

      e.target.value = '';
      return;
    }

    imageFile = f;

    if (localImage) {
      URL.revokeObjectURL(localImage);
    }

    localImage = URL.createObjectURL(f);

    preview();
  };

  // INITIAL PREVIEW

  preview();

  // CHECK AUTHENTICATION

  await refreshAuth();

  // LISTEN FOR LOGIN CHANGES

  db.auth.onAuthStateChange(() => {
    setTimeout(refreshAuth, 0);
  });
}

// START PAGEFORGE

window.addEventListener(
  'DOMContentLoaded',
  init
);
