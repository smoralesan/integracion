import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CONTENT_SECURITY_POLICY} from '../worker/security-headers.js';
const directive=name=>CONTENT_SECURITY_POLICY.split('; ').find(d=>d.startsWith(name+' '));
test('the policy only allows first-party and Mapbox scripts',()=>{
 assert.equal(directive('script-src'),"script-src 'self' https://api.mapbox.com");
 assert.equal(directive('object-src'),"object-src 'none'");
 assert.equal(directive('frame-ancestors'),"frame-ancestors 'none'");
});
test('the page loads no third-party or inline scripts',async()=>{
 const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');
 for(const [,attrs] of html.matchAll(/<script\b([^>]*)>/g))assert.match(attrs,/\bsrc="\.\//,attrs);
 assert.doesNotMatch(html,/\son[a-z]+=/i);
});
test('rendered templates do not use inline event handlers',async()=>{
 const app=await readFile(new URL('../web/app.js',import.meta.url),'utf8');
 assert.doesNotMatch(app,/\son(click|load|error|input|change|focus)="/);
});
