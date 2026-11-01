import {matchesDirectory} from './footer-directory.js';
import {matchesLandSearch} from './land-search.js';
import {matchesProjectDiscovery} from './project-discovery.js';
import {matchesOpportunityFilters} from './opportunity-filters.js';
import {pointInRing,insideBounds} from './geo.js';
// Uses only coordinates already present in the public record. Never reads private pins.
export function matchesCatalog(record,state){
 const zone=state.zone||[],sectors=state.sectors||[];
 return matchesDirectory(record,state.directoryScope)&&matchesLandSearch(record,state)&&matchesProjectDiscovery(record,state)&&matchesOpportunityFilters(record,{...state,query:zone.length||state.placeBounds?'':state.query})&&(!sectors.length||sectors.includes(record.sector))&&(!zone.length||pointInRing(record.coordinates,zone))&&(!state.placeBounds||insideBounds(record.coordinates,state.placeBounds));
}
