const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const initials=name=>String(name||'Perfil').trim().split(/\s+/).filter(Boolean).slice(0,2).map(x=>Array.from(x)[0]).join('').toLocaleUpperCase('es');
export function uniqueParticipants(items=[]){return [...new Map(items.filter(p=>p?.id).map(p=>[p.id,p])).values()];}
function safeImage(url){return typeof url==='string' && (/^\/api\/(?:profile\/avatar(?:\?v=\d+)?|team\/ally-profiles\/[a-f0-9-]+\/avatar(?:\?v=\d+)?|(?:team\/)?records\/[^?#]+\/participants\/[a-f0-9-]+\/avatar)$/.test(url)||/^blob:/.test(url));}
export function avatarHTML(profile={},size=128){
  const pixels=[32,40,48,56,64,128].includes(size)?size:128,name=profile.name||'Tu perfil';
  return `<span class="profile-avatar avatar-${profile.kind==='company'?'company':'person'}" style="--avatar-size:${pixels}px" role="img" aria-label="${escape(name)}" title="${escape(name)}"><span aria-hidden="true">${escape(initials(name))}</span>${safeImage(profile.avatarUrl)?`<img src="${escape(profile.avatarUrl)}" width="128" height="128" alt="" decoding="async">`:''}</span>`;
}
export function avatarStack(items=[],{size=48,limit=4}={}){
  const people=uniqueParticipants(items),shown=people.slice(0,Math.max(1,limit)),extra=people.length-shown.length;
  return `<span class="avatar-stack" style="--stack-size:${[32,40,48,56,64].includes(size)?size:48}px" aria-label="${people.length} perfiles">${shown.map(p=>avatarHTML(p,size)).join('')}${extra?`<span class="avatar-extra" aria-label="${extra} perfiles más">+${extra}</span>`:''}</span>`;
}
export function participantsHTML(items=[],{demo=false,preview=false}={}){
  const people=uniqueParticipants(items);
  if(!people.length)return '';
  return `<section class="project-participants"><div class="participants-heading"><div><span class="participants-kicker">${demo?'Ejemplo visual':'Seguimiento privado'}</span><h3>${demo?'Personas y empresas en un proyecto':'Perfiles que han interactuado'}</h3></div><span class="participants-count">${people.length} perfiles</span></div><details class="participants-disclosure"><summary>${avatarStack(people)}<span>Ver ${people.length===1?'perfil':'todos los perfiles'} <span aria-hidden="true">↗</span></span></summary><ul>${people.map(p=>`<li>${avatarHTML(p,48)}<div><strong>${escape(p.name)}</strong><small>${p.kind==='company'?'Empresa':'Persona'}${p.headline?' · '+escape(p.headline):''}</small>${p.role?`<small>${escape(p.role)}</small>`:''}</div></li>`).join('')}</ul></details><p class="participants-note">${demo?(preview?'Vista previa de tu perfil junto a participantes ficticios.':'Perfiles ficticios para mostrar la superposición.'):'La interacción no acredita una vinculación contractual ni concede acceso al expediente.'}</p></section>`;
}
export const demoParticipants=[
  {id:'demo-ana',name:'Ana Ríos',kind:'person',headline:'Arquitecta',role:'Perfil ilustrativo'},
  {id:'demo-norte',name:'Norte Desarrollo',kind:'company',headline:'Desarrollo inmobiliario',role:'Empresa ficticia'},
  {id:'demo-luis',name:'Luis Mejía',kind:'person',headline:'Consultoría técnica',role:'Perfil ilustrativo'},
  {id:'demo-urbana',name:'Urbana Constructora',kind:'company',headline:'Construcción',role:'Empresa ficticia'},
  {id:'demo-clara',name:'Clara Torres',kind:'person',headline:'Comercialización',role:'Perfil ilustrativo'},
  {id:'demo-suelo',name:'Suelo Consultores',kind:'company',headline:'Estudios de suelo',role:'Empresa ficticia'},
];
// A failed or removed photo exposes the initials already present underneath it.
if(typeof document!=='undefined')document.addEventListener('error',event=>{if(event.target.matches?.('.profile-avatar img'))event.target.remove();},true);
