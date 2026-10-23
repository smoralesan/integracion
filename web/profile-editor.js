import {professionalView} from './professional-model.js';
import {professionalFieldsHTML,specialtyChoices,captureProfessional,bindProfessional} from './professional-fields.js';
import {allyCategories,technicalSpecialties} from './ally-categories.js';
import {api} from './records-api.js';
import {avatarHTML,participantsHTML,demoParticipants} from './avatars.js';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export class ProfileEditor{
  constructor(){this.profile=null;this.draft=null;this.image=null;this.previewUrl=null;this.generation=0;this.imageGeneration=0;}
  dispose(){this.generation++;this.imageGeneration++;this.processing=false;if(this.previewUrl)URL.revokeObjectURL(this.previewUrl);this.previewUrl=null;this.host=null;this.file=null;}
  async mount(host,defaults={}){
    if(this.host===host)return;
    this.dispose();if(!host)return;this.host=host;const generation=this.generation;
    host.innerHTML='<p role="status">Cargando tu perfil…</p>';
    try{const {profile}=await api('/api/profile');if(generation!==this.generation)return;this.profile=profile;this.draft=profile?{...profile,...professionalView(profile)}:{...professionalView(),kind:'person',name:'',headline:'',shareInProjects:false,revision:0};if(allyCategories.includes(defaults.category)){this.draft.category=defaults.category;this.draft.specialty=defaults.category==='Técnicos'&&technicalSpecialties.includes(defaults.specialty)?defaults.specialty:'';this.draft.specialties=defaults.category==='Técnicos'?[...new Set([this.draft.specialty,...this.draft.specialties].filter(Boolean))]:[];}this.image=undefined;this.render();}
    catch(error){if(generation!==this.generation)return;host.innerHTML=`<p role="alert">${escape(error.message)}</p><a class="button outline" href="#/mi-espacio">Volver a Mi espacio</a>`;}
  }
  capture(){const form=this.host?.querySelector('form');if(!form)return;const data=new FormData(form);Object.assign(this.draft,{kind:data.get('kind'),name:String(data.get('name')||''),headline:String(data.get('headline')||''),category:String(data.get('category')||''),specialty:String(data.get('specialty')||''),shareInProjects:data.has('shareInProjects')});Object.assign(this.draft,captureProfessional(form,this.draft));}
  render(){
    const p=this.draft;
    this.host.innerHTML=`<div class="profile-layout"><section class="profile-edit-card"><form data-profile-form><div class="profile-photo-row"><div data-avatar-preview>${avatarHTML({...p,avatarUrl:this.previewUrl||(this.image===null?null:this.profile?.avatarUrl)},128)}</div><div><span class="participants-kicker">Tu imagen en la plataforma</span><h2>Foto o logo del perfil</h2><p>Avatar circular · 128 × 128 px</p><label class="button outline profile-file-button">Elegir imagen<input name="avatar_file" type="file" accept="image/png,image/jpeg,image/webp" aria-label="Elegir foto o logo"></label><button type="button" class="text-button" data-remove-avatar>Usar iniciales</button></div></div><p class="profile-image-help">PNG, JPG o WebP, hasta 10 MB. La foto se centra; los logos conservan sus proporciones dentro del círculo.</p><div class="form-grid"><label class="form-field full">Tipo de perfil<select name="kind" aria-label="Tipo de perfil"><option value="person" ${p.kind==='person'?'selected':''}>Persona</option><option value="company" ${p.kind==='company'?'selected':''}>Empresa</option></select></label><label class="form-field full">Nombre visible<input name="name" required maxlength="100" value="${escape(p.name)}" placeholder="Tu nombre o el de tu empresa"></label><label class="form-field full">Categoría de aliado (opcional)<select name="category"><option value="">Sin definir</option>${allyCategories.map(c=>`<option ${p.category===c?'selected':''}>${escape(c)}</option>`).join('')}</select></label><label class="form-field full" data-profile-technical ${p.category==='Técnicos'?'':'hidden'}>Especialidad técnica principal<select name="specialty" ${p.category==='Técnicos'?'required':'disabled'}><option value="">Seleccionar especialidad</option>${technicalSpecialties.map(s=>`<option ${p.specialty===s?'selected':''}>${escape(s)}</option>`).join('')}</select></label>${specialtyChoices(p)}<label class="form-field full">Especialidad o actividad<input name="headline" maxlength="100" value="${escape(p.headline)}" placeholder="Ej. Desarrollo inmobiliario"></label></div>${professionalFieldsHTML(p)}<label class="check-row profile-consent"><input name="shareInProjects" type="checkbox" ${p.shareInProjects?'checked':''}>Usar mi perfil al interactuar en expedientes privados.</label><p class="profile-image-help">Al activarlo, el titular y el equipo verán tu nombre, tipo de perfil, especialidad y avatar al registrar un proyecto o enviar un mensaje compartido. El perfil no se publica en el catálogo. Desactivar esta opción evita nuevas vinculaciones; las participaciones anteriores permanecen en el historial.</p><div class="profile-save-row"><button class="button primary" type="submit">Guardar perfil</button><p data-profile-result role="status" aria-live="polite"></p></div></form></section><aside class="profile-example"><span class="participants-kicker">Así se verá la participación</span><h2>Un proyecto, varios perfiles</h2><p>Personas y empresas comparten el mismo formato visual. Despliega el grupo para ver sus nombres.</p><div data-profile-stack>${this.stackPreview()}</div><p class="profile-image-help">En las fichas se usan versiones reducidas de tu imagen de 128 px. Si falta la foto o el logo, aparecen las iniciales.</p></aside></div>`;
    const form=this.host.querySelector('form');
    form.addEventListener('submit',event=>{event.preventDefault();this.save();});
    form.addEventListener('input',()=>{this.capture();this.preview();});
    form.elements.category.addEventListener('change',()=>{const technical=form.elements.category.value==='Técnicos',field=form.querySelector('[data-profile-technical]'),select=form.elements.specialty;field.hidden=!technical;select.disabled=!technical;select.required=technical;select.value='';for(const c of form.querySelectorAll('[name="specialties"]')){c.checked=false;c.disabled=!technical;}form.querySelector('[data-profile-specialties]').hidden=!technical;this.capture();this.preview();});
    form.elements.specialty.addEventListener('change',()=>{const primary=form.elements.specialty.value;for(const c of form.querySelectorAll('[name="specialties"]')){c.disabled=c.value===primary;if(c.disabled)c.checked=true;}this.capture();});
    bindProfessional(form,this);
    form.elements.kind.addEventListener('change',async()=>{this.capture();if(this.file)await this.prepare(this.file);else this.preview();});
    form.elements.avatar_file.addEventListener('change',async()=>{const file=form.elements.avatar_file.files[0];if(file)await this.prepare(file);});
    form.querySelector('[data-remove-avatar]').addEventListener('click',()=>{this.imageGeneration++;this.processing=false;form.querySelector('[type="submit"]').disabled=false;this.image=null;this.file=null;if(this.previewUrl)URL.revokeObjectURL(this.previewUrl);this.previewUrl=null;form.elements.avatar_file.value='';this.preview();});
  }
  stackPreview(){return participantsHTML([{...this.draft,id:'preview-self',name:this.draft.name||'Tu perfil',avatarUrl:this.previewUrl||(this.image===null?null:this.profile?.avatarUrl)},...demoParticipants],{demo:true,preview:true});}
  preview(){const target=this.host?.querySelector('[data-avatar-preview]');if(target)target.innerHTML=avatarHTML({...this.draft,avatarUrl:this.previewUrl||(this.image===null?null:this.profile?.avatarUrl)},128);const stack=this.host?.querySelector('[data-profile-stack]');if(stack){const open=!!stack.querySelector('details')?.open;stack.innerHTML=this.stackPreview();if(open)stack.querySelector('details').open=true;}}
  async prepare(file){
    const generation=this.generation,imageGeneration=++this.imageGeneration,result=this.host.querySelector('[data-profile-result]'),submit=this.host.querySelector('[type="submit"]');
    submit.disabled=true;this.processing=true;
    try{
      if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10_000_000)throw Error('Elige un PNG, JPG o WebP de hasta 10 MB.');
      const bitmap=await createImageBitmap(file);
      try{
        if(bitmap.width*bitmap.height>32_000_000)throw Error('Usa una imagen de hasta 32 megapíxeles.');
        const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,128,128);
        const company=this.draft.kind==='company',scale=company?Math.min(90/bitmap.width,90/bitmap.height):Math.max(128/bitmap.width,128/bitmap.height),w=bitmap.width*scale,h=bitmap.height*scale;
        ctx.drawImage(bitmap,(128-w)/2,(128-h)/2,w,h);
        if(generation!==this.generation||imageGeneration!==this.imageGeneration)return;
        const prepared=canvas.toDataURL('image/png');const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
        if(generation!==this.generation||imageGeneration!==this.imageGeneration)return;
        this.image=prepared;
        if(this.previewUrl)URL.revokeObjectURL(this.previewUrl);this.previewUrl=URL.createObjectURL(blob);this.file=file;this.preview();result.textContent='Imagen preparada en 128 × 128 px. Guarda el perfil para conservarla.';
      }finally{bitmap.close();}
    }catch(error){if(generation===this.generation&&imageGeneration===this.imageGeneration)result.textContent=error.message;}
    finally{if(generation===this.generation&&imageGeneration===this.imageGeneration){this.processing=false;submit.disabled=false;}}
  }
  async save(){
    if(this.processing||this.saving)return;this.capture();const generation=this.generation,form=this.host.querySelector('form'),result=form.querySelector('[data-profile-result]'),submit=form.querySelector('[type="submit"]');
    this.saving=true;submit.disabled=true;result.textContent='Guardando…';
    try{const body={...this.draft};delete body.avatarUrl;delete body.id;if(this.image!==undefined)body.avatar=this.image;const {profile}=await api('/api/profile',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(body)});if(generation!==this.generation)return;this.profile=profile;this.draft={...profile};this.image=undefined;result.textContent='Perfil guardado en tu cuenta.';}
    catch(error){if(generation===this.generation)result.textContent=error.message;}
    finally{this.saving=false;if(generation===this.generation)submit.disabled=false;}
  }
}
