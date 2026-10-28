
const $ = id => document.getElementById(id);
const db = window.pfDb;

let user = null;
let restaurant = null;
let categories = [];
let items = [];
let savingItem = false;

const indian = [
  'Starters', 'Main Course', 'Roti & Breads',
  'Rice & Biryani', 'South Indian', 'Chinese',
  'Fast Food', 'Desserts', 'Beverages'
];

const themes = [
  ['royal','Royal Dine','#d4af37','#101015','#f9edcd','Premium editorial'],
  ['quickbite','QuickBite','#f65b24','#fff5e9','#33251d','Fast-food grid'],
  ['desi','Desi Kitchen','#25874b','#f5f9ed','#203b29','Compact Indian list'],
  ['cafe','Café Studio','#926342','#f3e8d9','#39291f','Warm café cards'],
  ['tokyo','Tokyo Sushi','#cb3c3c','#fffafa','#25212a','Japanese minimal'],
  ['neon','Neon Night','#c65cff','#0c0920','#f8f3ff','Glowing dark'],
  ['pizza','Pizza House','#dc3e32','#fff2df','#3a251e','Bold pizza cards'],
  ['fresh','Fresh Bowl','#51a66a','#f3fff1','#203d2a','Fresh and airy'],
  ['steak','Steakhouse','#bd7769','#1c1216','#fff0e9','Dark horizontal'],
  ['bakery','Sweet Bakery','#dc83a1','#fff2f5','#4c303b','Pastel bakery'],
  ['street','Street Eats','#edb929','#fff6d7','#312319','Street-food bold'],
  ['ocean','Ocean Blue','#288fbd','#edfaff','#163848','Seafood cards'],
  ['minimal','Pure Minimal','#202020','#ffffff','#202020','Editorial list'],
  ['maharaja','Maharaja','#e6a13e','#4c1424','#fff1da','Traditional royal'],
  ['bubble','Bubble Pop','#ad6bdd','#f9f0ff','#39294b','Playful rounded'],
  ['classic','Classic Light','#e85d04','#fffaf4','#202020','Original classic'],
  ['midnight','Midnight Dine','#b47cff','#101827','#f5f5f5','Original dark'],
  ['spice','Spice Pop','#e64b21','#fff6e4','#442416','Original spice'],
  ['custom','Custom','#e85d04','#fffaf4','#202020','Custom colors']
];

const boolFields = [
  'showSearch', 'showImages', 'showDiscounts',
  'showVegLabels', 'requireTable'
];

function msg(s) {
  $('message').textContent = s;
}

function err(e) {
  msg('Error: ' + (e?.message || e));
  console.error(e);
}

function el(t, s) {
  const x = document.createElement(t);
  if (s !== undefined) x.textContent = s;
  return x;
}

function clearPixabay() {
  window.pfClearSelectedPixabay?.();
}

function menuLink(id) {
  const u = new URL('restaurant-menu.html', location.href);
  u.searchParams.set('id', id);
  return u.href;
}

function defaultDesign() {
  return {
    layout: 'auto',
    headerStyle: 'auto',
    cardRadius: 18,
    fontStyle: 'auto',
    showSearch: true,
    showImages: true,
    showDiscounts: true,
    showVegLabels: true,
    requireTable: true
  };
}

function readDesign() {
  const d = {
    layout: $('layout').value,
    headerStyle: $('headerStyle').value,
    cardRadius: Number($('cardRadius').value),
    fontStyle: $('fontStyle').value
  };
  for (const k of boolFields) d[k] = $(k).value === 'true';
  return d;
}

function fillDesign(d = {}) {
  d = { ...defaultDesign(), ...d };
  for (const k of [
    'layout', 'headerStyle', 'cardRadius',
    'fontStyle', ...boolFields
  ]) {
    $(k).value = String(d[k]);
  }
}

function buildGallery() {
  const box = $('templateGallery');
  box.replaceChildren();
  $('template').replaceChildren();

  for (const [id, name, accent, bg, ink, desc] of themes) {
    $('template').add(new Option(name, id));

    const b = el('button');
    b.type = 'button';
    b.className = 'templateTile';
    b.dataset.theme = id;
    b.style.setProperty('--tile-accent', accent);
    b.style.setProperty('--tile-bg', bg);
    b.style.setProperty('--tile-ink', ink);

    const sample = el('span');
    sample.className = 'templateSample';
    sample.append(el('i'), el('i'), el('i'));

    b.append(
      sample,
      el('strong', name),
      el('small', desc)
    );

    b.onclick = () => {
      $('template').value = id;
      applyPreset();
      renderPreview();
    };

    box.append(b);
  }
}

function applyPreset() {
  const t = themes.find(x => x[0] === $('template').value);
  if (t && t[0] !== 'custom') {
    $('accent').value = t[2];
    $('background').value = t[3];
    $('textColor').value = t[4];
  }
}

function renderPreview() {
  for (const b of document.querySelectorAll('.templateTile')) {
    b.classList.toggle(
      'selected',
      b.dataset.theme === $('template').value
    );
  }

  const p = $('designPreview');
  p.replaceChildren();
  p.style.background = $('background').value;
  p.style.color = $('textColor').value;
  p.style.setProperty('--preview-accent', $('accent').value);

  const h = el('div', '🍽️ ' + ($('name').value || 'Your Restaurant'));
  h.className = 'previewHeader';

  const c = el('div', 'Starters   •   Main Course   •   Desserts');
  c.className = 'previewCategories';

  const food = el('div');
  food.className = 'previewFood';

  for (const name of ['Signature Dish', 'Chef Special']) {
    const item = el('div');
    item.className = 'previewItem';
    item.style.borderRadius = $('cardRadius').value + 'px';

    item.append(
      el('span', '🍲'),
      el('strong', name),
      el('small', '₹199')
    );
    food.append(item);
  }

  p.append(h, c, food);
  p.dataset.layout = $('layout').value;
  p.dataset.theme = $('template').value;
}

function clearRestaurantForm() {
  for (const k of ['name', 'whatsapp', 'tagline', 'address']) {
    $(k).value = '';
  }
  $('template').value = 'classic';
  $('logo').value = '';
  applyPreset();
  fillDesign();
  renderPreview();
}

async function owned(id) {
  const { data, error } = await db.from('restaurants')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  return data;
}

async function init() {
  try {
    if (!db) throw Error('Supabase library unavailable');

    const { data: { user: u }, error } = await db.auth.getUser();
    if (error) throw error;

    if (!u) {
      msg('Sign in on PageForge first.');
      const a = el('a', 'Go to login');
      a.href = './';
      $('message').append(' ', a);
      return;
    }

    user = u;
    buildGallery();
    bind();
    $('studio').hidden = false;

    msg('Signed in. Create or select a restaurant.');
    await listRestaurants();

    const id = new URLSearchParams(location.search).get('id');
    if (id) await selectRestaurant(id);

  } catch (e) {
    err(e);
  }
}

function bind() {
  $('newRestaurant').onclick = () => {
    restaurant = null;
    $('editor').hidden = false;
    clearRestaurantForm();
    clearItemForm();

    categories = [];
    items = [];

    renderCategories();
    renderItems();

    $('menuUrl').value = '';
    $('openMenu').removeAttribute('href');
    $('qr').getContext('2d').clearRect(0, 0, 220, 220);

    msg('New restaurant: enter details and save first.');
  };

  $('saveRestaurant').onclick = saveRestaurant;
  $('publishRestaurant').onclick = togglePublish;
  $('deleteRestaurant').onclick = deleteRestaurant;

  $('addCategory').onclick = () => addCategory($('categoryName').value);
  $('seedCategories').onclick = seedCategories;

  $('saveItem').onclick = saveItem;
  $('clearItem').onclick = clearItemForm;

  $('copyLink').onclick = async () => {
    try {
      await navigator.clipboard.writeText($('menuUrl').value);
      msg('Menu URL copied');
    } catch {
      $('menuUrl').select();
      msg('Select and copy URL manually');
    }
  };

  $('template').onchange = () => {
    applyPreset();
    renderPreview();
  };

  for (const id of [
    'name', 'accent', 'background',
    'textColor', 'layout', 'cardRadius'
  ]) {
    $(id).addEventListener('input', renderPreview);
  }
}

async function listRestaurants() {
  const { data, error } = await db.from('restaurants')
    .select('id,name,published')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const box = $('restaurants');
  box.replaceChildren();

  for (const r of data) {
    const row = el('div');
    row.className = 'itemrow';

    const b = el('button', 'Manage');
    b.onclick = () => selectRestaurant(r.id);

    row.append(
      el('span', r.name + ' · ' + (r.published ? 'Published' : 'Draft')),
      b
    );

    box.append(row);
  }

  if (!data.length) box.textContent = 'No restaurants yet.';
}

async function selectRestaurant(id) {
  try {
    restaurant = await owned(id);
    $('editor').hidden = false;

    clearItemForm();

    for (const k of ['name', 'whatsapp', 'tagline', 'address']) {
      $(k).value = restaurant[k] || '';
    }

    $('template').value = themes.some(t => t[0] === restaurant.template)
      ? restaurant.template
      : 'classic';

    $('accent').value = restaurant.accent || '#e85d04';
    $('background').value = restaurant.background || '#fffaf4';
    $('textColor').value = restaurant.text_color || '#202020';
    $('logo').value = '';

    fillDesign(restaurant.design_settings);
    renderPreview();

    await loadChildren();
    await share();

    msg('Managing ' + restaurant.name);

  } catch (e) {
    err(e);
  }
}

function validateWhatsApp(raw) {
  const n = raw.replace(/\D/g, '');

  if (!/^\d{10,15}$/.test(n)) {
    throw Error(
      'Enter WhatsApp number with country code, e.g. 919876543210'
    );
  }
  return n;
}

async function upload(file) {
  if (!file) return null;

  if (
    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
    file.size > 5 * 1024 * 1024
  ) {
    throw Error('Use JPG, PNG or WEBP under 5 MB');
  }

  const ext = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
  }[file.type];

  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await db.storage
    .from('restaurant-images')
    .upload(path, file, { contentType: file.type });

  if (error) throw error;

  const { data } = db.storage
    .from('restaurant-images')
    .getPublicUrl(path);

  return { url: data.publicUrl, path };
}

async function saveRestaurant() {
  let uploaded = null;

  try {
    const name = $('name').value.trim();
    if (!name) throw Error('Restaurant name required');

    const payload = {
      name,
      whatsapp: validateWhatsApp($('whatsapp').value),
      tagline: $('tagline').value.trim(),
      address: $('address').value.trim(),
      template: $('template').value,
      accent: $('accent').value,
      background: $('background').value,
      text_color: $('textColor').value,
      design_settings: readDesign(),
      user_id: user.id
    };

    msg('Saving restaurant...');

    uploaded = await upload($('logo').files[0]);
    if (uploaded) payload.logo_url = uploaded.url;

    const result = restaurant
      ? await db.from('restaurants')
          .update(payload)
          .eq('id', restaurant.id)
          .eq('user_id', user.id)
          .select()
          .single()
      : await db.from('restaurants')
          .insert(payload)
          .select()
          .single();

    if (result.error) throw result.error;

    restaurant = result.data;
    uploaded = null;
    $('logo').value = '';

    await listRestaurants();
    await loadChildren();
    await share();

    msg('Restaurant and design saved.');

  } catch (e) {
    if (uploaded) {
      await db.storage.from('restaurant-images')
        .remove([uploaded.path]);
    }
    err(e);
  }
}

async function togglePublish() {
  try {
    if (!restaurant) throw Error('Save restaurant first');

    const next = !restaurant.published;

    const { error } = await db.from('restaurants')
      .update({ published: next })
      .eq('id', restaurant.id)
      .eq('user_id', user.id);

    if (error) throw error;

    restaurant.published = next;
    await listRestaurants();

    msg(next ? 'Menu published!' : 'Menu unpublished.');

  } catch (e) {
    err(e);
  }
}

async function deleteRestaurant() {
  if (
    !restaurant ||
    !confirm('Permanently delete restaurant, categories and dishes?')
  ) return;

  try {
    const { error } = await db.from('restaurants')
      .delete()
      .eq('id', restaurant.id)
      .eq('user_id', user.id);

    if (error) throw error;

    restaurant = null;
    clearItemForm();
    $('editor').hidden = true;

    await listRestaurants();
    msg('Restaurant deleted. Image files may need manual cleanup in Storage.');

  } catch (e) {
    err(e);
  }
}

async function loadChildren() {
  if (!restaurant) return;

  const [c, i] = await Promise.all([
    db.from('restaurant_categories')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('sort_order'),
    db.from('restaurant_items')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('sort_order')
  ]);

  if (c.error) throw c.error;
  if (i.error) throw i.error;

  categories = c.data;
  items = i.data;

  renderCategories();
  renderItems();
}

function renderCategories() {
  const box = $('categories');
  const sel = $('itemCategory');

  box.replaceChildren();
  sel.replaceChildren();
  sel.append(new Option('Uncategorized', ''));

  for (const c of categories) {
    sel.append(new Option(c.name, c.id));

    const row = el('div');
    row.className = 'itemrow';
    row.append(el('span', c.name));

    const b = el('button', 'Delete');
    b.className = 'danger';
    b.onclick = () => deleteCategory(c.id);

    row.append(b);
    box.append(row);
  }
}

async function addCategory(raw) {
  try {
    if (!restaurant) throw Error('Save restaurant first');

    const name = raw.trim();
    if (!name) throw Error('Enter category name');

    if (
      categories.some(c => c.name.toLowerCase() === name.toLowerCase())
    ) return;

    const { error } = await db.from('restaurant_categories')
      .insert({
        restaurant_id: restaurant.id,
        name,
        sort_order: categories.length
      });

    if (error) throw error;

    $('categoryName').value = '';
    await loadChildren();
    msg('Category added.');

  } catch (e) {
    err(e);
  }
}

async function seedCategories() {
  try {
    if (!restaurant) throw Error('Save restaurant first');

    const missing = indian.filter(n =>
      !categories.some(c => c.name.toLowerCase() === n.toLowerCase())
    );

    if (missing.length) {
      const { error } = await db.from('restaurant_categories')
        .insert(missing.map((name, i) => ({
          restaurant_id: restaurant.id,
          name,
          sort_order: categories.length + i
        })));

      if (error) throw error;
    }

    await loadChildren();
    msg('Indian categories ready.');

  } catch (e) {
    err(e);
  }
}

async function deleteCategory(id) {
  if (!confirm('Delete category? Dishes become uncategorized.')) return;

  try {
    const { error } = await db.from('restaurant_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await loadChildren();

  } catch (e) {
    err(e);
  }
}

function clearItemForm() {
  for (const id of [
    'editingItem', 'itemName', 'itemDescription', 'mrp', 'price'
  ]) {
    $(id).value = '';
  }

  $('itemImage').value = '';
  $('veg').value = 'true';
  $('available').value = 'true';
  $('itemCategory').value = '';

  // NEW: clear previously selected Pixabay image
  clearPixabay();
}

function renderItems() {
  const box = $('items');
  box.replaceChildren();

  for (const i of items) {
    const row = el('div');
    row.className = 'itemrow';

    if (i.image_url) {
      const im = el('img');
      im.src = i.image_url;
      im.alt = i.name;
      im.loading = 'lazy';
      row.append(im);
    }

    const info = el('div');
    info.className = 'details';

    info.append(
      el('strong', i.name),
      el(
        'div',
        `₹${i.price} (MRP ₹${i.mrp}) · ${
          i.available ? 'Available' : 'Sold out'
        }`
      )
    );

    const b = el('button', 'Edit');
    b.className = 'secondary';
    b.onclick = () => editItem(i);

    const d = el('button', 'Delete');
    d.className = 'danger';
    d.onclick = () => deleteItem(i);

    row.append(info, b, d);
    box.append(row);
  }

  if (!items.length) box.textContent = 'No dishes yet.';
}

function editItem(i) {
  // NEW: prevent an old Pixabay selection being used for this dish
  clearPixabay();

  $('editingItem').value = i.id;
  $('itemName').value = i.name;
  $('itemDescription').value = i.description || '';
  $('mrp').value = i.mrp;
  $('price').value = i.price;
  $('itemCategory').value = i.category_id || '';
  $('veg').value = String(i.veg);
  $('available').value = String(i.available);
  $('itemImage').value = '';

  msg('Editing ' + i.name);
  $('itemName').scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
}

async function saveItem() {
  if (savingItem) return;

  let uploaded = null;
  let databaseSaved = false;

  savingItem = true;
  $('saveItem').disabled = true;

  try {
    if (!restaurant) throw Error('Save restaurant first');

    const name = $('itemName').value.trim();
    const mrp = Number($('mrp').value);
    const price = Number($('price').value);

    if (!name) throw Error('Dish name required');

    if (
      $('mrp').value === '' ||
      $('price').value === '' ||
      !Number.isFinite(mrp) ||
      !Number.isFinite(price) ||
      mrp < 0 ||
      price < 0 ||
      mrp < price
    ) {
      throw Error('MRP must be at least discounted price');
    }

    const payload = {
      restaurant_id: restaurant.id,
      name,
      description: $('itemDescription').value.trim(),
      category_id: $('itemCategory').value || null,
      mrp,
      price,
      veg: $('veg').value === 'true',
      available: $('available').value === 'true'
    };

    const localFile = $('itemImage').files[0];

    // NEW: choose between manual upload and Pixabay
    if (localFile) {
      msg('Uploading your food image...');
      uploaded = await upload(localFile);
    } else if (window.pfSelectedPixabay) {
      if (typeof window.pfUploadSelectedPixabay !== 'function') {
        throw Error('Pixabay image search script is not loaded.');
      }

      msg('Saving selected Pixabay image...');
      uploaded = await window.pfUploadSelectedPixabay(user.id);
    }

    if (uploaded) {
      payload.image_url = uploaded.url;
      payload.image_path = uploaded.path;
    }

    const id = $('editingItem').value;

    msg(id ? 'Updating dish...' : 'Creating dish...');

    const result = id
      ? await db.from('restaurant_items')
          .update(payload)
          .eq('id', id)
          .eq('restaurant_id', restaurant.id)
          .select()
          .single()
      : await db.from('restaurant_items')
          .insert(payload)
          .select()
          .single();

    if (result.error) throw result.error;

    databaseSaved = true;
    uploaded = null;

    clearItemForm();

    try {
      await loadChildren();
      msg('Dish saved successfully!');
    } catch (refreshError) {
      console.error('Dish saved but refresh failed:', refreshError);
      msg('Dish saved. Refresh the page to see the latest list.');
    }

  } catch (e) {
    if (uploaded && !databaseSaved) {
      try {
        await db.storage.from('restaurant-images')
          .remove([uploaded.path]);
      } catch (cleanupError) {
        console.error('Image cleanup failed:', cleanupError);
      }
    }

    err(e);

  } finally {
    savingItem = false;
    $('saveItem').disabled = false;
  }
}

async function deleteItem(i) {
  if (!confirm('Delete ' + i.name + '?')) return;

  try {
    const { error } = await db.from('restaurant_items')
      .delete()
      .eq('id', i.id)
      .eq('restaurant_id', restaurant.id);

    if (error) throw error;

    if (i.image_path) {
      await db.storage.from('restaurant-images')
        .remove([i.image_path]);
    }

    await loadChildren();
    msg('Dish deleted.');

  } catch (e) {
    err(e);
  }
}

async function share() {
  if (!restaurant) return;

  const url = menuLink(restaurant.id);
  $('menuUrl').value = url;
  $('openMenu').href = url;

  if (window.QRCode?.toCanvas) {
    await window.QRCode.toCanvas(
      $('qr'),
      url,
      { width: 220, margin: 2 }
    );

    $('downloadQr').href = $('qr').toDataURL('image/png');
  } else {
    msg('QR library unavailable; link still works.');
  }
}

window.addEventListener('DOMContentLoaded', init);