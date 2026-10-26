/* Starter access gate. Load after config.js. Call StarterAccess.start() on protected dashboard pages. */
window.StarterAccess = (() => {
  let timer=null, requestInProgress=false;
  const overlayId='starter-expired-overlay';
  function showExpired(){
    if(document.getElementById(overlayId))return;
    const box=document.createElement('div');box.id=overlayId;
    box.setAttribute('role','alertdialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Starter plan expired');
    box.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#f5f6fb;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,sans-serif;color:#20243a';
    const inner=document.createElement('div');inner.style.cssText='max-width:420px;width:100%;padding:32px;background:white;border-radius:18px;box-shadow:0 10px 40px #20243a20;text-align:center';
    const h=document.createElement('h2');h.textContent='Your Starter plan has expired';
    const p=document.createElement('p');p.textContent='Recharge to continue using Starter. Your saved projects are not deleted.';p.style.cssText='line-height:1.6;color:#576079';
    const a=document.createElement('a');a.textContent='Contact support to recharge';a.href='mailto:support@example.com';a.style.cssText='display:inline-block;background:#6344df;color:white;padding:13px 20px;border-radius:10px;text-decoration:none';
    // Replace support@example.com with your real support contact before publishing.
    inner.append(h,p,a);box.append(inner);document.body.append(box);
  }
  function hideExpired(){document.getElementById(overlayId)?.remove();}
  async function check(){
    if(requestInProgress)return;requestInProgress=true;
    try{
      const db=window.pfDb;if(!db)throw Error('Supabase is not configured');
      const {data:{user},error:authError}=await db.auth.getUser();
      if(authError||!user){showExpired();return;}
      const {data,error}=await db.rpc('starter_my_access');if(error)throw error;
      const row=Array.isArray(data)?data[0]:data;
      if(row?.active)hideExpired();else showExpired();
    }catch(e){console.error('Starter subscription check failed',e);showExpired();}
    finally{requestInProgress=false;}
  }
  function start(){
    check();if(timer)clearInterval(timer);timer=setInterval(check,3000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
  }
  return {start,check};
})();
