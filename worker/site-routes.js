import {contractMinutes} from '../web/contract-minutes.js';
import {publicAllyProfileBySlug} from '../web/public-ally-profiles.js';
import {specialistBySlug} from '../web/specialist-landings.js';

// Accept shared landing/registration URLs as aliases of the existing hash router.
export function specialistRouteRedirect(url){
  const path=url.pathname.replace(/\/+$/,'');
  if(['/politica-de-privacidad','/politica-de-cookies','/terminos-y-condiciones','/directorio-de-notarias'].includes(path)){const target=new URL('/',url);target.hash=path+url.search;return target.href;}
  if(path==='/minutas-de-contratos'||path.startsWith('/minutas-de-contratos/')&&contractMinutes.some(t=>path==='/minutas-de-contratos/'+t.id)){const target=new URL('/',url);target.hash=path+url.search;return target.href;}
  if(path.startsWith('/perfil-aliado/')&&publicAllyProfileBySlug(path.slice('/perfil-aliado/'.length))){const target=new URL('/',url);target.hash=path+url.search;return target.href;}
  const landing=path.startsWith('/aliados/')&&specialistBySlug(path.slice('/aliados/'.length));
  const registration=path.startsWith('/registro/aliado/')&&specialistBySlug(path.slice('/registro/aliado/'.length));
  if(path.startsWith('/solicitar-servicio/')&&specialistBySlug(path.slice('/solicitar-servicio/'.length))){const target=new URL('/',url);target.hash=path+url.search;return target.href;}
  if(path!=='/aliados/buscar'&&path!=='/aliados'&&path!=='/registro/aliado'&&!landing&&!registration)return null;
  const target=new URL('/',url);
  target.hash=path+url.search;
  return target.href;
}
