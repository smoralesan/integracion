import {matchesDirectory} from './footer-directory.js';
import {matchesLandSearch,matchesPublicBounds} from './land-search.js';
import {matchesProjectDiscovery} from './project-discovery.js';
import {matchesOpportunityFilters} from './opportunity-filters.js';
// Uses only coordinates already present in the public record. Never reads private pins.
export function matchesCatalog(record,state){
 const zone=state.zone||[],sectors=state.sectors||[];
 return matchesDirectory(record,state.directoryScope)&&matchesLandSearch(record,state)&&matchesProjectDiscovery(record,state)&&matchesOpportunityFilters(record,{...state,query:zone.length||state.placeBounds?'':state.query})&&(!sectors.length||sectors.includes(record.sector))&&(!state.placeBounds||matchesPublicBounds(record,state.placeBounds));
}
