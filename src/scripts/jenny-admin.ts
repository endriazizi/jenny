// @ts-nocheck
const BASE='https://api.pizzerialalanterna.it/api';
const $=(s)=>document.querySelector(s);
const login=$('#jn-login'),space=$('#jn-workspace'),editor=$('#jn-editor'),rows=$('#jn-rows'),msg=$('#jn-msg');
let token='',bookings=[],services=[],editing=null,busy=false;
const field=(name)=>editor.elements.namedItem(name);
const notice=(s)=>{msg.textContent=s;};
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome'}).format(new Date());
const addDays=(date,n)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
$('#jn-from').value=today();$('#jn-to').value=addDays(today(),30);
async function request(path,{method='GET',body,auth=true}={}){
 const response=await fetch(BASE+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(auth?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});
 const data=await response.json().catch(()=>({}));
 if(!response.ok){if(response.status===401||response.status===403&&auth){logout();}throw new Error(data.message||data.reason||('Errore API '+response.status));}
 return data;
}
function logout(){token='';bookings=[];login.hidden=false;space.hidden=true;editor.hidden=true;}
function element(tag,text,css){const n=document.createElement(tag);if(text!=null)n.textContent=String(text);if(css)n.className=css;return n;}
function td(row,label,text){const n=element('td',text);n.dataset.label=label;row.append(n);return n;}
function action(parent,name,callback,css=''){const b=element('button',name,css);b.type='button';b.addEventListener('click',callback);parent.append(b);return b;}
function render(){
 rows.replaceChildren();const q=$('#jn-search').value.trim().toLowerCase();
 const filtered=bookings.filter(b=>!q||[b.first_name,b.last_name,b.phone,b.email].join(' ').toLowerCase().includes(q));
 for(const b of filtered){
  const tr=element('tr');td(tr,'Quando',String(b.starts_at||'').slice(0,16));td(tr,'Cliente',[b.first_name,b.last_name].filter(Boolean).join(' '));
  td(tr,'Trattamenti',(b.items||[]).map(i=>i.name).join(', '));td(tr,'Stato',b.status);
  const cell=td(tr,'Azioni',''),buttons=element('div',null,'jn-actions');cell.append(buttons);
  action(buttons,'Modifica',()=>openEditor(b));
  if(['pending','confirmed'].includes(b.status))action(buttons,'Annulla',()=>cancel(b),'jn-danger');
  rows.append(tr);
 }
 if(!filtered.length){const tr=element('tr');const c=td(tr,'','Nessun appuntamento nel periodo');c.colSpan=5;rows.append(tr);}
}
async function reload(){
 const from=$('#jn-from').value,to=$('#jn-to').value;
 bookings=await request('/jenny/admin/bookings?from='+encodeURIComponent(from)+'&to='+encodeURIComponent(to));
 render();
}
async function initialize(){
 services=(await request('/jenny/admin/services')).filter(s=>s.is_active);
 await reload();
}
login.addEventListener('submit',async e=>{
 e.preventDefault();if(busy)return;busy=true;notice('Accesso in corso…');
 try{
 const data=await request('/auth/login',{method:'POST',body:{identifier:login.elements.namedItem('identifier').value,password:login.elements.namedItem('password').value},auth:false});
 if(data.user?.must_change_password)throw new Error('È necessario cambiare prima la password nel backoffice ENEA.');
 if(!data.user?.roles?.includes('jenny_nails_admin'))throw new Error('Questo account non ha accesso all’area Jenny.');
 token=data.token;await initialize();login.hidden=true;space.hidden=false;login.reset();notice('');
 }catch(err){token='';notice(err.message);}finally{busy=false;}
});
$('#jn-logout').addEventListener('click',()=>{logout();notice('Sessione terminata.');});
$('#jn-refresh').addEventListener('click',()=>reload().catch(e=>notice(e.message)));
$('#jn-from').addEventListener('change',()=>reload().catch(e=>notice(e.message)));
$('#jn-to').addEventListener('change',()=>reload().catch(e=>notice(e.message)));
$('#jn-search').addEventListener('input',render);
function openEditor(b=null){
 editing=b;editor.reset();$('#jn-editor-title').textContent=b?'Modifica appuntamento #'+b.id:'Nuovo appuntamento';
 for(const name of ['first_name','last_name','phone','email']){field(name).value=b?(b[name]||''):'';field(name).disabled=!!b;}
 field('date').value=b?b.starts_at.slice(0,10):today();field('time').value=b?b.starts_at.slice(11,16):'';
 field('internal_note').value=b?.internal_note||'';field('notify').checked=true;
 const ids=new Set((b?.items||[]).map(i=>Number(i.service_id)));
 const container=$('#jn-services');container.replaceChildren();
 for(const s of services){const label=element('label'),check=element('input');check.type='checkbox';check.value=String(s.id);check.checked=ids.has(s.id);label.append(check,element('span',s.name));container.append(label);}
 editor.hidden=false;editor.scrollIntoView({behavior:'smooth',block:'start'});
}
$('#jn-new').addEventListener('click',()=>openEditor());
$('#jn-close').addEventListener('click',()=>{editor.hidden=true;});
async function cancel(b){
 if(busy||!confirm('Annullare l’appuntamento di '+[b.first_name,b.last_name].filter(Boolean).join(' ')+'? Rimarrà nello storico.'))return;
 busy=true;
 try{await request('/jenny/admin/bookings/'+b.id+'/cancel',{method:'POST',body:{notify:true}});await reload();notice('Appuntamento annullato.');}
 catch(err){notice(err.message)}finally{busy=false;}
}
editor.addEventListener('submit',async e=>{
 e.preventDefault();if(busy)return;
 const ids=[...$('#jn-services').querySelectorAll('input:checked')].map(x=>Number(x.value));
 if(!ids.length){notice('Seleziona almeno un trattamento.');return;}
 busy=true;const submit=editor.querySelector('button[type=submit]');submit.disabled=true;
 try{
 const data={date:field('date').value,time:field('time').value,service_ids:ids,internal_note:field('internal_note').value,notify:field('notify').checked,force:field('force').checked};
 if(editing){
  const same=JSON.stringify(editing.items.map(i=>i.service_id))===JSON.stringify(ids);
  const moved=editing.starts_at.slice(0,10)!==data.date||editing.starts_at.slice(11,16)!==data.time;
  const patch={version:editing.version,internal_note:data.internal_note,notify:data.notify,force:data.force,...(moved?{date:data.date,time:data.time}:{}),...(same?{}:{service_ids:ids})};
  await request('/jenny/admin/bookings/'+editing.id,{method:'PATCH',body:patch});
 }else{
  Object.assign(data,{customer:{first_name:field('first_name').value,last_name:field('last_name').value,phone:field('phone').value,email:field('email').value}});
  await request('/jenny/admin/bookings',{method:'POST',body:data});
 }
 editor.hidden=true;await reload();notice('Appuntamento salvato.');
 }catch(err){notice(err.message)}finally{busy=false;submit.disabled=false;}
});
