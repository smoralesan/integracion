import {test} from 'node:test';
import assert from 'node:assert/strict';
import {specialistRouteRedirect} from '../worker/site-routes.js';
import {specialists} from '../web/specialist-landings.js';
const redirect=path=>specialistRouteRedirect(new URL('https://portal.test'+path));
test('direct specialist URLs open their existing landing and registration routes',()=>{
  for(const {slug} of specialists){
    for(const base of ['/aliados/','/registro/aliado/']){
      const path=base+slug;
      assert.equal(redirect(path),'https://portal.test/#'+path);
      assert.equal(redirect(path+'/'),'https://portal.test/#'+path);
    }
  }
});
test('directory aliases preserve location query and remain on the same origin',()=>{
  assert.equal(redirect('/aliados?rol=Arquitectos'),'https://portal.test/#/aliados?rol=Arquitectos');
  assert.equal(redirect('/registro/aliado'),'https://portal.test/#/registro/aliado');
});
test('unknown routes, assets and APIs are not redirected into the app',()=>{
  for(const path of ['/aliados/no-existe','/aliados/arquitectos/extra','/registro/aliado/no-existe','/app.js','/api/profile','/no-existe','/'])assert.equal(redirect(path),null,path);
});

test('published legal firm profile has a direct route without admitting unknown profiles',()=>{
 assert.equal(redirect('/perfil-aliado/suarez-y-gomez-abogados'),'https://portal.test/#/perfil-aliado/suarez-y-gomez-abogados');
 assert.equal(redirect('/perfil-aliado/no-existe'),null);
});

test('El buscador de aliados acepta el enlace directo y conserva filtros',()=>{
 assert.equal(redirect('/aliados/buscar?q=Suarez&grupo=legal'),'https://portal.test/#/aliados/buscar?q=Suarez&grupo=legal');
 assert.equal(redirect('/aliados/buscar/extra'),null);
});
