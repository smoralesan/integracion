import { LandMap, geocodeLocation } from './mapbox-map.js';
import { describeGeometry } from './parcel-core.js';
import { uploadDocument } from './records-api.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=value=>new Intl.NumberFormat('es-CO',{maximumFractionDigits:2}).format(value);
export class ParcelEditor {
  constructor(){this.map=new LandMap();this.drawPoints=[];this.drawing=false;this.fit=0;this.candidates=[];this.places=[];this.style='satellite';this.generation=0;}
  html() {
    const o=this.options,geometry=o.geometry;let info=null;
    if(geometry)try{info=describeGeometry(geometry);}catch{}
    return `<div class="parcel-editor" data-parcel-editor><div class="parcel-heading"><div><h3>Perímetro del terreno</h3><p>${o.readOnly?'Perímetro declarado y confirmado al registrar este expediente.':'Busca la ubicación y dibuja el límite, o importa un archivo geográfico.'}</p></div><span class="pill neutral">Privado</span></div>${o.readOnly?'':`<div class="parcel-search"><label><span class="sr-only">Ubicar el terreno en el mapa</span><input type="search" data-parcel-search placeholder="Ciudad, municipio o sector" value="${esc(this.query||'')}" maxlength="256"></label><button type="button" class="button outline" data-parcel-action="search">Ubicar</button></div>${this.places.length?`<div class="parcel-options" aria-label="Ubicaciones del terreno">${this.places.map((p,i)=>`<button type="button" data-parcel-action="place" data-index="${i}">${esc(p.properties?.full_address||p.properties?.name)}</button>`).join('')}</div>`:''}`}
      <div class="parcel-map-stage"><div class="mapbox-root parcel-map-root"></div><div class="parcel-map-controls"><button type="button" data-parcel-action="zoom-in" aria-label="Acercar perímetro">+</button><button type="button" data-parcel-action="zoom-out" aria-label="Alejar perímetro">−</button><button type="button" data-parcel-action="style">${this.style==='satellite'?'Ver mapa':'Ver satélite'}</button></div>${this.drawing?`<div class="parcel-drawing-note">${this.drawPoints.length} puntos · Marca el perímetro y pulsa Finalizar.</div>`:''}</div>
      <p class="parcel-message ${this.error?'error':''}" role="status">${esc(this.message||'')}</p>
      ${o.readOnly?'':`<div class="parcel-actions">${this.drawing?`<button type="button" class="button primary" data-parcel-action="finish">Finalizar perímetro</button><button type="button" class="button outline" data-parcel-action="undo" ${this.drawPoints.length?'':'disabled'}>Deshacer punto</button><button type="button" class="text-button" data-parcel-action="cancel">Cancelar</button>`:`<button type="button" class="button primary" data-parcel-action="draw">${geometry?'Volver a dibujar':'Dibujar perímetro'}</button><label class="button outline parcel-import">Importar KML / KMZ / GeoJSON<input type="file" data-parcel-file accept=".kml,.kmz,.geojson,.json" ${this.busy?'disabled':''}></label>${geometry?`<button type="button" class="text-button" data-parcel-action="clear">Quitar perímetro</button>`:''}`}</div><p class="parcel-help">El archivo importado se guarda privado por 60 días. Lectura geográfica: hasta 2 MB descomprimidos y 500 vértices por anillo. Los soportes de hasta 10 MB también pueden adjuntarse para revisión.</p>`}
      ${this.candidates.length&&!o.readOnly?`<div class="parcel-candidates"><strong>Elige el perímetro que corresponde a tu lote</strong>${this.candidates.map((c,i)=>`<div><span>${esc(c.name)} · ${number(c.areaM2)} m² · ${c.vertices} vértices</span><button type="button" class="text-button" data-parcel-action="candidate" data-index="${i}">Usar este perímetro</button></div>`).join('')}</div>`:''}
      ${info?`<div class="parcel-stats"><div><small>Área aproximada</small><strong>${number(info.areaM2)} m²</strong></div><div><small>Superficie</small><strong>${number(info.areaM2/10000)} ha</strong></div><div><small>Vértices / coordenadas</small><strong>${info.vertices} · WGS84</strong></div></div><p class="parcel-help">Fuente: ${esc(o.source||'Dibujo en el mapa')}. El área se calcula a partir del perímetro y no sustituye un levantamiento ni la información catastral.</p><div class="parcel-actions">${o.readOnly?'':`<button type="button" class="text-button" data-parcel-action="use-area">Usar área calculada en el formulario</button>`}<button type="button" class="text-button" data-parcel-action="export">Descargar GeoJSON</button></div>${o.readOnly?'':`<label class="check-row parcel-confirm"><input type="checkbox" data-parcel-confirm ${o.confirmed?'checked':''}>Confirmo que este perímetro corresponde al terreno que registro. Entiendo que el área es aproximada.</label>`}`:''}</div>`;
  }
  mount(host,options) {
    if(this.options?.key!==options.key){this.destroy();this.options=options;this.place=null;this.query='';this.fit++;}
    this.options=options;this.host=host;this.render();
  }
  render() {
    if(!this.host?.isConnected)return;
    this.host.innerHTML=this.html();
    const root=this.host.querySelector('.parcel-map-root');
    this.map.mount(root,{context:'parcel',items:[],selectedId:null,style:this.style,geometry:this.drawing?null:this.options.geometry,zone:[],drawPoints:this.drawPoints,drawing:this.drawing,fitKey:'parcel:'+this.options.key+':'+this.fit,place:this.place,
      onReady:()=>{},onError:message=>{this.message=message;this.error=true;this.updateMessage();},
      onPoint:p=>{if(this.drawPoints.length>=500)return;this.drawPoints.push(p);this.render();}});
    const editor=this.host.querySelector('[data-parcel-editor]');
    editor.addEventListener('click',event=>{const button=event.target.closest('[data-parcel-action]');if(button)this.action(button.dataset.parcelAction,button);});
    editor.addEventListener('input',event=>{if(event.target.matches('[data-parcel-search]'))this.query=event.target.value;});
    editor.addEventListener('keydown',event=>{if(event.key==='Enter'&&event.target.matches('[data-parcel-search]')){event.preventDefault();this.action('search');}});
    editor.addEventListener('change',event=>{
      if(event.target.matches('[data-parcel-confirm]'))this.change(this.options.geometry,this.options.source,event.target.checked);
      if(event.target.matches('[data-parcel-file]')&&event.target.files[0])this.importFile(event.target.files[0]);
    });
  }
  updateMessage(){const el=this.host?.querySelector('.parcel-message');if(el){el.textContent=this.message;el.classList.toggle('error',!!this.error);}}
  change(geometry,source,confirmed=false){Object.assign(this.options,{geometry,source,confirmed});this.options.onChange?.({geometry,source,confirmed});}
  async importFile(file) {
    if(this.options.localPreview){this.message="En esta maqueta puedes dibujar el perímetro. Importar archivos requiere el acceso real del portal.";this.error=true;this.updateMessage();return;}
    if(this.options.documentCount>=20){this.message='Puedes vincular hasta 20 documentos. Retira una referencia en Soportes antes de importar otro archivo.';this.error=true;this.updateMessage();return;}
    if(file.size>10_000_000){this.message='El archivo supera 10 MB. Agrega un enlace de descarga en Soportes.';this.error=true;this.updateMessage();return;}
    const generation=this.generation;this.busy=true;this.message='Guardando e interpretando el archivo geográfico…';this.error=false;this.render();
    try {
      const document=await uploadDocument(file);if(generation!==this.generation)return;
      this.options.onDocument?.(document);
      this.options.documentCount++;
      if(!document.analysis?.candidates?.length)throw Error(document.analysis?.message||'No se encontró un perímetro interpretable. El soporte quedó privado para revisión.');
      this.candidates=document.analysis.candidates;this.candidateSource=document.name;
      this.message='Archivo interpretado. Selecciona el perímetro y confírmalo en el mapa.';
    }catch(e){if(generation!==this.generation)return;this.message=e.message;this.error=true;}
    finally{if(generation===this.generation){this.busy=false;this.render();}}
  }
  async action(name,button) {
    try {
      this.error=false;
      if(name==='zoom-in'){this.map.zoom(1);return;}if(name==='zoom-out'){this.map.zoom(-1);return;}
      if(name==='style'){this.style=this.style==='map'?'satellite':'map';this.render();return;}
      if(name==='draw'){this.drawing=true;this.drawPoints=[];this.message='Marca al menos tres puntos sobre el mapa.';}
      if(name==='undo')this.drawPoints.pop();
      if(name==='cancel'){this.drawing=false;this.drawPoints=[];this.message='Dibujo cancelado. Conservamos el perímetro anterior.';}
      if(name==='clear'){this.change(null,'',false);this.candidates=[];this.message='Perímetro retirado del borrador.';}
      if(name==='finish'){
        if(this.drawPoints.length<3)throw Error('Marca al menos tres puntos.');
        const info=describeGeometry({type:'Polygon',coordinates:[[...this.drawPoints,this.drawPoints[0]]]});
        this.change(info.geometry,'Dibujo en Mapbox',false);this.drawing=false;this.drawPoints=[];this.candidates=[];this.place=null;this.fit++;this.message='Revisa el área y confirma el perímetro.';
      }
      if(name==='candidate'){
        const candidate=this.candidates[Number(button.dataset.index)];if(!candidate)return;
        this.change(candidate.geometry,this.candidateSource,false);this.drawing=false;this.drawPoints=[];this.place=null;this.fit++;this.message='Revisa el perímetro en el mapa y confirma que corresponde al terreno.';
      }
      if(name==='use-area'){this.options.onArea?.(Math.round(describeGeometry(this.options.geometry).areaM2));this.message='Área calculada aplicada al formulario. Puedes contrastarla con los soportes.';}
      if(name==='search'){
        if(!this.query?.trim())throw Error('Escribe una ciudad, municipio o sector.');
        const generation=this.generation;this.message='Buscando ubicación…';this.updateMessage();
        const places=await geocodeLocation(this.query);if(generation!==this.generation)return;this.places=places;this.message=places.length?'Selecciona la ubicación para acercar el mapa.':'No encontramos esa ubicación en Colombia.';
      }
      if(name==='place'){this.place=this.places[Number(button.dataset.index)];this.places=[];this.fit++;}
      if(name==='export'){
        const url=URL.createObjectURL(new Blob([JSON.stringify({type:'Feature',properties:{area_aproximada_m2:describeGeometry(this.options.geometry).areaM2},geometry:this.options.geometry},null,2)],{type:'application/geo+json'}));
        const anchor=document.createElement('a');anchor.href=url;anchor.download='perimetro-lote.geojson';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;
      }
      this.render();
    }catch(e){this.message=e.message;this.error=true;this.updateMessage();}
  }
  destroy(){this.generation++;this.map.destroy();this.host=null;this.drawing=false;this.drawPoints=[];this.candidates=[];this.places=[];this.message='';this.busy=false;}
}
