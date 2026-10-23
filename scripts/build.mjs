import {build} from 'esbuild';
import {readFile,readdir,mkdir,rm,writeFile} from 'node:fs/promises';
import {extname,join} from 'node:path';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.json':'application/json'};
const assets={};
async function collect(dir,prefix=''){for(const f of await readdir(dir,{withFileTypes:true})){const p=join(dir,f.name),key=prefix+'/'+f.name;if(f.isDirectory())await collect(p,key);else{assets[key]={type:types[extname(f.name)]||'application/octet-stream',data:(await readFile(p)).toString('base64')};}}}
await collect('web');
const core=await build({entryPoints:['lib/parcel.js'],bundle:true,format:'esm',platform:'browser',write:false,minify:true});
assets['/parcel-core.js']={type:types['.js'],data:Buffer.from(core.outputFiles[0].contents).toString('base64')};
const result=await build({entryPoints:['worker/index.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',write:false,minify:true,plugins:[{name:'site-assets',setup(b){b.onResolve({filter:/^site-assets$/},()=>({path:'assets',namespace:'embedded'}));b.onLoad({filter:/.*/,namespace:'embedded'},()=>({contents:'export const assets='+JSON.stringify(assets),loader:'js'}));}}]});
await rm('dist',{recursive:true,force:true});await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
await writeFile('dist/server/index.js',result.outputFiles[0].contents);
await writeFile('dist/.openai/hosting.json',await readFile('.openai/hosting.json'));
console.log('Worker y '+Object.keys(assets).length+' recursos preparados ('+result.outputFiles[0].contents.length+' bytes).');
