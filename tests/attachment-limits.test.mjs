import test from 'node:test';
import assert from 'node:assert/strict';
import {attachmentCounts,validateAttachmentLimits,attachmentKind} from '../web/attachment-limits.js';
const photos=count=>Array.from({length:count},(_,i)=>({name:'foto-'+i+'.JPG'}));
const pdfs=count=>Array.from({length:count},(_,i)=>({name:'soporte-'+i+'.pdf'}));
test('permite 10 imágenes y 5 PDF independientes, conservando cupos para soportes geográficos',()=>{
 const files=[...photos(10),...pdfs(5),{name:'limite.kml'}];assert.deepEqual(attachmentCounts(files),{images:10,pdfs:5,other:1,total:16});assert.doesNotThrow(()=>validateAttachmentLimits(files));
 assert.throws(()=>validateAttachmentLimits(photos(11)),/10 imágenes/);assert.throws(()=>validateAttachmentLimits(pdfs(6)),/5 archivos PDF/);
});
test('la clasificación considera extensiones del servidor y enlaces a PDF con nombre libre',()=>{
 assert.equal(attachmentKind({name:'Informe',url:'https://example.com/informe.PDF?token=abc'}),'pdfs');assert.equal(attachmentKind({name:'Archivo',extension:'png'}),'images');
 assert.throws(()=>validateAttachmentLimits([...pdfs(5),{name:'Informe',url:'https://example.com/informe.pdf'}]),/5 archivos PDF/);
});
