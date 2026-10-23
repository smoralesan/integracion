export const terrainSearchOptions=[['land-only','Solo terreno','solo-terreno'],['land-project','Terreno con proyecto','con-proyecto']];
export const terrainSearchLabel=value=>terrainSearchOptions.find(([key])=>key===value)?.[1]||'Todos los terrenos';
export const terrainSearchQuery=value=>terrainSearchOptions.find(([key])=>key===value)?.[2]||'';
export const terrainSearchFromQuery=value=>terrainSearchOptions.find(([, ,query])=>query===value)?.[0]||'';
export function terrainSearchKind(record){
 if((record.kind||record.type)!=='terreno')return '';
 const content=record.land_content??record.landContent;
 if(content==='land-only')return record.developmentProject?'':'land-only';
 if(content==='land-project')return record.developmentProject&&record.developmentProject.landReference!==record.id?'':'land-project';
 return '';
}
