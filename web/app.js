import {landToolsPage,mountLandTools,landToolRoutes} from './land-tools.js';
import {notaryDirectoryPage} from './notary-directory.js';
import {valueStatusOptions,valueStatus,hasCashPreferences,negotiationValueLabel,normalizeNegotiationForm,referenceValueSummary} from './land-negotiation.js';
import {visibilityFieldsHTML,visibilityLabel} from './land-visibility.js';
import {howItWorksPage,mountHowItWorks} from './how-it-works.js';
import {proposalDemoPage,mountProposalDemo} from './proposal-demo.js';
import {contractMinutesPage,mountContractMinutes} from './contract-minutes.js';
import {catalogRouteState,savedSearchHash,searchLocationLabel} from './catalog-navigation.js';
import {terrainSearchLabel,terrainSearchQuery,terrainSearchFromQuery} from './terrain-search.js';
import {landSearchHTML,mountLandSearch,matchesLandSearch} from './land-search.js';
import {catalogSearchHTML,mountCatalogSearch,readCatalogTerritory,drawingTerritory} from './catalog-search.js';
import {landUses,sectorForSlug} from './development-sectors.js';
import {localDrafts,chooseDraft,putDraft,draftHref,completeLocalRegistration,registrationProgressHTML,demoPerimeterHTML,demoSupportsHTML,localRegistrationsHTML,localConfirmationHTML} from './registration-journey.js';
import {EmailEntry} from './email-entry.js';
import {captureSearchContext,readSearchContext,normalizeSearchContext,isCatalogHash,restoreSearchScroll} from './search-journey.js';
import {accessGateHTML} from './access-gate.js';
import {normalizeSpaceObjective} from './space-intent.js';
import {premiumValuationPage} from './premium-valuation.js';
import {catalogGroupsHTML,mountJourney,toggleSearchFilters} from './journey-ui.js';
import {mountActivity} from './activity-center.js';
import {OpportunityExperience,comparisonButton,availabilityHTML,publicOpportunityHTML,ownerExperienceHTML,teamExperienceHTML,reactivationContextHTML} from './opportunity-experience.js';
import {portalLinks,portalPage,mountPortalPage,mountLegalAccess,legalButtons} from './portal-pages.js';
import {rescueOverviewHTML,mountRescueGalleries,rescueGalleryZoomHTML} from './rescue-gallery.js';
import {rescueMetricsHTML} from './reactivation-finance.js';
import {terrainPreviewHTML,mountTerrainPreviews} from './terrain-previews.js';
import {allyNetworkHTML} from './ally-network.js';
import {demoTerrainGeometry,terrainDefaultMapStyle} from './terrain-parcels.js';
import {compactHeading,discoveryFiltersHTML,mountSpecialistDirectory} from './discovery-ux.js';
import {terrainDetailHTML,mountTerrainDetail,terrainConsultHTML,terrainPhotoHTML} from './terrain-detail.js';
import {publicAllyProfileBySlug,publicAllyProfileHTML} from './public-ally-profiles.js';
import {mountLawyerCarousel} from './lawyer-carousel.js';
import {terrainCardTag,terrainOverviewHTML,constructionProjectHTML,hasConstructionProject} from './terrain-project.js';
import {ProjectNeedsBoard,needProposalHTML,normalizeNeedProposal} from './project-needs-ui.js';
import {needProjects} from './project-needs-data.js';
import {formSteps,stepperHTML,filterChipsHTML,removeFilter,spaceActionsHTML,draftStatus,showFormIssue,focusFormStep,mountSubmissionUX} from './ux-flow.js';
import {SalesUI} from './sales-ui.js';
import {images,properties} from './opportunity-examples.js';
import {ServiceRequestsUI} from './service-requests-ui.js';
import {isBrokerRelationship,normalizeBrokerExclusivity,brokerExclusivityFields,syncBrokerExclusivity,brokerExclusivityLabel,brokerExclusivitySummary} from './broker-exclusivity.js';
import {landSituationFields,captureLandSituation,syncLandSituation,obligationSupports,landSituationSummary,premiumValuationField} from './land-situation.js';
import {normalizeLandSituation} from './land-situation-model.js';
import {specialists,specialistBySlug,specialistForRole,specialistDirectory,specialistLanding,specialistDefaults,registrationHref} from './specialist-landings.js';
import {HeroIntentSelector} from './hero-intent.js';
import {landScopeNotice,landScopeConfirmation,landScopeExclusion} from './land-scope.js';
import {technicalSpecialties} from './ally-categories.js';
import {ProfileEditor} from './profile-editor.js';
import {avatarStack,participantsHTML,demoParticipants} from './avatars.js';
import {departments,municipalitiesFor,getDepartment,getMunicipality,resolveLocation,normalizeLocationDraft} from './colombia-locations.js';
import {featuredOpportunities} from './featured-opportunities.js';
import {areaBands,priceLimits,matchesOpportunityFilters} from './opportunity-filters.js';
import {refreshedHomeSections} from './home-sections.js';
import {referenceHomeHero} from './home-hero.js';
import {footerDirectoryHTML,directoryTitle,matchesDirectory} from './footer-directory.js';
import {mountHeaderNavigation} from './header-nav.js';
import {homeOptionsIndex,homeAlternative,heroAlternative} from './home-options.js';
import {ReviewDesk, ownerWorkflowHTML, statusBadge, summaryHTML} from './review-ui.js';
import {statusLabel} from './workflow-model.js';
import { ParcelEditor } from "./parcel-editor.js";
import {normalizeLocationPin,terrainLocationMode,locationSummary,locationLabel} from "./terrain-location.js";
import { api, uploadDocument, addDocumentLink, saveRecord } from "./records-api.js";
import {
  readAmount,
  formatAmount,
  formatAmountInput,
  normalizePastedAmount,
} from "./money-input.js";
import { LandMap, geocodeLocation, staticMapHTML } from "./mapbox-map.js";
import {
  validRing,
  pointInRing,
  toPolygon,
  insideBounds,
  locationBounds,
} from "./geo.js";
const headerNavigation = mountHeaderNavigation();
const profileEditor = new ProfileEditor();
const serviceRequestsUI = new ServiceRequestsUI();
const salesUI = new SalesUI();
const heroIntent = new HeroIntentSelector();
const opportunityExperience = new OpportunityExperience({properties,toast,onOwnerUpdate:r=>{state.remoteRecord=r;render();},onTeamUpdate:()=>reviewDesk.load(reviewDesk.key)});
const needsBoard = new ProjectNeedsBoard((project,need)=>modal(needProposalHTML(project,need)));
document.querySelector("#footer-directory-root").innerHTML = footerDirectoryHTML();
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const paths = {
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  "arrow-left": '<path d="M20 12H4m6-6-6 6 6 6"/>',
  "arrow-right": '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  "arrow-up-right": '<path d="M6 18 18 6M6 6h12v12"/>',
  "chevron-right": '<path d="m9 5 7 7-7 7"/>',
  "chevron-down": '<path d="m6 9 6 6 6-6"/>',
  tag: '<path d="M3 3h8l10 10-8 8L3 11V3Z"/><circle cx="7.5" cy="7.5" r="1"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  heart:
    '<path d="M20.5 4.7a5.2 5.2 0 0 0-7.3 0L12 5.9l-1.2-1.2a5.2 5.2 0 0 0-7.3 7.3L12 20.5l8.5-8.5a5.2 5.2 0 0 0 0-7.3Z"/>',
  map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15"/>',
  polygon:
    '<path d="m4 7 6-4 10 5-3 12-13-3V7Z"/><circle cx="4" cy="7" r="1"/><circle cx="10" cy="3" r="1"/><circle cx="20" cy="8" r="1"/><circle cx="17" cy="20" r="1"/>',
  layers: '<path d="m12 3 10 6-10 6L2 9l10-6Zm-9 11 9 5 9-5M3 18l9 5 9-5"/>',
  bookmark: '<path d="M6 3h12v19l-6-4-6 4V3Z"/>',
  sliders:
    '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2" fill="white"/><circle cx="16" cy="12" r="2" fill="white"/><circle cx="10" cy="18" r="2" fill="white"/>',
  lock: '<rect x="5" y="10" width="14" height="12" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v3"/>',
  shield:
    '<path d="m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6l9-4Z"/><path d="m8 12 3 3 5-6"/>',
  building:
    '<path d="M3 22V8l7-4v18M10 22V2l11 5v15H1m13-14h3m-3 4h3m-3 4h3M6 10v2m0 4v2"/>',
  chart: '<path d="M3 22V13h5v9m0 0V8h5v14m0 0V3h5v19M1 22h21"/>',
  helmet: '<path d="M3 17v-3a9 9 0 0 1 18 0v3M9 5v8m6-8v8M2 17h20v4H2v-4Z"/>',
  ruler: '<path d="m3 21 18-18v18H3Zm10-5h3v-3M9 15l2 2m2-6 2 2m2-6 2 2"/>',
  scale: '<path d="M12 3v18M6 21h12M4 7h16M6 7l-4 8h8L6 7Zm12 0-4 8h8l-4-8Z"/>',
  bank: '<path d="m2 8 10-6 10 6H2Zm2 3v8m5-8v8m6-8v8m5-8v8M2 22h20"/>',
  coins:
    '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v5c0 4 16 4 16 0V5M4 10v5c0 4 16 4 16 0v-5M4 15v4c0 4 16 4 16 0v-4"/>',
  users:
    '<circle cx="12" cy="7" r="4"/><path d="M5 22v-3a7 7 0 0 1 14 0v3M4 4a4 4 0 0 0 0 7m16-7a4 4 0 0 1 0 7M1 21v-3a6 6 0 0 1 3-5m19 8v-3a6 6 0 0 0-3-5"/>',
  user: '<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',
  file: '<path d="M5 2h9l5 5v15H5V2Zm9 0v6h5M8 12h8M8 16h8"/>',
  upload: '<path d="M12 16V3m-5 5 5-5 5 5M3 15v6h18v-6"/>',
  link: '<path d="m10 14 4-4m-6 7-2 2a4.2 4.2 0 0 1-6-6l5-5a4.2 4.2 0 0 1 6 0m2 8a4.2 4.2 0 0 0 6 0l5-5a4.2 4.2 0 0 0-6-6l-2 2" transform="translate(2 0) scale(.9)"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 11v6m0-10v1"/>',
  x: '<path d="m6 6 12 12M6 18 18 6"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
  minus: '<path d="M4 12h16"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  list: '<path d="M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01"/>',
  handshake:
    '<path d="m2 8 5-4 5 3 5-3 5 4-3 9-6 4-7-4-4-9Zm5-4 5 3-4 4 3 2 4-3 6 5M6 15l5 5"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  home: '<path d="m2 11 10-9 10 9M5 9v13h14V9M10 22v-8h4v8"/>',
};
const icon = (name, cls = "") =>
  `<svg class="ui-icon ${cls}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.file}</svg>`;
function hydrateIcons() {
  $$("[data-icon]").forEach((el) => {
    el.innerHTML = icon(el.dataset.icon);
  });
}
const roles = [
  ["Abogados (legales)", "scale", "Aportan revisión jurídica del terreno, los contratos y los acuerdos del proyecto."],
  [
    "Estructuradores",
    "chart",
    "Articulan la evaluación y la estructura técnica, financiera y jurídica del proyecto.",
  ],
  [
    "Desarrolladores",
    "building",
    "Impulsan el proyecto y coordinan sus etapas y actores.",
  ],
  [
    "Arquitectos",
    "ruler",
    "Aportan diseño y evaluación del potencial espacial.",
  ],
  [
    "Constructores",
    "helmet",
    "Evalúan y ejecutan las obras según el alcance acordado.",
  ],
  [
    "Inversionistas",
    "coins",
    "Evalúan oportunidades de participación y sus condiciones.",
  ],
  [
    "Financiadores",
    "bank",
    "Estudian alternativas y requisitos de financiación.",
  ],
  [
    "Fiduciarias",
    "shield",
    "Administran bienes o recursos conforme al esquema contratado.",
  ],
  [
    "Comercializadores",
    "users",
    "Conectan la oferta con su mercado y acompañan las ventas.",
  ],
  ["Técnicos", "ruler", "Estudios, diseños técnicos, interventoría, presupuestos y coordinación para cada etapa del proyecto."],
];
const needs = needProjects.slice(0,4).map(p=>({projectId:p.id,projectTitle:p.title,scale:p.scale,image:p.image,specialties:p.needs.map(n=>specialistBySlug(n.specialist).label),role:p.needs.slice(0,2).map(n=>specialistBySlug(n.specialist).label).join(' · ')+(p.needs.length>2?' +'+(p.needs.length-2):''),city:p.locations.map(l=>getMunicipality(l.municipalityCode).name).join(' / '),stage:p.stage,type:specialistBySlug(p.needs[0].specialist).icon,description:p.summary}));
const KEY = "ii-web-demo-v1";
function readStore() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    return {
      objective:normalizeSpaceObjective(raw.objective),
      favorites: Array.isArray(raw.favorites) ? raw.favorites : [],
      searches: Array.isArray(raw.searches) ? raw.searches : [],
      submissions: Array.isArray(raw.submissions) ? raw.submissions : [],
      interests: Array.isArray(raw.interests) ? raw.interests : [],
      draft: raw.draft && typeof raw.draft === "object" ? raw.draft : null,
      drafts:localDrafts(raw),
    };
  } catch {
    return {
      favorites: [],
      searches: [],
      submissions: [],
      interests: [],
      draft: null,
      drafts:[],
    };
  }
}
let saved = readStore();
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(saved));
    return true;
  } catch {
    toast(
      "No fue posible guardar en este navegador. Revisa el espacio disponible.",
    );
    return false;
  }
}
const state = {
  searchDepartment:"",searchMunicipality:"",intendedUse:"",
  query: "",
  directoryScope: null,
  type: "",
  landContent: "",
  mode: "",
  maxPrice: "",
  min: "",
  max: "",
  view: "list",
  zone: [],
  sectors: [],
  drawing: false,
  drawPoints: [],
  layers: false,
  mapStyle: "map",
  detailMapStyle: "map",
  mapFitRevision: 0,
  mapPlace: null,
  mapSearchText: "",
  pendingLocationQuery: "",
  placeResults: [],
  placeBounds: null,
  selected: properties[0].id,
  searchSelected: "",
  session:null,
  catalogRecords:[], catalogLoaded:false, catalogError:"", catalogCursor:null,
  publicRecord:null, publicError:"",
  remoteRecords: [],
  remoteCursor: null,
  remoteLoaded: false,
  remoteError: "",
  remoteRecord: null,
  remoteRecordError: "",
  submitting: false,
  spaceTab: "favorites",
  formStep: 1,
  formKind: "terreno",
  form: {},
  files: [],
  fileMode: "upload",
  tutorialStep: 0,
  tutorialChoice: "",
  tutorialFromForm: false,
  allyRole: "",
};
const money = (n) =>
  new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(n);
const btn = (text, href, style = "primary") =>
  `<a class="button ${style}" href="${href}">${text}</a>`;
const link = (text, href) =>
  `<a class="text-link" href="${href}">${text} ${icon("arrow-right")}</a>`;
const demoLabel = () =>
  `<span class="section-meta">${icon("info")} Datos de ejemplo</span>`;
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("visible");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("visible"), 4200);
}
function modal(content) {
  $("#dialog-content").innerHTML = content;
  hydrateIcons();
  if (!$("#dialog").open) $("#dialog").showModal();
}
function closeModal() {
  $("#dialog").close();
}
function pageHeader(title, description, eyebrow = "", action = "") {
  return `<section class="page-header"><div class="container"><div class="breadcrumbs"><a href="#/">Inicio</a>${icon("chevron-right")}<span>${escape(title)}</span></div><div class="page-header-row"><div>${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ""}<h1>${title}</h1><p>${description}</p></div>${action}</div></div></section>`;
}
function propertyCard(p) {
  const favorite = saved.favorites.includes(p.id);
  return `<article class="property-card${p.type==='proyecto'?' property-card--project':''}"><div class="property-image"><a href="#/oportunidad/${p.id}" aria-label="Ver ${escape(p.title)}">${terrainPreviewHTML(p)||`<img src="${escape(p.image)}" alt="Imagen arquitectónica ilustrativa de un edificio individual" loading="lazy">`}</a><span class="pill${p.reactivation ? " warm" : ""}">${p.label}</span><button class="favorite ${favorite ? "saved" : ""}" data-action="favorite" data-id="${p.id}" aria-label="${favorite ? "Quitar de" : "Guardar en"} favoritos: ${escape(p.title)}" aria-pressed="${favorite}">${icon("heart")}</button></div><div class="property-body"><div class="property-reference">${p.id} · Ejemplo</div>${terrainCardTag(p)}<h3><a class="card-detail-link" href="#/oportunidad/${p.id}">${p.title}</a></h3><div class="property-location">${icon("pin")}<span>${escape(locationLabel(p))}</span></div><div class="property-facts"><span>${p.area ? money(p.area) + " m²" : "Busca " + p.need.toLowerCase()}</span><span>${p.mode}</span></div>${rescueMetricsHTML(p)}<div class="property-bottom"><div class="property-price">${p.price ? "COP $" + money(p.price) : p.type === "terreno" ? "Condiciones por acordar" : "Conecta con el proyecto"}<small>${p.price ? "Precio ilustrativo · Negociable" : p.type === "terreno" ? "Abierto a propuestas" : "Participación por evaluar"}</small></div><a class="icon-button" href="#/oportunidad/${p.id}" aria-label="Ver oportunidad ${p.id}">${icon("arrow-up-right")}</a></div>${comparisonButton(p)}</div></article>`;
}
const emailEntry = new EmailEntry();
let draftSaveTimer;
const landMap = new LandMap();
const parcelEditor = new ParcelEditor();
const reviewDesk = new ReviewDesk(()=>{if(location.hash.startsWith('#/equipo'))render();});
async function loadSession(){
  try{state.session=await api('/api/session');}catch{state.session={authenticated:false,teamRole:null};}
  document.querySelectorAll('[data-team-link]').forEach(a=>a.hidden=!state.session.teamRole);
  if(location.hash==='#/mi-espacio'||location.hash.startsWith('#/publicar/'))render();
}
let catalogGeneration=0,pendingResultsContext=null,pendingExplicitReturn=null,pendingCatalogNavigation=null,initialNavigation=true;
function navigateCatalog(hash){
  const params=new URLSearchParams(hash.split('?')[1]||'');
  if(hash.startsWith('#/buscar')&&!params.has('tipo'))Object.assign(state,{type:'terreno',landContent:params.has('contenido')?terrainSearchFromQuery(params.get('contenido')):state.landContent||'land-only',reactivationFilter:''});
  pendingCatalogNavigation={hash,drawing:state.drawing};
  if(location.hash===hash)enterRoute();else location.hash=hash;
}
async function refreshPublished(append=false){
  const generation=++catalogGeneration,restore=pendingResultsContext;
  try{
    let result=await api('/api/catalog'+(append&&state.catalogCursor?'?cursor='+encodeURIComponent(state.catalogCursor):'')),records=append?[...state.catalogRecords,...result.records]:result.records,cursor=result.cursor,pages=0;
    while(!append&&restore&&records.length<restore.catalogLimit&&cursor&&pages<9){const next=await api('/api/catalog?cursor='+encodeURIComponent(cursor));records.push(...next.records);cursor=next.cursor;pages++;}
    if(generation!==catalogGeneration)return;
    state.catalogRecords=records;state.catalogCursor=cursor;state.catalogError='';
  }catch(error){if(generation!==catalogGeneration)return;state.catalogError=error.message;}
  state.catalogLoaded=true;
  if(isCatalogHash(location.hash)){const y=window.scrollY;render();if(restore&&pendingResultsContext===restore&&restore.hash===location.hash)restoreSearchScroll(restore);else window.scrollTo({top:y,behavior:'instant'});}
  if(pendingResultsContext===restore)pendingResultsContext=null;
}
async function loadPublication(id){
  state.publicRecord=null;state.publicError='';
  if(location.hash==='#/publicacion/'+id)render();
  try{const r=await api('/api/catalog/'+encodeURIComponent(id));if(location.hash==='#/publicacion/'+id)state.publicRecord=r;}
  catch(error){state.publicError=error.message;}
  if(location.hash==='#/publicacion/'+id)render();
}
function publicationsHTML(){
  if(!state.catalogLoaded)return '<section class="published-catalog"><p role="status">Consultando resúmenes publicados…</p></section>';
  if(state.catalogError)return '<p class="jr-publications-access">No pudimos cargar las publicaciones. Puedes explorar los ejemplos o <button type="button" class="text-button" data-action="retry-publications">volver a intentarlo</button>.</p>';
  if(!state.catalogRecords.length&&!state.catalogCursor)return '';
  const directoryRecords=state.catalogRecords.filter(r=>matchesDirectory(r,state.directoryScope)&&matchesLandSearch(r,state)&&matchesOpportunityFilters(r,state));
  return `<section class="published-catalog"><div class="section-heading"><div><h2>Resúmenes publicados</h2><p>${directoryRecords.length} ${directoryRecords.length===1?'coincidencia':'coincidencias'} entre ${state.catalogRecords.length} ${state.catalogRecords.length===1?'publicación cargada':'publicaciones cargadas'}${state.catalogCursor?'; hay más por cargar':''}. Información autorizada por su titular.</p></div></div><div class="published-grid">${[...directoryRecords.reduce((groups,r)=>{const key=r.assetReference||r.id;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);return groups;},new Map()).values()].map(group=>{const r=group[0];return `<article>${availabilityHTML(r)}${terrainCardTag(r)}${summaryHTML(r)}<a class="button outline" href="#/publicacion/${r.id}">Ver ficha</a>${comparisonButton(r)}${group.length>1?`<details><summary>${group.length} presentaciones vinculadas al mismo inmueble</summary>${group.slice(1).map(x=>`<p><a href="#/publicacion/${x.id}">${escape(x.reference)} · ${escape(x.title)}</a></p>`).join('')}<p>Revisa representación y exclusividad en cada ficha. Las autorizaciones se gestionan por separado.</p></details>`:''}</article>`;}).join('')}</div>${!directoryRecords.length?'<p>Aún no hay coincidencias entre los resúmenes cargados.</p>':''}${state.catalogCursor?'<button class="button outline" data-action="more-publications">Cargar más publicaciones</button>':''}</section>`;
}
function publicationPage(){
  const r=state.publicRecord;
  if(!r)return pageHeader('Resumen publicado',state.publicError||'Cargando publicación…')+`<section class="page-content"><div class="container">${btn('Volver al catálogo','#/oportunidades','outline')}</div></section>`;
  return publicOpportunityHTML(r);
}

function syncParcel() {
  const host = $("[data-parcel-host]");
  if (!host) { parcelEditor.destroy(); return; }
  const readOnly = host.dataset.readOnly === "true";
  const record = host.dataset.teamParcel ? reviewDesk.record : state.remoteRecord;
  const f = state.form;
  const key = readOnly ? record?.id : f.client_id;
  parcelEditor.mount(host, {
    key, readOnly, localPreview:emailEntry.isPreview(), documentCount:state.files.length, locationQuery:readOnly?'':[f.city,f.region].filter(Boolean).join(', '),
    geometry: readOnly ? record?.parcel?.geometry : f.parcel_geometry,
    mode:readOnly?(record?.locationPin?'pin':'polygon'):terrainLocationMode(f),
    pin:readOnly?record?.locationPin?.coordinates:f.location_pin,
    pinConfirmed:readOnly?true:f.location_pin_confirmed,
    source: readOnly ? record?.parcel?.source : f.parcel_source,
    confirmed: readOnly ? true : f.parcel_confirmed,
    onChange: ({geometry, source, confirmed, mode, pin, pinConfirmed}) => {
      if (state.form.client_id !== key) return;
      Object.assign(state.form, {parcel_geometry: geometry, parcel_source: source, parcel_confirmed: confirmed,location_mode:mode,location_pin:pin,location_pin_confirmed:pinConfirmed});
      const summary=$('[data-submission-summary]');if(summary)summary.innerHTML=formSummary();
      saveDraft(true);
    },
    onArea: area => {
      if (state.form.client_id !== key) return;
      state.form.area = String(area);
      const field = $('[data-form="submission"] [name="area"]');
      if (field) field.value = area;
      const summary=$('[data-submission-summary]');if(summary)summary.innerHTML=formSummary();
      saveDraft(true);
    },
    onDocument: document => {
      if (state.form.client_id !== key) return;
      state.files = state.files.filter(f => f.id || f.name !== document.name);
      state.files.push(document); saveDraft(true);
    },
  });
}
async function refreshRemoteRecords(append=false) {
  try {
    const result=await api('/api/records'+(append&&state.remoteCursor?'?cursor='+encodeURIComponent(state.remoteCursor):''));
    state.remoteRecords=append?[...state.remoteRecords,...result.records]:result.records;
    state.remoteCursor=result.cursor;state.remoteError='';state.remoteLoaded=true;
  } catch(e) {state.remoteLoaded=true;state.remoteError=e.message;}
  if(location.hash==='#/mi-espacio') render();
}
async function loadRemoteRecord(id) {
  state.remoteRecord=null;state.remoteRecordError='';
  try {const record=await api('/api/records/'+encodeURIComponent(id));if(location.hash==='#/mi-expediente/'+id)state.remoteRecord=record;}
  catch(e){state.remoteRecordError=e.message;}
  if(location.hash==='#/mi-expediente/'+id)render();
}
function privateRecordsHTML() {
  return `<section class="private-records"><div class="section-heading"><div><h2>Expedientes privados</h2><p>Guardados en tu cuenta, con su estado y seguimiento.</p></div><button class="button outline" data-action="refresh-records">Actualizar</button></div>${state.remoteError?`<div class="info-box warm">${escape(state.remoteError)}</div>`:!state.remoteLoaded?'<p>Cargando tus expedientes…</p>':state.remoteRecords.length?state.remoteRecords.map(r=>`<div class="saved-row">${icon("file")}<div><h3>${escape(r.form.title)}</h3><p>${escape(r.reference)} · ${escape(r.form.city)} · ${escape(statusLabel(r))}</p>${r.kind==='proyecto'&&r.participants?.length?avatarStack(r.participants,{size:32}):''}</div>${link("Abrir expediente", "#/mi-expediente/"+r.id)}</div>`).join(''):'<p>Aún no has enviado expedientes. Tu borrador local aparece en Mis registros.</p>'}${state.remoteCursor?'<button class="button outline" data-action="more-records">Ver más expedientes</button>':''}</section>`;
}
function remoteRecordPage(id) {
  const r=state.remoteRecord;
  if(!r||r.id!==id)return pageHeader('Tu expediente privado',state.remoteRecordError||'Cargando la información…')+`<section class="page-content"><div class="container">${btn('Volver a Mi espacio','#/mi-espacio','outline')}</div></section>`;
  return pageHeader(escape(r.form.title),escape(r.reference)+' · '+escape(statusLabel(r)),'Expediente privado',btn('Mi espacio','#/mi-espacio','outline'))+`<section class="page-content"><div class="container content-narrow"><div class="info-box">${icon('lock')}<span>Este expediente se guardó en tu cuenta. La publicación depende de tu autorización y de la gestión del equipo. Los avisos y las preferencias de correo se consultan en Mi espacio.</span></div><dl class="summary-list"><div><dt>Ubicación</dt><dd>${escape(r.form.region)} → ${escape(r.form.city)}</dd></div>${r.form.neighborhood?`<div><dt>Barrio</dt><dd>${escape(r.form.neighborhood)}</dd></div>`:""}<div><dt>${r.kind==='terreno'?negotiationValueLabel(r.form):'Valor solicitado'}</dt><dd>${referenceValueSummary(r.form)|| (r.form.amount?escape((r.form.price_method==='usd'?'USD':'COP')+' $'+formatAmount(r.form.amount)):'Por definir')}</dd></div>${valueStatus(r.form)==='known'&&['dual','mixed'].includes(r.form.price_method)?`<div><dt>${r.form.price_method==='dual'?'Precio alternativo en USD':'Componente en USD'}</dt><dd>${r.form.amount_usd?'USD $'+escape(formatAmount(r.form.amount_usd)):'Por definir'}</dd></div>`:''}<div><dt>Área declarada</dt><dd>${r.form.area?escape(money(r.form.area))+' m²':'Por definir'}</dd></div></dl>${r.parcel||r.locationPin?'<div data-parcel-host data-read-only="true"></div>':''}${r.kind==='terreno'?`${brokerExclusivitySummary(r.form)}${r.form.valuation_assistance?'<div class="info-box"><span>Solicitud de asesoría premium para definir un valor base. Alcance y honorarios por acordar con el equipo.</span></div>':''}${landSituationSummary(r.form.land_situation,r.files)}`:''}<h2>Documentos y referencias</h2><p>Los documentos temporales dejan de estar disponibles al vencer 60 días desde la carga. Abrirlos no renueva el plazo.</p>${r.files.length?r.files.map(f=>`<div class="uploaded-file">${icon('file')}<div><strong>${escape(f.name)}</strong><small>${escape(f.analysis?.message||'Pendiente de revisión')} · Vence ${new Date(f.expiresAt).toLocaleDateString('es-CO')}</small></div><button class="text-button" data-action="download-document" data-id="${f.id}" ${Date.parse(f.expiresAt)<=Date.now()?'disabled':''}>${f.origin==='link'?'Ver enlace':'Descargar'}</button></div>`).join(''):'<p>No se adjuntaron soportes.</p>'}${r.kind==='proyecto'?participantsHTML(r.participants)+`<div class="profile-project-actions"><a class="text-link" href="#/mi-perfil">Editar mi perfil</a> · <button class="text-button" data-action="link-project-profile">Mostrar mi perfil en este proyecto</button><p class="participants-note">Se conserva el acceso privado actual del expediente.</p></div>`:''}<div class="dialog-actions"><a class="button outline" href="#/interesados-recibidos?expediente=${r.id}">Ver interesados en este expediente →</a></div>${ownerWorkflowHTML(r)}${ownerExperienceHTML(r)}</div></section>`;
}

function mapHTML(context = "home", propertyId = "") {
  const style=context==="detail"?state.detailMapStyle:state.mapStyle;
  return `<div class="map-stage${context !== "detail" && state.drawing ? " is-drawing" : ""}" data-map-context="${context}" data-property-id="${escape(propertyId)}"><div class="mapbox-root" role="region" aria-label="Mapa interactivo de Colombia"></div><div class="map-service-status" data-map-status role="status">Cargando cartografía…</div>${["detail","search"].includes(context) ? "" : `<form class="map-search" data-form="map-search">${icon("search")}<input name="mapQuery" aria-label="Buscar ciudad, municipio o sector en Mapbox" placeholder="${context === "hero" ? "¿Dónde te gustaría buscar?" : "Ciudad, municipio o sector"}" maxlength="256" value="${escape(state.mapSearchText)}"><button class="text-button" type="submit" aria-label="Buscar ubicación">${context === "hero" ? "Buscar" : icon("arrow-right")}</button></form>`}${context === "hero" ? `<div class="hero-map-filters">${[["Tipo de lote","land_type"],["Tamaño","minArea"],["Modalidad","mode"],["Más filtros",""]].map(([label,focus])=>`<button data-action="hero-filters" data-focus="${focus}">${label}${icon("chevron-down")}</button>`).join("")}</div><div class="hero-map-views"><button data-action="hero-map">${icon("map")}Ver mapa</button><button data-action="hero-list">${icon("list")}Ver lista</button></div>` : ""}<div class="map-switch"><button data-action="map-style" data-style="map" aria-pressed="${style === "map"}" class="${style === "map" ? "active" : ""}">Mapa</button><button data-action="map-style" data-style="satellite" aria-pressed="${style === "satellite"}" class="${style === "satellite" ? "active" : ""}">Satélite</button></div>${context !== "detail" && state.drawing ? `<div class="map-hint"><strong>Delimita tu zona de búsqueda</strong><span>${state.drawPoints.length} ${state.drawPoints.length===1?"punto marcado":"puntos marcados"} · ${state.drawPoints.length<3?"Marca al menos 3 para buscar.":"Ya puedes buscar en esta zona."}</span></div>` : ""}<div class="map-controls"><button class="icon-button" data-action="map-zoom" data-change="1" aria-label="Acercar mapa">${icon("plus")}</button><button class="icon-button" data-action="map-zoom" data-change="-1" aria-label="Alejar mapa">${icon("minus")}</button></div>${context === "detail" ? "" : `${!state.drawing && (state.zone.length || state.sectors.length) ? `<div class="map-legend"><i></i>${state.zone.length ? "Zona de búsqueda" : state.sectors.length + " filtro(s) de zona"} <button class="text-button" style="font-size:9px;margin-left:8px" data-action="clear-zone">Limpiar</button></div>` : ""}<div class="map-tools"><button data-action="${state.drawing ? "finish-zone" : "draw-zone"}" class="${state.drawing ? "active" : ""}">${icon(state.drawing ? "search" : "polygon")}${state.drawing ? "Buscar en esta zona" : "Dibujar zona"}</button>${state.drawing ? `<button data-action="undo-point" ${state.drawPoints.length ? "" : "disabled"}>${icon("arrow-left")}Deshacer</button><button data-action="cancel-zone">${icon("x")}Cancelar</button>` : `<button data-action="sectors" class="${state.layers ? "active" : ""}">${icon("layers")}Elegir sectores</button><button data-action="save-search">${icon("bookmark")}Guardar búsqueda</button>`}</div>`}${
    context !== "detail" && state.layers
      ? `<div class="sector-panel"><h4>Zonas de interés · Ejemplos</h4>${[
          ["zona-norte", "Cartagena · Zona Norte"],
          ["caribe", "Otros municipios del Caribe"],
          ["interior", "Interior del país"],
        ]
          .map(
            ([id, title]) =>
              `<label><input type="checkbox" name="sector" value="${id}" ${state.sectors.includes(id) ? "checked" : ""}>${title}</label>`,
          )
          .join(
            "",
          )}<small>Filtros de ejemplo; no son delimitaciones oficiales ni catastrales.</small></div>`
      : ""
  }${context !== "detail" && state.placeResults.length ? `<div class="map-place-results" role="group" aria-label="Resultados de ubicación"><div><strong>Elige la ubicación</strong><button class="text-button" data-action="close-places" aria-label="Cerrar resultados">${icon("x")}</button></div>${state.placeResults.map((feature, i) => `<button data-action="choose-place" data-index="${i}">${icon("pin")}<span>${escape(feature.properties?.full_address || [feature.properties?.name, feature.properties?.place_formatted].filter(Boolean).join(", "))}</span></button>`).join("")}</div>` : ""}<span class="map-demo-label">Ubicaciones de ejemplo · No prediales</span></div>`;
}
function mapStatus(message, error = false) {
  const status = $("[data-map-status]");
  if (!status) return;
  if (!message) {
    status.hidden = true;
    return;
  }
  status.hidden = false;
  status.innerHTML = error
    ? `${escape(message)} <button data-action="retry-map" class="text-button">Reintentar</button>`
    : escape(message);
}
function syncMap() {
  const host = $(".map-stage > .mapbox-root");
  if (!host) {
    landMap.destroy();
    return;
  }
  const stage = host.closest(".map-stage"),
    context = stage.dataset.mapContext;
  const items =
    context === "detail"
      ? properties.filter((p) => p.id === stage.dataset.propertyId)
      : ["home","hero"].includes(context)
        ? properties
        : filtered();
  const selected =
    context === "detail" ? stage.dataset.propertyId : context === "search" ? state.searchSelected : state.selected;
  const rootReady = landMap.root?.dataset.mapReady === "true";
  if (rootReady) mapStatus(null);
  landMap.mount(host, {
    context: context === "hero" ? "home" : context,
    richPopup: context === "hero",
    initialCamera:context==='search'&&state.searchCameraRevision===state.mapFitRevision?state.searchCamera:null,
    onViewChange:camera=>{if(context==='search'){state.searchCamera=camera;state.searchCameraRevision=state.mapFitRevision;}},
    geometry: context === "detail" ? demoTerrainGeometry(stage.dataset.propertyId) : null,
    hideMarkers: context === "detail" && !!demoTerrainGeometry(stage.dataset.propertyId),
    items,
    style: context === "detail" ? state.detailMapStyle : state.mapStyle,
    selectedId: selected,
    zone: context === "detail" ? [] : state.zone,
    drawPoints: context === "detail" ? [] : state.drawPoints,
    drawing: context !== "detail" && state.drawing,
    fitKey:
      context +
      ":" +
      (stage.dataset.propertyId || "") +
      ":" +
      state.mapFitRevision,
    place: context === "detail" ? null : state.mapPlace,
    onLoading: () => mapStatus("Cargando cartografía…"),
    onReady: () => mapStatus(null),
    onError: (message) => mapStatus(message, true),
    onPoint: (point) => {
      if (state.drawPoints.length >= 500) {
        toast("La zona admite hasta 500 puntos.");
        return;
      }
      state.drawPoints.push(point);
      redrawMap();
    },
    onSelect: (id) => {
      if(context==='search')state.searchSelected=id;
      else state.selected = id;
      redrawMap();
    },
  });
}
let placeRequest;
async function searchPlace(query) {
  if (!query.trim()) {
    toast("Escribe una ciudad, municipio o sector.");
    return;
  }
  placeRequest?.abort();
  placeRequest = new AbortController();
  state.mapSearchText = query;
  state.placeResults = [];
  mapStatus("Buscando ubicación…");
  const controller = placeRequest;
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const features = await geocodeLocation(query, controller.signal);
    if (controller !== placeRequest) return;
    state.placeResults = features;
    redrawMap();
    if (!features.length)
      toast("No se encontraron ubicaciones en Colombia para esa búsqueda.");
  } catch {
    if (controller === placeRequest) {
      mapStatus(null);
      toast(
        "No fue posible buscar esa ubicación. Puedes navegar en el mapa o usar los filtros del catálogo.",
      );
    }
  } finally {
    clearTimeout(timer);
    if (controller === placeRequest) placeRequest = null;
  }
}
function filterBar(compact=false) {
  if(compact)return discoveryFiltersHTML({state,icon,priceLimits,filterChipsHTML});
  return `${state.directoryScope?`<div class="directory-scope-note"><span>${escape(directoryTitle(state.directoryScope))}</span><button class="text-button" type="button" data-action="reset-filters">Quitar filtros del directorio</button></div>`:""}<form class="filter-bar" id="opportunity-filters" data-form="filters"><label class="field-control">${icon("search")}<input name="query" aria-label="Ubicación o palabra clave" placeholder="Ubicación o palabra clave" value="${escape(state.query)}"></label><label class="field-control"><span class="sr-only">Tipo de oportunidad</span><select name="type"><option value="">Tipo de oportunidad</option><option value="terreno" ${state.type === "terreno" ? "selected" : ""}>Terrenos</option><option value="proyecto" ${state.type === "proyecto" ? "selected" : ""}>Proyectos</option></select></label><label class="field-control"><span class="sr-only">Modalidad</span><select name="mode"><option value="">Modalidad</option>${["Venta", "Aporte", "Alianzas"].map((m) => `<option ${state.mode === m ? "selected" : ""}>${m}</option>`).join("")}</select></label><button class="button outline" type="button" data-action="more-filters" aria-controls="extra-search-filters" aria-expanded="${Boolean(state.min||state.max||state.maxPrice)}">${icon("sliders")}Más filtros</button><button class="button primary" type="submit">Buscar ${icon("arrow-right")}</button></form><div class="extra-filters" id="extra-search-filters" ${state.min||state.max||state.maxPrice?'':'hidden'}><label>Área mínima (m²)<input type="number" min="0" name="minArea" form="opportunity-filters" value="${escape(state.min)}" placeholder="Desde"></label><label>Área máxima (m²)<input type="number" min="0" name="maxArea" form="opportunity-filters" value="${escape(state.max)}" placeholder="Hasta"></label><label>Precio máximo (COP)<select name="maxPrice" form="opportunity-filters"><option value="">Sin límite de precio</option>${priceLimits.map(([value,label])=>`<option value="${value}" ${state.maxPrice===value?"selected":""}>${label}</option>`).join("")}</select></label><button class="text-button" data-action="reset-filters">Limpiar filtros</button></div>${state.maxPrice?'<p class="ux-filter-help">El precio máximo compara valores declarados en COP. No convierte precios en USD ni pagos mixtos.</p>':''}${filterChipsHTML(state)}`;
}
function normalize(s) {
  return String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
function filtered() {
  return properties.filter(
    (p) =>
      matchesDirectory(p,state.directoryScope) && matchesLandSearch(p,state) &&
      matchesOpportunityFilters(p,{...state,query:state.zone.length||state.placeBounds?"":state.query}) &&
      (!state.sectors.length || state.sectors.includes(p.sector)) &&
      (!state.zone.length || pointInRing(p.coordinates, state.zone)) &&
      (!state.placeBounds || insideBounds(p.coordinates, state.placeBounds)),
  );
}
function empty(text = "No encontramos coincidencias con estos filtros.") {
  return `<div class="empty-state">${icon("search")}<h3>La búsqueda puede seguir</h3><p>${text} Puedes ampliar los criterios o guardar lo que buscas.</p><button class="button outline" data-action="reset-filters">Ampliar búsqueda</button> <button class="button primary" data-action="save-search">Guardar búsqueda</button></div>`;
}
function needsTable() {
  return `<div class="needs-table"><div class="needs-row head"><span>Necesidad</span><span>Ubicación</span><span>Etapa</span><span>Conectar</span></div>${needs
    .slice(0, 3)
    .map(
      (n, i) =>
        `<div class="needs-row"><div class="need-title"><span>${icon(n.type)}</span>Busca ${n.role.toLowerCase()}</div><span class="need-location">${icon("pin")}${n.city}</span><span class="pill neutral">${n.stage}</span><button class="text-link" data-action="need-interest" data-index="${i}">Manifestar interés ${icon("arrow-right")}</button></div>`,
    )
    .join("")}</div>`;
}
function processHTML() {
  return `<div class="process-grid">${[
    [
      "Cuéntanos qué tienes o buscas",
      "Un terreno, un proyecto, una búsqueda o tu especialidad.",
    ],
    [
      "Organizamos la información",
      "Revisamos qué puede compartirse, con quién y para qué.",
    ],
    [
      "Facilitamos el encuentro",
      "Conectamos a los actores y acompañamos el seguimiento.",
    ],
  ]
    .map(
      ([title, text], i) =>
        `<div class="process-step"><span class="step-number">0${i + 1}</span><div><h3>${title}</h3><p>${text}</p></div></div>`,
    )
    .join("")}</div>`;
}
const faqs = [
  ["¿Puedo registrar un lote para construir una sola vivienda?", "No. El portal se enfoca en terrenos para desarrollar proyectos. Sí puedes presentar terrenos para evaluar un desarrollo residencial de varias viviendas, así como proyectos comerciales, industriales, turísticos u otros desarrollos. Registrar el terreno no confirma su viabilidad."],
  [
    "¿Publicar una oportunidad la hace visible inmediatamente?",
    "La postulación comienza privada. El equipo revisa la información y las autorizaciones antes de difundir el resumen aprobado. El expediente y sus soportes se guardan privados; autorizar el resumen no lo publica automáticamente.",
  ],
  [
    "¿Puedo mantener reservada la identidad del propietario?",
    "Sí. La identidad, los documentos y la ubicación precisa requieren permisos específicos. El contenido público se define por separado.",
  ],
  [
    "¿Puedo aportar mi terreno y recibir inmuebles?",
    "Puedes expresar esa preferencia y evaluar propuestas. Se deben acordar las unidades, su valoración, las características y las condiciones de entrega y transferencia.",
  ],
  [
    "¿Integración realiza la estructuración del proyecto?",
    "Integración conecta a los actores y facilita el seguimiento. La estructuración y los servicios especializados corresponden a los profesionales o empresas vinculados.",
  ],
];
function home(alternativeHero = false) {
  const originalHero = alternativeHero ? "" : referenceHomeHero(mapHTML("hero"),icon);
  return `${alternativeHero===true ? heroAlternative(mapHTML()) : originalHero}<div class="trust-strip"><div class="container"><span>${icon("pin")}Colombia</span><span>${icon("lock")}Información compartida con autorización</span><span>${icon("handshake")}Conexiones con actores independientes</span></div></div>${featuredOpportunities({items:properties,state,favorites:saved.favorites,icon,money,escape})}${refreshedHomeSections({icon,roles,faqs,needs,images})}`;
}
function catalog(isSearch = false, reactivation = false) {
  reactivation=reactivation||state.reactivationFilter==='only';
  const result=filtered();
  const title=reactivation?'Proyectos para reactivación':state.type==='terreno'&&state.landContent?terrainSearchLabel(state.landContent):state.directoryScope?directoryTitle(state.directoryScope):state.type==='proyecto'?'Proyectos inmobiliarios':state.type==='terreno'?'Todos los terrenos':'Tierras y proyectos';
  const description=reactivation?'Explora proyectos en pausa que buscan una nueva ruta de evaluación.':state.type==='terreno'&&state.landContent==='land-only'?'Predios sin proyecto constructivo asociado. Compara su ubicación, perímetro y condiciones de venta o aporte.':state.type==='terreno'&&state.landContent==='land-project'?'Predios que incluyen una propuesta de desarrollo. Revisa el terreno, el programa constructivo y el alcance de la negociación.':state.type==='proyecto'?'Iniciativas que buscan aliados para avanzar, con o sin terreno.':'Compara terrenos y proyectos. Elige una categoría para explorar cada formato por separado.';
  return `<div class="du-catalog cs-catalog ${reactivation?'rf-catalog':''} ${state.view!=='list'?'du-catalog-map':''}">${compactHeading(title,description,isSearch?'Busco tierra':'Oportunidades',!isSearch?btn('Publicar oportunidad','#/publicar/terreno','outline'):'')}<section class="page-content"><div class="container">${catalogGroupsHTML(state)}${state.type==='terreno'?catalogSearchHTML({state,icon,priceLimits,filterChipsHTML}):filterBar(true)}${publicationsHTML()}<div class="du-results-bar"><p tabindex="-1" data-results-heading role="status"><strong>${result.length}</strong> ${result.length===1?'oportunidad de ejemplo':'oportunidades de ejemplo'}</p><div>${true?`<button class="du-save-search" data-action="save-search">${icon('bookmark')}Guardar búsqueda</button><div class="view-toggle"><button data-action="view" data-view="list" aria-pressed="${state.view==='list'}" class="${state.view==='list'?'active':''}">${icon('list')}Lista</button><button data-action="view" data-view="both" aria-pressed="${state.view!=='list'}" class="${state.view!=='list'?'active':''}">${icon('map')}Mapa</button></div>`:''}</div></div><div class="${state.view!=='list'?'search-layout':'list-only'}"><div class="property-grid">${result.length?result.map(propertyCard).join(''):empty()}</div>${state.view!=='list'?`<div class="search-map">${mapHTML('search')}</div>`:''}</div><p class="du-context-note">${icon('info')}Fichas y ubicaciones ilustrativas. Los terrenos se orientan a desarrollar proyectos; excluyen lotes individuales para una sola vivienda.</p></div></section></div>`;
}

function detail(id) {
  const p = properties.find((x) => x.id === id);
  if (!p) return notFound();
  if(p.type==='terreno')return terrainDetailHTML(p,{map:mapHTML('detail',p.id),related:properties.filter(x=>x.type==='terreno'&&x.id!==p.id).slice(0,3).map(propertyCard).join(''),favorite:saved.favorites.includes(p.id),icon,specialistBySlug})+'<div class="container">'+comparisonButton(p)+'</div>';
  return (
    pageHeader(
      p.title,
      `${p.city}, ${p.region} · ${p.id}`,
      p.label,
      `<button class="button outline" data-action="favorite" data-id="${p.id}">${icon("heart")}${saved.favorites.includes(p.id) ? "Guardado" : "Guardar"}</button>`,
    ) +
    `<section class="page-content">${p.reactivation?`<div class="container">${rescueOverviewHTML(p,{action:`<button class="button primary" data-action="interest" data-id="${p.id}">Consultar este proyecto ${icon('arrow-right')}</button>`})}</div>`:''}${p.reactivation?'<div class="container">'+reactivationContextHTML(p)+'</div>':''}<div class="container detail-layout"><div>${p.reactivation?'':`<div class="detail-cover detail-cover--project"><img src="${p.image}" alt="Imagen ilustrativa de ${p.type === "terreno" ? "terreno" : "proyecto"}"><span class="pill">Ejemplo · Información por revisar</span></div><p class="detail-photo-note">Imagen arquitectónica ilustrativa. No corresponde a un inmueble ofrecido.</p>`}<div class="detail-facts"><div><small>Área declarada</small><strong>${p.area ? money(p.area) + " m²" : "Por definir"}</strong></div><div><small>Modalidad</small><strong>${p.mode}</strong></div><div><small>Busca conectar con</small><strong>${p.need}</strong></div></div><div class="detail-copy">${p.type==='proyecto'?participantsHTML(demoParticipants,{demo:true}):''}<h2>Sobre esta oportunidad</h2><p>${p.description}</p>${terrainOverviewHTML(p)}<h2>Condiciones para conversar</h2><ul class="check-list"><li>${icon("check")}Condiciones comerciales abiertas a evaluación entre las partes.</li><li>${icon("check")}Representación, disponibilidad y documentos pendientes de revisión.</li><li>${icon("check")}Identidad y ubicación precisa con acceso autorizado.</li></ul>${p.mode.includes("Aporte") || p.mode.includes("aporte") ? `<div class="info-box">${icon("building")}<span><strong>¿Cómo funciona el aporte de un terreno?</strong><br>Puedes evaluar dinero posterior al punto de equilibrio, inmuebles del desarrollo o una combinación.<br><button class="text-button" data-action="tutorial" style="margin-top:8px">Ver explicación paso a paso ${icon("arrow-right")}</button></span></div>` : ""}<h2>${p.type==='terreno'?'Mapa del terreno · Referencia':'Ubicación de referencia'}</h2><p>Ubicación ilustrativa para esta ficha de ejemplo; no es el perímetro de un predio.</p><div class="detail-map">${mapHTML("detail", p.id)}</div>${constructionProjectHTML(p)}<h2>Documentación y evaluación</h2><p>La documentación privada se solicitará por etapas y se compartirá únicamente con los permisos correspondientes. Un registro publicado no acredita titularidad, usos permitidos ni viabilidad.</p></div></div><aside class="detail-sidebar"><span class="pill neutral">${p.type === "terreno" ? "Condiciones del propietario" : "Necesidad del proyecto"}</span><div class="price">${p.price ? "$" + money(p.price) : p.type === "terreno" ? "Abierto a propuestas" : "Busca aliados"}</div><small>${p.price ? "COP · Precio de ejemplo" : "Condiciones por acordar entre las partes"}</small>${hasConstructionProject(p)?`<p class="terrain-sidebar-scope">${escape(p.developmentProject.priceScope)}</p>`:''}<button class="button primary" data-action="interest" data-id="${p.id}">Me interesa ${icon("arrow-right")}</button><button class="button outline" data-action="share" data-id="${p.id}">${icon("link")}Copiar enlace a la ficha</button><div class="privacy-note">${icon("lock")}Manifestar interés no concede acceso a documentos ni acepta una oferta.</div><hr><h3>Un siguiente paso claro</h3><p>Puedes probar el seguimiento comercial con esta ficha de ejemplo. La solicitud queda guardada para ti y el equipo, identificada como demostración.</p><div class="info-box" style="margin-bottom:0">${icon("info")}Esta ficha contiene exclusivamente datos de demostración.</div></aside></div></section>`
  );
}
function inputField(
  label,
  name,
  {
    type = "text",
    currency = false,
    placeholder = "",
    required = false,
    full = false,
    hint = "",
    min = "",
    options = null,
  } = {},
) {
  const v = state.form[name] ?? "";
  return `<label class="form-field ${full ? "full" : ""}">${label}${required?'<span class="ux-required">Obligatorio</span>':''}${
    options
      ? `<select aria-label="${escape(label)}" name="${name}" ${required ? "required" : ""}><option value="">Seleccionar</option>${options
          .map((o) => {
            const [value, text] = Array.isArray(o) ? o : [o, o];
            return `<option value="${escape(value)}" ${v === value ? "selected" : ""}>${text}</option>`;
          })
          .join("")}</select>`
      : `<input aria-label="${escape(label)}" type="${currency ? "text" : type}" ${currency ? 'data-money inputmode="decimal" autocomplete="off"' : ""} name="${name}" value="${escape(currency ? formatAmount(v) : v)}" placeholder="${escape(placeholder)}" ${required ? "required" : ""} ${!currency && min !== "" ? `min="${min}"` : ""} ${!currency && type === "number" ? 'step="any"' : ""}>`
  }${hint ? `<small>${hint}</small>` : ""}</label>`;
}
function municipalityOptions(departmentCode, selected = "") {
  return `<option value="">${departmentCode ? "Selecciona el municipio" : "Primero elige un departamento"}</option>${municipalitiesFor(departmentCode).map(m=>`<option value="${m.code}" ${m.code===selected?'selected':''}>${escape(m.name)}${m.type==='Municipio'?'':' ('+escape(m.type)+')'}</option>`).join('')}`;
}
function locationFields() {
  const f=state.form;
  return `<fieldset class="location-fields full"><legend>Ubicación en Colombia</legend><div class="location-grid"><label class="form-field">Departamento<span class="ux-required">Obligatorio</span><select name="department_code" required aria-label="Departamento"><option value="">Selecciona el departamento</option>${departments.map(d=>`<option value="${d.code}" ${d.code===f.department_code?'selected':''}>${escape(d.name)}</option>`).join('')}</select></label><label class="form-field">Municipio<span class="ux-required">Obligatorio</span><select name="municipality_code" required aria-label="Municipio" ${f.department_code?'':'disabled'}>${municipalityOptions(f.department_code,f.municipality_code)}</select></label><label class="form-field">Barrio (opcional)<input name="neighborhood" aria-label="Barrio (opcional)" maxlength="120" value="${escape(f.neighborhood||'')}" placeholder="Ej. El Prado" ${f.municipality_code?'':'disabled'}></label></div><p class="location-help">Elige el departamento y luego el municipio. Puedes dejar el barrio vacío si no aplica.</p></fieldset>`;
}
function selectChoice(name, value, title, description, type = "building") {
  return `<label class="choice-card"><input type="radio" name="${name}" value="${value}" ${state.form[name] === value ? "checked" : ""} required>${icon(type)}<strong>${title}</strong><small>${description}</small></label>`;
}
function currencyFields() {
  const f=state.form,contribution=f.negotiation==='contribution',method=f.price_method||'cop';
  const cash=hasCashPreferences(f),hasUSD=['usd','dual','mixed'].includes(method)||(cash&&f.receive_currencies?.includes('USD'));
  const amountLabel=method==='usd'?(contribution?'Valor estimado del aporte en USD':'Valor solicitado en USD'):method==='dual'?'Valor alternativo en COP':method==='mixed'?'Componente del valor en COP':(contribution?'Valor estimado del aporte en COP':'Valor solicitado en COP');
  return `<section class="lf-price"><h3>${negotiationValueLabel(f)}</h3><div class="form-grid">${inputField('¿Cómo quieres expresar el valor?','price_method',{options:[['cop','Valor fijo en pesos (COP)'],['usd','Valor fijo en dólares (USD)'],['dual','Dos valores fijos alternativos'],['mixed','Una parte en COP y otra en USD']],required:true,full:true})}${inputField(amountLabel,'amount',{currency:true,required:true,placeholder:'Ej. 1.000.000,00',hint:contribution?'Es una referencia para evaluar el aporte; la compensación se acuerda por separado.':'Usa coma para los decimales; los puntos se agregan automáticamente.'})}${['dual','mixed'].includes(method)?inputField(method==='dual'?'Valor alternativo en USD':'Componente del valor en USD','amount_usd',{currency:true,required:true,placeholder:'Ej. 250.000,00'}):cash?inputField('¿Aceptas negociar el valor?','negotiable',{options:[['yes','Sí, escucho propuestas'],['no','Prefiero mantener el valor'],['advice','Por definir']]}):''}</div><details class="lf-optional" ${hasUSD?'open':''}><summary>Monedas y conversión (opcional)</summary>${cash?`<div class="form-field full"><span>Monedas de recepción que te gustaría evaluar</span><div class="checkbox-group">${['COP','USD'].map(c=>`<label><input type="checkbox" name="receive_currencies" value="${c}" ${(f.receive_currencies||['COP']).includes(c)?'checked':''}>${c==='COP'?'Pesos colombianos':'Dólares estadounidenses'}</label>`).join('')}</div><small>La recepción en USD se evalúa según las partes y la operación.</small></div>`:''}${hasUSD?`<div class="form-grid">${inputField('Para la conversión, prefiero','rate_method',{options:[['trm','TRM como referencia sugerida'],['fixed','Una tasa fija propuesta'],['agree','Acordar la tasa entre las partes']],required:true})}${inputField(f.rate_method==='fixed'?'Tasa propuesta (COP por USD)':'Tasa ilustrativa para explorar (COP por USD)','exchange_rate',{type:'number',min:1,placeholder:'Ejemplo: 4000',hint:'Este prototipo no consulta una tasa vigente.'})}<div class="conversion-preview form-field full" id="conversion-preview">${conversionText()}</div></div>`:'<p>Para explorar una conversión, elige un valor en USD o esa moneda de recepción.</p>'}</details></section>`;
}
function negotiationValueFields() {
 const f=state.form,status=valueStatus(f);
 return `<section class="lf-value"><div class="form-grid">${inputField('¿Tienes un valor de referencia?','value_status',{options:valueStatusOptions,required:true,full:true})}</div>${status==='known'?currencyFields():status==='pending'?'<p class="lf-context">Puedes continuar sin definir el valor y completarlo después.</p>':''}${status==='advice'?premiumValuationField(f.valuation_assistance):`<details class="lf-optional" ${f.valuation_assistance?'open':''}><summary>Quiero asesoría para definir un valor base (opcional)</summary>${premiumValuationField(f.valuation_assistance)}</details>`}</section>`;
}
function conversionText() {
  const amount = Number(state.form.amount),
    rate = Number(state.form.exchange_rate);
  if (!(amount > 0 && rate > 0))
    return "Ingresa un monto y una tasa para explorar su equivalencia.<small>La tasa es ilustrativa; el precio base no se modifica.</small>";
  return `${state.form.price_method === "usd" ? `USD $${formatAmount(state.form.amount)} ≈ COP $${formatAmount((amount * rate).toFixed(2))}` : `COP $${formatAmount(state.form.amount)} ≈ USD $${formatAmount((amount / rate).toFixed(2))}`}<small>Equivalencia ilustrativa · La tasa y su fecha se acuerdan en la propuesta.</small>`;
}
function contributionFields() {
  const choice = state.form.compensation || "advice";
  return `<div class="info-box">${icon("info")}<span><strong>Tu terreno puede ser el comienzo de un desarrollo.</strong><br>Conoce qué recibirías y qué hace falta acordar.<br><button class="text-button" data-action="tutorial" data-from-form="true" type="button" style="margin-top:8px">¿Cómo funciona aportar mi lote? ${icon("arrow-right")}</button></span></div><div class="form-section-label">¿Qué te gustaría recibir?</div><div class="choice-grid">${selectChoice("compensation", "cash", "Dinero posterior", "Después del punto de equilibrio, con un calendario acordado.", "coins")}${selectChoice("compensation", "units", "Inmuebles del proyecto", "Unidades a construir y entregar según el acuerdo.", "building")}${selectChoice("compensation", "mixed", "Dinero + inmuebles", "Una combinación de ambas alternativas.", "layers")}</div><label class="check-row" style="margin-top:12px"><input type="radio" name="compensation" value="advice" ${choice === "advice" ? "checked" : ""}>Necesito orientación para elegir</label>${
    ["cash", "mixed"].includes(choice)
      ? `<div class="form-section-label">Para la parte en dinero</div><div class="form-grid">${inputField(
          "Forma de pago preferida",
          "payment_schedule",
          {
            options: [
              ["single", "Un solo pago"],
              ["installments", "Cuotas"],
              ["agree", "Abierto a propuestas"],
            ],
          },
        )}${inputField("Plazo máximo deseado después del hito (meses)", "payment_months", { type: "number", min: 1, placeholder: "Por definir" })}</div><div class="info-box warm">${icon("clock")}<span>El punto de equilibrio y el calendario de pago son distintos. Alcanzar el hito no significa pago inmediato ni utilidades garantizadas.</span></div>`
      : ""
  }${["units", "mixed"].includes(choice) ? `<div class="form-section-label">Para los inmuebles a entregar</div><div class="form-grid">${inputField("Tipo de inmueble preferido", "unit_type", { options: ["Apartamentos", "Casas", "Locales", "Oficinas", "Abierto a alternativas"] })}${inputField("Cantidad deseada", "unit_count", { type: "number", min: 1, placeholder: "Por definir" })}${inputField("Área privada aproximada por unidad (m²)", "unit_area", { type: "number", min: 1, placeholder: "Por definir" })}${inputField("Plazo deseado de entrega (meses)", "unit_months", { type: "number", min: 1, placeholder: "Por definir", hint: "El hito desde el que se cuenta se pactará con el proyecto." })}</div>` : ""}${choice === "mixed" ? `<div class="form-grid" style="margin-top:20px">${inputField("Porcentaje del valor en dinero", "cash_percent", { type: "number", min: 0, placeholder: "Por acordar", hint: "El restante se recibiría en inmuebles. Se refiere al valor, no a las utilidades." })}</div>` : ""}`;
}
function formPage(kind) {
  if(!emailEntry.allows(state.session))return emailEntry.html(kind,new URLSearchParams(location.hash.split('?')[1]||'').get('nuevo')==='1'?null:chooseDraft(saved,kind,new URLSearchParams(location.hash.split('?')[1]||'').get('borrador')));
  const project = kind === "proyecto",
    f = state.form, totalSteps = project ? 3 : 4;
  let body = "";
  if (state.formStep === 1) {
    body = `<h2>${project ? "Cuéntanos sobre tu proyecto" : "Comencemos por tu terreno"}</h2><p class="form-intro">${project ? "Puede tener terreno, estar negociándolo o seguir buscando." : "La información comienza privada. No necesitas tener todos los documentos para empezar."}</p>${project?'':'<p class="du-scope-line">Para desarrollos inmobiliarios. '+landScopeExclusion+'</p>'}<div class="form-grid">${inputField(project ? "Nombre del proyecto" : "Nombre para identificar el terreno", "title", { required: true, full: true, placeholder: project ? "Ej. Proyecto residencial" : "Ej. Terreno en Zona Norte" })}${locationFields()}${project?'':`<section class="lf-location full" id="terrain-location"><h3>Ubica tu terreno en el mapa</h3><p>Usa un pin aproximado o delimita el perímetro. La ubicación se mantiene privada; confirma la opción elegida.</p><div data-parcel-host></div></section>`}${inputField(project ? "Tipo de desarrollo" : "Tipo de terreno", "land_type", { options: project ? ["Residencial", "Comercial", "Mixto", "Industrial", "Turístico", "Por definir"] : ["Urbano", "Rural", "Expansión urbana", "Por confirmar"], required: true })}${project ? inputField("Etapa actual", "stage", { options: ["Idea / evaluación", "Planeación", "Preventa", "Construcción", "Proyecto detenido"], required: true }) : inputField("Área declarada (m²)", "area", { type: "number", min: 1, required: true, placeholder: "Ej. 5200" })}${inputField("¿Cuál es tu relación con este registro?", "relationship", { options: ["Propietario", "Representante autorizado", "Promotor / desarrollador", ["Intermediario", "Intermediario / broker"], "Otra relación"], required: true, full: true })}${project?'':inputField('¿Qué incluye la oferta?', 'land_content', {options:[['land-only','Solo terreno'],['land-project','Terreno con proyecto']],required:true,full:true,hint:'Elige con proyecto si existe una propuesta de desarrollo asociada. Sus diseños, etapa y condiciones se revisarán con los soportes; no implica licencia ni viabilidad aprobada.'})}${project?'':inputField('Uso que propones evaluar','intended_use',{options:landUses,full:true,hint:'Indica una intención de desarrollo. No equivale a una certificación de uso permitido o aptitud.'})}${project?'':brokerExclusivityFields(f)}${
      project
        ? inputField("Situación del terreno", "land_status", {
            options: [
              ["owned", "El proyecto ya tiene terreno"],
              ["negotiating", "Está negociando un terreno"],
              ["searching", "Todavía busca terreno"],
            ],
            required: true,
            full: true,
          })
        : ""
    }<details class="jr-optional" ${f.description?'open':''}><summary>Agregar una descripción (opcional)</summary><label class="form-field full">${project ? "¿Qué propone el proyecto?" : "Cuéntanos lo que consideras relevante"}<textarea name="description" placeholder="Un resumen breve. Evita datos personales o documentos reservados.">${escape(f.description || "")}</textarea></label></details>${project?'':`<label class="check-row full land-scope-confirmation"><input type="checkbox" name="project_land_confirmed" required ${f.project_land_confirmed===true?'checked':''}>${landScopeConfirmation}<span class="ux-required">Obligatorio</span></label>`}</div><div class="info-box">${icon("shield")}<span>La ubicación exacta, la titularidad y las autorizaciones se revisan por separado. Registrar información no acredita propiedad ni viabilidad.</span></div>`;
  }
  if (state.formStep === 2) {
    body = project
      ? `<h2>¿Qué necesita para avanzar?</h2><p class="form-intro">Podrás buscar actores para evaluar la oportunidad o para participar en su ejecución.</p><div class="form-grid">${inputField("Principal necesidad", "need", { options: ["Asesoría legal", "Terreno", "Estructuración", "Desarrollo", "Construcción", "Financiación", "Inversión", "Comercialización", "Evaluación para reactivación"], required: true, full: true })}${inputField("Tipo de vinculación que buscas", "participation", { options: ["Evaluación especializada", "Participación en el desarrollo", "Servicio contratado", "Por definir"], required: true, full: true })}${f.land_status === "searching" ? `${inputField("Área mínima de terreno (m²)", "desired_min", { type: "number", min: 1, placeholder: "Desde" })}${inputField("Área máxima de terreno (m²)", "desired_max", { type: "number", min: 1, placeholder: "Hasta" })}${inputField("Municipios o zonas de interés", "desired_zone", { placeholder: "Ej. Zona Norte de Cartagena", full: true })}` : ""}<label class="form-field full">Información sobre la necesidad<textarea name="need_description" placeholder="Describe el alcance y las condiciones que quieres evaluar.">${escape(f.need_description || "")}</textarea></label><label class="check-row"><input type="checkbox" name="reactivation" ${f.reactivation ? "checked" : ""}>El proyecto está detenido y necesita evaluar una reactivación.</label></div><div class="info-box">${icon("users")}<span>Integración facilita la conexión. La estructuración y los servicios especializados corresponden a los actores vinculados.</span></div>`
      : `<h2>¿Cómo quieres negociarlo?</h2><p class="form-intro">Estas son preferencias para recibir propuestas. Podrás ajustarlas antes de formalizar cualquier acuerdo.</p><p class="form-section-label">Selecciona una modalidad <span class="ux-required">Obligatorio</span></p><div class="choice-grid">${selectChoice("negotiation", "sale", "Venta", "Recibir dinero por tu terreno.", "coins")}${selectChoice("negotiation", "contribution", "Aporte a proyecto", "Recibir dinero posterior o inmuebles del desarrollo.", "building")}${selectChoice("negotiation", "open", "Evaluar alternativas", "Venta, aporte o propuestas combinadas.", "handshake")}</div>${f.negotiation === "contribution" ? contributionFields() : ""}${negotiationValueFields()}${visibilityFieldsHTML(f.visibility)}`;
  }
  if (!project && state.formStep === 3) body = landSituationFields(f.land_situation);
  if (state.formStep === totalSteps) {
    body = `<h2>Soportes y revisión final</h2><p class="form-intro">${emailEntry.isPreview()?'Recorre los soportes con un documento ficticio y revisa el resumen antes de finalizar la demostración.':'Los archivos seleccionados se guardan privados por 60 días. Los archivos geográficos se interpretan; PDF, imágenes y CAD quedan disponibles para revisión del equipo.'}</p>${emailEntry.isPreview()?demoSupportsHTML():`<div class="view-toggle" style="width:max-content;margin-bottom:17px"><button type="button" data-action="file-mode" data-mode="upload" class="${state.fileMode === "upload" ? "active" : ""}">${icon("upload")}Archivo</button><button type="button" data-action="file-mode" data-mode="link" class="${state.fileMode === "link" ? "active" : ""}">${icon("link")}Enlace de descarga</button></div>${state.fileMode === "upload" ? `<div class="upload-zone">${icon("upload")}<h3>Selecciona los soportes del expediente</h3><p>Hasta 10 MB por archivo · Temporales por 60 días.<br>Para archivos mayores, utiliza un enlace de descarga.</p><label><span class="sr-only">Seleccionar documentos del expediente</span><input type="file" id="file-input" multiple accept=".pdf,.kml,.kmz,.geojson,.zip,.jpg,.jpeg,.png,.dwg,.dxf"></label></div>` : `<div class="form-grid">${inputField("Nombre del documento", "file_link_name", { placeholder: "Ej. Levantamiento topográfico", full: true })}${inputField("Enlace HTTPS de acceso o descarga", "file_link_url", { type: "url", placeholder: "https://…", full: true, hint: "No se descarga automáticamente ni se modifican los permisos del proveedor." })}<button type="button" class="button outline" data-action="add-file-link">Agregar referencia ${icon("plus")}</button></div>`}<p class="file-message" id="file-message" role="status"></p><div id="file-list">${fileList()}</div><div class="privacy-note">${icon("info")}Los originales se guardan privados, con acceso para ti y el equipo autorizado. El envío no los publica.</div>`}${project?'':obligationSupports(f.land_situation,state.files,{preview:emailEntry.isPreview()})}<hr class="form-divider"><div class="rj-review-heading"><span class="eyebrow">Antes de terminar</span><h2>Revisa tu ${project ? "proyecto" : "terreno"}</h2><p>Comprueba los datos y usa los accesos de edición. ${emailEntry.isPreview()?"Finalizar guarda una demostración local, sin enviar.":"El envío crea un expediente privado; la publicación requiere revisión y autorización."}</p></div><div class="ux-summary-edit-links">${formSteps(state.formKind).slice(0,-1).map((name,i)=>`<button class="ux-edit-summary" type="button" data-action="form-step" data-step="${i+1}">Editar ${name.toLowerCase()}</button>`).join('')}</div><div data-submission-summary>${formSummary()}</div><hr class="form-divider"><label class="check-row"><input type="checkbox" name="demo_consent" required ${f.demo_consent ? "checked" : ""}>${emailEntry.isPreview()?'Entiendo que este registro de demostración se guarda solo en este navegador y no se envía al equipo.':'Autorizo a MMS CAPITAL SAS a tratar los datos de este expediente privado para su revisión y seguimiento, según la política de privacidad. Enviarlo no publica el terreno ni transfiere el activo.'}<span class="ux-required">Obligatorio</span></label><label class="check-row" style="margin-top:12px"><input type="checkbox" name="alerts" ${f.alerts ? "checked" : ""}>Me interesa recibir avisos relacionados con este registro cuando se habiliten. Este envío no activa correos.</label>`;
  }
  return (
    (emailEntry.isPreview()?emailEntry.banner():'') + compactHeading(
      project
        ? "Tengo un proyecto"
        : f.negotiation === "sale"
          ? "Vender mi terreno"
          : "Tengo un terreno",
      project
        ? "Dale un lugar a tu proyecto y encuentra los actores que necesita."
        : f.negotiation === "sale"
          ? "Presenta tu terreno para desarrollar un proyecto: ubicación, área y condiciones de venta."
          : "Cuéntanos qué tienes y qué estás dispuesto a evaluar.",
      project ? "Con o sin terreno" : "Terrenos para desarrollo inmobiliario",
    ) +
    `<section class="page-content du-publication"><div class="container"><div class="form-layout"><aside class="form-sidebar">${emailEntry.isPreview()?registrationProgressHTML():''}${stepperHTML(state.formKind,state.formStep)}<div class="sidebar-note">${icon("lock")}${emailEntry.isPreview()?'Estás recorriendo la maqueta. El avance queda en este navegador; no se envía al equipo ni se publica.':'Tu expediente queda privado y pendiente de revisión. No se difunde ningún resumen automáticamente.'}<br><br>¿No tienes todo a mano?<br>Puedes guardar un borrador local.</div></aside><form class="form-main" data-form="submission"><div class="ux-form-tools"><p data-draft-status role="status">${chooseDraft(saved,state.formKind,state.form.client_id)?'Borrador recuperado de este navegador.':'El borrador se guarda en este navegador al completar los campos.'}</p><button class="text-button" type="button" data-action="save-draft">Guardar borrador</button><button class="text-button" type="button" data-action="save-and-exit">Guardar y salir</button></div><div data-form-errors class="ux-form-errors" role="alert" tabindex="-1" hidden></div><div class="jr-form-progress" role="progressbar" aria-label="Progreso del registro" aria-valuemin="0" aria-valuemax="${totalSteps}" aria-valuenow="${state.formStep}"><span style="width:${state.formStep/totalSteps*100}%"></span></div><p class="rj-field-legend">Los campos marcados como <strong>Obligatorio</strong> son necesarios para continuar. Los demás son opcionales o pueden quedar por definir.</p><div class="jr-form-orientation"><span>${state.formStep===1?'Primero, los datos esenciales':state.formStep===totalSteps?'Revisa antes de enviar':'Completa lo que conoces'}</span><span>Documentos al final · Borrador local disponible</span></div>${body}<div class="form-navigation">${state.formStep > 1 ? `<button class="button" type="button" data-action="form-back">Atrás</button>` : `<a class="text-button" href="#/mi-espacio">Salir a Mi espacio</a>`}<span>Paso ${state.formStep} de ${totalSteps}</span><button class="button primary" type="submit">${state.formStep === totalSteps ? (emailEntry.isPreview()?"Finalizar demostración":"Enviar a revisión privada") : "Continuar"} ${icon("arrow-right")}</button></div></form></div></div></section>`
  );
}
const compensationNames = {
  cash: "Dinero posterior al punto de equilibrio",
  units: "Inmuebles del desarrollo",
  mixed: "Dinero + inmuebles",
  advice: "Necesita orientación",
};
function formSummary() {
  const f = state.form;
  const rows = [
    ["Nombre", f.title],
    ["Ubicación", [f.region, f.city].filter(Boolean).join(" → ")],
    ["Barrio", f.neighborhood || "Sin especificar (opcional)"],
    ["Relación", f.relationship],
  ];
  if (state.formKind === "proyecto")
    rows.push(
      ["Necesidad", f.need],
      [
        "Situación del terreno",
        {
          owned: "Ya tiene terreno",
          negotiating: "Está negociando",
          searching: "Busca terreno",
        }[f.land_status],
      ],
    );
  else {
    if(isBrokerRelationship(f.relationship))rows.push(['Exclusividad del intermediario / broker',brokerExclusivityLabel(f.broker_exclusivity)]);
    rows.push(["Área declarada",f.area?money(f.area)+" m²":"Por definir"],["Ubicación en el mapa",locationSummary(f)]);
    rows.push(["Destino declarado", "Terreno para evaluar el desarrollo de un proyecto"]);
    rows.push(["Qué incluye la oferta", f.land_content?terrainSearchLabel(f.land_content):"Por definir"]);
    rows.push([
      "Modalidad",
      {
        sale: "Venta",
        contribution: "Aporte a proyecto",
        open: "Evaluar alternativas",
      }[f.negotiation],
    ]);
    if (f.negotiation === "contribution") {
      rows.push([
        "Preferencia de aporte",
        compensationNames[f.compensation] || "Por definir",
      ]);
      if (["cash", "mixed"].includes(f.compensation))
        rows.push([
          "Calendario deseado",
          f.payment_months
            ? f.payment_months + " meses después del hito"
            : "Por acordar",
        ]);
      if (["units", "mixed"].includes(f.compensation))
        rows.push([
          "Inmuebles deseados",
          [
            f.unit_count,
            f.unit_type,
            f.unit_area ? f.unit_area + " m² privados por unidad" : "",
          ]
            .filter(Boolean)
            .join(" · ") || "Por definir",
        ]);
      if (f.compensation === "mixed")
        rows.push([
          "Distribución por valor",
          f.cash_percent !== "" && f.cash_percent !== undefined
            ? f.cash_percent +
              " % dinero / " +
              (100 - Number(f.cash_percent)) +
              " % inmuebles"
            : "Por acordar",
        ]);
    }
    rows.push([
      negotiationValueLabel(f),
      referenceValueSummary(f) || (f.amount
        ? (f.price_method === "usd" ? "USD" : "COP") +
          " $" +
          formatAmount(f.amount)
        : "Por definir"),
    ]);
    if (valueStatus(f)==='known' && ["dual", "mixed"].includes(f.price_method))
      rows.push([
        f.price_method === "dual"
          ? "Precio alternativo en USD"
          : "Parte adicional en USD",
        f.amount_usd ? "USD $" + formatAmount(f.amount_usd) : "Por definir",
      ]);
    if(valueStatus(f)==='known'&&hasCashPreferences(f))rows.push([
      "Monedas preferidas",
      Array.isArray(f.receive_currencies)
        ? f.receive_currencies.join(" / ")
        : "Por definir",
    ]);
    if (valueStatus(f)==='known' && f.exchange_rate)
      rows.push([
        "Tasa ilustrativa propuesta",
        "COP $" + money(Number(f.exchange_rate)) + " por USD · Por acordar",
      ]);
  }
  if(state.formKind==='terreno')rows.push(['Visibilidad',f.visibility?visibilityLabel({kind:'terreno',form:f}):'Por seleccionar']);
  if(state.formKind==='terreno'&&f.valuation_assistance===true)rows.push(["Asesoría premium de valor base","Solicitada · Alcance y honorarios pendientes de acordar"]);
  return `<dl class="summary-list">${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${escape(value || "Por definir")}</dd></div>`).join("")}</dl>${state.formKind==='terreno'?landSituationSummary(f.land_situation,state.files):''}`;
}
function fileList() {
  return state.files.map((f,i)=>`<div class="uploaded-file">${icon(f.origin==='link'?'link':'file')}<div><strong>${escape(f.name)}</strong><small>${f.size?new Intl.NumberFormat('es-CO',{maximumFractionDigits:2}).format(f.size<1000000?f.size/1000:f.size/1000000)+(f.size<1000000?' KB · ':' MB · '):''}${f.origin==='demo'?'Referencia ficticia · Solo en este navegador':(f.id?'Guardado privado':'Referencia local anterior: vuelve a seleccionar el archivo')+' · '+(Date.parse(f.expiresAt)<=Date.now()?'Vencido':'Vence '+new Date(f.expiresAt).toLocaleDateString('es-CO'))}<br>${escape(f.analysis?.message||'Sin interpretación')}</small>${f.analysis?.candidates?.length?`<button type="button" class="text-button" data-action="file-perimeter" data-index="${i}">Revisar los perímetros del archivo</button>`:''}</div>${f.id&&f.origin!=='demo'?`<button type="button" class="text-button" data-action="download-document" data-id="${f.id}">${f.origin==='link'?'Ver enlace':'Descargar'}</button>`:''}<button type="button" class="icon-button" data-action="remove-file" data-index="${i}" aria-label="Quitar ${escape(f.name)}">${icon('x')}</button></div>`).join('');
}
function captureForm() {
  const form = $('[data-form="submission"]');
  if (!form) return;
  const controls = $$("[name]", form);
  const names = new Set(controls.map((c) => c.name));
  for (const name of names) {
    const group = controls.filter((c) => c.name === name);
    if (group[0].type === "file" || name.startsWith("ls_")) continue;
    if (group[0].type === "radio") {
      const checked = group.find((c) => c.checked);
      if (checked) state.form[name] = checked.value;
    } else if (group[0].type === "checkbox") {
      state.form[name] =
        name === "receive_currencies"
          ? group.filter((c) => c.checked).map((c) => c.value)
          : group[0].checked;
    } else if (group[0].hasAttribute("data-money")) {
      const amount = readAmount(group[0].value);
      state.form[name] = amount.valid ? amount.canonical : "";
    } else state.form[name] = group[0].value;
  }
  if(!isBrokerRelationship(state.form.relationship))delete state.form.broker_exclusivity;
  if (form.querySelector('[name^="ls_"]')) state.form.land_situation=captureLandSituation(form,state.form.land_situation);
  if (form.querySelector('[name="department_code"]')) {
    const d=getDepartment(state.form.department_code),m=getMunicipality(state.form.municipality_code);
    state.form.region=d?.name||'';
    state.form.city=m?.departmentCode===d?.code?m?.name||'':'';
  }
}
function saveDraft(silent = false) {
  clearTimeout(draftSaveTimer);
  captureForm();
  saved.draft = {
    kind: state.formKind,
    form: state.form,
    step: state.formStep,
    files: state.files,
    updatedAt: new Date().toISOString(),
  };
  putDraft(saved,saved.draft);
  const ok = persist();
  if(ok&&location.hash.startsWith('#/publicar/')){const params=new URLSearchParams(location.hash.split('?')[1]||'');params.delete('nuevo');params.set('borrador',state.form.client_id);history.replaceState(null,'','#/publicar/'+state.formKind+'?'+params.toString());}
  draftStatus($('[data-form="submission"]'),ok,saved.draft.updatedAt);
  if (ok && !silent) toast("Borrador guardado únicamente en este navegador.");
  return ok;
}
function successPage(id) {
  const submission = saved.submissions.find((s) => s.id === id);
  if(!submission)return notFound();
  if(submission.localRegistration)return localConfirmationHTML(submission);
  return `<section class="page-content"><div class="container"><div class="success-card"><div class="success-icon">${icon("check")}</div><div class="eyebrow" style="justify-content:center">Recorrido completado</div><h1>Tu demostración quedó guardada</h1><p>Recorriste el registro de ${submission?.kind === "proyecto" ? "un proyecto" : "un terreno"}. Puedes consultar el resumen en Mi espacio y seguir explorando la maqueta.</p><div class="reference">${escape(id)} · Registro local de ejemplo</div><div class="info-box" style="text-align:left">${icon("info")}No se publicó una oportunidad, no se subieron archivos ni se enviaron correos. La conexión con los servicios reales está pendiente.</div>${btn("Ir a Mi espacio", "#/mi-espacio")}${btn("Volver al inicio", "#/", "outline")}</div></div></section>`;
}
function allyPage() {
  const params=new URLSearchParams(location.hash.split('?')[1]||'');
  const selected=specialistForRole(params.get('rol'),params.get('especialidad')||'');
  return selected?specialistLanding(selected,{icon,escape}):params.has('grupo')?specialistDirectory({icon}):allyNetworkHTML({specialists,icon});
}
function allyRegistrationPage(selected) {
  return pageHeader(selected?'Regístrate como '+selected.singular:'Registra tu perfil de aliado',
    'Presenta tu experiencia como persona o empresa. El perfil se guarda en tu cuenta y podrás editarlo cuando lo necesites.',
    selected?selected.label:'La red de aliados',btn('Volver a '+(selected?'mi especialidad':'especialidades'),selected?'#/aliados/'+selected.slug:'#/aliados','outline'))+
    `<section class="page-content"><div class="container"><p class="sl-registration-note">${selected?'La especialidad viene seleccionada para ti. ':''}Tienes un perfil por cuenta. Si ya creaste uno, podrás actualizarlo antes de guardar. Este paso no publica tu perfil en un directorio ni activa correos automáticos.</p><div data-profile-editor></div></div></section>`;
}
function needsPage(id='') {
  return compactHeading(id?'Detalle del proyecto':'Proyectos que buscan aliados',id?'Conoce cada necesidad, su alcance y la atención que requiere.':'Combina especialidades, zonas y etapas para encontrar dónde aportar tu experiencia.','Proyectos y necesidades',id?'':btn('Tengo un proyecto','#/publicar/proyecto','outline'))+`<section class="page-content nb-page"><div class="container" data-project-needs-host></div></section>`;
}
function spacePage() {
  const tab = state.spaceTab;
  let body = "";
  if (tab === "favorites")
    body = saved.favorites.length
      ? `<div class="property-grid">${properties
          .filter((p) => saved.favorites.includes(p.id))
          .map(propertyCard)
          .join("")}</div>`
      : `<div class="empty-state">${icon("heart")}<h3>Oportunidades para volver a mirar</h3><p>Explora el catálogo y utiliza el corazón de una ficha para guardarla aquí.</p>${btn("Explorar oportunidades", "#/oportunidades")}</div>`;
  if (tab === "searches")
    body = saved.searches.length
      ? saved.searches
          .map(
            (s, i) =>
              `<div class="saved-row">${icon("map")}<div><h3>${escape(s.name)}</h3><p>${escape(searchLocationLabel(s))} · ${escape(s.type==='terreno'?terrainSearchLabel(s.landContent):s.type || "Terrenos y proyectos")} · ${s.zone?.length ? "Con zona dibujada" : s.sectors?.length ? "Con sectores" : "Sin zona"} · Guardado en este navegador</p></div><button class="text-button" data-action="open-search" data-index="${i}">Abrir ${icon("arrow-right")}</button></div>`,
          )
          .join("")
      : `<div class="empty-state">${icon("map")}<h3>Tus criterios, a mano</h3><p>Guarda una búsqueda desde el mapa para retomarla aquí.</p>${btn("Buscar tierra", "#/buscar")}</div>`;
  if (tab === "submissions")
    body =
      (saved.draft
        ? `<div class="saved-row">${icon("file")}<div><h3>${escape(saved.draft.form.title || "Borrador sin nombre")}</h3><p>Borrador local · ${escape(saved.draft.kind)}</p></div>${link("Continuar", "#/publicar/" + saved.draft.kind)}</div>`
        : "") +
      (saved.submissions.length
        ? saved.submissions
            .map(
              (s) =>
                `<div class="saved-row">${icon(s.kind === "proyecto" ? "building" : "map")}<div><h3>${escape(s.form.title || s.form.ally_name || "Perfil de aliado")}</h3><p>${escape(s.id)} · ${escape(s.kind)} · Demostración local, sin enviar</p></div><button class="text-button" data-action="view-submission" data-id="${escape(s.id)}">Ver resumen ${icon("arrow-right")}</button></div>`,
            )
            .join("")
        : !saved.draft
          ? `<div class="empty-state">${icon("file")}<h3>Tu siguiente paso comienza aquí</h3><p>Retoma un borrador o registra tu primera oportunidad para enviarla a revisión privada.</p>${btn("Tengo un terreno", "#/publicar/terreno")}</div>`
          : "");
  if (tab === "interests")
    body = saved.interests.length
      ? saved.interests
          .map(
            (s) =>
              `<div class="saved-row">${icon("handshake")}<div><h3>${escape(s.title)}</h3><p>${escape(s.id)} · Guardado en este navegador · Sin enviar</p>${s.kind==='need-proposal'?`<p>${escape(s.role)} · ${escape(s.availability)}</p><p>${escape(s.message)}</p><a class="text-link" href="#/necesidades/${escape(s.projectId)}">Ver proyecto y necesidad →</a>`:''}</div></div>`,
          )
          .join("")
      : `<div class="empty-state">${icon("handshake")}<h3>Conexiones por comenzar</h3><p>Prepara una participación desde una necesidad de ejemplo. Quedará en este navegador, sin enviarse a terceros.</p>${btn("Explorar proyectos", "#/necesidades")}</div>`;
  return (
    pageHeader(
      "Mi espacio",
      "Tus expedientes privados, borradores y actividad en un lugar.",
      "Tu actividad",
      btn("Vender mi terreno", "#/publicar/terreno", "outline"),
    ) +
    `<section class="page-content"><div class="container"><div class="info-box">${icon("lock")}<span><strong>Tu actividad, en su lugar.</strong> Los expedientes enviados y el seguimiento se guardan en tu cuenta. Los favoritos, búsquedas y borradores se conservan en este navegador.</span></div>${localRegistrationsHTML(saved)}${spaceActionsHTML({draft:null,team:!!state.session?.teamRole,objective:saved.objective})}${state.session?.authenticated?privateRecordsHTML()+'<div data-activity-center></div>':emailEntry.preview?'<div class="rj-demo-account"><strong>Recorrido por correo · Demostración</strong><p>Retoma tus registros locales desde Mis terrenos y proyectos. No necesitas iniciar una sesión real para continuar la maqueta.</p></div>':state.session?accessGateHTML({hash:'#/mi-espacio',title:'Tu seguimiento, desde tu cuenta',description:'Inicia sesión para consultar expedientes, intereses y solicitudes. Tus favoritos y búsquedas locales siguen disponibles más abajo.'}):'<p role="status">Consultando tu cuenta…</p>'}<section class="ux-local-section"><h2>Guardado en este navegador</h2><p>Favoritos, búsquedas y borradores para retomar después. Los expedientes enviados y el seguimiento se consultan arriba.</p><div class="space-stats"><div class="space-stat"><strong>${saved.favorites.length}</strong><span>Favoritos</span></div><div class="space-stat"><strong>${saved.searches.length}</strong><span>Búsquedas guardadas</span></div><div class="space-stat"><strong>${saved.submissions.length}</strong><span>Registros de ejemplo</span></div></div><div class="space-tabs" role="tablist" aria-label="Actividad">${[
      ["favorites", "Favoritos"],
      ["searches", "Búsquedas"],
      ["submissions", "Borrador e historial local"],
      ["interests", "Participaciones de ejemplo"],
    ]
      .map(
        ([id, label]) =>
          `<button role="tab" id="space-tab-${id}" aria-controls="space-panel" tabindex="${tab===id?0:-1}" aria-selected="${tab === id}" data-action="space-tab" data-tab="${id}" class="${tab === id ? "active" : ""}">${label}</button>`,
      )
      .join("")}</div><div role="tabpanel" id="space-panel" aria-labelledby="space-tab-${tab}" tabindex="0">${body}</div><details class="ux-local-tools"><summary>Administrar datos de este navegador</summary><p>Puedes borrar los favoritos, búsquedas, borradores e historial local. Los expedientes enviados, perfiles y solicitudes guardados en tu cuenta se conservan.</p><button type="button" class="text-button" data-action="clear-data">Borrar datos locales</button></details></section></div></section>`
  );
}
function howPage() { return howItWorksPage({icon,faqs}); }

function notFound() {
  return `<section class="page-content"><div class="container"><div class="empty-state">${icon("search")}<h1 style="font-size:30px">Esta página no está disponible</h1><p style="margin-top:15px">Puedes retomar el recorrido desde el inicio.</p>${btn("Volver al inicio", "#/")}</div></div></section>`;
}
function currentRouteHash(){const slug=location.pathname.replace(/\/+$/,'').slice('/aliados/'.length);return location.hash||(location.pathname.startsWith('/aliados/')&&(slug==='desarrolladores'||sectorForSlug(slug))?'#'+location.pathname:'#/');}
function render() {
  const path = currentRouteHash().slice(1).split("?")[0];
  let html;
  if (portalLinks.some(([slug])=>path==='/'+slug)) html=portalPage(path.slice(1));
  else if (path === "/") html = home();
  else if (path === '/alternativas-home/terrenos') html=home();
  else if (path === '/alternativas-home/hero') html=home(true);
  else if (path === '/alternativas-home') html=homeOptionsIndex();
  else if (path.startsWith('/alternativas-home/')) html=homeAlternative(path.split('/')[2],{cards:properties.slice(0,3).map(propertyCard).join(''),map:path.endsWith('/mapa')?mapHTML('home'):''});
  else if(path==='/minutas-de-contratos'||path.startsWith('/minutas-de-contratos/'))html=contractMinutesPage(path.slice('/minutas-de-contratos/'.length));
  else if(landToolRoutes.includes(path))html=landToolsPage(path);
  else if(path==='/directorio-de-notarias')html=notaryDirectoryPage();
  else if(path==='/asesoria-valor-terreno')html=premiumValuationPage();
  else if(path==='/propuestas-demo'||path.startsWith('/propuestas-demo/')||path.startsWith('/preparar-propuesta/'))html=proposalDemoPage();
  else if (path === "/comparar") html=pageHeader("Comparar terrenos","Hasta cuatro alternativas, con datos declarados y monedas separadas.","Tu evaluación")+'<section class="page-content"><div class="container" data-exp-comparison></div></section>';
  else if (path === "/buscar") html = catalog(true);
  else if (path === "/oportunidades") html = catalog();
  else if (path === "/proyectos-siniestrados") html = catalog(false, true);
  else if (path.startsWith("/oportunidad/")) html = detail(path.split("/")[2]);
  else if (path.startsWith("/publicar/")) html = formPage(state.formKind);
  else if(path.startsWith('/perfil-aliado/')){const profile=publicAllyProfileBySlug(path.slice('/perfil-aliado/'.length));html=profile?publicAllyProfileHTML(profile):notFound();}
  else if (path === "/aliados") html = allyPage();
  else if (path === "/aliados/buscar") html = specialistDirectory({icon});
  else if (path.startsWith('/aliados/')) {const specialist=specialistBySlug(path.slice('/aliados/'.length));html=specialist?specialistLanding(specialist,{icon,escape}):notFound();}
  else if (path==='/registro/aliado'||path.startsWith('/registro/aliado/')) {const selected=specialistBySlug(path.slice('/registro/aliado/'.length));html=path==='/registro/aliado'||selected?allyRegistrationPage(selected):notFound();}
  else if(path.startsWith('/interes/')){const parts=path.split('/'),kind=parts[2];html=['publicacion','ejemplo'].includes(kind)&&parts[3]?pageHeader('Registrar mi interés','Un seguimiento privado para evaluar esta oportunidad con el equipo.','Terrenos y proyectos')+`<section class="page-content"><div class="container" data-sales-host></div></section>`:notFound();}
  else if(path==='/mis-intereses'||path.startsWith('/mis-intereses/'))html=pageHeader('Mis intereses en oportunidades','Consulta el contacto autorizado, las visitas, propuestas y próximos pasos.','Seguimiento comercial')+`<section class="page-content"><div class="container" data-sales-host></div></section>`;
  else if(path==='/interesados-recibidos'||path.startsWith('/interesados-recibidos/'))html=pageHeader('Interesados en mis publicaciones','Evalúa y autoriza las presentaciones relacionadas con tus expedientes.','Control del titular')+`<section class="page-content"><div class="container" data-sales-host></div></section>`;
  else if(path==='/equipo-comercial'||path.startsWith('/equipo-comercial/'))html=pageHeader('Gestión comercial de oportunidades','Asigna responsables y registra contacto, visitas, propuestas y resultados.','Gestión privada')+`<section class="page-content"><div class="container" data-sales-host></div></section>`;
  else if(path.startsWith('/solicitar-servicio/')){const selected=specialistBySlug(path.slice('/solicitar-servicio/'.length));html=selected?pageHeader('Solicitar servicio especializado','Describe tu necesidad. El equipo revisará el alcance y gestionará los siguientes pasos.',selected.label)+`<section class="page-content"><div class="container" data-service-host></div></section>`:notFound();}
  else if(path==='/mis-solicitudes'||path.startsWith('/mis-solicitudes/'))html=pageHeader('Mis solicitudes de servicio','Consulta el estado y responde al equipo desde tu cuenta.','Seguimiento privado')+`<section class="page-content"><div class="container" data-service-host></div></section>`;
  else if(path==='/equipo-solicitudes'||path.startsWith('/equipo-solicitudes/'))html=pageHeader('Solicitudes de servicio','Gestiona las necesidades recibidas, responsables y próximos pasos.','Gestión privada')+`<section class="page-content"><div class="container" data-service-host></div></section>`;
  else if(path==='/equipo-aliados')html=pageHeader('Perfiles autorizados de aliados','Consulta servicios, cobertura y referencias compartidos con el equipo.','Gestión privada')+`<section class="page-content"><div class="container" data-service-host></div></section>`;
  else if (path === "/necesidades" || path.startsWith("/necesidades/")) html = needsPage(path.split("/")[2]);
  else if (path === "/mi-espacio") html = spacePage();
  else if (path === "/mi-perfil") html = pageHeader("Mi perfil","Tu identidad como persona o empresa en la plataforma.","Personas y empresas",btn("Mi espacio","#/mi-espacio","outline"))+`<section class="page-content"><div class="container" data-profile-editor></div></section>`;
  else if (path.startsWith("/mi-expediente/")) html = remoteRecordPage(path.split('/')[2]);
  else if(path==='/equipo-reportes')html=pageHeader('Reportes de publicaciones','Información desactualizada, representación y posibles duplicados.','Gestión privada')+'<section class="page-content"><div class="container" data-publication-reports></div></section>';
  else if (path === '/equipo'||path.startsWith('/equipo/')) html=pageHeader('Bandeja del equipo','Revisa expedientes, solicita información y gestiona su publicación.','Gestión privada',btn('Mi espacio','#/mi-espacio','outline'))+`<section class="page-content"><div class="container"><nav class="service-entry-nav"><a href="#/equipo">Expedientes</a><a href="#/equipo-comercial">Gestión comercial</a><a href="#/equipo-solicitudes">Solicitudes de servicio</a><a href="#/equipo-aliados">Perfiles autorizados</a><a href="#/equipo-reportes">Reportes</a></nav><div data-review-desk>${reviewDesk.html()}</div></div></section>`;
  else if (path.startsWith('/publicacion/')) html=publicationPage();
  else if (path === "/como-funciona") html = howPage();
  else if (path.startsWith("/confirmacion/"))
    html = successPage(path.split("/")[2]);
  else html = notFound();
  $("#contenido").innerHTML = html;
  hydrateIcons();
  emailEntry.mount($('#contenido'),render);
  mountCatalogSearch($('#contenido'));
  mountLandSearch($('#contenido'),({searchDepartment,searchMunicipality,intendedUse,landContent,draw})=>{Object.assign(state,{searchDepartment,searchMunicipality,intendedUse,landContent,type:'terreno',reactivationFilter:'',query:'',directoryScope:null,zone:[],sectors:[],drawPoints:[],placeBounds:null,mapPlace:null,view:draw?'both':'list',drawing:draw,mapFitRevision:state.mapFitRevision+1});const params=new URLSearchParams();params.set('contenido',terrainSearchQuery(landContent)||'todos');if(searchMunicipality)params.set('municipio',searchMunicipality);if(intendedUse)params.set('uso',intendedUse);if(draw)params.set('zona','1');const hash='#/buscar'+(params.size?'?'+params:'');if(location.pathname!=='/'){location.href='/'+hash;return;}navigateCatalog(hash);});
  mountPortalPage($('#contenido'));mountLegalAccess($('#contenido'));
  mountContractMinutes($('#contenido'));
  mountLandTools($('#contenido'));
  mountHowItWorks($('#contenido'));
  mountProposalDemo($('#contenido'),properties);
  mountTerrainDetail($('[data-terrain-detail]'));
  mountJourney($('#contenido'),{modal});
  mountTerrainPreviews($('#contenido'));
  mountLawyerCarousel($('[data-lawyer-carousel]'));
  mountSpecialistDirectory($('[data-specialist-directory]'),specialists);
  heroIntent.mount($('[data-hero-selector]'));
  syncMap();
  syncParcel();
  needsBoard.mount($('[data-project-needs-host]'),{id:path.split("/")[2]||"",query:location.hash.split("?")[1]||""});
  mountRescueGalleries($('#contenido'),[...properties,...needProjects],item=>modal(rescueGalleryZoomHTML(item)));
  const demoFileList=$('.rj-demo-supports #file-list');if(demoFileList)demoFileList.innerHTML=fileList();
  const landSituationForm=$('[data-form="submission"]');if(landSituationForm){syncLandSituation(landSituationForm);syncBrokerExclusivity(landSituationForm);mountSubmissionUX(landSituationForm);}
  reviewDesk.mount($('[data-review-desk]'));
  if(path.startsWith('/equipo/')&&reviewDesk.record)$('[data-review-desk]').insertAdjacentHTML('beforeend',teamExperienceHTML(reviewDesk.record));
  opportunityExperience.mount($('#contenido'),{owner:state.remoteRecord,team:reviewDesk.record});
  mountActivity($('#contenido'),{team:!!state.session?.teamRole});
  salesUI.mount($('[data-sales-host]'),{mode:path.startsWith('/interes/')?'form':'list',audience:path.startsWith('/equipo-comercial')?'team':path.startsWith('/interesados-recibidos')?'seller':'buyer',id:(path.startsWith('/mis-intereses/')||path.startsWith('/interesados-recibidos/')||path.startsWith('/equipo-comercial/'))?path.split('/')[2]:null,sourceKind:path.split('/')[2]==='publicacion'?'publication':'demo',sourceId:path.startsWith('/interes/')?path.split('/')[3]:null,recordId:new URLSearchParams(location.hash.split('?')[1]||'').get('expediente')||'',consultation:new URLSearchParams(location.hash.split('?')[1]||'').get('consulta')||''});
  serviceRequestsUI.mount($('[data-service-host]'),{mode:path.startsWith('/solicitar-servicio/')?'form':path==='/equipo-aliados'?'allies':'requests',slug:path.startsWith('/solicitar-servicio/')?path.split('/')[2]:null,team:path.startsWith('/equipo-'),id:(path.startsWith('/mis-solicitudes/')||path.startsWith('/equipo-solicitudes/'))?path.split('/')[2]:null,query:new URLSearchParams(location.hash.split('?')[1]||'').get('especialidad')||'',departmentCode:new URLSearchParams(location.hash.split('?')[1]||'').get('departamento')||'',service:new URLSearchParams(location.hash.split('?')[1]||'').get('servicio')||''});
  profileEditor.mount($('[data-profile-editor]'),path.startsWith('/registro/aliado/')?specialistDefaults(specialistBySlug(path.slice('/registro/aliado/'.length))):{});
  $$(".primary-navigation a").forEach(a => {
    if(a.getAttribute("href") === "#" + path) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  document.title =
    (path === "/"
      ? "Vende tu terreno"
      : $("#contenido h1")?.textContent || "Explorar") +
    " · Integración Inmobiliaria";
}
function enterRoute() {
  placeRequest?.abort();
  placeRequest = null;
  state.placeResults = [];
  closeModal();
  const path = currentRouteHash().slice(1).split("?")[0];
  if(path==='/alternativas-home/terrenos'){location.replace('#/');return;}
  if(path.startsWith('/oportunidad/'))state.detailMapStyle=terrainDefaultMapStyle(properties.find(p=>p.id===path.split('/')[2]));
  const navigation=pendingCatalogNavigation?.hash===location.hash?pendingCatalogNavigation:null;
  pendingCatalogNavigation=null;
  const restore=isCatalogHash(location.hash)&&!navigation?(pendingExplicitReturn||normalizeSearchContext(history.state?.iiCatalogSearch)||(initialNavigation?readSearchContext(location.hash):null)):null;
  pendingExplicitReturn=null;initialNavigation=false;
  const restoring=restore?.hash===location.hash;
  if(isCatalogHash(location.hash))state.searchSelected='';
  if(isCatalogHash(location.hash)&&!restoring&&!navigation)Object.assign(state,catalogRouteState(location.hash),{mapFitRevision:state.mapFitRevision+1});
  if(restoring){Object.assign(state,restore.filters,{placeResults:[],mapPlace:null,drawPoints:[],drawing:false,mapFitRevision:state.mapFitRevision+1});state.searchCamera=restore.camera;state.searchCameraRevision=state.mapFitRevision;pendingResultsContext=restore;}
  if (path.startsWith("/publicar/")) {
    const kind = path.endsWith("proyecto") ? "proyecto" : "terreno";
    const params=new URLSearchParams(location.hash.split('?')[1]||''),requestedId=params.get('borrador');
    const draft=params.get('nuevo')==='1'?null:chooseDraft(saved,kind,requestedId);
    if(requestedId&&!draft){const completed=saved.submissions.find(s=>s.localRegistration&&s.clientId===requestedId&&s.kind===kind);if(completed){location.replace('#/confirmacion/'+completed.id);return;}state.formKind=kind;$('#contenido').innerHTML=notFound();return;}
    state.formKind = kind;
    state.formStep = draft?.step || 1;
    state.form = {
      price_method: "cop",
      negotiable: "yes",
      receive_currencies: ["COP"],
      rate_method: "trm",
      compensation: "advice",
      ...(kind === "terreno" ? { negotiation: "sale", value_status: draft?valueStatus(draft.form):"" } : {}),
      ...draft?.form,
    };
    state.form = normalizeLocationDraft(state.form);
    if (!resolveLocation(state.form)) state.formStep = 1;
    if (!state.form.client_id) state.form.client_id = crypto.randomUUID();

    if(kind==='terreno'&&isBrokerRelationship(state.form.relationship)&&!['yes','no'].includes(state.form.broker_exclusivity))state.formStep=1;
    if(kind==='terreno'&&(!['land-only','land-project'].includes(state.form.land_content)||state.form.project_land_confirmed!==true))state.formStep=1;
    state.files = draft?.files || [];
  }
  state.drawing=restoring?false:navigation?navigation.drawing:isCatalogHash(location.hash)?state.drawing:false;
  state.layers = false;
  headerNavigation.close();
  render();
  if (path === "/mi-espacio") refreshRemoteRecords();
  if (path === '/equipo'||path.startsWith('/equipo/'))reviewDesk.load(path.startsWith('/equipo/')?decodeURIComponent(path.split('/')[2]):null);
  if (['/oportunidades','/buscar','/proyectos-siniestrados'].includes(path))refreshPublished();
  if (path.startsWith('/publicacion/'))loadPublication(path.split('/')[2]);
  if (path.startsWith("/mi-expediente/")) loadRemoteRecord(path.split('/')[2]);
  if(restoring)restoreSearchScroll(restore);else window.scrollTo({ top: 0, behavior: "instant" });
  if(!restoring&&state.drawing&&isCatalogHash(location.hash))requestAnimationFrame(()=>$(".search-layout")?.scrollIntoView({block:"start",behavior:"instant"}));
  if (path === "/buscar" && state.pendingLocationQuery) {
    const query = state.pendingLocationQuery;
    state.pendingLocationQuery = "";
    searchPlace(query);
    toast("Elige de nuevo la ubicación para recuperar su alcance geográfico.");
  }
}
function tutorial() {
  const step = state.tutorialStep;
  let content = "";
  if (step === 0)
    content = `<h2 id="dialog-title">Tu terreno puede ser el comienzo.</h2><p class="tutorial-lead">Aportar tu lote significa proponerlo para un desarrollo inmobiliario y negociar qué recibirás a cambio: dinero más adelante, inmuebles del proyecto o una combinación.</p><div class="tutorial-timeline"><span>Tu terreno</span>${icon("arrow-right")}<span>Un acuerdo</span>${icon("arrow-right")}<span>El desarrollo</span>${icon("arrow-right")}<span>Lo que recibirías</span></div><div class="tutorial-callout">Primero se acuerdan valoración, obligaciones, plazos y condiciones. <strong>Guardar una preferencia no transfiere tu terreno ni acepta una oferta.</strong></div>`;
  if (step === 1)
    content = `<h2 id="dialog-title">¿Qué te gustaría recibir?</h2><p class="tutorial-lead">Elige una preferencia para explorarla. Podrás negociar alternativas con los participantes.</p><div class="tutorial-options">${[
      [
        "cash",
        "coins",
        "Dinero posterior",
        "Un monto y un calendario después del punto de equilibrio.",
      ],
      [
        "units",
        "building",
        "Inmuebles del desarrollo",
        "Unidades con características y condiciones acordadas.",
      ],
      [
        "mixed",
        "layers",
        "Dinero + inmuebles",
        "Una parte del valor en cada alternativa.",
      ],
    ]
      .map(
        ([id, type, title, text]) =>
          `<button class="tutorial-option ${state.tutorialChoice === id ? "selected" : ""}" data-action="tutorial-choice" data-choice="${id}" aria-pressed="${state.tutorialChoice === id}">${icon(type)}<strong>${title}</strong><small>${text}</small></button>`,
      )
      .join(
        "",
      )}</div><button class="text-button" data-action="tutorial-choice" data-choice="advice">${state.tutorialChoice === "advice" ? "✓ " : ""}Necesito orientación para elegir</button>`;
  if (step === 2)
    content = ["cash", "mixed"].includes(state.tutorialChoice)
      ? `<h2 id="dialog-title">El hito y el pago son distintos.</h2><p class="tutorial-lead">El punto de equilibrio reúne condiciones pactadas para que el proyecto avance: pueden incluir ventas, financiación, licencias y otras condiciones técnicas o jurídicas.</p><div class="tutorial-callout"><strong>Alcanzarlo no significa que ya existan utilidades ni que recibas todo el dinero automáticamente.</strong> Tu calendario de pago debe acordarse por separado.</div><ul class="check-list"><li>${icon("check")}Definir qué condiciones componen el hito y quién acredita su cumplimiento.</li><li>${icon("check")}Pactar cuánto tiempo después comienza el pago y cuándo termina.</li><li>${icon("check")}Acordar monto, moneda, cuotas, garantías y qué sucede si el hito no se alcanza.</li>${state.tutorialChoice === "mixed" ? "<li>" + icon("building") + "Definir también las unidades, su valoración y las condiciones de entrega de la parte en inmuebles.</li>" : ""}</ul><a class="link-source" target="_blank" rel="noopener noreferrer" href="https://www.superfinanciera.gov.co/publicaciones/10089703/normativanormativa-generalboletin-juridico-superintendencia-financieraboletin-juridico-numero-fiducia-proyectos-inmobiliarios-rendimientos-10089703/">Referencia: Superintendencia Financiera · Condiciones del negocio fiduciario</a>`
      : `<h2 id="dialog-title">Más que un número de inmuebles.</h2><p class="tutorial-lead">Recibir unidades del proyecto requiere acordar qué inmuebles recibirás, cómo se valoran y en qué condiciones se entregan.</p><ul class="check-list"><li>${icon("check")}Tipo de unidad, área privada, ubicación, acabados y anexos.</li><li>${icon("check")}Unidades identificadas o un mecanismo de selección acordado.</li><li>${icon("check")}Fechas y condiciones de entrega física, escrituración y transferencia.</li><li>${icon("check")}Qué sucede ante retrasos, cambios o interrupción del proyecto.</li></ul><div class="tutorial-callout">No se convierten automáticamente metros de terreno en apartamentos. <strong>La equivalencia y la disponibilidad se deben acordar con el proyecto.</strong></div>`;
  if (step === 3)
    content = `<h2 id="dialog-title">Una preferencia para conversar.</h2><p class="tutorial-lead">Tu elección sirve para recibir y comparar propuestas. El acuerdo final se construye con los participantes y sus especialistas.</p><div class="tutorial-summary"><strong>Tu preferencia:</strong><br>${compensationNames[state.tutorialChoice] || "Necesita orientación"}<br><br><strong>Pendiente por acordar:</strong><br>Valoración del terreno, condiciones, plazos, garantías y qué sucede si el proyecto no avanza.</div><div class="privacy-note">${icon("lock")}Integración conecta a los actores. No estructura el proyecto ni transfiere tu terreno.</div>`;
  modal(
    `<div class="tutorial-step-label">Aportar mi terreno · Paso ${step + 1} de 4</div><div class="tutorial-progress">${[0, 1, 2, 3].map((i) => `<span class="${i <= step ? "active" : ""}"></span>`).join("")}</div>${content}<div class="tutorial-nav">${step ? '<button class="button" data-action="tutorial-back">Atrás</button>' : '<button class="text-button" data-action="close-dialog">Ver más tarde</button>'}<button class="button primary" data-action="${step === 3 ? "tutorial-finish" : "tutorial-next"}">${step === 3 ? (state.tutorialFromForm ? "Usar esta preferencia" : "Entendido") : "Continuar"} ${icon("arrow-right")}</button></div>`,
  );
}
function requestInterest(title, ref) {
  modal(
    `<div class="eyebrow">Un primer acercamiento</div><h2 id="dialog-title">${escape(title)}</h2><p>En la plataforma real, el equipo revisaría tu interés y coordinaría los siguientes pasos. Puedes probar ese registro en tu espacio local.</p><form class="dialog-form" data-form="interest"><input type="hidden" name="reference" value="${escape(ref)}"><input type="hidden" name="title" value="${escape(title)}"><label class="form-field">¿Desde qué rol te interesa participar?<select name="role" required><option value="">Seleccionar</option>${["Abogados (legales)", "Propietario", "Desarrollador", "Estructurador", "Constructor", "Inversionista", "Financiador", "Comercializador", "Otro"].map((r) => `<option>${r}</option>`).join("")}</select></label><label class="form-field">Qué te gustaría evaluar<textarea name="message" maxlength="1000" placeholder="Describe tu intención sin incluir datos sensibles."></textarea></label><div class="info-box">${icon("info")}Se guardará únicamente en tu navegador. No se enviará a terceros ni generará un correo.</div><button class="button primary" type="submit">Guardar interés de demostración ${icon("arrow-right")}</button></form>`,
  );
}
function captureSearchFilters() {
  const filter = $('[data-form="filters"]');
  if (!filter) return true;
  const data = new FormData(filter);
  const query = String(data.get("query") || "").trim();
  const min = $('[name="minArea"]')?.value || "";
  const max = $('[name="maxArea"]')?.value || "";
  const showSearchIssue=message=>{const panel=$('#extra-search-filters'),issue=$('[data-jr-filter-error]');if(panel)panel.hidden=false;document.querySelectorAll('[data-action="more-filters"]').forEach(button=>button.setAttribute('aria-expanded','true'));if(issue){issue.hidden=false;issue.textContent=message;issue.focus();}else toast(message);};
  let territory=null;
  if(filter.hasAttribute('data-catalog-search')){try{territory=readCatalogTerritory(state,Object.fromEntries(data));}catch(error){showSearchIssue(error.message);return false;}}
  if (
    [...filter.elements].some(input=>['minArea','maxArea'].includes(input.name)&&input.validity.badInput)||
    [min, max].some(
      (value) =>
        value && (!Number.isFinite(Number(value)) || Number(value) < 0),
    ) ||
    (min && max && Number(min) > Number(max))
  ) {
    showSearchIssue('El área máxima debe ser mayor o igual a la mínima; utiliza valores positivos.');
    return false;
  }
  if (query !== state.query || territory?.locationChanged) {
    state.zone = [];
    state.sectors = [];
    state.drawPoints = [];
    state.drawing = false;
    state.mapPlace = null;
    state.placeBounds = null;
    state.placeResults = [];
    state.mapSearchText = query;
  }
  Object.assign(state, {
    ...territory?.filters,
    query,
    min,
    max,
    searchTypeExplicit:true,
    reactivationFilter:String(data.get("type")||'')===state.type?state.reactivationFilter:(data.get("type")==="proyecto"?"exclude":""),
    type: String(data.get("type") || ""),
    landContent: data.get('type')==='terreno'&&['land-only','land-project'].includes(data.get('landContent'))?String(data.get('landContent')):'',
    mode: String(data.get("mode") || ""),
    maxPrice: priceLimits.some(([v])=>v===($('[name="maxPrice"]')?.value||""))?$('[name="maxPrice"]').value:"",
  });
  if(state.type!=="terreno"){
    state.searchDepartment='';state.searchMunicipality='';state.intendedUse='';
    state.directoryScope=null;
    if(location.hash.startsWith("#/oportunidades?"))history.replaceState(null,"","#/oportunidades");
  }
  state.mapFitRevision++;
  captureSearchContext(state,location.hash);
  return true;
}
function saveSearchDialog() {
  if (state.drawing) {
    toast("Finaliza la zona antes de guardar la búsqueda.");
    return;
  }
  if (!captureSearchFilters()) return;
  modal(
    `<div class="eyebrow">Retoma tu búsqueda</div><h2 id="dialog-title">Guarda lo que estás buscando.</h2><p>Podrás volver a tus criterios desde Mi espacio. Se guardan solo en este navegador.</p><form class="dialog-form" data-form="save-search"><label class="form-field">Nombre de la búsqueda<input name="name" required maxlength="90" placeholder="Ej. Tierra para vivienda" value="${escape(state.query ? "Búsqueda en " + state.query : "")}" autofocus></label><div class="tutorial-summary">Municipio: ${escape(searchLocationLabel(state))}<br>Tipo: ${escape(state.type==='terreno'?terrainSearchLabel(state.landContent):state.type || "Terrenos y proyectos")}<br>Modalidad: ${escape(state.mode || "Abierta a alternativas")}<br>Zona: ${state.zone.length ? "Polígono geográfico" : state.sectors.length ? "Sectores seleccionados" : state.mapPlace ? "Ubicación elegida en Mapbox; al abrir, vuelve a seleccionarla" : "Sin delimitar"}</div><button class="button primary" type="submit">Guardar búsqueda ${icon("bookmark")}</button></form>`,
  );
}
function redrawMap() {
  const stage = $(".map-stage");
  if (!stage) return;
  stage.outerHTML = mapHTML(
    stage.dataset.mapContext,
    stage.dataset.propertyId || "",
  );
  hydrateIcons();
  mountLawyerCarousel($('[data-lawyer-carousel]'));
  heroIntent.mount($('[data-hero-selector]'));
  syncMap();
}
function redrawResults() {
  const path = location.hash || "#/";
  if (isCatalogHash(path)) {
    const scroll = window.scrollY;
    render();
    window.scrollTo({ top: scroll, behavior: "instant" });
  } else redrawMap();
}
function resetFilters() {
  Object.assign(state, {searchDepartment:"",searchMunicipality:"",intendedUse:"",
    query: "",
    searchTypeExplicit:false,
    directoryScope: null,
    type: state.type,
    mode: "",
    maxPrice: "",
    min: "",
    max: "",
    zone: [],
    sectors: [],
    drawing: false,
    drawPoints: [],
    mapPlace: null,
    placeBounds: null,
    placeResults: [],
    mapSearchText: "",
    pendingLocationQuery: "",
    mapFitRevision: state.mapFitRevision + 1,
  });
  if (location.hash === "#/" || !location.hash || location.hash.startsWith("#/oportunidades?"))
    navigateCatalog("#/oportunidades");
  else {render();captureSearchContext(state,location.hash);}
}
async function action(actionName, el, event) {
  if(actionName==='return-search'){event?.preventDefault();const context=readSearchContext();if(context){pendingExplicitReturn=context;if(location.hash===context.hash)enterRoute();else location.hash=context.hash;}else location.hash='#/buscar';return;}
  if(actionName==='retry-publications'){refreshPublished();return;}
  if(actionName==='space-objective'){saved.objective=normalizeSpaceObjective(el.dataset.objective);persist();render();document.querySelector('[data-objective="'+saved.objective+'"]').focus({preventScroll:true});return;}

  if(actionName==='link-project-profile'){
    if(!state.remoteRecord)return;el.disabled=true;
    try{state.remoteRecord=await api('/api/records/'+state.remoteRecord.id+'/profile',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({revision:state.remoteRecord.revision})});render();toast('Tu perfil quedó vinculado al proyecto privado.');}
    catch(error){toast(error.message);el.disabled=false;}return;
  }

  if (actionName === "menu") headerNavigation.toggleMobile();
  if(actionName==='hero-list'||actionName==='hero-map'){state.view=actionName==='hero-list'?'list':'both';navigateCatalog('#/buscar');}
  if(actionName==='hero-filters'){
    modal(`<div class="eyebrow">Define tu búsqueda</div><h2 id="dialog-title">Un terreno para tu proyecto</h2><form data-form="hero-filters" class="dialog-form"><div class="form-grid"><label class="form-field full">Tipo de lote<select name="land_type"><option value="">Todos los lotes</option>${['Urbano','Rural','Expansión urbana'].map(value=>`<option ${state.directoryScope?.landType===value?'selected':''}>${value}</option>`).join('')}</select></label><label class="form-field">Área mínima (m²)<input type="number" min="0" name="minArea" value="${escape(state.min)}" placeholder="Desde"></label><label class="form-field">Área máxima (m²)<input type="number" min="0" name="maxArea" value="${escape(state.max)}" placeholder="Hasta"></label><label class="form-field full">Modalidad<select name="mode"><option value="">Venta o aporte</option>${['Venta','Aporte'].map(value=>`<option ${state.mode===value?'selected':''}>${value}</option>`).join('')}</select></label></div><p class="privacy-note">La clasificación del lote corresponde a información declarada y requiere verificación.</p><button class="button primary" type="submit">Ver resultados ${icon('arrow-right')}</button></form>`);
    if(el.dataset.focus)document.querySelector(`#dialog [name="${el.dataset.focus}"]`)?.focus();
  }
  if (actionName === "publish")
    modal(
      `<div class="eyebrow">¿Por dónde comenzamos?</div><h2 id="dialog-title">Cuéntanos qué tienes.</h2><p>Un terreno y un proyecto tienen recorridos propios. Tu postulación comienza privada.</p><div class="dialog-actions">${btn("Tengo un terreno", "#/publicar/terreno")}${btn("Tengo un proyecto", "#/publicar/proyecto")}</div>`,
    );
  if (actionName === "close-dialog") closeModal();
  if (actionName === "favorite") {
    const id = el.dataset.id;
    const old = [...saved.favorites];
    saved.favorites = old.includes(id)
      ? old.filter((x) => x !== id)
      : [...old, id];
    if (!persist()) {
      saved.favorites = old;
      return;
    }
    const scroll = window.scrollY;
    render();
    window.scrollTo({ top: scroll, behavior: "instant" });
    toast(
      saved.favorites.includes(id)
        ? "Oportunidad guardada en Mi espacio."
        : "Oportunidad eliminada de favoritos.",
    );
  }
  if (actionName === "more-filters") {
    toggleSearchFilters(el);
  }
  if (actionName === "reset-filters") resetFilters();
  if (actionName === "view") {
    if(!captureSearchFilters())return;
    state.view = el.dataset.view;
    render();
    captureSearchContext(state,location.hash);
    if(state.view!=='list'&&state.query&&!state.zone.length&&!state.placeBounds)searchPlace(state.query);
  }
  if (actionName === "map-pin") {
    event?.stopPropagation();
    state.selected = el.dataset.id;
    redrawMap();
  }
  if (actionName === "map-style") {
    if(el.closest('.map-stage')?.dataset.mapContext==='detail')state.detailMapStyle=el.dataset.style;
    else state.mapStyle = el.dataset.style;
    redrawMap();
  }
  if (actionName === "map-zoom") landMap.zoom(Number(el.dataset.change));
  if (actionName === "retry-map") {
    landMap.destroy();
    redrawMap();
  }
  if (actionName === "choose-place") {
    const feature = state.placeResults[Number(el.dataset.index)];
    if (!feature) return;
    state.query = state.mapSearchText;
    state.zone = [];
    state.sectors = [];
    state.drawPoints = [];
    state.drawing = false;
    state.layers = false;
    state.view = "both";
    state.mapPlace = feature;
    state.placeBounds = locationBounds(feature);
    state.placeResults = [];
    state.mapFitRevision++;
    if (!location.hash || location.hash === "#/" || location.hash.startsWith("#/alternativas-home/")) navigateCatalog("#/buscar");
    else render();
  }
  if (actionName === "close-places") {
    state.placeResults = [];
    redrawMap();
  }
  if (actionName === "draw-zone") {
    placeRequest?.abort();
    placeRequest = null;
    Object.assign(state,drawingTerritory(state));
    state.drawing = true;
    state.layers = false;
    state.drawPoints = [];
    state.placeResults = [];
    if($('.cs-catalog')){render();$('.search-map')?.scrollIntoView({block:'start',behavior:'smooth'});}else redrawMap();
  }
  if (actionName === "undo-point") {
    state.drawPoints.pop();
    redrawMap();
  }
  if (actionName === "cancel-zone") {
    state.drawPoints = [];
    state.drawing = false;
    redrawMap();
    toast("Dibujo cancelado. Conservamos la zona anterior.");
  }
  if (actionName === "finish-zone") {
    if (state.drawPoints.length < 3) {
      toast("Marca al menos tres puntos para cerrar la zona.");
      return;
    }
    if (!validRing(state.drawPoints)) {
      toast(
        "La zona debe tener superficie y no cruzarse a sí misma. Dibuja una nueva zona.",
      );
      return;
    }
    state.zone = [...state.drawPoints];
    state.drawPoints = [];
    state.drawing = false;
    state.sectors = [];
    state.placeBounds = null;
    state.mapPlace = null;
    state.query = "";
    state.mapSearchText = "";
    state.view = "both";
    state.mapFitRevision++;
    if (!location.hash || location.hash === "#/" || location.hash.startsWith("#/alternativas-home/")) navigateCatalog("#/buscar");
    else redrawResults();
    toast("Zona geográfica delimitada. Puedes guardar la búsqueda.");
  }
  if (actionName === "clear-zone") {
    state.zone = [];
    state.sectors = [];
    state.drawPoints = [];
    state.drawing = false;
    state.mapFitRevision++;
    redrawResults();
  }
  if (actionName === "sectors") {
    state.layers = !state.layers;
    state.drawing = false;
    redrawMap();
  }
  if (actionName === "save-search") saveSearchDialog();
  if(actionName==='remove-filter'){if(removeFilter(state,el.dataset.filter)){render();captureSearchContext(state,location.hash);$('.ux-active-filters button')?.focus();}return;}
  if(actionName==='form-step'){const step=Number(el.dataset.step);if(Number.isInteger(step)&&step>=1&&step<state.formStep){captureForm();state.formStep=step;saveDraft(true);render();focusFormStep();}return;}
  if (actionName === "form-back") {
    captureForm();
    state.formStep = Math.max(1, state.formStep - 1);
    saveDraft(true);
    render();
    focusFormStep();
  }
  if(actionName==='save-and-exit'){if(saveDraft(true)){state.spaceTab='submissions';location.hash='#/mi-espacio';toast('Avance guardado en este navegador. Puedes retomarlo desde Mis terrenos y proyectos.');}return;}
  if(actionName==='edit-local-registration'){const record=saved.submissions.find(s=>s.localRegistration&&s.id===el.dataset.id);if(!record)return;const previous=structuredClone(saved);const draft={kind:record.kind,form:structuredClone(record.form),step:1,files:structuredClone(record.files||[]),updatedAt:new Date().toISOString()};putDraft(saved,draft);if(!persist()){saved=previous;return;}location.hash=draftHref(draft);return;}
  if(actionName==='demo-document'&&emailEntry.isPreview()){if(!state.files.some(f=>f.origin==='demo'))state.files.push({id:crypto.randomUUID(),name:'Ficha técnica de ejemplo.pdf',origin:'demo',analysis:{status:'demo',message:'Referencia ficticia. No se cargó ningún archivo.'}});saveDraft(true);render();return;}
  if(actionName==='demo-perimeter'&&emailEntry.isPreview()){captureForm();Object.assign(state.form,{parcel_geometry:demoTerrainGeometry('TER-DEMO-001'),parcel_source:'Perímetro ficticio de demostración · no predial',parcel_confirmed:false,demo_parcel_confirmed:false});saveDraft(true);render();return;}
  if (actionName === "save-draft") saveDraft();
  if (actionName === "file-mode") {
    captureForm();
    state.fileMode = el.dataset.mode;
    render();
  }
  if (actionName === "add-file-link") {
    if(emailEntry.isPreview()){toast("Los adjuntos requieren el acceso real del portal. Esta maqueta conserva solo el borrador local.");return;}
    captureForm();
    if (state.files.length>=20) {toast("Puedes adjuntar hasta 20 documentos.");return;}
    const key=state.form.client_id;
    try {
      el.disabled=true;
      const document=await addDocumentLink(state.form.file_link_name,state.form.file_link_url);
      if(state.form.client_id!==key)return;
      state.files.push(document);state.form.file_link_url='';state.form.file_link_name='';saveDraft(true);render();
    }catch(e){toast(e.message);}finally{el.disabled=false;}
  }
  if (actionName === "remove-file") {
    captureForm();state.files.splice(Number(el.dataset.index),1);saveDraft(true);render();
    toast("Referencia retirada del borrador. El original privado conserva su vencimiento de 60 días.");
  }
  if (actionName === "file-perimeter") {
    captureForm();const file=state.files[Number(el.dataset.index)];
    state.form.location_mode='polygon';state.formStep=1;saveDraft(true);render();parcelEditor.candidates=file.analysis.candidates;parcelEditor.candidateSource=file.name;parcelEditor.render();
    $('[data-parcel-host]').scrollIntoView({behavior:'smooth',block:'start'});
  }
  if (actionName === "more-publications") refreshPublished(true);
  if (actionName === "refresh-records") refreshRemoteRecords();
  if (actionName === "more-records") refreshRemoteRecords(true);
  if (actionName === "download-document") {
    try {
      const meta=await api('/api/documents/'+el.dataset.id);
      const href=meta.origin==='link'?meta.url:'/api/documents/'+meta.id+'/download';
      const a=document.createElement('a');a.href=href;
      if(meta.origin==='link'){a.target='_blank';a.rel='noopener noreferrer';}else a.download=meta.name;
      document.body.append(a);a.click();a.remove();
    }catch(e){toast(e.message);}
  }
  if (actionName === 'detail-section') {
    const section=document.getElementById(el.dataset.target);
    if(section){section.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});section.focus({preventScroll:true});}
  }
  if (actionName === "tutorial") {
    captureForm();
    state.tutorialStep = 0;
    state.tutorialFromForm = el.dataset.fromForm === "true";
    state.tutorialChoice = state.tutorialFromForm
      ? state.form.compensation || "advice"
      : "";
    tutorial();
  }
  if (actionName === "tutorial-choice") {
    state.tutorialChoice = el.dataset.choice;
    tutorial();
  }
  if (actionName === "tutorial-next") {
    if (state.tutorialStep === 1 && !state.tutorialChoice) {
      toast("Elige una alternativa o solicita orientación.");
      return;
    }
    state.tutorialStep = Math.min(3, state.tutorialStep + 1);
    tutorial();
  }
  if (actionName === "tutorial-back") {
    state.tutorialStep = Math.max(0, state.tutorialStep - 1);
    tutorial();
  }
  if (actionName === "tutorial-finish") {
    closeModal();
    if (state.tutorialFromForm) {
      state.form.compensation = state.tutorialChoice || "advice";
      state.form.negotiation = "contribution";
      render();
      saveDraft(true);
      toast(
        "Preferencia aplicada al borrador. Puedes ajustar sus condiciones.",
      );
    }
  }
  if (actionName === 'terrain-consult' || actionName === 'terrain-photo' || actionName === 'terrain-visit') {
    const p=properties.find(p=>p.id===el.dataset.id&&p.type==='terreno');
    if(p){if(actionName==='terrain-visit')location.hash='#/interes/ejemplo/'+p.id+'?consulta=visita';else modal(actionName==='terrain-photo'?terrainPhotoHTML(p):terrainConsultHTML(p,icon));}
  }
  if (actionName === "interest") {
    const p = properties.find((p) => p.id === el.dataset.id);
    if(p)location.hash="#/interes/ejemplo/"+p.id;
  }
  if (actionName === "need-interest") {
    const n = needs[Number(el.dataset.index)];
    if(n)location.hash="#/necesidades/"+n.projectId;
  }
  if (actionName === "share") {
    const url = new URL(location.href);
    url.hash = "/oportunidad/" + el.dataset.id;
    try {
      await navigator.clipboard.writeText(url.href);
      toast("Enlace copiado. La ficha contiene datos de ejemplo.");
    } catch {
      modal(
        `<h2 id="dialog-title">Enlace de la ficha</h2><p>Puedes copiar esta dirección. Contiene únicamente información de demostración.</p><label class="form-field" style="margin-top:18px">Dirección<input readonly value="${escape(url.href)}" onclick="this.select()"></label>`,
      );
    }
  }
  if (actionName === "space-tab") {
    state.spaceTab = el.dataset.tab;
    render();
    $('#space-tab-'+state.spaceTab)?.focus({preventScroll:true});
  }
  if (actionName === "open-search") {
    const s = saved.searches[Number(el.dataset.index)];
    if (!s) return;
    Object.assign(state, {
      searchTypeExplicit:true,
      searchDepartment:getDepartment(s.searchDepartment)?.code||"",searchMunicipality:getMunicipality(s.searchMunicipality)?.code||"",intendedUse:landUses.some(([v])=>v===s.intendedUse)?s.intendedUse:"",
      directoryScope: s.directoryScope || null,
      query: s.query || "",
      mapSearchText: s.query || "",
      pendingLocationQuery: s.locationQuery || "",
      placeResults: [],
      type: s.type || "",
      landContent:s.type==='terreno'&&['land-only','land-project'].includes(s.landContent)?s.landContent:'',
      reactivationFilter:['only','exclude'].includes(s.reactivationFilter)?s.reactivationFilter:'',
      mode: s.mode || "",
      maxPrice: s.maxPrice || "",
      min: s.min || "",
      max: s.max || "",
      zone:
        s.coordinateSystem === "EPSG:4326" && validRing(s.zone) ? s.zone : [],
      mapPlace: null,
      placeBounds: null,
      mapFitRevision: state.mapFitRevision + 1,
      sectors: s.sectors || [],
      view: "both",
    });
    if (s.zone?.length && s.coordinateSystem !== "EPSG:4326")
      toast(
        "Se conservaron tus filtros. Vuelve a dibujar la zona del mapa anterior.",
      );
    navigateCatalog(savedSearchHash(state));
  }
  if (actionName === "view-submission") {
    const s = saved.submissions.find((s) => s.id === el.dataset.id);
    modal(
      `<div class="eyebrow">Registro local de demostración</div><h2 id="dialog-title">${escape(s.form.title || s.form.ally_name || "Perfil de aliado")}</h2><div class="tutorial-summary">Referencia: ${escape(s.id)}<br>Tipo: ${escape(s.kind)}<br>Ubicación: ${escape(s.form.city || s.form.ally_region || "Por definir")}<br>Modalidad: ${escape(s.form.negotiation || s.form.need || s.form.ally_role || "Por definir")}<br>Aporte: ${escape(compensationNames[s.form.compensation] || "No especificado")}<br>Archivos/referencias: ${s.files?.length || 0}</div><p>Este registro no se envió al equipo ni a otros actores.</p>`,
    );
  }
  if (actionName === "clear-data")
    modal(
      `<h2 id="dialog-title">Borrar datos de este navegador</h2><p>Se eliminarán favoritos, búsquedas, borradores e historial local de este navegador. Tus expedientes enviados, perfil y solicitudes guardados en tu cuenta se conservan.</p><div class="dialog-actions"><button class="button" data-action="close-dialog">Conservar</button><button class="button primary" data-action="confirm-clear">Borrar datos locales</button></div>`,
    );
  if (actionName === "confirm-clear") {
    localStorage.removeItem(KEY);localStorage.removeItem('ii-compare-v1');opportunityExperience.selected=[];opportunityExperience.refresh();for(const key of Object.keys(localStorage))if(key.startsWith('ii-terrain-preparation-'))localStorage.removeItem(key);
    saved = readStore();
    closeModal();
    render();
    toast("Los datos locales de esta maqueta se borraron.");
  }
  if (actionName === "ally-register") {
    const role=el.dataset.role||new URLSearchParams(location.hash.split('?')[1]||'').get('rol');
    location.hash=registrationHref(specialistForRole(role,el.dataset.specialty||''));
  }
  if(actionName==="privacy"){closeModal();location.hash="#/politica-de-privacidad";return;}
  if(actionName==="terms"){closeModal();location.hash="#/terminos-y-condiciones";return;}
  if (actionName === "contact")
    modal(
      `<h2 id="dialog-title">Hablemos del siguiente paso</h2><p>El canal de contacto comercial se configurará con los datos oficiales del equipo. Mientras revisas esta maqueta, puedes explorar los recorridos y guardar tus preferencias de demostración.</p><div class="dialog-actions">${btn("Tengo un terreno", "#/publicar/terreno")}${btn("Soy un aliado", "#/aliados", "outline")}</div>`,
    );
}
document.addEventListener("click", (event) => {
  const next=event.target.closest('a[href]');
  if(next&&isCatalogHash(location.hash)&&next.getAttribute('href')!==location.hash)captureSearchContext(state,location.hash,next.getAttribute('href'));

  const directoryShortcut=event.target.closest(".footer-directory a");
  if(directoryShortcut?.getAttribute("href")===location.hash){event.preventDefault();enterRoute();return;}
  if (event.target.closest(".skip-link")) {
    event.preventDefault();
    $("#contenido").focus();
    $("#contenido").scrollIntoView();
    return;
  }
  const control = event.target.closest("[data-action]");
  if (control) {
    if (control.tagName === "BUTTON") event.preventDefault();
    Promise.resolve(action(control.dataset.action, control, event)).catch(error=>toast(error.message));
  }
});
document.addEventListener('keydown',event=>{
  const tab=event.target.closest('[role="tab"][data-action="space-tab"]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();const tabs=$$('[data-action="space-tab"]'),i=tabs.indexOf(tab),next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(i+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].click();
});
document.addEventListener("change", async (event) => {
  const el = event.target;
  if(el.form?.dataset.form==='ally'&&el.name==='ally_role'){
    const field=el.form.querySelector('[data-technical-specialty]'),select=field.querySelector('select'),technical=el.value==='Técnicos';
    field.hidden=!technical;select.disabled=!technical;select.required=technical;select.value='';
  }
  if(el.form?.dataset.form==='featured-filters'&&el.name==='type'){
    const landType=el.form.querySelector('[name="landType"]');landType.disabled=el.value==='proyecto';if(landType.disabled)landType.value='';
  }
  if (el.name === "sector") {
    const sector = el.value;
    state.sectors = el.checked
      ? [...state.sectors, sector]
      : state.sectors.filter((x) => x !== sector);
    state.zone = [];
    state.query = "";
    state.mapSearchText = "";
    state.mapPlace = null;
    state.placeBounds = null;
    state.mapFitRevision++;
    if (!location.hash || location.hash === "#/" || location.hash.startsWith("#/alternativas-home/")) navigateCatalog("#/buscar");
    else {
      redrawResults();
      state.layers = true;
      redrawMap();
    }
  }
  if (el.closest('[data-form="submission"]') && el.type !== "file") {
    if (el.name === 'department_code') {
      const municipality=el.form.elements.municipality_code;
      municipality.innerHTML=municipalityOptions(el.value);
      municipality.disabled=!el.value;
      el.form.elements.neighborhood.value='';
      el.form.elements.neighborhood.disabled=true;
    }
    if (el.name === 'municipality_code') {
      el.form.elements.neighborhood.value='';
      el.form.elements.neighborhood.disabled=!el.value;
    }
    if(["relationship","broker_exclusivity"].includes(el.name))syncBrokerExclusivity(el.form);
    if(el.name.startsWith("ls_"))syncLandSituation(el.form);
    captureForm();
    if(['department_code','municipality_code'].includes(el.name)&&state.formKind==='terreno'){parcelEditor.query=[state.form.city,state.form.region].filter(Boolean).join(', ');const search=$('[data-parcel-search]');if(search)search.value=parcelEditor.query;}
    if(el.name==='demo_parcel_confirmed'&&emailEntry.isPreview())state.form.parcel_confirmed=el.checked;
    if(el.name.startsWith("ls_")&&$('[data-submission-summary]'))$('[data-submission-summary]').innerHTML=formSummary();
    if (
      [
        "negotiation",
        "compensation",
        "value_status",
        "price_method",
        "rate_method",
        "receive_currencies",
      ].includes(el.name)
    ) {
      saveDraft(true);
      render();
    } else saveDraft(true);
  }
  if (el.id === "file-input") {
    if(emailEntry.isPreview()){el.value='';toast("La carga de documentos requiere el acceso real del portal.");return;}
    captureForm();const key=state.form.client_id,files=[...el.files];
    if(state.files.length+files.length>20){toast("Puedes adjuntar hasta 20 documentos.");return;}
    const messages=[];el.disabled=true;
    for(const file of files) {
      if(file.size>10_000_000){state.fileMode='link';messages.push(file.name+" supera 10 MB. Agrega un enlace HTTPS.");continue;}
      try {const doc=await uploadDocument(file);if(state.form.client_id!==key)return;state.files=state.files.filter(f=>f.id||f.name!==doc.name);state.files.push(doc);saveDraft(true);}
      catch(e){messages.push(file.name+': '+e.message);}
    }
    if(state.form.client_id===key){render();$('#file-message').textContent=messages.join(' ')||'Archivos guardados privados. Revisa el resultado de interpretación.';}
  }

});
function updateMoneyField(el) {
  const result = formatAmountInput(
    el.value,
    el.selectionStart ?? el.value.length,
  );
  el.setCustomValidity(
    !result.valid
      ? "Ingresa un monto válido, con máximo dos decimales y 15 cifras enteras."
      : result.canonical && Number(result.canonical) < (el.name.startsWith("ls_")?0:1)
        ? "El valor solicitado debe ser al menos 1."
        : "",
  );
  if (result.valid) {
    el.value = result.formatted;
    el.setSelectionRange(result.caret, result.caret);
  }
  saveDraft(true);
  if ($("#conversion-preview"))
    $("#conversion-preview").innerHTML = conversionText();
}
document.addEventListener("beforeinput", (event) => {
  const el = event.target;
  if (!el.matches("[data-money]") || event.isComposing) return;
  const start = el.selectionStart,
    end = el.selectionEnd;
  if (start === null || end === null) return;
  if (event.inputType === "insertText" && event.data === ".") {
    event.preventDefault();
    if (
      el.value.slice(0, start).includes(",") ||
      el.value.slice(end).includes(",")
    )
      return;
    el.setRangeText(",", start, end, "end");
    updateMoneyField(el);
  } else if (
    start === end &&
    event.inputType === "deleteContentBackward" &&
    el.value[start - 1] === "."
  ) {
    el.setSelectionRange(Math.max(0, start - 2), start);
  } else if (
    start === end &&
    event.inputType === "deleteContentForward" &&
    el.value[start] === "."
  ) {
    el.setSelectionRange(start, start + 2);
  }
});
document.addEventListener("paste", (event) => {
  const el = event.target;
  if (!el.matches("[data-money]")) return;
  const pasted = event.clipboardData?.getData("text") || "";
  if (!pasted) return;
  const normalized = normalizePastedAmount(pasted);
  if (normalized === null) {
    event.preventDefault();
    toast("Usa un monto válido, por ejemplo 1.234.567,89.");
    return;
  }
  event.preventDefault();
  el.setRangeText(normalized, el.selectionStart, el.selectionEnd, "end");
  updateMoneyField(el);
});
document.addEventListener("focusout", (event) => {
  const el = event.target;
  if (!el.matches("[data-money]")) return;
  const amount = readAmount(el.value);
  if (amount.valid) el.value = formatAmount(amount.canonical);
  captureForm();
});
document.addEventListener("input", (event) => {
  if(event.target.closest('[data-form="submission"]')&&!event.target.matches('[data-money],input[type="file"]')){
    clearTimeout(draftSaveTimer);const status=$('[data-draft-status]');if(status)status.textContent="Guardando en este navegador…";draftSaveTimer=setTimeout(()=>{if($('[data-form="submission"]'))saveDraft(true);},350);
  }
  if (event.target.matches("[data-money]")) {
    if (!event.isComposing) updateMoneyField(event.target);
    return;
  }
  if (event.target.name === "mapQuery")
    state.mapSearchText = event.target.value;
  if (
    ["amount", "exchange_rate"].includes(event.target.name) &&
    $("#conversion-preview")
  ) {
    captureForm();
    $("#conversion-preview").innerHTML = conversionText();
  }
});
document.addEventListener("submit", async (event) => {
  const form = event.target;
  if (!form.dataset.form) return;
  event.preventDefault();
  const data = new FormData(form);
  const type = form.dataset.form;
  if (type === 'owner-reply'||type === 'publication-consent'||type === 'land-visibility') {
    const record=state.remoteRecord,button=form.querySelector('[type="submit"]'),output=form.querySelector('[data-owner-result]');
    if(!record||button.disabled)return;button.disabled=true;output.textContent='Guardando…';
    try{
      let payload={revision:record.revision||0},suffix=type==='land-visibility'?'visibility':type==='owner-reply'?'reply':'publication-consent';
      if(type==='land-visibility'){payload.visibility=String(data.get('visibility')||'');}
      else if(type==='publication-consent'){payload.authorized=!record.publicationConsent?.authorized;payload.includeNeighborhood=true;}
      else{
        payload.message=String(data.get('message')||'');payload.documentIds=[];
        const files=[...form.querySelector('[name="reply_files"]').files];
        if(record.files.length+files.length+(String(data.get('link_url')||'').trim()?1:0)>20)throw Error('El expediente admite hasta 20 documentos.');
        if(files.some(f=>f.size>10_000_000))throw Error('Un archivo supera 10 MB. Utiliza el enlace HTTPS para ese soporte.');
        for(const file of files){const doc=await uploadDocument(file);payload.documentIds.push(doc.id);}
        const url=String(data.get('link_url')||'').trim();if(url){const doc=await addDocumentLink(String(data.get('link_name')||'Soporte adicional'),url);payload.documentIds.push(doc.id);}
      }
      const result=await api('/api/records/'+record.id+'/'+suffix,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
      if(state.remoteRecord?.id===record.id){state.remoteRecord=result;render();toast(type==='land-visibility'?'Visibilidad actualizada.':type==='owner-reply'?'Respuesta recibida. El expediente vuelve a revisión.':payload.authorized?'Autorización guardada. El equipo podrá publicar el resumen.':'Autorización retirada. El resumen ya no está disponible en el catálogo.');}
    }catch(error){output.textContent=error.message;button.disabled=false;}
    return;
  }
  if(type==='hero-filters'){
    const min=String(data.get('minArea')||''),max=String(data.get('maxArea')||'');
    if([min,max].some(v=>v&&(!Number.isFinite(Number(v))||Number(v)<0))||(min&&max&&Number(min)>Number(max))){toast('Revisa el rango de áreas. La máxima debe ser mayor o igual a la mínima.');return;}
    const landType=['Urbano','Rural','Expansión urbana'].includes(data.get('land_type'))?data.get('land_type'):'';
    Object.assign(state,{searchDepartment:'',searchMunicipality:'',intendedUse:'',query:'',type:'terreno',landContent:'land-only',reactivationFilter:'',mode:String(data.get('mode')||''),maxPrice:'',min,max,directoryScope:landType?{city:'',department:'',landType}:null,zone:[],sectors:[],mapPlace:null,placeBounds:null,mapSearchText:'',view:'both',mapFitRevision:state.mapFitRevision+1});
    closeModal();navigateCatalog('#/buscar');return;
  }
  if(type==='featured-filters'){
    const opportunityType=['terreno','proyecto'].includes(data.get('type'))?data.get('type'):'';
    const landType=opportunityType!=='proyecto'&&['Urbano','Rural','Expansión urbana'].includes(data.get('landType'))?String(data.get('landType')):'';
    const areaBand=areaBands.find(([id])=>id===data.get('areaBand'));
    const min=areaBand?areaBand[2]:data.get('areaBand')==='custom'?state.min:'';
    const max=areaBand?areaBand[3]:data.get('areaBand')==='custom'?state.max:'';
    const maxPrice=priceLimits.some(([v])=>v===data.get('maxPrice'))?String(data.get('maxPrice')):'';
    Object.assign(state,{searchDepartment:'',searchMunicipality:'',intendedUse:'',query:String(data.get('query')||'').trim().slice(0,160),type:opportunityType|| (landType?'terreno':''),landContent:opportunityType==='terreno'&&['land-only','land-project'].includes(data.get('landContent'))?String(data.get('landContent')):'',reactivationFilter:opportunityType==='proyecto'?'exclude':'',mode:'',min,max,maxPrice,directoryScope:landType?{city:'',department:'',landType}:null,zone:[],sectors:[],mapPlace:null,placeBounds:null,mapSearchText:'',view:'list',mapFitRevision:state.mapFitRevision+1});
    navigateCatalog(state.type==='terreno'?'#/buscar?contenido='+(terrainSearchQuery(state.landContent)||'todos'):'#/oportunidades');return;
  }
  if (type === "filters") {
    if (!captureSearchFilters()) return;
    if(event.submitter?.hasAttribute('data-catalog-draw')){
      placeRequest?.abort();placeRequest=null;
      Object.assign(state,drawingTerritory(state),{view:'both',drawing:true,layers:false,drawPoints:[],mapFitRevision:state.mapFitRevision+1});
      render();captureSearchContext(state,location.hash);$('.search-map')?.scrollIntoView({block:'start',behavior:'smooth'});return;
    }
    if (location.hash === "#/" || !location.hash)
      navigateCatalog("#/oportunidades");
    else {render();$('[data-results-heading]')?.focus({preventScroll:true});if(state.view!=='list'&&state.query&&!state.searchDepartment)searchPlace(state.query);}
  }
  if (type === "map-search")
    searchPlace(String(data.get("mapQuery") || "").trim());
  if (type === "save-search") {
    const search = {
      name: String(data.get("name")).trim(),
      searchDepartment:state.searchDepartment,searchMunicipality:state.searchMunicipality,intendedUse:state.intendedUse,
      directoryScope: state.directoryScope,
      query: state.query,
      locationQuery: state.mapPlace ? state.query : "",
      type: state.type,
      landContent:state.landContent,
      reactivationFilter: state.reactivationFilter||'',
      mode: state.mode,
      maxPrice: state.maxPrice,
      min: state.min,
      max: state.max,
      zone: state.zone,
      geometry: state.zone.length ? toPolygon(state.zone) : null,
      coordinateSystem: "EPSG:4326",
      sectors: state.sectors,
      createdAt: new Date().toISOString(),
    };
    if (!search.name) return;
    saved.searches.push(search);
    if (persist()) {
      closeModal();
      toast("Búsqueda guardada. Puedes retomarla desde Mi espacio.");
    }
  }
  if (type === "submission") {
    if(state.submitting)return;
    captureForm();
    if(state.formKind==='terreno'){try{normalizeBrokerExclusivity(state.form.relationship,state.form.broker_exclusivity);}catch(error){state.formStep=1;render();showFormIssue(error.message);return;}}
    const selectedLocation=resolveLocation(state.form);
    if (!selectedLocation) {state.formStep=1;render();showFormIssue("Selecciona un departamento y un municipio válido para continuar.");return;}
    Object.assign(state.form,selectedLocation);
    if(state.formKind==='terreno'&&!['land-only','land-project'].includes(state.form.land_content)){state.formStep=1;render();showFormIssue('Indica si ofreces solo terreno o terreno con proyecto antes de continuar.');return;}
    if(state.formKind==='terreno'&&state.form.project_land_confirmed!==true){state.formStep=1;render();showFormIssue(landScopeExclusion+' Confirma el destino del terreno antes de continuar.');return;}
    if(state.formKind==='terreno'&&[1,4].includes(state.formStep)){
      try{if(terrainLocationMode(state.form)==='pin')normalizeLocationPin({coordinates:state.form.location_pin,confirmed:state.form.location_pin_confirmed});else if(!state.form.parcel_geometry||!state.form.parcel_confirmed)throw Error('Añade y confirma el polígono, o cambia a un pin aproximado.');}
      catch(error){if(state.formStep!==1){state.formStep=1;render();}showFormIssue(error.message);return;}
    }
    if(state.formKind==='terreno'&&state.formStep>=2){try{normalizeNegotiationForm(state.form);}catch(error){state.formStep=2;render();showFormIssue(error.message);return;}}
    if (state.formKind === "terreno" && state.formStep >= 2 && valueStatus(state.form)==='known') {
      const names = [
        "amount",
        ...(["dual", "mixed"].includes(state.form.price_method)
          ? ["amount_usd"]
          : []),
      ];
      if (
        names.some(
          (name) =>
            state.form[name] !== "" &&
            state.form[name] != null &&
            (!Number.isFinite(Number(state.form[name])) ||
              Number(state.form[name]) < 1),
        )
      ) {
        showFormIssue(
          "Los valores solicitados deben ser al menos 1. Puedes dejarlos pendientes si todavía no los defines.",
        );
        return;
      }
    }
    if (
      state.form.cash_percent !== "" &&
      state.form.cash_percent !== undefined &&
      (Number(state.form.cash_percent) < 0 ||
        Number(state.form.cash_percent) > 100)
    ) {
      showFormIssue("El porcentaje en dinero debe estar entre 0 y 100.");
      return;
    }
    if (
      state.form.desired_min &&
      state.form.desired_max &&
      Number(state.form.desired_min) > Number(state.form.desired_max)
    ) {
      showFormIssue("El área máxima debe ser mayor o igual al área mínima.");
      return;
    }
    if(state.formKind==='terreno'&&state.formStep>=3){
      try{normalizeLandSituation(state.form.land_situation,{documentIds:state.files.map(f=>f.id)});}
      catch(error){state.formStep=3;render();showFormIssue(error.message);return;}
    }
    if (state.formStep < (state.formKind==='terreno'?4:3)) {
      state.formStep++;
      saveDraft(true);
      render();
      focusFormStep();
    } else {
      if(emailEntry.isPreview()){if(!saveDraft(true))return;const previous=structuredClone(saved);try{const record=completeLocalRegistration(saved,saved.draft);if(!persist()){saved=previous;return;}state.spaceTab='submissions';location.hash='#/confirmacion/'+record.id;}catch(error){saved=previous;showFormIssue(error.message);}return;}
      if(state.files.some(f=>!f.id)){showFormIssue("Vuelve a seleccionar los archivos anteriores para subirlos, o retira sus referencias locales.");return;}
      state.submitting=true;const submit=form.querySelector('[type="submit"]');submit.disabled=true;submit.textContent='Guardando expediente privado…';
      try {
        const record=await saveRecord({id:state.form.client_id,kind:state.formKind,form:state.formKind==='terreno'?normalizeNegotiationForm(state.form):state.form,locationMode:terrainLocationMode(state.form),locationPin:terrainLocationMode(state.form)==='pin'?{coordinates:state.form.location_pin,confirmed:!!state.form.location_pin_confirmed}:null,parcel:terrainLocationMode(state.form)==='polygon'?{geometry:state.form.parcel_geometry,source:state.form.parcel_source,confirmed:!!state.form.parcel_confirmed}:null,documentIds:state.files.map(f=>f.id)});
        state.remoteRecord=record;saved.drafts=localDrafts(saved).filter(d=>d.form.client_id!==record.id);saved.draft=saved.drafts.at(-1)||null;persist();state.remoteLoaded=false;
        location.hash='#/mi-expediente/'+record.id;toast('Expediente guardado privado y pendiente de revisión.');
      }catch(e){showFormIssue(e.message);saveDraft(true);submit.disabled=false;submit.textContent='Enviar a revisión privada';}
      finally{state.submitting=false;}
    }
  }
  if(type==='need-proposal'){
    const output=form.querySelector('[data-proposal-result]');
    try{
      const proposal=normalizeNeedProposal({...Object.fromEntries(data),demoAcknowledged:data.get('demoAcknowledged')==='on'});
      if(saved.interests.some(i=>i.reference===proposal.reference))throw Error('Ya guardaste una participación para esta necesidad. Puedes consultarla en Mi espacio.');
      const entry={...proposal,id:'CON-DEMO-'+String(saved.interests.length+1).padStart(4,'0'),createdAt:new Date().toISOString()};
      saved.interests.push(entry);
      if(!persist()){saved.interests.pop();throw Error('No se pudo guardar en este navegador. Libera espacio e inténtalo de nuevo.');}
      state.spaceTab='interests';
      modal(`<h2 id="dialog-title">Participación de ejemplo guardada</h2><p>${escape(proposal.title)}</p><div class="info-box">Quedó en este navegador. No se envió una postulación ni se contactó a terceros.</div><a class="button primary" href="#/mi-espacio">Ver en Mi espacio →</a>`);
      $('#dialog-content a')?.focus();
    }catch(error){output.textContent=error.message;}
    return;
  }
  if (type === "interest") {
    const ref = String(data.get("reference"));
    if (saved.interests.some((i) => i.reference === ref)) {
      toast("Ya guardaste un interés para este ejemplo.");
      closeModal();
      return;
    }
    saved.interests.push({
      id: "CON-DEMO-" + String(saved.interests.length + 1).padStart(4, "0"),
      reference: ref,
      title: String(data.get("title")),
      role: String(data.get("role")),
      message: String(data.get("message") || "").slice(0, 1000),
      createdAt: new Date().toISOString(),
    });
    if (persist()) {
      closeModal();
      toast("Interés guardado en Mi espacio. No se enviaron mensajes.");
    }
  }
  if (type === "ally") {
    const id =
      "ALI-DEMO-" + String(saved.submissions.length + 1).padStart(4, "0");
    saved.submissions.push({
      id,
      kind: "aliado",
      form: Object.fromEntries(data),
      files: [],
      createdAt: new Date().toISOString(),
    });
    if (persist()) {
      closeModal();
      state.spaceTab = "submissions";
      location.hash = "#/mi-espacio";
      toast("Perfil de ejemplo guardado en este navegador.");
    }
  }
});
$("#dialog").addEventListener("click", (event) => {
  if (event.target === $("#dialog")) {
    const r = $("#dialog").getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      closeModal();
  }
});
window.addEventListener('pagehide',()=>{if($('[data-form="submission"]'))saveDraft(true);if(isCatalogHash(location.hash))captureSearchContext(state,location.hash);});
for(const name of ['wheel','touchstart'])window.addEventListener(name,()=>{pendingResultsContext=null;},{passive:true});
window.addEventListener("hashchange", enterRoute);
enterRoute();
loadSession();
