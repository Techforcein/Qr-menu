

const SUPABASE_URL =
  'https://uzrdwnfvdanaohrwrybt.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_SndQ_tuEBtqvIGMSmdiQ-Q_vg8-zJWP';

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

// =========================================
// 2. HELPERS
// =========================================

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

function status(message) {
  $('status').textContent = message;
}

function getErrorMessage(error) {
  if (!error) return 'Unknown error';

  const message = error.message || String(error);

  if (
    message.toLowerCase().includes('failed to fetch')
  ) {
    return (
      'Cannot connect to Supabase. Check the ' +
      'project URL, internet connection and ' +
      'whether your Supabase project is active.'
    );
  }

  return message;
}

function cleanUrl(value) {
  try {
    const url = new URL(value);

    if (
      url.protocol === 'https:' ||
      url.protocol === 'http:'
    ) {
      return url.href;
    }

    return '';
  } catch {
    return '';
  }
}

function dataFromForm() {
  return Object.fromEntries(
    keys.map(key => [
      key,
      $(key).value
    ])
  );
}

function element(tag, className, content) {
  const el = document.createElement(tag);

  if (className) {
    el.className = className;
  }

  if (content !== undefined) {
    el.textContent = content;
  }

  return el;
}

function clearLocalImage() {
  if (localImage) {
    URL.revokeObjectURL(localImage);
  }

  localImage = '';
}

// =========================================
// 3. PAGE RENDERING
// =========================================

function render(target, data, image) {
  target.replaceChildren();

  const shell = element(
    'article',
    'rendered'
  );

  shell.style.background =
    data.background || '#0b1020';

  shell.style.color =
    data.textColor || '#ffffff';

  const inner = element(
    'div',
    'renderedInner'
  );

  // Cover image

  if (image) {
    const img = element('img');

    img.src = image;
    img.alt = data.title || 'Cover image';
    img.loading = 'lazy';

    inner.append(img);
  }

  // Title

  inner.append(
    element(
      'h1',
      '',
      data.title || 'Untitled Page'
    )
  );

  // Subtitle

  if (data.subtitle) {
    inner.append(
      element(
        'h3',
        '',
        data.subtitle
      )
    );
  }

  // Description

  if (data.description) {
    inner.append(
      element(
        'p',
        '',
        data.description
      )
    );
  }

  // Action button

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

// =========================================
// 4. LIVE PREVIEW
// =========================================

function preview() {
  render(
    $('preview'),
    dataFromForm(),
    localImage || imageUrl
  );
}

// =========================================
// 5. PUBLIC PAGE URL
// =========================================

function publicUrl(id) {
  const url = new URL(
    window.location.href
  );

  url.search = '';
  url.hash = '';

  url.searchParams.set(
    'page',
    id
  );

  return url.href;
}

// =========================================
// 6. RESET EDITOR
// =========================================

function clearEditor() {
  editingId = null;

  imageFile = null;
  imageUrl = '';
  imagePath = '';

  clearLocalImage();

  $('image').value = '';

  $('title').value =
    'Welcome to my page';

  $('subtitle').value =
    'Everything you need, in one place';

  $('description').value =
    'A beautiful page made with PageForge.';

  $('buttonText').value =
    'Contact us';

  $('buttonUrl').value = '';

  $('background').value =
    '#0b1020';

  $('accent').value =
    '#8b5cf6';

  $('textColor').value =
    '#ffffff';

  $('result').hidden = true;

  status('');

  preview();
}

// =========================================
// 7. LOAD SAVED PAGES
// =========================================

async function loadPages() {
  if (!user) return;

  const wrap = $('myPages');

  wrap.textContent =
    'Loading your pages...';

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
      const row = element(
        'div',
        'pageRow'
      );

      const link = element(
        'a',
        '',
        page.title
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

      editButton.onclick = () =>
        editPage(page.id);

      const deleteButton = element(
        'button',
        'ghost',
        'Delete'
      );

      deleteButton.type = 'button';

      deleteButton.onclick = () =>
        deletePage(page.id);

      actions.append(
        editButton,
        deleteButton
      );

      row.append(
        link,
        actions
      );

      wrap.append(row);
    }

  } catch (error) {
    wrap.textContent =
      'Error: ' + getErrorMessage(error);
  }
}

// =========================================
// 8. EDIT PAGE
// =========================================

async function editPage(id) {
  if (!user) return;

  status('Loading page...');

  try {
    const { data, error } = await db
      .from('pages')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;

    editingId = id;

    imageUrl =
      data.image_url || '';

    imagePath =
      data.image_path || '';

    imageFile = null;

    clearLocalImage();

    $('image').value = '';

    const defaults = {
      background: '#0b1020',
      accent: '#8b5cf6',
      textColor: '#ffffff'
    };

    for (const key of keys) {
      $(key).value =
        data[key] ||
        defaults[key] ||
        '';
    }

    $('result').hidden = true;

    preview();

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    status('Editing existing page.');

  } catch (error) {
    status(
      'Error: ' + getErrorMessage(error)
    );
  }
}

// =========================================
// 9. DELETE PAGE
// =========================================

async function deletePage(id) {
  if (!user) return;

  const confirmed = confirm(
    'Delete this page permanently?'
  );

  if (!confirmed) return;

  status('Deleting page...');

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

    // Delete associated image

    if (page?.image_path) {
      const { error: storageError } =
        await db.storage
          .from('page-images')
          .remove([
            page.image_path
          ]);

      if (storageError) {
        console.warn(
          'Image cleanup failed:',
          storageError.message
        );
      }
    }

    if (editingId === id) {
      clearEditor();
    }

    await loadPages();

    status(
      'Page deleted successfully.'
    );

  } catch (error) {
    status(
      'Delete failed: ' +
      getErrorMessage(error)
    );
  }
}

// =========================================
// 10. PUBLISH OR UPDATE PAGE
// =========================================

async function publish() {
  if (!user) {
    status('Please sign in first.');
    return;
  }

  const title =
    $('title').value.trim();

  if (!title) {
    status('Please enter a page title.');
    return;
  }

  const publishButton = $('publish');

  publishButton.disabled = true;

  status('Publishing your page...');

  let uploadedPath = '';
  let saved = false;

  try {
    let newImageUrl = imageUrl;
    let newImagePath = imagePath;

    // Upload new image if selected

    if (imageFile) {
      const types = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp'
      };

      const extension =
        types[imageFile.type];

      if (!extension) {
        throw new Error(
          'Unsupported image type.'
        );
      }

      if (
        imageFile.size >
        5 * 1024 * 1024
      ) {
        throw new Error(
          'Image must be under 5 MB.'
        );
      }

      status('Uploading image...');

      uploadedPath =
        `${user.id}/${crypto.randomUUID()}.${extension}`;

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

      if (uploadError) {
        throw uploadError;
      }

      const { data: imageData } =
        db.storage
          .from('page-images')
          .getPublicUrl(
            uploadedPath
          );

      newImageUrl =
        imageData.publicUrl;

      newImagePath =
        uploadedPath;
    }

    status('Saving website...');

    // Build database record

    const payload = {
      ...dataFromForm(),
      image_url: newImageUrl,
      image_path: newImagePath,
      user_id: user.id
    };

    let result;

    if (editingId) {
      // Update existing page

      result = await db
        .from('pages')
        .update(payload)
        .eq('id', editingId)
        .eq('user_id', user.id)
        .select('id')
        .single();

    } else {
      // Create new page

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

    const pageId =
      result.data.id;

    const previousImagePath =
      imagePath;

    editingId = pageId;

    imageUrl = newImageUrl;
    imagePath = newImagePath;

    imageFile = null;

    clearLocalImage();

    $('image').value = '';

    // Clean up old replaced image

    if (
      uploadedPath &&
      previousImagePath &&
      previousImagePath !== newImagePath
    ) {
      const { error: cleanupError } =
        await db.storage
          .from('page-images')
          .remove([
            previousImagePath
          ]);

      if (cleanupError) {
        console.warn(
          cleanupError.message
        );
      }
    }

    // Generate public link

    const url =
      publicUrl(pageId);

    $('shareUrl').value = url;

    $('openPage').href = url;

    $('result').hidden = false;

    // Generate QR code

    if (
      window.QRCode &&
      typeof QRCode.toCanvas === 'function'
    ) {
      try {
        await QRCode.toCanvas(
          $('qr'),
          url,
          {
            width: 220,
            margin: 2
          }
        );

        $('downloadQR').href =
          $('qr').toDataURL(
            'image/png'
          );

        $('downloadQR').download =
          'pageforge-qr.png';

      } catch (qrError) {
        console.warn(
          'QR generation failed:',
          qrError
        );
      }
    }

    status(
      'Page published successfully!'
    );

    await loadPages();

  } catch (error) {
    // Remove image only if database
    // saving was unsuccessful

    if (
      uploadedPath &&
      !saved
    ) {
      await db.storage
        .from('page-images')
        .remove([
          uploadedPath
        ]);
    }

    status(
      'Publishing failed: ' +
      getErrorMessage(error)
    );

    console.error(error);

  } finally {
    publishButton.disabled = false;
  }
}

// =========================================
// 11. AUTHENTICATION SESSION
// =========================================

async function refreshAuth() {
  try {
    const {
      data: { user: current },
      error
    } = await db.auth.getUser();

    if (error) throw error;

    user = current;

    $('auth').hidden = !!user;
    $('editor').hidden = !user;
    $('logout').hidden = !user;

    if (user) {
      await loadPages();
    }

  } catch (error) {
    console.error(
      'Authentication error:',
      error
    );

    status(
      'Authentication error: ' +
      getErrorMessage(error)
    );
  }
}

// =========================================
// 12. SIGNUP / LOGIN
// =========================================

async function authenticate(mode) {
  const email =
    $('email').value.trim();

  const password =
    $('password').value;

  if (!email || !password) {
    alert(
      'Please enter email and password.'
    );
    return;
  }

  if (password.length < 6) {
    alert(
      'Password must contain at least 6 characters.'
    );
    return;
  }

  const signInButton =
    $('signin');

  const signUpButton =
    $('signup');

  signInButton.disabled = true;
  signUpButton.disabled = true;

  try {
    let result;

    if (mode === 'signup') {
      result = await db.auth.signUp({
        email,
        password
      });

    } else {
      result =
        await db.auth.signInWithPassword({
          email,
          password
        });
    }

    if (result.error) {
      throw result.error;
    }

    if (
      mode === 'signup' &&
      !result.data.session
    ) {
      alert(
        'Account created. Check your email to confirm your account.'
      );
    }

    await refreshAuth();

  } catch (error) {
    alert(
      'Authentication failed: ' +
      getErrorMessage(error)
    );

    console.error(error);

  } finally {
    signInButton.disabled = false;
    signUpButton.disabled = false;
  }
}

// =========================================
// 13. DISPLAY PUBLIC PAGE
// =========================================

async function showPublic(id) {
  $('builder').hidden = true;

  $('publicPage').hidden = false;

  const target =
    $('publishedContent');

  target.textContent =
    'Loading webpage...';

  try {
    const { data, error } = await db
      .from('pages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      throw new Error(
        'Page not found.'
      );
    }

    document.title =
      data.title + ' | PageForge';

    render(
      target,
      data,
      data.image_url
    );

  } catch (error) {
    target.textContent =
      'Unable to load page: ' +
      getErrorMessage(error);
  }
}

// =========================================
// 14. IMAGE UPLOAD PREVIEW
// =========================================

function handleImage(event) {
  const file =
    event.target.files[0];

  if (!file) return;

  const allowed = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ];

  if (
    !allowed.includes(file.type) ||
    file.size > 5 * 1024 * 1024
  ) {
    alert(
      'Choose JPG, PNG or WEBP under 5 MB.'
    );

    event.target.value = '';
    return;
  }

  imageFile = file;

  clearLocalImage();

  localImage =
    URL.createObjectURL(file);

  preview();
}

// =========================================
// 15. INITIALIZE PAGEFORGE
// =========================================

async function init() {
  // Detect public page URL

  const pageId =
    new URLSearchParams(
      window.location.search
    ).get('page');

  if (pageId) {
    await showPublic(pageId);
    return;
  }

  // Sign in button

  $('signin').onclick = () =>
    authenticate('signin');

  // Sign up button

  $('signup').onclick = () =>
    authenticate('signup');

  // Logout button

  $('logout').onclick = async () => {
    const { error } =
      await db.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    user = null;

    clearEditor();

    await refreshAuth();
  };

  // Publish button

  $('publish').onclick = publish;

  // New page button

  $('reset').onclick = clearEditor;

  // Copy URL

  $('copy').onclick = async () => {
    const url =
      $('shareUrl').value;

    try {
      await navigator.clipboard.writeText(
        url
      );

      status(
        'URL copied successfully!'
      );

    } catch {
      $('shareUrl').select();

      status(
        'Select and copy the URL.'
      );
    }
  };

  // Live preview inputs

  for (const key of keys) {
    $(key).addEventListener(
      'input',
      preview
    );
  }

  // Image input

  $('image').addEventListener(
    'change',
    handleImage
  );

  // Render initial preview

  preview();

  // Load authentication session

  await refreshAuth();

  // Listen for login/logout

  db.auth.onAuthStateChange(() => {
    setTimeout(
      refreshAuth,
      0
    );
  });
}

// =========================================
// 16. START APPLICATION
// =========================================

window.addEventListener(
  'DOMContentLoaded',
  init
);
