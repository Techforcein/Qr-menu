// Publishable key only. NEVER put service_role or secret keys in browser files.
window.PF_CONFIG = Object.freeze({
  url: 'https://uzrdwnfvdanaohrwrybt.supabase.co',
  key: 'sb_publishable_SndQ_tuEBtqvIGMSmdiQ-Q_vg8-zJWP'
});
window.pfDb = window.supabase.createClient(window.PF_CONFIG.url, window.PF_CONFIG.key);
