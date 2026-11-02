import test from 'node:test';
import assert from 'node:assert/strict';
import {mobileContactInset,mountMobileContactSpacing} from '../web/opportunity-journey-ux.js';
test('el espacio del contacto usa su altura real, incluyendo texto partido y área segura',()=>{
 assert.equal(mobileContactInset([]),0);
 assert.equal(mobileContactInset([{getBoundingClientRect:()=>({height:92.3})},{getBoundingClientRect:()=>({height:120.2})}]),121);
});
test('el espacio se actualiza al redimensionar y se limpia al salir de la ficha',t=>{
 const previousDocument=globalThis.document,previousObserver=globalThis.ResizeObserver,values=new Map();let callback,disconnected=0,height=92;
 globalThis.document={documentElement:{style:{setProperty:(key,value)=>values.set(key,value),removeProperty:key=>values.delete(key)}}};
 globalThis.ResizeObserver=class{constructor(cb){callback=cb;}observe(){}disconnect(){disconnected++;}};
 t.after(()=>{if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;if(previousObserver===undefined)delete globalThis.ResizeObserver;else globalThis.ResizeObserver=previousObserver;});
 mountMobileContactSpacing({querySelectorAll:()=>[{getBoundingClientRect:()=>({height})}]});assert.equal(values.get('--terrain-contact-height'),'92px');
 height=142;callback();assert.equal(values.get('--terrain-contact-height'),'142px');
 mountMobileContactSpacing({querySelectorAll:()=>[]});assert.equal(disconnected,1);assert.equal(values.has('--terrain-contact-height'),false);
});
