import {divipola} from './colombia-divipola-data.js';

export const locationKey = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const displayName = value => value.toLocaleLowerCase('es-CO').split(' ').map((word,index) => ['de','del','la','las','los','y'].includes(word) && index ? word : word.charAt(0).toLocaleUpperCase('es-CO') + word.slice(1)).join(' ').replace(/d\.c\./gi,'D. C.');
export const departments = divipola.departments.map(([code,name]) => ({code,name:displayName(name)})).sort((a,b)=>a.name.localeCompare(b.name,'es'));
export const municipalities = divipola.municipalities.map(([code,name,type]) => ({code,departmentCode:code.slice(0,2),name:displayName(name),type}));
const departmentIndex = new Map(departments.map(d=>[d.code,d]));
const municipalityIndex = new Map(municipalities.map(m=>[m.code,m]));
export const getDepartment = code => departmentIndex.get(code);
export const getMunicipality = code => municipalityIndex.get(code);
export const municipalitiesFor = code => municipalities.filter(m=>m.departmentCode===code).sort((a,b)=>a.name.localeCompare(b.name,'es'));
const cityAliases = {cartagena:'cartagenadeindias',bogota:'bogotadc',cucuta:'sanjosedecucuta'};
const departmentAliases = {bogota:'bogotadc',sanandresprovidenciaysantacatalina:'archipielagodesanandresprovidenciaysantacatalina'};
export const municipalityKey = value => cityAliases[locationKey(value)] || locationKey(value);
export const departmentKey = value => departmentAliases[locationKey(value)] || locationKey(value);

// Codes are authoritative. Legacy drafts/clients may resolve a known, unambiguous name pair.
export function resolveLocation(form) {
  let department, municipality;
  if (form.department_code || form.municipality_code) {
    department = getDepartment(form.department_code);
    municipality = getMunicipality(form.municipality_code);
  } else {
    department = departments.find(d=>departmentKey(d.name)===departmentKey(form.region));
    municipality = municipalities.find(m=>m.departmentCode===department?.code && municipalityKey(m.name)===municipalityKey(form.city));
  }
  if (!department || !municipality || municipality.departmentCode!==department.code) return null;
  return {department_code:department.code,municipality_code:municipality.code,region:department.name,city:municipality.name};
}

export function normalizeLocationDraft(form) {
  const location = resolveLocation(form);
  if (location) return {...form,...location};
  const department = getDepartment(form.department_code) || (!form.department_code && departments.find(d=>departmentKey(d.name)===departmentKey(form.region)));
  return {...form,department_code:department?.code||'',region:department?.name||'',municipality_code:'',city:''};
}
