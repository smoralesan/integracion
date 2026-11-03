export async function photoFingerprint(file){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer())),byte=>byte.toString(16).padStart(2,'0')).join('');}
export async function uniquePhotoSelection(selected,existing=[]){const known=new Set(existing.map(file=>file.fingerprint).filter(Boolean)),files=[],duplicates=[];for(const file of selected){if(!/\.(jpe?g|png)$/i.test(file.name)||!file.size||file.size>10_000_000){files.push({file});continue;}const fingerprint=await photoFingerprint(file);if(known.has(fingerprint)){duplicates.push(file.name);continue;}known.add(fingerprint);files.push({file,fingerprint});}return {files,duplicates};}

export function newDemoId(prefix){return prefix+'-'+crypto.randomUUID();}
export function hasDemoDocument(files){return files.some(file=>file.origin==='demo'&&!file.localPhoto&&/\.pdf$/i.test(file.name));}
