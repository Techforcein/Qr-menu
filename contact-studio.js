
(()=>{'use strict';

const $=id=>document.getElementById(id);
let db,user,forms=[],current=null,selected=-1,allResponses=[],templateFiles=[],allViews=[],analyticsRange=30;

const types=[['short','Short answer'],['long','Long answer'],['choice','Multiple choice'],['checkbox','Checkboxes'],['dropdown','Dropdown'],['multi','Multi-select'],['number','Number'],['email','Email'],['phone','Phone number'],['link','Link'],['date','Date'],['time','Time'],['linear','Linear scale'],['rating','Rating']];
const defaults={bg:'#ffffff',accent:'#6557d8',text:'#222222',font:'Inter,Arial,sans-serif',width:'680px',radius:16,shadow:true,progress:false};
const $esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>crypto.randomUUID?crypto.randomUUID():'f'+Date.now()+Math.random().toString(16).slice(2);
const status=s=>{if($('editorStatus'))$('editorStatus').textContent=s;};
const icon=(name)=>`<i class="fas fa-${name}" aria-hidden="true"></i>`;
const fmt=n=>Number(n||0).toLocaleString();
const dateLabel=d=>new Date(d).toLocaleDateString(undefined,{month:'short',day:'numeric'});
const escapeAttr=$esc;

function loadIcons(){
 if(!document.querySelector('#starter-fontawesome')){
  const l=document.createElement('link');
  l.id='starter-fontawesome';
  l.rel='stylesheet';
  l.href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
  document.head.append(l);
 }
}

function addDashboardStyles(){
 if($('starter-analytics-styles'))return;
 const s=document.createElement('style');
 s.id='starter-analytics-styles';
 s.textContent=`
 .sa-analytics{display:grid;gap:18px;margin:0 0 26px}
 .sa-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
 .sa-heading h2{font-size:21px;margin:0;color:var(--text,#202236)}
 .sa-heading p{margin:5px 0 0;color:var(--muted,#85859a);font-size:13px}
 .sa-range{display:flex;gap:6px;flex-wrap:wrap}
 .sa-range button,.sa-action{border:1px solid var(--border,#e7e7ef);background:white;color:#555;padding:9px 12px;border-radius:10px;cursor:pointer;font-weight:600}
 .sa-range button.active{background:#7654dc;color:#fff;border-color:#7654dc}
 .sa-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}
 .sa-stat{background:#fff;border:1px solid #ececf3;border-radius:16px;padding:17px;min-width:0;box-shadow:0 4px 16px #24204408}
 .sa-stat-top{display:flex;align-items:center;justify-content:space-between;gap:8px;color:#77758b;font-size:12px}
 .sa-stat-icon{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:#f0edff;color:#7654dc;font-size:15px}
 .sa-stat strong{display:block;font-size:27px;letter-spacing:-.7px;margin-top:13px;color:#242236}
 .sa-stat small{display:block;color:#9694a5;margin-top:5px;font-size:11px}
 .sa-panels{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(260px,1fr);gap:14px}
 .sa-panel{background:#fff;border:1px solid #ececf3;border-radius:16px;padding:18px;min-width:0;box-shadow:0 4px 16px #24204408}
 .sa-panel h3{margin:0;font-size:15px;color:#29273b}
 .sa-panel-sub{font-size:12px;color:#9995a8;margin:5px 0 18px}
 .sa-chart{height:190px;display:flex;align-items:flex-end;gap:7px;border-bottom:1px solid #eeeef4;padding:8px 2px 0;overflow:hidden}
 .sa-bar-col{height:100%;flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:7px;min-width:0}
 .sa-bar{width:min(100%,24px);min-height:3px;border-radius:6px 6px 2px 2px;background:linear-gradient(180deg,#9c8aff,#7058d9);position:relative}
 .sa-bar:hover{filter:brightness(.92)}
 .sa-bar-label{font-size:9px;color:#999;white-space:nowrap}
 .sa-legend{display:flex;gap:14px;flex-wrap:wrap;font-size:11px;color:#777;margin-top:12px}
 .sa-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#8069e7;margin-right:5px}
 .sa-dot.alt{background:#31b69b}
 .sa-list{display:grid;gap:13px}
 .sa-list-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;font-size:12px;color:#555}
 .sa-track{height:7px;background:#f0eff5;border-radius:20px;overflow:hidden;margin-top:6px}
 .sa-track span{height:100%;display:block;background:linear-gradient(90deg,#9b87ff,#6e55d8);border-radius:20px}
 .sa-empty{font-size:12px;color:#999;padding:20px 0;text-align:center}
 .sa-insights{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
 .sa-insight{background:#fff;border:1px solid #ececf3;border-radius:15px;padding:16px;min-width:0}
 .sa-insight h4{font-size:13px;margin:0 0 13px;color:#353247}
 .sa-insight .sa-list{gap:11px}
 .sa-inbox-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:22px 0 14px}
 .sa-inbox-head h2{font-size:20px;margin:0}
 .sa-inbox-head p{font-size:12px;color:#888;margin:5px 0 0}
 .sa-btn-icon{display:inline-flex;align-items:center;gap:7px}
 .sa-table-wrap{overflow-x:auto;width:100%}
 .sa-table-wrap table{min-width:700px}
 .sa-table-wrap button{white-space:nowrap}
 .sa-pill{display:inline-flex;padding:5px 9px;border-radius:30px;background:#f1efff;color:#7058d9;font-size:11px;font-weight:700}
 .sa-pill.unread{background:#fff2e6;color:#b66a18}
 .sa-pill.archived{background:#f1f1f3;color:#777}
 .sa-mobile-response{display:none}
 .sa-analytics button:focus-visible,.sa-analytics select:focus-visible{outline:3px solid #b8aaff;outline-offset:2px}
 @media(max-width:1050px){.sa-stats{grid-template-columns:repeat(3,minmax(0,1fr))}.sa-insights{grid-template-columns:repeat(2,minmax(0,1fr))}}
 @media(max-width:700px){.sa-panels{grid-template-columns:1fr}.sa-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.sa-stat{padding:14px}.sa-stat strong{font-size:23px}.sa-panel{padding:14px}.sa-chart{height:155px}}
 @media(max-width:480px){.sa-heading h2{font-size:18px}.sa-range{width:100%}.sa-range button{flex:1;padding:8px 5px;font-size:11px}.sa-stats{gap:8px}.sa-stat{padding:12px}.sa-stat-top{font-size:10px}.sa-stat-icon{width:29px;height:29px}.sa-stat strong{font-size:21px}.sa-stat small{font-size:10px}.sa-insights{grid-template-columns:1fr 1fr;gap:8px}.sa-insight{padding:12px}.sa-insight h4{font-size:12px}.sa-inbox-head h2{font-size:18px}}
 `;
 document.head.append(s);
}

function field(type){return{id:uid(),type,label:types.find(x=>x[0]===type)?.[1]||'Question',required:false,placeholder:'Your answer',options:['Option 1','Option 2','Option 3']};}

function getDesign(){return{bg:$('designBg').value,accent:$('designAccent').value,text:$('designText').value,font:$('designFont').value,width:$('designWidth').value,radius:+$('designRadius').value,shadow:$('designShadow').checked,progress:$('designProgress').checked,submitText:$('submitText').value,successText:$('successText').value};}

function applyDesign(d={}){d={...defaults,...d};$('designBg').value=d.bg;$('designAccent').value=d.accent;$('designText').value=d.text;$('designFont').value=d.font;$('designWidth').value=d.width;$('designRadius').value=d.radius;$('designShadow').checked=d.shadow;$('designProgress').checked=d.progress;$('submitText').value=d.submitText||'Submit response →';$('successText').value=d.successText||'Thank you! Your response has been submitted.';}

async function readTemplate(file){
 const r=await fetch('./Templates/'+encodeURIComponent(file));
 if(!r.ok)throw Error('Could not load Templates/'+file+'. Check the folder name and deployment.');
 const html=await r.text(),doc=new DOMParser().parseFromString(html,'text/html');
 const cfg=JSON.parse(doc.querySelector('#pf-template-config')?.textContent||'{}');
 return{file,css:doc.querySelector('style')?.textContent||'',config:cfg};
}

async function loadTemplateList(){
 const names=['PureMinimal.html','NeonDark.html','Glassmorphism.html','SoftPastel.html','LuxuryGold.html','CreativePop.html','CorporatePro.html','BusinessEnquiry.html','CustomerFeedback.html','RestaurantFeedback.html','JobApplication.html','EventRegistration.html','BookingRequest.html','MedicalAppointment.html','EducationAdmission.html','StartupGradient.html','ModernUI.html','Editorial.html','SplitScreen.html','Conversational.html'];
 templateFiles=await Promise.all(names.map(async file=>{try{return await readTemplate(file)}catch(e){return{file,config:{name:file.replace('.html',''),background:'#fff',text:'#222',accent:'#6557d8'},css:''};}}));
 renderTemplates();
}

function renderTemplates(){
 const g=$('templateGrid');g.innerHTML='';
 const q=($('templateSearch')?.value||'').toLowerCase();
 templateFiles.filter(t=>(t.config.name||t.file).toLowerCase().includes(q)).forEach(t=>{
  const c=document.createElement('article');c.className='template-card';
  c.innerHTML=`<div class="template-swatch" style="background:${$esc(t.config.background)};--accent:${$esc(t.config.accent)}"><div class="swatch-inner"><i></i><i style="width:55%"></i><i style="width:75%"></i></div></div><h3>${$esc(t.config.name||t.file)}</h3><p>${$esc(t.config.description||'Customizable HTML form design')}</p><small>${$esc(t.file)}</small><div class="toolbar"><button class="secondary preview-template">${icon('eye')} Preview</button><button class="primary use-template">${icon('plus')} Use template</button></div>`;
  c.querySelector('.use-template').onclick=()=>createForm(t.file);
  c.querySelector('.preview-template').onclick=async()=>{await createForm(t.file);await buildPreview();};
  g.append(c);
 });
}

function renderForms(){
 const g=$('formList');g.innerHTML='';
 $('formCount').textContent=forms.length;
 $('publishedCount').textContent=forms.filter(f=>f.published).length;
 if(!forms.length){g.innerHTML='<p class="notice">No forms yet. Create your first form or choose a template.</p>';return;}
 forms.forEach(f=>{
  const c=document.createElement('article');c.className='form-card';
  c.innerHTML=`<h3>${$esc(f.title)}</h3><p>${f.published?'🟢 Published':'⚪ Draft'} · ${(f.fields||[]).length} fields · ${$esc(f.template||'PureMinimal.html')}</p><div class="card-actions">
  <button data-act="edit">${icon('pen')} Edit</button>
  <button data-act="responses">${icon('inbox')} Responses</button>
  <button data-act="copy">${icon('link')} Copy link</button>
  <button data-act="publish">${icon(f.published?'eye-slash':'globe')} ${f.published?'Unpublish':'Publish'}</button>
  <button data-act="duplicate">${icon('copy')} Duplicate</button>
  <button data-act="delete">${icon('trash')} Delete</button></div>`;
  c.querySelectorAll('button').forEach(b=>b.onclick=()=>formAction(f,b.dataset.act));
  g.append(c);
 });
}

async function loadForms(){
 const {data,error}=await db.from('contact_forms').select('*').eq('owner_id',user.id).order('updated_at',{ascending:false});
 if(error)throw error;
 forms=data||[];
 renderForms();fillFormSelects();
 await loadResponses();
 await loadViews();
}

function fillFormSelects(){
 ['responseFormFilter','sheetFormSelect'].forEach(id=>{
  const el=$(id);if(!el)return;
  const old=el.value;
  el.innerHTML=(id==='responseFormFilter'?'<option value="">All forms</option>':'')+forms.map(f=>`<option value="${f.id}">${$esc(f.title)}</option>`).join('');
  if(forms.some(f=>f.id===old))el.value=old;
 });
}

async function loadResponses(){
 allResponses=[];
 if(forms.length){
  const {data,error}=await db.from('contact_form_submissions').select('*').in('form_id',forms.map(f=>f.id)).order('submitted_at',{ascending:false}).limit(1000);
  if(error)throw error;
  allResponses=data||[];
 }
 $('responseCount').textContent=allResponses.length;
 renderResponses();
 renderAnalytics();
}

async function loadViews(){
 allViews=[];
 if(forms.length){
  const {data,error}=await db.from('contact_form_views')
   .select('form_id,visitor_id,viewed_at,page_url,referrer,device_type,operating_system,browser')
   .in('form_id',forms.map(f=>f.id))
   .order('viewed_at',{ascending:false}).limit(10000);
  if(error)throw error;
  allViews=data||[];
 }
 renderAnalytics();
}

function answersText(r){
 return Object.entries(r.answers||{}).map(([k,v])=>{
  const f=forms.find(x=>x.id===r.form_id)?.fields?.find(x=>x.id===k);
  return(f?.label||k)+': '+(Array.isArray(v)?v.join(', '):v);
 }).join(' | ');
}

function renderResponses(){
 const root=$('responseList');if(!root)return;
 const q=($('responseSearch')?.value||'').toLowerCase();
 const fid=$('responseFormFilter')?.value||'';
 const filter=$('responseStatusFilter')?.value||'all';
 let rows=allResponses.filter(r=>(!fid||r.form_id===fid)&&(!q||(answersText(r)+' '+(forms.find(f=>f.id===r.form_id)?.title||'')+' '+r.id).toLowerCase().includes(q)));
 rows=rows.filter(r=>filter==='all'||(filter==='unread'&&!r.read_at)||(filter==='read'&&r.read_at)||(filter==='starred'&&r.starred)||(filter==='archived'&&r.archived));
 if(!rows.length){root.innerHTML='<p class="notice">No responses match these filters.</p>';return;}
 root.innerHTML=`<div class="table-wrap sa-table-wrap"><table><thead><tr><th><input type="checkbox" id="selectAllResponses"></th><th>Form</th><th>Submitted</th><th>Preview</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows.map(r=>`<tr>
 <td><input type="checkbox" class="response-check" value="${$esc(r.id)}"></td>
 <td>${$esc(forms.find(f=>f.id===r.form_id)?.title||'Form')}</td>
 <td>${new Date(r.submitted_at).toLocaleString()}</td>
 <td>${$esc(answersText(r).slice(0,110))}</td>
 <td><span class="sa-pill ${r.archived?'archived':r.read_at?'':'unread'}">${r.archived?'Archived':r.read_at?'Read':'Unread'}</span> ${r.starred?'★':''}</td>
 <td><button data-open="${$esc(r.id)}">${icon('eye')} View</button> <button data-star="${$esc(r.id)}">${icon('star')} ${r.starred?'Unstar':'Star'}</button> <button data-archive="${$esc(r.id)}">${icon('box-archive')} ${r.archived?'Restore':'Archive'}</button></td>
 </tr>`).join('')}</tbody></table></div>`;
 root.querySelector('#selectAllResponses').onchange=e=>root.querySelectorAll('.response-check').forEach(x=>x.checked=e.target.checked);
 root.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openResponse(b.dataset.open));
 root.querySelectorAll('[data-star]').forEach(b=>b.onclick=()=>updateResponse(b.dataset.star,{starred:!allResponses.find(r=>r.id===b.dataset.star).starred}));
 root.querySelectorAll('[data-archive]').forEach(b=>b.onclick=()=>updateResponse(b.dataset.archive,{archived:!allResponses.find(r=>r.id===b.dataset.archive).archived}));
}

async function updateResponse(id,patch){
 const {error}=await db.from('contact_form_submissions').update(patch).eq('id',id);
 if(error){alert(error.message);return;}
 const r=allResponses.find(x=>x.id===id);
 if(r)Object.assign(r,patch);
 renderResponses();renderAnalytics();
}

async function openResponse(id){
 const r=allResponses.find(x=>x.id===id);if(!r)return;
 const f=forms.find(x=>x.id===r.form_id);
 $('responseDetail').innerHTML=`<h2>${$esc(f?.title||'Form response')}</h2><p class="muted">${new Date(r.submitted_at).toLocaleString()} · Response ${$esc(r.id)}</p>${Object.entries(r.answers||{}).map(([k,v])=>{const field=f?.fields?.find(x=>x.id===k);return `<div class="answer-detail"><b>${$esc(field?.label||k)}</b><p>${$esc(Array.isArray(v)?v.join(', '):v)}</p></div>`}).join('')}<div class="toolbar"><button id="markRead" class="primary">${icon('check')} Mark as read</button><button id="deleteResponse" class="danger">${icon('trash')} Delete response</button></div>`;
 $('responseModal').hidden=false;
 $('markRead').onclick=()=>updateResponse(id,{read_at:new Date().toISOString()}).then(()=>$('responseModal').hidden=true);
 $('deleteResponse').onclick=async()=>{
  if(confirm('Delete this response permanently?')){
   const {error}=await db.from('contact_form_submissions').delete().eq('id',id);
   if(error)alert(error.message);
   else{allResponses=allResponses.filter(x=>x.id!==id);renderResponses();renderAnalytics();$('responseModal').hidden=true;}
  }
 };
 if(!r.read_at)await updateResponse(id,{read_at:new Date().toISOString()});
}

function createForm(file='PureMinimal.html'){
 const t=templateFiles.find(x=>x.file===file)||templateFiles[0];
 current={id:null,title:'Untitled form',description:'',fields:[],design:{...defaults,bg:t.config.background,text:t.config.text,accent:t.config.accent,radius:t.config.radius||16},template:file,published:false};
 selected=-1;renderFieldButtons();openEditor();
}

async function openEditor(){
 const legacyMap={'pure-minimal':'PureMinimal.html','neon-dark':'NeonDark.html','glass-studio':'Glassmorphism.html','soft-pastel':'SoftPastel.html','luxury-gold':'LuxuryGold.html','creative-pop':'CreativePop.html','corporate':'CorporatePro.html','business-enquiry':'BusinessEnquiry.html','customer-feedback':'CustomerFeedback.html','restaurant-feedback':'RestaurantFeedback.html','job-application':'JobApplication.html','event-registration':'EventRegistration.html','booking-request':'BookingRequest.html','medical-appointment':'MedicalAppointment.html','education-admission':'EducationAdmission.html','startup-gradient':'StartupGradient.html','material-modern':'ModernUI.html','editorial':'Editorial.html','split-screen':'SplitScreen.html','conversational':'Conversational.html'};
 current.template=legacyMap[current.template]||current.template;
 if(!templateFiles.some(t=>t.file===current.template))current.template='PureMinimal.html';
 $('editor').hidden=false;
 ['forms','templates','responses','integrations'].forEach(t=>$(t+'Tab').hidden=true);
 $('editorHeading').textContent=current.id?'Edit form':'Create your form';
 $('formTitle').value=current.title;$('formDescription').value=current.description;$('designTemplate').value=current.template;
 $('selectedTemplateLabel').textContent='Template file: Templates/'+current.template;
 applyDesign(current.design);renderFields();window.scrollTo({top:0,behavior:'smooth'});
}

function closeEditor(){
 $('editor').hidden=true;$('formsTab').hidden=false;
 document.querySelector('[data-tab="forms"]').classList.add('active');
 current=null;loadForms().catch(e=>alert(e.message));
}

function renderFields(){
 const root=$('fieldCanvas');root.innerHTML='';
 (current.fields||[]).forEach((f,i)=>{
  const q=document.createElement('div');q.className='question'+(i===selected?' selected':'');
  const choice=['choice','checkbox','dropdown','multi'].includes(f.type);
  q.innerHTML=`<div class="question-head"><b>${i+1}. ${$esc(f.label)}</b><span><button data-move="-1" title="Move up">${icon('arrow-up')}</button><button data-move="1" title="Move down">${icon('arrow-down')}</button><button data-delete="1" title="Delete">${icon('trash')}</button></span></div><div class="muted small">${types.find(x=>x[0]===f.type)?.[1]||f.type}${f.required?' · Required':''}</div>${i===selected?`<div class="question-settings"><label>Question label<input data-prop="label" value="${$esc(f.label)}"></label><label>Placeholder<input data-prop="placeholder" value="${$esc(f.placeholder||'')}"></label><label class="check"><input type="checkbox" data-prop="required" ${f.required?'checked':''}> Required</label>${choice?`<label>Options (one per line)<textarea data-prop="options">${$esc((f.options||[]).join('\n'))}</textarea></label>`:''}</div>`:''}`;
  q.onclick=e=>{if(!e.target.closest('button')){selected=i;renderFields();}};
  q.querySelectorAll('[data-prop]').forEach(el=>el.onchange=()=>{const p=el.dataset.prop;f[p]=p==='required'?el.checked:p==='options'?el.value.split('\n').map(s=>s.trim()).filter(Boolean):el.value;renderFields();});
  q.querySelector('[data-delete]').onclick=()=>{current.fields.splice(i,1);selected=-1;renderFields();};
  q.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>{const n=i+Number(b.dataset.move);if(n>=0&&n<current.fields.length){[current.fields[i],current.fields[n]]=[current.fields[n],current.fields[i]];selected=n;renderFields();}});
  root.append(q);
 });
}

function renderFieldButtons(){
 const root=$('fieldButtons');root.innerHTML='';
 types.forEach(([id,name])=>{const b=document.createElement('button');b.innerHTML=`${icon('plus')} ${name}`;b.onclick=()=>{current.fields.push(field(id));selected=current.fields.length-1;renderFields();};root.append(b);});
}

function inputFor(f){
 const id='f_'+f.id,req=f.required?'required':'';
 if(f.type==='long')return `<textarea id="${id}" ${req} placeholder="${$esc(f.placeholder)}"></textarea>`;
 if(['choice','checkbox','multi'].includes(f.type))return(f.options||[]).map(o=>`<label class="option"><input type="${f.type==='choice'?'radio':'checkbox'}" name="${id}" value="${$esc(o)}"> ${$esc(o)}</label>`).join('');
 if(f.type==='dropdown')return `<select id="${id}" ${req}><option value="">Choose…</option>${(f.options||[]).map(o=>`<option value="${$esc(o)}">${$esc(o)}</option>`).join('')}</select>`;
 if(f.type==='rating')return `<select id="${id}" ${req}>${[1,2,3,4,5].map(n=>`<option>${n} / 5</option>`).join('')}</select>`;
 return `<input id="${id}" type="${({short:'text',number:'number',email:'email',phone:'tel',link:'url',date:'date',time:'time',linear:'range'}[f.type]||'text')}" ${req} placeholder="${$esc(f.placeholder||'')}">`;
}

async function buildPreview(){
 const d=getDesign(),t=await readTemplate(current.template);
 $('previewContent').innerHTML=`<div class="public-preview pf-form-card" style="background:${d.bg};color:${d.text};font-family:${d.font};max-width:${d.width};border-radius:${d.radius}px;box-shadow:${d.shadow?'0 15px 45px #0002':'none'};--accent:${d.accent}"><h1>${$esc($('formTitle').value)}</h1><p>${$esc($('formDescription').value)}</p>${current.fields.map(f=>`<label class="pf-field">${$esc(f.label)}${f.required?' *':''}${inputFor(f)}</label>`).join('')}<button class="pf-submit">${$esc(d.submitText)}</button></div>`;
 const style=document.createElement('style');style.textContent=t.css;$('previewContent').prepend(style);
 $('previewModal').hidden=false;
}

async function saveForm(){
 current.title=$('formTitle').value.trim();current.description=$('formDescription').value.trim();current.design=getDesign();current.template=$('designTemplate').value;
 if(!current.title)return status('Enter a form title.');
 if(!current.fields.length)return status('Add at least one field.');
 const payload={owner_id:user.id,title:current.title,description:current.description,fields:current.fields,design:current.design,template:current.template,published:!!current.published,updated_at:new Date().toISOString()};
 const res=current.id?await db.from('contact_forms').update(payload).eq('id',current.id).select().single():await db.from('contact_forms').insert(payload).select().single();
 if(res.error)throw res.error;
 current={...res.data};status('Saved successfully.');$('editorHeading').textContent='Edit your form';await loadForms();
}

async function formAction(f,a){
 try{
  if(a==='edit'){current={...f,template:f.template||'PureMinimal.html'};selected=-1;renderFieldButtons();await openEditor();}
  if(a==='responses'){showTab('responses');$('responseFormFilter').value=f.id;renderResponses();}
  if(a==='copy'){const u=new URL('contact-public.html',location.href);u.searchParams.set('id',f.id);await navigator.clipboard.writeText(u.href);alert('Public form link copied.');}
  if(a==='publish'&&!f.fields?.length)return alert('Add fields before publishing.');
  if(a==='delete'&&!confirm('Delete this form and its responses?'))return;
  if(['publish','delete','duplicate'].includes(a)){
   let res;
   if(a==='publish')res=await db.from('contact_forms').update({published:!f.published}).eq('id',f.id);
   if(a==='delete')res=await db.from('contact_forms').delete().eq('id',f.id);
   if(a==='duplicate')res=await db.from('contact_forms').insert({owner_id:user.id,title:f.title+' (copy)',description:f.description,fields:f.fields,design:f.design,template:f.template,published:false});
   if(res?.error)throw res.error;
   await loadForms();
  }
 }catch(e){alert(e.message||String(e));}
}

function showTab(name){
 ['forms','templates','responses','integrations'].forEach(t=>{
  $(t+'Tab').hidden=t!==name;
  document.querySelector(`[data-tab="${t}"]`).classList.toggle('active',t===name);
 });
 $('editor').hidden=true;
 if(name==='responses')renderAnalytics();
}

function exportFile(kind){
 const rows=allResponses.map(r=>({form:forms.find(f=>f.id===r.form_id)?.title||'',submitted_at:r.submitted_at,response_id:r.id,answers:r.answers}));
 let blob,name;
 if(kind==='json'){blob=new Blob([JSON.stringify(rows,null,2)],{type:'application/json'});name='starter-contact-responses.json';}
 else{
  const csv=[['Form','Submitted at','Response ID','Answers'],...rows.map(r=>[r.form,r.submitted_at,r.response_id,JSON.stringify(r.answers)])].map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
  blob=new Blob([csv],{type:'text/csv;charset=utf-8'});name='starter-contact-responses.csv';
 }
 const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

async function saveSheet(){
 const id=$('sheetFormSelect').value;
 if(!id)return $('sheetStatus').textContent='Create or select a form first.';
 const {error}=await db.from('contact_forms').update({google_script_url:$('sheetScriptUrl').value.trim(),google_sheet_url:$('sheetUrl').value.trim()}).eq('id',id).eq('owner_id',user.id);
 if(error)throw error;
 $('sheetStatus').textContent='Integration settings saved. New submissions will sync when the public form is configured with this Apps Script endpoint.';
}

async function loadSheetSettings(){
 const f=forms.find(x=>x.id===$('sheetFormSelect').value);
 $('sheetScriptUrl').value=f?.google_script_url||'';$('sheetUrl').value=f?.google_sheet_url||'';
}

/* ---------------- ANALYTICS DASHBOARD ---------------- */

function filteredAnalytics(){
 const cutoff=analyticsRange==='all'?0:Date.now()-analyticsRange*86400000;
 const views=allViews.filter(v=>!cutoff||new Date(v.viewed_at).getTime()>=cutoff);
 const responses=allResponses.filter(r=>!cutoff||new Date(r.submitted_at).getTime()>=cutoff);
 return{views,responses};
}

function groupCounts(items,keyFn){
 const map={};
 items.forEach(item=>{const k=keyFn(item)||'Unknown';map[k]=(map[k]||0)+1;});
 return Object.entries(map).sort((a,b)=>b[1]-a[1]);
}

function renderBreakdown(items,keyFn){
 const groups=groupCounts(items,keyFn).slice(0,5);
 if(!groups.length)return '<div class="sa-empty">No data available yet</div>';
 const max=groups[0][1]||1;
 return `<div class="sa-list">${groups.map(([name,count])=>`<div><div class="sa-list-row"><span>${$esc(name)}</span><b>${fmt(count)}</b></div><div class="sa-track"><span style="width:${Math.max(3,count/max*100)}%"></span></div></div>`).join('')}</div>`;
}

function renderDailyChart(views,responses){
 const days=analyticsRange==='all'?30:Math.min(analyticsRange,30);
 const now=new Date();now.setHours(0,0,0,0);
 const buckets=[];
 for(let i=days-1;i>=0;i--){
  const d=new Date(now);d.setDate(d.getDate()-i);
  const key=d.toISOString().slice(0,10);
  buckets.push({key,label:days>14&&i%3!==0?'':dateLabel(d),views:0,submissions:0});
 }
 const lookup=Object.fromEntries(buckets.map(b=>[b.key,b]));
 views.forEach(v=>{const b=lookup[new Date(v.viewed_at).toISOString().slice(0,10)];if(b)b.views++;});
 responses.forEach(r=>{const b=lookup[new Date(r.submitted_at).toISOString().slice(0,10)];if(b)b.submissions++;});
 const max=Math.max(1,...buckets.map(b=>Math.max(b.views,b.submissions)));
 return `<div class="sa-chart">${buckets.map(b=>`<div class="sa-bar-col" title="${b.key}: ${b.views} visits, ${b.submissions} submissions"><div style="display:flex;align-items:flex-end;gap:3px;height:100%;width:100%;justify-content:center"><div class="sa-bar" style="height:${Math.max(2,b.views/max*100)}%;background:linear-gradient(180deg,#9b89ff,#735bd9)"></div><div class="sa-bar" style="height:${Math.max(2,b.submissions/max*100)}%;background:linear-gradient(180deg,#63d6bc,#24a98b)"></div></div><span class="sa-bar-label">${b.label}</span></div>`).join('')}</div><div class="sa-legend"><span><i class="sa-dot"></i>Visits</span><span><i class="sa-dot alt"></i>Submissions</span></div>`;
}

function renderAnalytics(){
 const tab=$('responsesTab');if(!tab)return;
 let root=$('responseAnalytics');
 if(!root){
  root=document.createElement('div');root.id='responseAnalytics';root.className='sa-analytics';
  tab.insertBefore(root,tab.firstChild);
 }
 const {views,responses}=filteredAnalytics();
 const unique=new Set(views.map(v=>v.visitor_id).filter(Boolean)).size;
 const unread=allResponses.filter(r=>!r.read_at&&!r.archived).length;
 const completion=views.length?Math.round(responses.length/views.length*100):0;
 const stats=[
  ['Total visits',views.length,'eye'],
  ['Unique visitors',unique,'users'],
  ['Submissions',responses.length,'paper-plane'],
  ['Completion rate',completion+'%','chart-line'],
  ['Unread responses',unread,'envelope']
 ];
 root.innerHTML=`
 <div class="sa-heading">
  <div><h2>${icon('chart-pie')} Form analytics</h2><p>Understand traffic, visitors and response activity</p></div>
  <div class="sa-range">
   <button data-range="7" class="${analyticsRange===7?'active':''}">7 days</button>
   <button data-range="30" class="${analyticsRange===30?'active':''}">30 days</button>
   <button data-range="90" class="${analyticsRange===90?'active':''}">90 days</button>
   <button data-range="all" class="${analyticsRange==='all'?'active':''}">All time*</button>
  </div>
 </div>
 <div class="sa-stats">${stats.map(([label,value,ico])=>`<div class="sa-stat"><div class="sa-stat-top"><span>${label}</span><span class="sa-stat-icon">${icon(ico)}</span></div><strong>${value}</strong><small>${label==='Completion rate'?'Submissions divided by visits':label==='Unread responses'?'Awaiting review':'For selected period'}</small></div>`).join('')}</div>
 <div class="sa-panels">
  <section class="sa-panel"><h3>${icon('chart-column')} Traffic overview</h3><p class="sa-panel-sub">Daily visits compared with submissions · recent 30 days</p>${renderDailyChart(views,responses)}</section>
  <section class="sa-panel"><h3>${icon('bullseye')} Traffic sources</h3><p class="sa-panel-sub">Where visitors came from</p>${renderBreakdown(views,v=>{if(!v.referrer)return 'Direct / unknown';try{return new URL(v.referrer).hostname.replace(/^www\\./,'');}catch(e){return v.referrer;}})}</section>
 </div>
 <div class="sa-insights">
  <section class="sa-insight"><h4>${icon('mobile-screen')} Devices</h4>${renderBreakdown(views,v=>v.device_type||'Unknown')}</section>
  <section class="sa-insight"><h4>${icon('globe')} Browsers</h4>${renderBreakdown(views,v=>v.browser||'Unknown')}</section>
  <section class="sa-insight"><h4>${icon('laptop')} Operating systems</h4>${renderBreakdown(views,v=>v.operating_system||'Unknown')}</section>
  <section class="sa-insight"><h4>${icon('file-lines')} Popular forms</h4>${renderBreakdown(views,v=>forms.find(f=>f.id===v.form_id)?.title||'Unknown form')}</section>
 </div>
 <p class="sa-panel-sub">* All time is based on the most recent 10,000 recorded visits and up to 1,000 loaded responses. Completion rate is an approximate submissions-to-visits ratio.</p>
 `;
 root.querySelectorAll('[data-range]').forEach(b=>b.onclick=()=>{analyticsRange=b.dataset.range==='all'?'all':Number(b.dataset.range);renderAnalytics();});
 const inbox=document.createElement('div');
 inbox.className='sa-inbox-head';
 inbox.innerHTML=`<div><h2>${icon('inbox')} Responses inbox</h2><p>${fmt(allResponses.length)} total responses · ${fmt(unread)} unread</p></div>`;
 const existing=$('responseList');
 if(existing){
  const parent=existing.parentElement;
  const old=parent.querySelector('.sa-inbox-head');
  if(old)old.remove();
  parent.insertBefore(inbox,existing);
 }
}

/* ---------------- EVENT SETUP ---------------- */

async function init(){
 try{
  loadIcons();addDashboardStyles();
  if(!window.pfDb)throw Error('Supabase configuration did not load. Check config.js.');
  db=window.pfDb;
  const {data,error}=await db.auth.getUser();if(error)throw error;
  user=data.user;
  if(!user){$('authMessage').textContent='Please sign in to Starter first.';return;}
  $('authMessage').hidden=true;$('app').hidden=false;
  await loadTemplateList();
  renderFieldButtons();
  templateFiles.forEach(t=>$('designTemplate').add(new Option(t.config.name||t.file,t.file)));
  await loadForms();

  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
  document.querySelectorAll('[data-control]').forEach(b=>b.onclick=()=>{
   document.querySelectorAll('[data-control]').forEach(x=>x.classList.toggle('active',x===b));
   ['content','design','layout'].forEach(x=>$(x+'Controls').hidden=x!==b.dataset.control);
  });

  $('newForm').onclick=()=>createForm();
  $('closeEditor').onclick=closeEditor;
  $('saveForm').onclick=()=>saveForm().catch(e=>status('Error: '+e.message));
  $('previewForm').onclick=()=>buildPreview().catch(e=>status(e.message));
  $('closePreview').onclick=()=>$('previewModal').hidden=true;
  $('closeResponse').onclick=()=>$('responseModal').hidden=true;
  $('formTitle').oninput=()=>current.title=$('formTitle').value;
  $('formDescription').oninput=()=>current.description=$('formDescription').value;
  $('designTemplate').onchange=async()=>{
   const t=await readTemplate($('designTemplate').value);current.template=t.file;
   applyDesign({...current.design,bg:t.config.background,text:t.config.text,accent:t.config.accent,radius:t.config.radius||16});
   $('selectedTemplateLabel').textContent='Template file: Templates/'+t.file;
  };
  $('exportCsv').onclick=()=>exportFile('csv');
  $('exportJson').onclick=()=>exportFile('json');
  $('responseSearch').oninput=renderResponses;
  $('responseFormFilter').onchange=renderResponses;
  $('responseStatusFilter').onchange=renderResponses;
  $('refreshResponses').onclick=async()=>{
   try{await loadResponses();await loadViews();}
   catch(e){alert(e.message);}
  };
  $('deleteSelected').onclick=async()=>{
   const ids=[...document.querySelectorAll('.response-check:checked')].map(x=>x.value);
   if(!ids.length)return alert('Select responses first.');
   if(!confirm(`Delete ${ids.length} selected responses?`))return;
   const {error}=await db.from('contact_form_submissions').delete().in('id',ids);
   if(error)alert(error.message);
   else{allResponses=allResponses.filter(r=>!ids.includes(r.id));renderResponses();renderAnalytics();}
  };
  $('templateSearch').oninput=renderTemplates;
  $('sheetFormSelect').onchange=loadSheetSettings;
  $('saveSheetSettings').onclick=()=>saveSheet().catch(e=>$('sheetStatus').textContent=e.message);
  $('testSheet').onclick=()=>$('sheetStatus').textContent='Save the integration and submit a real test response from the public form to verify the end-to-end connection.';
  $('previewModal').onclick=e=>{if(e.target===$('previewModal'))$('previewModal').hidden=true;};
 }catch(e){
  $('authMessage').textContent='Setup error: '+e.message;
 }
}

document.addEventListener('DOMContentLoaded',init);
})();
