/* Starter Restaurant Studio navigation - gated workflow */
(() => {
  'use strict';
  const PAGES = ['restaurants','settings','design','categories','products','qr'];
  const $ = id => document.getElementById(id);
  let current = 'restaurants';
  let ready = false;
  const status = { settings:false, design:false, categories:false, products:false };
  const order = ['settings','design','categories','products','qr'];
  const gates = { design:'settings', categories:'design', products:'categories', qr:'products' };
  function refresh() {
    document.querySelectorAll('[data-go]').forEach(b => {
      const gate = gates[b.dataset.go];
      b.disabled = !!gate && !status[gate];
      b.title = b.disabled ? 'Complete and save this step first' : '';
    });
    document.querySelectorAll('.studio-nav [data-screen]').forEach(b => {
      const page = b.dataset.screen;
      const gate = gates[page];
      b.disabled = !!gate && !status[gate];
      b.classList.toggle('active',page === current);
      if (page === current) b.setAttribute('aria-current','page');
      else b.removeAttribute('aria-current');
    });
  }
  function navigate(page, updateHash=true) {
    if (!PAGES.includes(page)) page='restaurants';
    if (!ready && page !== 'restaurants') page='restaurants';
    if (page !== 'restaurants' && page !== 'settings') {
      const idx=order.indexOf(page);
      for (let i=1;i<=idx;i++) {
        if (!status[order[i-1]]) { page=order[i-1]; break; }
      }
    }
    current=page;
    const editor=$('editor');
    if (editor) { editor.hidden=page==='restaurants'; editor.style.display=page==='restaurants'?'none':'block'; }
    document.querySelectorAll('.studio-screen[data-page]').forEach(s => {
      const show=s.dataset.page===page;
      s.hidden=!show; s.style.display=show?'block':'none';
    });
    refresh();
    if (updateHash) history.replaceState(null,'','#'+page);
    window.scrollTo(0,0);
  }
  window.pfNavigate=navigate;
  window.pfStudio={
    setReady(v){ ready=!!v; if (!ready) this.reset(); else refresh(); },
    setStep(step,v){ if (Object.prototype.hasOwnProperty.call(status,step)) { status[step]=!!v; refresh(); } },
    getStep(step){ return !!status[step]; },
    reset(){ Object.keys(status).forEach(k=>status[k]=false); refresh(); },
    go: navigate
  };
  function setup() {
    document.addEventListener('click',e=>{
      const b=e.target.closest('button');
      if (!b || b.disabled) return;
      const target=b.dataset.screen||b.dataset.go;
      if (target) { e.preventDefault(); navigate(target); return; }
      if (b.id==='newRestaurant') navigate('settings');
    });
    $('saveDesignShortcut')?.addEventListener('click',()=> $('saveRestaurant')?.click());
    window.addEventListener('hashchange',()=>navigate(location.hash.slice(1),false));
    navigate('restaurants',false);
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',setup);
  else setup();
})();
