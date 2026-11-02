export const attachmentLimits=Object.freeze({images:10,pdfs:5,total:20});
export const attachmentLimitCopy='Hasta 10 imágenes y 5 PDF por registro · Hasta 10 MB por archivo.';
export function attachmentExtension(file){let extension=String(file.extension||'').toLowerCase();if(!extension)extension=String(file.name||'').split('.').at(-1).toLowerCase();if(!['jpg','jpeg','png','pdf'].includes(extension)&&file.url){try{extension=new URL(file.url).pathname.split('.').at(-1).toLowerCase();}catch{}}
 return extension;}
export function attachmentKind(file){const extension=attachmentExtension(file);return ['jpg','jpeg','png'].includes(extension)?'images':extension==='pdf'?'pdfs':'other';}
export function attachmentCounts(files){return files.reduce((counts,file)=>{counts[attachmentKind(file)]++;counts.total++;return counts;},{images:0,pdfs:0,other:0,total:0});}
export function validateAttachmentLimits(files){const counts=attachmentCounts(files);if(counts.images>attachmentLimits.images)throw Error('Puedes agregar hasta 10 imágenes por registro. Quita alguna para seleccionar otra.');if(counts.pdfs>attachmentLimits.pdfs)throw Error('Puedes agregar hasta 5 archivos PDF por registro. Quita alguno para seleccionar otro.');if(counts.total>attachmentLimits.total)throw Error('Puedes agregar hasta 20 archivos en total, incluidos los soportes geográficos y otros documentos.');return counts;}
