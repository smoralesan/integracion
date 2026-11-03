import {numberSeparators} from './country-config.js';
export function declaredAreaInput(value,caret=String(value).length){
 const text=String(value??''),{group,decimal}=numberSeparators();
 const parts=text.split(decimal),whole=parts[0].split(group).join(''),fraction=parts[1]??'';
 if(parts.length>2||!/^\d*$/.test(whole)||!/^\d*$/.test(fraction)||whole.length>15||fraction.length>20)return {valid:false,formatted:text,caret,canonical:''};
 if(!text)return {valid:true,formatted:'',caret:0,canonical:''};
 const integer=whole.replace(/^0+(?=\d)/,'')||'0',formatted=integer.replace(/\B(?=(\d{3})+(?!\d))/g,group)+(parts.length===2?decimal+fraction:'');
 const logical=Math.max(0,text.slice(0,caret).split(group).join('').length-Math.max(0,whole.length-integer.length)+(whole?0:1));
 let position=0,count=0;while(position<formatted.length&&count<logical){if(formatted[position]!==group)count++;position++;}
 return {valid:true,formatted,caret:position,canonical:integer+(fraction?'.'+fraction:'')};
}
export function updateDeclaredAreaField(field){const result=declaredAreaInput(field.value,field.selectionStart??field.value.length);field.setCustomValidity(!result.valid?'Ingresa un área válida. Usa coma para los decimales.':result.canonical&&Number(result.canonical)<1?'El área declarada debe ser al menos 1 m².':'');if(result.valid){field.value=result.formatted;field.setSelectionRange(result.caret,result.caret);}return result;}
