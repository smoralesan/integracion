const groups = [
  {id:'terrenos',label:'Terrenos',eyebrow:'Terrenos para proyectos',title:'Vende o encuentra terrenos para desarrollar.',description:'Conectamos propietarios con compradores y desarrolladores en Colombia.',links:[
    ['Vender mi terreno','Presenta su ubicación, área y condiciones de venta.','#/publicar/terreno'],
    ['Buscar terreno','Busca por municipio o delimita una zona en el mapa.','#/buscar'],
    ['Explorar oportunidades','Consulta fichas de terrenos y proyectos.','#/oportunidades'],
  ],feature:{label:'Venta o aporte',title:'Aportar un terreno a un proyecto',text:'Conoce las opciones de recibir dinero posterior, inmuebles del desarrollo o una combinación.',action:'tutorial',cta:'Cómo funciona el aporte'}},
  {id:'proyectos',label:'Proyectos',eyebrow:'Proyectos inmobiliarios',title:'Presenta tu proyecto y los aliados que buscas.',description:'Conectamos proyectos con profesionales y empresas especializados.',links:[
    ['Tengo un proyecto','Registra su etapa y las capacidades que necesitas sumar.','#/publicar/proyecto'],
    ['Necesidades de proyectos','Consulta las especialidades que buscan los proyectos.','#/necesidades'],
    ['Proyectos para reactivación','Explora proyectos en pausa que requieren evaluación.','#/proyectos-siniestrados'],
  ],feature:{label:'Cómo funciona',title:'El registro comienza privado.',text:'El equipo revisa tu expediente. Tú autorizas el resumen que podrá publicarse.',href:'#/como-funciona',cta:'Conocer el proceso'}},
  {id:'aliados',label:'Aliados',eyebrow:'Profesionales y empresas',title:'Encuentra una especialidad o presenta tu perfil.',description:'Conoce los actores que participan en el desarrollo de un proyecto inmobiliario.',links:[
    ['Conocer la red de aliados','Conoce los perfiles públicos y las especialidades.','#/aliados'],
    ['Buscar aliados','Busca por firma, especialidad o servicio.','#/aliados/buscar'],
    ['Ser un aliado','Presenta tus servicios como persona o empresa.','#/registro/aliado'],
    ['Abogados (legales)','Revisión jurídica de terrenos, contratos y acuerdos.','#/aliados/abogados'],
    ['Estructuradores','Evalúan la estructura técnica, financiera y jurídica.','#/aliados/estructuradores'],
    ['Constructores','Evalúan y ejecutan las obras del proyecto.','#/aliados/constructores'],
    ['Técnicos','Estudios, diseños, interventoría y coordinación especializada.','#/aliados/tecnicos'],
  ],feature:{label:'Necesidades de proyectos',title:'Conoce dónde buscan tu especialidad.',text:'Consulta qué profesionales o empresas requieren los proyectos para avanzar.',href:'#/necesidades',cta:'Explorar necesidades'}},
];
export function mountHeaderNavigation(){
  const header=document.querySelector('.site-header');
  const nav=document.querySelector('#primary-navigation');
  const toggle=header.querySelector('.menu-toggle');
  const mobile=matchMedia('(max-width: 960px)');
  nav.innerHTML=groups.map(g=>`<div class="mega-group"><button class="mega-trigger" id="nav-${g.id}" aria-expanded="false" aria-controls="mega-${g.id}">${g.label}<span class="mega-chevron" aria-hidden="true"></span></button><div class="mega-panel" id="mega-${g.id}" aria-labelledby="nav-${g.id}" hidden><div class="container mega-grid"><div class="mega-intro"><span class="mega-eyebrow">${g.eyebrow}</span><h2>${g.title}</h2><p>${g.description}</p></div><div class="mega-links">${g.links.map(([title,text,href],i)=>`<a class="mega-link ${i===0?'mega-link-first':''}" href="${href}"><span><strong>${title}</strong><small>${text}</small></span><span class="mega-arrow" aria-hidden="true">↗</span></a>`).join('')}</div><aside class="mega-feature"><span class="mega-eyebrow">${g.feature.label}</span><h3>${g.feature.title}</h3><p>${g.feature.text}</p>${g.feature.action?`<button class="mega-feature-link" data-action="${g.feature.action}">${g.feature.cta} <span aria-hidden="true">→</span></button>`:`<a class="mega-feature-link" href="${g.feature.href}">${g.feature.cta} <span aria-hidden="true">→</span></a>`}</aside></div><button class="mega-close" aria-label="Cerrar menú ${g.label}">×</button></div></div>`).join('')+`<a class="mega-how" href="#/como-funciona">Cómo funciona</a><div class="mega-mobile-shortcuts"><a href="#/publicar/terreno">Vender mi terreno ↗</a><a href="#/mi-espacio">Mi espacio</a><a data-team-link hidden href="#/equipo">Bandeja del equipo</a></div>`;
  const countryButton=header.querySelector('[data-country-toggle]');
  const countryPanel=header.querySelector('#country-panel');
  const brandCluster=header.querySelector('.brand-cluster');
  let active=null;
  function closeCountry(restore=false){
    countryPanel.hidden=true;
    countryButton.setAttribute('aria-expanded','false');
    if(restore)countryButton.focus();
  }
  function closePanel(restore=false){
    if(!active)return;
    const trigger=active;
    document.getElementById(trigger.getAttribute('aria-controls')).hidden=true;
    trigger.setAttribute('aria-expanded','false');
    active=null;
    if(restore)trigger.focus();
  }
  function close(restore=false){
    closePanel();
    closeCountry();
    nav.classList.remove('is-mobile-open');
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label','Abrir menú');
    if(restore)toggle.focus();
  }
  function toggleMobile(){
    const opening=!nav.classList.contains('is-mobile-open');
    close();
    if(opening){nav.classList.add('is-mobile-open');toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-label','Cerrar menú');}
  }
  header.addEventListener('click',event=>{
    if(event.target.closest('[data-country-toggle]')){
      const opening=countryPanel.hidden;close();
      if(opening){countryPanel.hidden=false;countryButton.setAttribute('aria-expanded','true');}
      return;
    }
    if(event.target.closest('.country-panel'))return;
    const trigger=event.target.closest('.mega-trigger');
    if(trigger){closeCountry();const opening=active!==trigger;closePanel();if(opening){active=trigger;trigger.setAttribute('aria-expanded','true');document.getElementById(trigger.getAttribute('aria-controls')).hidden=false;}return;}
    if(event.target.closest('.mega-close')){closePanel(true);return;}
    if(event.target.closest('a')||event.target.closest('.mega-feature-link'))close();
  });
  document.addEventListener('click',event=>{if(!header.contains(event.target))close();});
  header.addEventListener('keydown',event=>{
    if(event.key==='Escape'){
      if(!countryPanel.hidden){closeCountry(true);event.preventDefault();return;}
      if(active){closePanel(true);event.preventDefault();}
      else if(nav.classList.contains('is-mobile-open')){close(true);event.preventDefault();}
    }
    if(event.key==='ArrowDown'&&event.target.matches('.mega-trigger')){
      event.preventDefault();
      if(active!==event.target)event.target.click();
      document.getElementById(event.target.getAttribute('aria-controls')).querySelector('a,button')?.focus();
    }
  });
  header.addEventListener('focusout',event=>{
    if(!event.relatedTarget)return;
    if(!brandCluster.contains(event.relatedTarget))closeCountry();
    if(!header.contains(event.relatedTarget))close();
  });
  mobile.addEventListener('change',()=>close());
  return {close,toggleMobile};
}
