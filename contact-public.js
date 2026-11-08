(()=>{'use strict';
const $=id=>document.getElementById(id);
let db,form;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const groupTypes=['choice','checkbox','multi','ranking','matrix'];
const inputTypes={short:'text',number:'number',email:'email',phone:'tel',link:'url',date:'date',time:'time'};
function attr(name,value){return value!==''&&value!==null&&value!==undefined?` ${name}="${esc(value)}"`:'';}
function renderField(f,index){
  const id='f_'+f.id, required=!!f.required, type=f.type||'short';
  const help=f.helpText?`<small class="field-help" id="${id}_help">${esc(f.helpText)}</small>`:'';
  const label=`<span class="public-field-title">${esc(f.label||'Question')}${required?' <em aria-hidden="true">*</em>':''}</span>`;
  const placeholder=esc(f.placeholder||'');
  let control='';
  if(groupTypes.includes(type)){
    const opts=Array.isArray(f.options)?f.options:[];
    const inputType=type==='choice'?'radio':'checkbox';
    control=`<div class="public-options" role="${type==='choice'?'radiogroup':'group'}" aria-label="${esc(f.label||'Question')}">${opts.map((o,n)=>`<label class="public-option"><input type="${inputType}" name="${esc(id)}" value="${esc(o)}"${required&&type==='choice'&&n===0?' required':''}><span>${esc(o)}</span></label>`).join('')}</div>`;
  }else if(type==='dropdown'){
    control=`<select id="${esc(id)}"${required?' required':''}><option value="">Choose an option…</option>${(f.options||[]).map(o=>`<option value="${esc(o)}"${f.defaultValue===o?' selected':''}>${esc(o)}</option>`).join('')}</select>`;
  }else if(type==='rating'){
    control=`<select id="${esc(id)}"${required?' required':''}><option value="">Select a rating…</option>${[1,2,3,4,5].map(n=>`<option value="${n}"${String(f.defaultValue)===String(n)?' selected':''}>${n} / 5</option>`).join('')}</select>`;
  }else if(type==='linear'){
    const min=f.min!==''&&f.min!=null?Number(f.min):1;
    const max=f.max!==''&&f.max!=null?Number(f.max):10;
    const safeMin=Number.isFinite(min)?min:1, safeMax=Number.isFinite(max)&&max>=safeMin?max:10;
    const val=f.defaultValue!==''&&f.defaultValue!=null?Number(f.defaultValue):safeMin;
    control=`<div class="public-range-wrap"><input id="${esc(id)}" type="range" min="${safeMin}" max="${safeMax}" value="${Math.min(safeMax,Math.max(safeMin,Number.isFinite(val)?val:safeMin))}"${required?' required':''}><div class="public-range-labels"><span>${safeMin}</span><output id="${esc(id)}_value">${Math.min(safeMax,Math.max(safeMin,Number.isFinite(val)?val:safeMin))}</output><span>${safeMax}</span></div></div>`;
  }else if(type==='long'||type==='signature'){
    const rows=Math.max(2,Math.min(12,Number(f.rows)||4));
    control=`<textarea id="${esc(id)}" rows="${rows}" placeholder="${placeholder}"${required?' required':''}${attr('maxlength',f.maxLength)}>${esc(f.defaultValue||'')}</textarea>`;
  }else{
    const htmlType=inputTypes[type]||'text';
    control=`<input id="${esc(id)}" type="${htmlType}" placeholder="${placeholder}" value="${esc(f.defaultValue||'')}"${required?' required':''}${attr('min',f.min)}${attr('max',f.max)}${attr('maxlength',f.maxLength)}>`;
  }
  return `<section class="public-field" data-field-id="${esc(f.id)}" data-field-type="${esc(type)}"><label class="public-field-label" ${groupTypes.includes(type)?'':'for="'+esc(id)+'"'}>${label}</label>${help}${control}<small class="public-field-error" id="${esc(id)}_error" aria-live="polite"></small></section>`;
}
function applyDesign(d){
  const el=$('publicForm');
  el.style.background=d.bg||'#fff';el.style.color=d.text||'#222';
  el.style.fontFamily=d.font||'system-ui';el.style.maxWidth=d.width||'680px';
  el.style.borderRadius=(Number(d.radius)||16)+'px';
  el.style.boxShadow=d.shadow===false?'none':'0 15px 45px #0002';
  el.style.setProperty('--accent',d.accent||'#6557d8');
}
function updateRangeLabels(){
  document.querySelectorAll('#publicFields input[type="range"]').forEach(input=>{
    const out=$(input.id+'_value');if(out)out.value=input.value;
  });
}
function updateProgress(){
  if(!form?.design?.progress)return;
  const fields=form.fields||[],answered=fields.filter(f=>{
    const id='f_'+f.id;
    if(groupTypes.includes(f.type))return document.querySelectorAll(`[name="${CSS.escape(id)}"]:checked`).length>0;
    return !!($(id)?.value||'').trim();
  }).length;
  const percent=fields.length?Math.round(answered/fields.length*100):0;
  $('publicProgressText').textContent=`${answered} of ${fields.length} questions answered`;
  $('publicProgressBar').style.width=percent+'%';
}
function readAnswer(f){
  const id='f_'+f.id;
  if(groupTypes.includes(f.type)){
    const values=[...document.querySelectorAll(`[name="${CSS.escape(id)}"]:checked`)].map(x=>x.value);
    return f.type==='choice'?(values[0]||''):values;
  }
  return $(id)?.value??'';
}
function validate(){
  let firstInvalid=null,valid=true;
  for(const f of form.fields||[]){
    const id='f_'+f.id,section=document.querySelector(`[data-field-id="${CSS.escape(String(f.id))}"]`);
    const error=$(id+'_error');if(error)error.textContent='';
    section?.classList.remove('has-error');
    const value=readAnswer(f);
    let message='';
    if(f.required&&(!value||(Array.isArray(value)&&!value.length)))message='Please answer this question.';
    if(!message&&f.type==='email'&&value&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))message='Enter a valid email address.';
    if(!message&&f.type==='link'&&value){try{new URL(value);}catch{message='Enter a valid website URL.';}}
    if(!message&&f.type==='number'&&value!==''&&f.min!==''&&f.min!=null&&Number(value)<Number(f.min))message=`Enter a number of at least ${f.min}.`;
    if(!message&&f.type==='number'&&value!==''&&f.max!==''&&f.max!=null&&Number(value)>Number(f.max))message=`Enter a number no greater than ${f.max}.`;
    if(message){valid=false;if(error)error.textContent=message;section?.classList.add('has-error');if(!firstInvalid)firstInvalid=section;}
  }
  if(firstInvalid){firstInvalid.scrollIntoView({behavior:'smooth',block:'center'});firstInvalid.querySelector('input,textarea,select')?.focus();}
  return valid;
}
async function init(){
  try{
    db=window.pfDb;if(!db)throw Error('Supabase configuration did not load. Check config.js.');
    const id=new URLSearchParams(location.search).get('id');if(!id)throw Error('This form link is incomplete.');
    const {data,error}=await db.from('contact_forms').select('id,title,description,fields,design,published').eq('id',id).eq('published',true).single();
    if(error)throw error;form=data;
    applyDesign(form.design||{});
    $('publicTitle').textContent=form.title||'Contact form';
    $('publicDescription').textContent=form.description||'';
    $('publicFields').innerHTML=(form.fields||[]).map(renderField).join('');
    if(!(form.fields||[]).length)throw Error('This form does not have any questions yet.');
    if(form.design?.progress){$('publicProgress').hidden=false;updateProgress();}
    $('publicForm').hidden=false;$('publicStatus').hidden=true;
    $('publicFields').addEventListener('input',()=>{updateRangeLabels();updateProgress();});
    $('publicFields').addEventListener('change',()=>{updateRangeLabels();updateProgress();});
    $('publicForm').addEventListener('submit',submit);
  }catch(e){$('publicStatus').textContent='This form is unavailable: '+(e.message||'Please try again later.');}
}
async function submit(e){
  e.preventDefault();if(!validate())return;
  const answers={};for(const f of form.fields||[])answers[f.id]=readAnswer(f);
  const btn=$('publicSubmit');btn.disabled=true;btn.textContent='Sending…';
  try{
    const {error}=await db.from('contact_form_submissions').insert({form_id:form.id,answers});
    if(error)throw error;
    $('publicForm').innerHTML='<div class="public-success"><div class="public-success-icon">✓</div><h1>Thank you!</h1><p>Your response has been submitted successfully.</p></div>';
  }catch(err){btn.disabled=false;btn.innerHTML='Submit response <span aria-hidden="true">→</span>';alert('Could not submit your response: '+(err.message||'Please try again.'));}
}
document.addEventListener('DOMContentLoaded',init);
})();