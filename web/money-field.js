import {formatAmountInput} from './money-input.js';
// Validation belongs to the field; draft persistence belongs only to a publication form.
export function updateMoneyInput(el,{saveDraft=()=>{},updateConversion=()=>{}}={}){
 const result=formatAmountInput(el.value,el.selectionStart??el.value.length);
 const minimum=/^(ls_|rescue_)/.test(el.name)?0:1;
 el.setCustomValidity(!result.valid?'Ingresa un monto válido, con máximo dos decimales y 15 cifras enteras.':result.canonical&&Number(result.canonical)<minimum?'El valor solicitado debe ser al menos 1.':'');
 if(result.valid){el.value=result.formatted;el.setSelectionRange(result.caret,result.caret);}
 if(el.closest('[data-form="submission"]')){saveDraft(true);updateConversion();}
 return result;
}
