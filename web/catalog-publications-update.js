// Refresh the asynchronous publication region without replacing editable filters.
export function updateCatalogPublications(root,html){
 const region=root?.querySelector('[data-catalog-publications]');
 if(!region)return false;
 region.innerHTML=html;
 return true;
}
