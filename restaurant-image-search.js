/* PageForge Pixabay image picker. Requires config.js, restaurant-builder.js and a signed-in user. */
(() => {
  const $ = id => document.getElementById(id);
  const presets = ['Paneer','Biryani','Pizza','Burger','Dosa','Momos','Noodles','Coffee'];
  let results = [];
  let chosen = null;
  let timer = null;
  let requestNo = 0;
  window.pfSelectedPixabay = null;
  const status = text => { if ($('pfPhotoStatus')) $('pfPhotoStatus').textContent = text; };
  function clearSelection() {
    chosen = null;
    window.pfSelectedPixabay = null;
    $('pfPhotoSelected').hidden = true;
    document.querySelectorAll('.pf-photo-card').forEach(b => b.setAttribute('aria-pressed', 'false'));
  }
  window.pfClearSelectedPixabay = clearSelection;
  function selectImage(image, button) {
    clearSelection();
    chosen = image;
    window.pfSelectedPixabay = image;
    $('pfPhotoSelectedImg').src = image.thumbnail || image.preview;
    $('pfPhotoCredit').textContent = 'Photo by ' + (image.creator || 'Pixabay contributor');
    $('pfPhotoSelected').hidden = false;
    button.setAttribute('aria-pressed','true');
    status('Photo selected. Tap Save dish to attach it.');
    $('pfPhotoSelected').scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  function render(images) {
    const grid = $('pfPhotoGrid'); grid.replaceChildren();
    for (const image of images) {
      if (!image.preview || !image.thumbnail) continue;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pf-photo-card'; b.setAttribute('aria-pressed','false');
      const img = document.createElement('img'); img.src = image.preview; img.alt = 'Food photo'; img.loading = 'lazy';
      const credit = document.createElement('small'); credit.textContent = image.creator || 'Pixabay';
      b.append(img,credit); b.onclick = () => selectImage(image,b); grid.append(b);
    }
    status(grid.children.length ? `${grid.children.length} photos found. Tap one to select.` : 'No matching photos. Try another search.');
  }
  async function search() {
    const query = $('pfPhotoQuery').value.trim();
    if (query.length < 2) { status('Enter at least 2 characters.'); return; }
    const db = window.pfDb;
    if (!db) { status('Supabase not connected.'); return; }
    const seq = ++requestNo;
    $('pfPhotoSearch').disabled = true;
    status('Searching photos…');
    try {
      const {data:sessionData,error:sessionError} = await db.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) throw Error('Sign in to PageForge first.');
      const {data,error} = await db.functions.invoke('smooth-handler',{body:{query}});
      if (error) {
        if (error.context?.json) {
          const details = await error.context.json().catch(()=>null);
          throw Error(details?.error || error.message);
        }
        throw error;
      }
      if (seq !== requestNo) return;
      results = Array.isArray(data?.images) ? data.images : [];
      render(results);
    } catch (e) { if (seq === requestNo) status('Search failed: ' + e.message); }
    finally { if (seq === requestNo) $('pfPhotoSearch').disabled = false; }
  }
  /* The original Pixabay photo should be downloaded to owned storage, not permanently hotlinked. */
  window.pfUploadSelectedPixabay = async function(userId) {
    if (!chosen) return null;
    const db = window.pfDb;
    if (!db || !userId) throw Error('Sign in before saving images.');
    status('Saving selected photo to restaurant storage…');
    // The Edge Function returns webformatURL as thumbnail. Pixabay allows temporary previews;
    // downloading the selected image for rehosting is subject to Pixabay licensing and API terms.
    const imageUrl = chosen.thumbnail;
    const parsed = new URL(imageUrl);
    if (parsed.protocol !== 'https:' || !['pixabay.com','cdn.pixabay.com'].some(h=>parsed.hostname===h || parsed.hostname.endsWith('.'+h))) {
      throw Error('Unexpected image host. Please upload a local image instead.');
    }
    let response;
    try { response = await fetch(imageUrl, {mode:'cors'}); }
    catch { throw Error('This photo cannot be downloaded in your browser. Download an allowed photo from its Pixabay page and use the regular image upload.'); }
    if (!response.ok) throw Error('Could not download selected photo. Use regular upload instead.');
    const blob = await response.blob();
    if (!blob.type.startsWith('image/') || blob.size > 5 * 1024 * 1024) throw Error('Selected image is unsupported or larger than 5 MB.');
    const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const {error} = await db.storage.from('restaurant-images').upload(path, blob, {contentType:blob.type,upsert:false});
    if (error) throw error;
    const {data} = db.storage.from('restaurant-images').getPublicUrl(path);
    return {url:data.publicUrl,path};
  };
  function setup() {
    if (!$('pfPhotoSearch')) return;
    $('pfPhotoSearch').onclick = search;
    $('pfPhotoRemove').onclick = () => { clearSelection(); status('Photo selection removed.'); };
    $('pfPhotoQuery').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); search(); } });
    $('pfPhotoQuery').addEventListener('input', () => {
      clearTimeout(timer);
      const q = $('pfPhotoQuery').value.trim();
      if (q.length >= 3) timer = setTimeout(search, 650);
    });
    const suggestions = $('pfPhotoSuggestions');
    for (const word of presets) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = word;
      b.onclick = () => { $('pfPhotoQuery').value = word; search(); };
      suggestions.append(b);
    }
    $('itemName')?.addEventListener('blur', () => {
      if (!$('pfPhotoQuery').value.trim() && $('itemName').value.trim()) $('pfPhotoQuery').value = $('itemName').value.trim();
    });
    $('itemImage')?.addEventListener('change', () => {
      if ($('itemImage').files.length) clearSelection();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',setup);
  else setup();
})();
