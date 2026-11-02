import {activeMarket,numberSeparators} from './country-config.js';
// Area is a declared measurement, not a currency. Preserve its decimal places.
const integerFormat=new Intl.NumberFormat(activeMarket.locale,{maximumFractionDigits:0});
const numericFormat=new Intl.NumberFormat(activeMarket.locale,{maximumFractionDigits:20});
export function formatDeclaredArea(value){
 if(typeof value==='string'&&/^\d+(?:\.\d+)?$/.test(value.trim())){const [integer,fraction='']=value.trim().split('.'),decimals=fraction.replace(/0+$/,'');return integerFormat.format(BigInt(integer))+(decimals?numberSeparators().decimal+decimals:'');}
 const number=Number(value);return value!=null&&value!==''&&Number.isFinite(number)?numericFormat.format(number):'Por informar';
}
