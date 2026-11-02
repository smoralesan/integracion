import {activeMarket,numberSeparators} from './country-config.js';
// Area is a declared measurement, not a currency. Preserve its decimal places.
const integerFormat=new Intl.NumberFormat(activeMarket.locale,{maximumFractionDigits:0});
const numericFormat=new Intl.NumberFormat(activeMarket.locale,{maximumFractionDigits:20});
export function formatDeclaredArea(value){
 if(typeof value==='string'&&/^\d+(?:\.\d+)?$/.test(value.trim())){const [integer,fraction='']=value.trim().split('.'),decimals=fraction.replace(/0+$/,'');return integerFormat.format(BigInt(integer))+(decimals?numberSeparators().decimal+decimals:'');}
 const number=Number(value);return value!=null&&value!==''&&Number.isFinite(number)?numericFormat.format(number):'Por informar';
}
// Expand scientific notation without converting the entered decimal through floating point.
export function canonicalDeclaredArea(value){
 if(value==null||String(value).trim()==='')return null;
 const match=String(value).trim().match(/^\+?(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/);if(!match)return null;
 const whole=match[1],fraction=match[2]||'',exponent=Number(match[3]||0);if(!Number.isInteger(exponent)||Math.abs(exponent)>100)return null;
 const digits=whole+fraction,point=whole.length+exponent;
 let result=point<=0?'0.'+'0'.repeat(-point)+digits:point>=digits.length?digits+'0'.repeat(point-digits.length):digits.slice(0,point)+'.'+digits.slice(point);
 let [integer,decimals='']=result.split('.');integer=integer.replace(/^0+(?=\d)/,'');decimals=decimals.replace(/0+$/,'');if(integer.length>15||decimals.length>20)return null;
 return integer+(decimals?'.'+decimals:'');
}
