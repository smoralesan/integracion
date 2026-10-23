import test from 'node:test';
import assert from 'node:assert/strict';
import {mapboxConfigResponse} from '../worker/mapbox-config.js';
test('Runtime cartography configuration exposes only an explicit public token',async()=>{
 const response=mapboxConfigResponse(new Request('https://site.test/mapbox-config.js'),{MAPBOX_PUBLIC_TOKEN:'pk.public-demo.browser-demo',BREVO_API_KEY:'private-mail-value',II_TEAM_ROLES:'private-roles'});
 const code=await response.text();assert.ok(code.includes('pk.public-demo.browser-demo'));assert.ok(!code.includes('private-mail-value'));assert.ok(!code.includes('private-roles'));assert.equal(response.headers.get('cache-control'),'no-store');assert.match(response.headers.get('content-type'),/javascript/);
});
test('Runtime cartography rejects secret tokens and script injection; HEAD has no body',async()=>{
 for(const value of ['sk.secret-demo.server-demo','pk.token";alert(1)//',undefined]){const response=mapboxConfigResponse(new Request('https://site.test/mapbox-config.js'),{MAPBOX_PUBLIC_TOKEN:value});assert.ok((await response.text()).startsWith('export const MAPBOX_TOKEN="";'));}
 assert.equal((await mapboxConfigResponse(new Request('https://site.test/mapbox-config.js',{method:'HEAD'}),{}).text()),'');
 assert.equal(mapboxConfigResponse(new Request('https://site.test/mapbox-config.js',{method:'POST'}),{}).status,405);
});
