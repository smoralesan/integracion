const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function signInPath(hash='#/mi-espacio'){
 const safe=/^#\/[a-z0-9/?=&%_.-]*$/i.test(hash)&&hash.length<=2048?'/'+hash:'/#/mi-espacio';
 return '/signin-with-chatgpt?return_to='+encodeURIComponent(safe);
}
export function accessGateHTML({hash='#/mi-espacio',title='Continúa desde tu cuenta',description='Inicia sesión para enviar tu solicitud y consultar su seguimiento.'}={}){
 return `<section class="px-access-gate"><span class="eyebrow">Tu siguiente paso</span><h2>${e(title)}</h2><p>${e(description)}</p><a class="button primary" href="${e(signInPath(hash))}" target="_top">Iniciar sesión y continuar →</a><a class="text-link" href="#/buscar">Seguir explorando</a><small>Explorar las fichas públicas no requiere cuenta. El contacto y los documentos privados se gestionan con autorización.</small></section>`;
}
