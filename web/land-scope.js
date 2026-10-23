export const landScopeTitle='Terrenos para desarrollar proyectos';
export const landScopeExclusion='No recibimos lotes individuales destinados a construir una sola vivienda.';
export const landScopeConfirmation='Presento este terreno para evaluar el desarrollo de un proyecto; no lo ofrezco como lote individual para una sola vivienda.';
export function landScopeNotice(){
  return `<aside class="land-scope-notice" aria-label="Qué terrenos recibimos"><strong>${landScopeTitle}</strong><p>Pueden ser proyectos residenciales de varias viviendas, comerciales, industriales, turísticos u otros desarrollos. ${landScopeExclusion}</p></aside>`;
}
