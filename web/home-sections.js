import {homeWorkingSection} from './brand-story.js';
import {specialistForRole} from './specialist-landings.js';
export function refreshedHomeSections({icon,roles,faqs}){
 const primaryRoles=['Abogados (legales)','Estructuradores','Arquitectos','Técnicos'].map(name=>roles.find(([role])=>role===name)).filter(Boolean);
 const steps=[
  ['file','Presenta lo que tienes o buscas','Registra el terreno, el proyecto o los criterios de tu búsqueda.'],
  ['users','Organiza la información','Identifica los soportes disponibles, los pendientes y qué autorizas compartir.'],
  ['handshake','Define el siguiente paso','Consulta información, coordina una visita o conversa sobre las condiciones.'],
 ];
 return `<div class="home-sections">
 <section class="hs-section hs-allies hs-allies--focused container" aria-labelledby="hs-allies-title"><div class="hs-heading"><div><span class="hs-eyebrow">Capacidades para tu proyecto</span><h2 id="hs-allies-title">Empieza por la especialidad que necesitas</h2></div><a class="hs-text-link" href="#/aliados">Ver todas las especialidades ${icon('arrow-right')}</a></div><nav class="hs-role-grid hs-role-grid--focused" aria-label="Especialidades principales de la red">${primaryRoles.map(([name,type,description])=>`<a href="#/aliados/${specialistForRole(name).slug}"><span class="hs-role-icon">${icon(type)}</span><div><strong>${name==='Abogados (legales)'?'Abogados':name}</strong><p>${description}</p></div><span class="hs-role-arrow" aria-hidden="true">↗</span></a>`).join('')}</nav><div class="hs-network-links"><a href="#/aliados/buscar">Buscar personas y empresas ${icon('arrow-right')}</a><span>¿Ofreces servicios? <a href="#/registro/aliado">Presenta tu especialidad →</a></span></div></section>
 ${homeWorkingSection({steps,icon})}
 <section class="hs-faq" aria-labelledby="hs-faq-title"><div class="container hs-faq-grid"><div class="hs-faq-intro"><span class="hs-eyebrow">Antes de comenzar</span><h2 id="hs-faq-title">Resolvemos tus dudas</h2><p>Publicación, revisión de la información y privacidad: conoce cómo funciona cada paso.</p><a class="hs-text-link" href="#/preguntas-frecuentes">Todas las preguntas frecuentes ${icon('arrow-right')}</a></div><div class="hs-faq-list">${faqs.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div></div></section>
 <section class="hs-closing" aria-labelledby="hs-closing-title"><div class="container hs-closing-grid"><div><span class="hs-eyebrow">Presenta tu oportunidad</span><h2 id="hs-closing-title">¿Tienes un terreno para vender?</h2><p>Ubícalo, describe sus condiciones y prepara la información para presentarlo.</p></div><div class="hs-closing-actions"><nav aria-label="Da el siguiente paso"><a class="hs-closing-sell" href="#/publicar/terreno">${icon('tag')}Vender mi terreno</a><a class="hs-closing-search" href="#/buscar">${icon('search')}Buscar terreno</a><a href="#/publicar/proyecto">${icon('building')}Tengo un proyecto</a></nav><p class="hs-closing-scope">Para terrenos destinados al desarrollo de proyectos inmobiliarios.</p></div></div></section>
 </div>`;
}
