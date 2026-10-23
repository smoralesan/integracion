# Maqueta web navegable — Integración Inmobiliaria

Home aprobado y recorridos en HTML, CSS y JavaScript, con un Worker ESM y almacenamiento privado R2. La compilación integra los recursos de `web/` y el parser geográfico en `dist/server/index.js`. La identidad del sitio privado en Sites se conserva en `.openai/hosting.json`.

## Recorridos disponibles

- Home con los tres accesos al mismo nivel: Busco tierra, Tengo un terreno y Tengo un proyecto.
- Catálogo, ficha, filtros por municipio, tipo, modalidad y área, estados sin resultados y favoritos.
- Mapbox en home, buscador y ficha: calles, satélite, búsqueda de ciudades, marcadores de ejemplo y polígonos WGS84 guardados localmente como GeoJSON. Los filtros de sectores siguen siendo ejemplos, no límites oficiales.
- Registro de terreno en cuatro pasos: información básica, negociación, situación del terreno y soportes/resumen.
- Venta o aporte, precio base COP/USD, dos precios alternativos o componentes en ambas monedas y conversión ilustrativa. No consulta una TRM vigente.
- Tutorial de aporte con dinero posterior al punto de equilibrio, inmuebles del desarrollo, combinación u orientación; aplica la selección al formulario.
- Proyecto con o sin terreno y necesidades según su situación.
- Necesidades abiertas, especialidades de aliados y proyectos para reactivación.
- Mi espacio con expedientes privados en el servidor y favoritos, búsquedas e intereses locales de demostración.
- Menú móvil, diálogos, etiquetas de formulario y alternativa por sectores para quien no dibuje.

## Qué se guarda

Los nuevos terrenos y proyectos se guardan como expedientes privados en R2, bajo un prefijo derivado de la identidad estable que entrega Sites. Cada expediente y documento tiene un UUID v4; la referencia legible TER-/PRO- se muestra aparte. Las API exigen identidad y verifican la propiedad en el servidor. Las mutaciones exigen el mismo origen. El formulario no publica automáticamente ni envía correos.

La clave `ii-web-demo-v1` de localStorage conserva favoritos, búsquedas, borradores y la actividad anterior de demostración. Los metadatos de adjuntos pueden estar en el borrador; sus originales están en R2. Los registros anteriores que solo guardaban nombres de archivos exigen volver a seleccionar los originales.

Cada carga admite hasta 10.000.000 bytes, controlado también en el servidor. Los enlaces HTTPS se guardan como referencias, sin descargar su contenido ni modificar los permisos del proveedor. Cada original y referencia vence 60 días después de completarse la carga; consultar o asociar un archivo no renueva su vencimiento. El servidor bloquea el acceso al llegar esa fecha. Una limpieza física por lotes recorre objetos vencidos cuando hay actividad de API; no hay un cron configurado que garantice la eliminación física exactamente al minuto 60 días. La geometría elegida y los datos del expediente se conservan como datos del registro, separados de los originales temporales.

La lectura de KML, KMZ y GeoJSON admite Polygon y MultiPolygon en WGS84, dentro del ámbito de coordenadas de Colombia; cierra anillos, conserva vacíos, rechaza cruces, duplicados y componentes superpuestos. Hasta 2 MB de texto geográfico descomprimido, 500 vértices por anillo, 4.000 vértices en total y 20 candidatos. Se elige explícitamente un candidato y se confirma su perímetro; el área es aproximada. Un KML con varios polígonos no se fusiona automáticamente. XML con entidades/enlaces externos y rutas inseguras de KMZ se rechazan. Un archivo que no puede interpretarse queda como soporte pendiente de revisión, no como perímetro confirmado.

PDF, JPG, PNG, ZIP, DWG y DXF se guardan para revisión humana. No hay OCR ni análisis automático de documentos, certificación de titularidad, consulta catastral ni viabilidad urbanística. El titular consulta su expediente en Mi espacio. La bandeja del equipo permite consultar los expedientes enviados y sus documentos vinculados según el rol configurado en el servidor. El sitio conserva su audiencia privada.

Las fichas iniciales, imágenes y precios de demostración se identifican como ejemplos. Los nuevos resúmenes autorizados y publicados por administración aparecen en una sección separada del catálogo, sin documentos, contacto, descripción privada ni perímetro exacto. No se ejecutan transacciones, contratos ni correos. El módulo de Supabase/Brevo en la carpeta superior sigue separado y pendiente de conectar a los eventos reales. Las solicitudes de orientación y los intereses de la maqueta no contactan a terceros.

## Vista local

Desde esta carpeta:

```sh
npm ci
npm run build
npm run dev
```

Abrir `http://127.0.0.1:4174/`. El servidor se limita a loopback e introduce una identidad local de prueba; el adaptador guarda datos en `.local-data/`, ignorado por Git. Esta identidad no forma parte del Worker publicado. Las rutas de página usan fragmentos; `/api/` se atiende en el servidor.

## Verificación

Se probaron en el navegador los flujos de terreno y proyecto sin tierra, tutorial y selección aplicada, precios alternativos COP/USD, conversión ilustrativa, admisión de 10.000.000 bytes y rechazo de 10.000.001 bytes, enlace HTTPS, confirmación local, favoritos, sectores y búsquedas guardadas. Se probó la carga de Mapbox, el cambio a satélite, la búsqueda de Cartagena, el dibujo geográfico, el guardado y la recuperación tras recargar, y el mapa de la ficha. Se revisaron escritorio y móvil (390 px), sin desbordamiento horizontal en home y catálogo. Capturas y acta de revisión en `../output/website-qa/`.

Las pruebas automatizadas cubren geometría, formatos, límites, expiración, propiedad del expediente, descarga privada, idempotencia y limpieza. La vista local usa un adaptador R2; la identidad y el binding R2 alojados requieren verificación en la publicación. TRM, notificaciones y OCR siguen pendientes.

## Activos

Identidad provisional en SVG/CSS y cartografía provista por Mapbox. Las fotografías son referencias descargadas de Unsplash, no fotos de los inmuebles del catálogo:

- `terreno-rural.jpg`: https://images.unsplash.com/photo-1500382017468-9049fed747ef
- `desarrollo-urbano.jpg`: https://images.unsplash.com/photo-1486406146926-c627a92ad1ab
- `proyecto-construccion.jpg`: https://images.unsplash.com/photo-1541888946425-d81bb19240f5

Antes de usar datos reales, sustituir los ejemplos por oportunidades y fotografías autorizadas.

## Ajuste del hero

Se simplificó la primera sección para acercarla a la referencia: título uniforme sin salto forzado, eliminación del subtítulo decorativo, botones de igual ancho, menos altura y un marco de mapa más discreto. Revisado en escritorio y móvil de 390 px, sin desbordamiento horizontal y conservando las tres rutas principales.

## Integración de Mapbox

Mapbox GL JS 3.33.0, cargado desde el CDN oficial y con token público `pk.*` en `web/mapbox-config.js`. Este token es de uso en navegador; no se deben incorporar claves secretas `sk.*`. No se incluyó ninguna clave de servicio del backend.

El mapa usa Streets v12 y Satellite Streets v12, con atribución y controles de Mapbox. Se conserva una instancia al actualizar filtros, selección o puntos del dibujo, en lugar de crear otro mapa por cada interacción. Se libera al abandonar las vistas con mapa.

Los puntos del catálogo tienen posiciones ilustrativas en sus municipios. El proyecto sin terreno solo tiene una referencia municipal. Ni los marcadores ni sus coordenadas representan predios reales. No se dibuja un perímetro de terreno ficticio. La zona dibujada es la búsqueda del usuario, separada de la geometría de un activo.

Las nuevas zonas se validan contra cruces, puntos duplicados y coordenadas inválidas. Se guardan con `coordinateSystem: "EPSG:4326"` y geometría GeoJSON Polygon cerrada. Los dibujos anteriores en píxeles no se reinterpretan como coordenadas; al abrirlos se conservan los filtros y se pide dibujar la zona nuevamente.

La búsqueda usa Geocoding v6, limitada a Colombia, y se solicita al pulsar Buscar. El usuario selecciona el resultado cuando hay nombres repetidos. Los resultados temporales del proveedor no se guardan en localStorage; se conserva únicamente el texto ingresado y, si existe, el polígono dibujado por el usuario. La aplicación no solicita geolocalización del dispositivo.

Si el proveedor no responde, se informa del fallo y se mantiene la lista y los filtros. El servicio de cartografía no sustituye la base de datos ni los permisos de los expedientes.

Pruebas de geometría y encuadre: `node --test tests/*.test.mjs`. Fuente técnica: [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/example/simple-map/), [polígonos GeoJSON](https://docs.mapbox.com/mapbox-gl-js/example/geojson-polygon/), [Geocoding](https://docs.mapbox.com/api/search/geocoding/) y [mapas estáticos](https://docs.mapbox.com/api/maps/static-images/).

## Corrección de búsqueda y mapa

Cambiar de ubicación elimina la zona y los sectores anteriores para evitar restricciones ocultas. El encuadre usa `properties.bbox` de Geocoding v6. El dibujo permite deshacer y cancelar sin perder una zona previa; al finalizar desde el home abre sus resultados. Los filtros se validan antes de modificar los criterios activos.

Al recuperar una búsqueda de ubicación se vuelve a consultar el texto original y se pide seleccionar el resultado; no se persisten los resultados temporales de Mapbox. Los textos de interacción del mapa están en español. Se muestra una opción de reintento si la carga no termina en 20 segundos y se cancela una consulta pendiente al cambiar de página.

## Corrección de heroes internos

Los iconos generados incluyen ancho y alto intrínsecos para evitar que un SVG sin dimensiones expanda un contenedor flexible. La flecha de la navegación mide 14 × 14 px. Las rutas largas se recortan visualmente en la navegación sin modificar el título completo. En móvil, las acciones del encabezado se ubican debajo del texto.

Se revisaron los diez encabezados internos a 390 y 1280 px: ninguno presenta desbordamiento horizontal ni iconos de navegación sobredimensionados. Los recursos de entrada incluyen una versión en la URL para cargar los estilos y el módulo actualizados.

## Prioridad comercial: vender el terreno

El home presenta primero “Vender mi terreno”, como acción principal frente a las rutas de búsqueda y proyectos. La cabecera, el menú móvil y la invitación final llevan directamente al registro del terreno. Los registros nuevos comienzan con Venta; un borrador que ya eligió aporte u otra alternativa conserva su selección.

Verificado en navegador: acceso desde el home, Venta marcada al llegar al paso 2, cambio a aporte y recuperación de esa elección al volver al formulario. La identidad de MMS permanece discreta junto al copyright.

## Montos COP y USD

Los campos de valor solicitado y sus variantes de precio alternativo/mixto agrupan los miles con puntos mientras se escribe. La coma separa hasta dos decimales; al salir del campo se completan dos cifras decimales. El resumen y las equivalencias conservan los centavos.

Los borradores conservan cadenas numéricas sin agrupadores y con punto decimal; las conversiones no interpretan los puntos de miles como decimales. Se admiten importes pegados con formato colombiano o estadounidense. El cursor se mantiene al editar y los separadores de miles no bloquean el borrado. Pruebas específicas: `node --test tests/money-input.test.mjs`.

## Publicación con backend

`.openai/hosting.json` conserva el proyecto existente y declara `r2: "BUCKET"`; Sites provisiona el recurso. No se necesitan claves R2 en el navegador. `node scripts/build.mjs` genera un Worker ESM con recursos integrados y `node scripts/check-artifact.mjs` comprueba los recursos y la protección inicial de la API. Publicar mediante el flujo de Sites; no servir `web/` directamente porque requiere el módulo geográfico compilado y las rutas privadas.

Los documentos se sirven como descarga con `nosniff` y sin caché; no se renderiza HTML de adjuntos. Los datos de los expedientes se filtran en el servidor. El módulo de notificaciones Supabase/Brevo de la carpeta superior permanece separado y desactivado.


## Bandeja del equipo y seguimiento

Ruta `#/equipo`, con enlaces desde Mi espacio y el menú para usuarios autorizados. El servidor consulta `II_TEAM_ROLES`, un objeto JSON de correos normalizados y roles `admin` o `reviewer`, guardado como secreto de Sites. No se confía en roles ni prefijos suministrados por el navegador. Al configurar esta versión se habilita administración para el propietario actual del sitio; no se invita a otras cuentas ni se modifica la audiencia privada. Para incorporar una persona, el propietario deberá identificarla, autorizar el acceso al sitio y configurar el rol correspondiente. La asignación de responsable por nombre solo organiza el seguimiento; no concede permisos.

Estados: `received` → `in_review` → `needs_information` / `approved` → `published`. `pending_review` anterior se interpreta como `received` sin migrar sus objetos. Revisión puede iniciar y pedir información; administración puede además aprobar, publicar y retirar una publicación a aprobado. Pedir información y retirar una publicación requieren explicación compartida. El propietario responde con texto, archivos nuevos o enlaces; sus archivos mantienen vencimientos independientes y la respuesta vuelve el expediente a revisión. No se alteran sus datos originales ni se certifica titularidad/viabilidad.

Cada cambio registra fecha, estado, actor y mensaje. Las notas internas se excluyen de las respuestas de API del propietario. Se exige versión vigente y una escritura condicional R2 por ETag: dos gestiones concurrentes no se sobrescriben. Las notas y el historial se actualizan juntos en el mismo objeto. Los documentos del equipo solo se consultan a través de un expediente vinculado y respetan el vencimiento original.

Publicar exige aprobación y autorización explícita del propietario del resumen mostrado. El servidor proyecta únicamente título, municipio, departamento, tipo, área declarada, modalidad y precios; reserva contacto, descripción, documentos, coordenadas y geometría. La autorización no publica sola. La revocación del titular oculta inmediatamente la ficha; las lecturas del catálogo comprueban el estado y consentimiento vigentes en el expediente, aunque exista un índice antiguo. La publicación en catálogo no modifica la audiencia general del sitio. Los datos originales siguen privados.

La bandeja pagina por lotes; los contadores y filtros se aplican a los expedientes cargados y se identifican así en la interfaz. No se activan Brevo, OCR ni una limpieza programada con este cambio.


## Alternativas del home

`#/alternativas-home` permite comparar tres composiciones: comercial con fotografía, mapa amplio y editorial. Cada propuesta es navegable, conserva los accesos a terreno/búsqueda/proyecto y usa los recorridos existentes. `#/` sigue siendo el home vigente. No se agrega una acción para reemplazarlo desde el comparador. Las fotografías y fichas ilustrativas están identificadas. La variante de mapa usa la integración existente y envía al buscador al seleccionar una ubicación o finalizar una zona. La navegación de comparación permite regresar al home actual.

### Alternativa solo del hero

`#/alternativas-home/hero` muestra una propuesta de cabecera con mapa y tres accesos. Reutiliza todas las secciones inferiores del home actual, que sigue en `#/`.

### Navegación principal

El megamenú comparte sus destinos entre escritorio y móvil (`web/header-nav.js`). Los grupos Terrenos, Proyectos y Aliados se abren por clic o teclado. Escape devuelve el foco al control; la navegación y el clic exterior cierran los paneles. En móvil, el botón de menú presenta los mismos grupos como desplegables.

### Subfooter de terrenos

Incluye 16 ciudades, los 32 departamentos y las clases de lote del formulario. Los enlaces `#/oportunidades?tipo=terreno&ciudad=…`, `&departamento=…` y `&lote=urbano|rural|expansion` filtran las fichas ilustrativas y los resúmenes publicados cargados, con categoría visible y opción de limpiar. Los departamentos se comparan por nombre exacto. La clasificación se toma de datos declarados; no se deduce del uso deseado.

### Hero principal basado en referencia visual

`web/home-hero.js` y `web/home-hero.css` componen el hero principal: título con énfasis azul, tres accesos al mismo nivel, trayectoria declarada del equipo y mapa interactivo. Los controles del mapa abren filtros de tipo de lote, área y modalidad; la aplicación lleva al catálogo de búsqueda. La ficha ampliada del mapa conserva la etiqueta de ejemplo y usa las cifras del registro ilustrativo. No se agregan contadores de usuarios o publicaciones sin soporte.

### Secciones de conexión del home

`web/home-sections.js` y su hoja de estilos reúnen la franja para definir búsquedas, la tabla ilustrativa de necesidades, las ocho especialidades, el proceso, las preguntas frecuentes y el cierre de acciones. La tabla usa los tres primeros registros de `needs`; sus accesos mantienen el formulario de interés existente. Los textos de búsqueda describen el guardado local disponible y no anuncian alertas automáticas.

### Oportunidades destacadas

`web/featured-opportunities.js` presenta la selección ilustrativa del home con su barra de filtros, favoritos y fichas. La búsqueda admite palabra clave, tipo de oportunidad, clase de lote, área y un máximo de precio en COP. `web/opportunity-filters.js` aplica los criterios comunes a ejemplos y resúmenes cargados: el precio máximo excluye precios desconocidos, USD y pagos mixtos, sin hacer conversiones implícitas. Las búsquedas guardadas conservan ese máximo. Las clases de lote son declaradas, sin inferir usos permitidos del suelo.

### Ubicación DIVIPOLA

La ubicación de terrenos y proyectos usa Departamento → Municipio → Barrio opcional. El catálogo se extrajo del archivo DIVIPOLA suministrado el 19 de octubre de 2026: 33 unidades departamentales (incluida Bogotá D. C.) y 1.122 registros territoriales, con sus tipos originales (municipio, isla o área no municipalizada). Los códigos de dos y cinco dígitos se conservan como texto. El archivo generado incluye nombre y SHA-256 de la fuente; no se altera ni se publica el libro original.

`web/colombia-locations.js` comparte la validación entre el navegador y el servidor. El cambio de departamento limpia el municipio y el barrio. Los borradores anteriores con una pareja de nombres reconocible se convierten a códigos; una ubicación desconocida exige selección antes de continuar. El servidor determina los nombres a partir de los códigos y rechaza parejas incompatibles. El barrio se conserva en el expediente privado y queda fuera del resumen autorizado para publicación. El catálogo administrativo no verifica que el polígono esté dentro del municipio ni reemplaza la revisión geográfica.

Para actualizar la fuente, ejecutar `scripts/import-divipola.py` con la ruta del nuevo libro usando Python con openpyxl disponible, revisar los cambios y ejecutar `npm test`, el build y la comprobación del artefacto antes de publicar.

### Avatares y participación en proyectos

`#/mi-perfil`, accesible desde Mi espacio, permite configurar una identidad de persona o empresa por cuenta. La imagen se convierte en el navegador a PNG de 128 × 128 px y se muestra circular. Las fotos se recortan al centro y los logos se encajan con margen para preservar sus proporciones. Se admiten originales PNG/JPG/WebP hasta 10 MB y 32 MP. El servidor valida el PNG y sus dimensiones. Sin imagen se muestran iniciales.

El perfil se guarda por cuenta en R2, con ID UUID estable y actualización condicional por revisión. La imagen es parte del perfil persistente, separada de los documentos temporales de 60 días. Reemplazar o retirar la foto elimina el objeto anterior. Los originales seleccionados para el avatar no se envían ni se conservan en el servidor.

Al activar el uso del perfil, crear un proyecto, responder al equipo o enviar un mensaje compartido desde revisión vincula el perfil al expediente. Las notas internas por sí solas no agregan participantes. El titular también puede vincular su perfil a proyectos anteriores. La lista deduplica por ID, conserva el nombre/tipo/especialidad de la interacción y usa la foto vigente. El grupo muestra cuatro avatares de 48 px (40 en móvil), superpuestos, un contador +N y un desplegable accesible con todos los perfiles. No crea membresías ni concede acceso adicional: hoy los flujos reales son titular y equipo autorizado. La vinculación de aliados externos sigue pendiente de un flujo propio.

Las imágenes y participantes del expediente solo están disponibles para su titular y el equipo autorizado mediante rutas protegidas. Ni los perfiles ni los participantes se incorporan al resumen público del catálogo. Los ejemplos visuales de proyectos y del editor están identificados como ilustrativos.

La categoría de aliados Técnicos agrupa Ingenieros estructurales, Ingenieros eléctricos, Diseñadores de interiores, Interventores y Diseñadores hidráulicos. La categoría aparece en el home, el megamenú y la página de aliados. Cada especialidad puede preseleccionarse al abrir el registro persistente de aliado; la selección técnica es obligatoria cuando se elige Técnicos. El perfil persistente también guarda categoría y especialidad, validadas con la misma taxonomía en el servidor.

### Alcance de los terrenos recibidos

El portal se enfoca en terrenos para evaluar desarrollos inmobiliarios y no recibe lotes individuales destinados a construir una sola vivienda. El mensaje se muestra en el home, el catálogo, las preguntas frecuentes y el inicio del formulario de terrenos. El registro exige confirmar esta declaración (`project_land_confirmed: true`), que también valida el backend. Los borradores anteriores vuelven al primer paso para confirmarla. No se impone un área mínima ni se infiere capacidad urbanística: un terreno pequeño puede servir para varias unidades y todo desarrollo requiere evaluación. Los expedientes anteriores se mantienen consultables.

### Hero original con selector deslizable de venta y compra

El home `#/` conserva texto a la izquierda y mapa Mapbox a la derecha. Un selector deslizable nativo (rango 0–1) permite alternar Vendo terreno y Compro terreno, mediante arrastre, clic sobre la pista o flechas del teclado. Al cambiarlo se actualizan el título, la descripción y la acción resaltada. El texto cambia solo por decisión del visitante, sin temporizadores ni rotación automática.

El selector mantiene las búsquedas escritas y la instancia del mapa. Las dos versiones comparten una celda de altura estable y la preferencia de movimiento reducido desactiva sus transiciones. El enlace de la propuesta dividida anterior redirige al home actual.

Los textos del megamenú describen acciones concretas: vender o buscar terrenos para desarrollar, presentar proyectos y consultar especialidades de aliados. El aporte se explica como una alternativa por evaluar; la estructuración corresponde a los especialistas. Se conservan los destinos, los permisos y el tamaño del menú principal.

### Landings por especialidad

El índice `#/aliados` enlaza veinte landings: nueve categorías y once especialidades técnicas, en `#/aliados/<slug>`. Los enlaces anteriores con `?rol=` siguen abriendo la landing correspondiente. Cada página tiene propuesta, ámbitos de servicio, preparación del perfil, proceso y preguntas frecuentes propios.

Los botones llevan a `#/registro/aliado/<slug>`, que reutiliza el editor y la API de perfil existentes. Categoría y especialidad se precargan desde la taxonomía permitida; nada se guarda hasta pulsar Guardar perfil. Se conserva un perfil por cuenta y los demás campos del perfil existente. El registro genérico está en `#/registro/aliado`. No crea un directorio público, verificación profesional, membresía en expedientes ni envíos de correo.

Las rutas directas `/aliados`, `/aliados/<slug>`, `/registro/aliado` y `/registro/aliado/<slug>` también funcionan: el Worker redirige a su equivalente con `#/`, conserva los parámetros de búsqueda y acepta barras finales. Solo se reconocen especialidades existentes; las rutas desconocidas conservan su 404.

### Situación privada del terreno y asesoría premium

El registro de terrenos tiene cuatro pasos: información, negociación, situación del terreno y soportes/resumen. Los proyectos mantienen tres. Se declara el estado de predial, valorización, administración, servicios y otras obligaciones, con opciones de al día, saldo pendiente, acuerdo, desconocido y no aplica. Fechas, montos COP, entidad y propuesta de resolución son opcionales y condicionales. Se recogen titularidad/autorización, ocupación/entrega e hipotecas u otras situaciones jurídicas conocidas.

En soportes se pueden relacionar documentos o enlaces del propio expediente con las obligaciones. El servidor valida estados, fechas, montos y referencias y asigna la fecha de declaración. Se descartan saldos que dejan de aplicar y marcas de verificación suministradas por el cliente. Tener deuda o desconocer el estado no impide el envío. El titular y el equipo ven las declaraciones y los soportes vinculados por separado. Ningún dato se incluye en la proyección pública del catálogo. Los expedientes anteriores sin esta sección siguen accesibles.

En negociación se puede solicitar asesoría premium para definir un valor base según posible desarrollo, condiciones del predio y referencias actuales de mercado. Es una preferencia privada que recibe el equipo; permite enviar sin precio. No contrata ni cobra, no activa emails, y el alcance y los honorarios deben acordarse antes de comenzar.

Al elegir Intermediario / broker en un terreno, se exige declarar si tiene exclusividad. Responder No muestra que otros brokers podrían publicar el mismo inmueble. La respuesta se guarda en el expediente privado, aparece para titular/equipo y se excluye del resumen público. Cambiar a otra relación elimina el dato y los borradores de intermediarios sin respuesta vuelven al primer paso. No acredita un mandato ni activa bloqueo de publicaciones duplicadas.

Técnicos incluye también las landings `/aliados/interventores` y `/aliados/disenadores-hidraulicos` (con alias directos y con `#/`), con registro preseleccionado y validación en el perfil persistente.

### Red profesional y solicitudes de servicio

Técnicos tiene once especialidades; las nuevas son Topógrafos, Geotecnistas, Consultores ambientales, Diseñadores viales y de urbanismo, Especialistas en presupuestos y programación y Coordinadores BIM. Cada una tiene landing y registro. Los perfiles mantienen una categoría y especialidad principal compatibles con versiones anteriores, y admiten especialidades técnicas adicionales. Se guardan servicios, experiencia, años, tipologías, disponibilidad, hasta 12 zonas DIVIPOLA, alcance nacional/desplazamiento, contacto y cinco trabajos de referencia con enlaces HTTPS. Los enlaces no se descargan.

La autorización `shareWithTeam` es independiente de la participación en expedientes. Activa un índice privado de perfiles para el equipo; retirarla deja de mostrar el perfil y sus imágenes por esa ruta. Las consultas comprueban la autorización vigente, no solo el índice. No existe directorio público de contactos ni se conceden permisos de expedientes.

`#/solicitar-servicio/<slug>` recibe solicitudes persistentes, con consentimiento de contacto, ubicación validada y referencia UUID/SOL-. El titular las consulta y responde en `#/mis-solicitudes`; el equipo autorizado las gestiona en `#/equipo-solicitudes` y busca perfiles en `#/equipo-aliados`. Estados: recibida, revisión, información pendiente, búsqueda de especialista, conexión coordinada y cerrada. Los responsables y mensajes compartidos aparecen al solicitante; las notas internas y la identidad del equipo se filtran. Las actualizaciones usan revisión y ETag para evitar sobrescrituras. El índice global privado rechaza referencias de otra cuenta. Este flujo no envía correos, no contrata servicios y no conecta automáticamente a personas ni abre documentos.

### Intereses y gestión comercial de oportunidades

Las fichas reales publicadas incluyen «Me interesa». `#/interes/publicacion/<id>` resuelve el resumen vigente desde el servidor: exige publicación aprobada y consentimiento vigente, descarta datos de ficha suministrados por el cliente y no admite intereses en la propia publicación. Guarda identidad, rol, intención, mensaje y consentimiento de contacto en un expediente comercial privado UUID/INT-. Las fichas ilustrativas usan `#/interes/ejemplo/<id>` y requieren reconocer que son una prueba sin inmueble real. Los registros históricos locales de necesidades se conservan por separado.

`#/mis-intereses` muestra solicitudes y mensajes de la propia cuenta. `#/interesados-recibidos` permite al titular registrado del expediente aceptar, declinar o retirar una presentación individual. Antes de aceptar, ve rol e intención; el contacto y mensaje del comprador permanecen reservados. Al aceptar proporciona y autoriza expresamente el contacto que se comparte. Retirar la autorización oculta el contacto en nuevas consultas y detiene el avance; no puede borrar datos ya consultados. Ningún interés concede acceso a soportes, perímetros privados ni otros expedientes.

El equipo autorizado usa `#/equipo-comercial`, con separación entre publicaciones reales y pruebas, responsable, filtros e historial. Etapas: recibido, revisión, autorización pendiente, contacto autorizado, contactado, visita programada/realizada, propuesta, negociación y cierre informado/descarte. Los cambios exigen mensaje y respetan las transiciones. La visita registra fecha, hora de Colombia y modalidad; la propuesta registra alcance y monto opcional COP/USD. Las notas internas y la identidad del equipo quedan fuera de las proyecciones para comprador y titular. Revisión y ETag evitan sobrescrituras concurrentes. El cierre es un registro del equipo; este flujo no envía correos, no agenda invitaciones externas, no celebra contratos ni transfiere activos.

### UX de los recorridos principales

Mi espacio organiza los accesos en ofrecer, encontrar y conectar, destaca el borrador local y separa herramientas del equipo e historial del navegador. El borrado local queda dentro de una sección secundaria con su alcance explícito. Las pestañas admiten flechas, Inicio/Fin y referencias accesibles entre pestaña y panel.

El registro muestra un indicador de pasos adaptable a móvil, permite editar pasos anteriores y ofrece guardado en todos los pasos. El estado del borrador confirma el guardado local; los errores nativos y de negocio aparecen en un resumen persistente y los campos inválidos tienen enlaces de acceso. Al avanzar o volver, el foco pasa al encabezado del paso. La revisión final incluye accesos para editar cada sección sin enviar el expediente.

La búsqueda presenta criterios aplicados con eliminación individual y limpieza completa. Retirar una ubicación elimina también sus límites geográficos conservando los otros criterios. Los filtros avanzados activos permanecen abiertos y forman parte del formulario de búsqueda; el máximo COP explica su alcance. Los resultados publicados se presentan después de los filtros y, sin publicaciones, se distingue explícitamente la oferta revisada de las fichas ilustrativas.

### Fotografías de las landings de especialistas

Las veinte landings usan el hero fotográfico con un fondo relacionado con su especialidad, degradado de contraste, acción de registro y tarjeta translúcida. `web/specialist-photos.js` define la imagen, el tema y el encuadre de cada ruta. Las fotografías son decorativas y se identifican como referencias; no presentan personas como aliados registrados ni inmuebles como oferta disponible.

Arquitectura y construcción reutilizan los recursos existentes. Las otras dieciocho imágenes se sirven localmente desde `web/assets/specialists/`, en JPEG de 1280 × 854 px; la procedencia está en `web/specialist-photo-sources.json`. Solo se carga la fotografía de la landing activa. La comprobación del artefacto recorre las veinte rutas de imagen y verifica su disponibilidad, tipo, firma JPEG y peso inferior a 500 KB.

### Proyectos que buscan aliados (UX)

`#/necesidades` organiza seis proyectos y 20 necesidades ilustrativas. Permite combinar especialidades, departamentos completos y municipios DIVIPOLA, etapas, tipo de proyecto y atención del aliado. Las opciones de un mismo grupo se combinan como alternativas; los distintos grupos se cruzan. Especialidad y atención deben coincidir con una misma necesidad. Los filtros aplicados quedan en la URL y se conservan al volver desde una ficha.

Cada ficha desglosa alcance, entregables orientativos, vinculación, plazo, presupuesto por acordar y cobertura. La ubicación del proyecto no determina la ciudad de residencia del aliado. La vista de mapa utiliza referencias municipales y no representa polígonos ni ubicaciones prediales. Un proyecto sin terreno puede tener varias zonas alternativas.

La participación por necesidad es una prueba guardada exclusivamente en `interests` del almacenamiento local del navegador. Exige reconocer el carácter ilustrativo, evita duplicados por proyecto y necesidad y aparece en Mi espacio. No constituye una convocatoria abierta, no activa Brevo, no envía propuestas al equipo y no crea una contratación. Para operar con necesidades reales se requerirá un flujo de autorización, publicación y seguimiento en backend.

La primera categoría de aliados es **Abogados (legales)** (`#/aliados/abogados`), disponible en registro, perfiles, solicitudes de servicio y filtros. Su necesidad jurídica aparece primero en el proyecto de reactivación ilustrativo.

Las especialidades requeridas se despliegan desde cada tarjeta. En la ficha, cada necesidad usa un acordeón con su alcance y participación; se abre una a la vez y Abogados conserva el primer lugar.


### Terrenos con y sin proyecto (UX)

TER-DEMO-001 y TER-DEMO-004 presentan solo el terreno. TER-DEMO-002 y TER-DEMO-003 incorporan propuestas constructivas ilustrativas, vinculadas por `landReference` al mismo terreno. Las tarjetas distinguen ambos casos y las fichas incluyen mapa de referencia; los proyectos muestran uso, etapa, áreas, unidades, edificios, pisos, parqueaderos y plazo orientativo. Diseños, estudios, licencia, alcance de negociación y especialidades aparecen en desplegables. El precio del terreno se distingue del costo de construcción y de los derechos de cesión de diseños. No se crean licencias, soportes descargables ni ofertas reales.

### Carrusel de abogados (UX)

La landing de Abogados incluye el carrusel «Ellos ya están en IntegraciónInmobiliaria.com». Incluye el perfil editorial de Suarez y Gomez Abogados, publicado con el nombre y el logo suministrados por el titular del sitio, seguido de cuatro perfiles genéricos de ejemplo identificados como tales. No se reutilizan los perfiles privados del backend. Se navega por botones, teclado o desplazamiento horizontal y no hay reproducción automática. Los aliados reales solo podrán sustituirlos con autorización de publicación. El CTA conduce al registro de abogado, que no publica automáticamente el perfil.

El perfil de **Suarez y Gomez Abogados** se abre en `#/perfil-aliado/suarez-y-gomez-abogados` y también admite la ruta directa `/perfil-aliado/suarez-y-gomez-abogados`. Su logo SVG blanco conserva el archivo recibido y se muestra sobre fondo oscuro. La ficha publica únicamente nombre, categoría y logo; no crea una cuenta de usuario ni atribuye servicios, ubicación o contactos no proporcionados.


El perfil editorial de Suarez y Gomez Abogados incluye ocho áreas resumidas de abogadofiduciario.com/servicios/, ubicación y contactos públicos (consulta: 2026-10-21). El teléfono 321 357 1507 coincide con el enlace WhatsApp del sitio; 300 882 3720 se muestra por separado como teléfono adicional publicado en contacto. Los enlaces `tel:`, `mailto:` y WhatsApp son iniciados por el visitante: no envían mensajes automáticamente. Se enlazan las fuentes, se conserva una sola firma con ID estable y no se incorporan cifras promocionales, garantías de resultados ni miembros del equipo no solicitados.

### Fichas internas de terrenos ampliadas (2026-10-21)

Las cuatro fichas `TER-DEMO-*` usan una presentación detallada con navegación por secciones, ficha técnica, entorno y acceso a servicios, condiciones de compra/aporte y moneda de pago, documentación y obligaciones en acordeones, preguntas de evaluación, especialistas y terrenos relacionados. El precio por m² se calcula únicamente cuando existen área y precio. Los terrenos con proyecto conservan el programa constructivo vinculado y distinguen su alcance del precio de la tierra. Los datos no aportados siguen identificados como pendientes; no se generan archivos, aprobaciones, estados de deuda ni contactos ficticios. Los resúmenes autorizados de `/publicacion/` conservan su contrato de privacidad y no reciben estos datos de demostración.

La navegación interna conserva la ruta, mueve el foco a la sección elegida y respeta la preferencia de movimiento reducido. Los botones de interés usan el seguimiento comercial existente; el tutorial de aporte mantiene su recorrido original.

### Evaluación y preparación del interesado (2026-10-21)

Las fichas de terreno incluyen potencial por evaluar (norma, área útil, condiciones del suelo y viabilidad del negocio), solicitudes de conexión con especialistas, acompañamiento para conversar sobre el valor, condiciones para coordinar una visita y preguntas frecuentes adaptadas al alcance de la ficha. Las visitas inician mediante el formulario de interés existente; no se publican fechas, contactos ni reservas ficticias.

La lista personal de preparación conserva únicamente cinco indicadores en `localStorage`, separados por referencia de terreno con la clave `ii-terrain-preparation-v1:`. No modifica el expediente, el estado de verificación ni los permisos, y no envía respuestas a terceros. Si el almacenamiento local no está disponible, funciona durante la vista y lo informa al usuario.

### Rediseño de la experiencia de terrenos (2026-10-21)

Las cuatro fichas `TER-DEMO-*` presentan un título descriptivo, una imagen de referencia ampliable y un resumen comercial junto a la acción «Consultar este terreno». La información se organiza en pestañas accesibles: El terreno, Ubicación, Negociación y Documentos; los terrenos con programa asociado incluyen Proyecto. Solo un panel se muestra a la vez; las flechas, Inicio y Fin permiten recorrer las pestañas con teclado, y el mapa se redimensiona al activar su panel. En móvil la imagen precede al resumen y una barra inferior conserva precio y consulta.

La consulta permite elegir información, visita o negociación. `consulta` solo acepta tres valores conocidos y agrega un mensaje editable al formulario comercial existente; el usuario mantiene control del envío y sus consentimientos. La lista de preparación personal aparece desplegable en ese formulario para fichas de terreno de ejemplo y conserva las mismas claves locales. Las imágenes permanecen identificadas como referencias; el canal de la plataforma no se presenta como propietario o broker del inmueble. Los resúmenes privados/autorizados y los permisos de documentos conservan sus flujos.

### Buscador, especialistas y publicación (2026-10-21)

El buscador abre en lista y, en «Busco tierra», muestra terrenos por defecto. Conserva la selección explícita de otro tipo al volver, unifica la consulta de ubicación/palabra clave y deja tipo, área y precio en filtros avanzados. En móvil Lista y Mapa son vistas alternativas; el mapa conserva dibujo, sectores y guardado. Los cuatro terrenos de ejemplo comparten títulos descriptivos entre tarjetas, mapa, ficha y solicitud de interés.

El directorio separa «Necesito un especialista» y «Ofrezco mis servicios», permite buscar por servicio y área y mantiene Abogados primero. El departamento opcional se traslada a la solicitud para completarla con municipio; no representa un filtro de cobertura confirmada ni publica perfiles privados. Las landings conservan fotografías y condiciones de registro, con una guía más breve. El perfil público autorizado de Suarez y Gomez permanece accesible.

Los proyectos que buscan aliados tienen encabezado y aviso compactos, especialidades principales visibles en las tarjetas y búsqueda dentro de la selección múltiple. La publicación de terrenos mantiene cuatro pasos: datos básicos, negociación, situación y revisión final. El perímetro se dibuja o importa en el último paso y continúa siendo obligatorio para enviar; no es obligatorio para avanzar por los pasos anteriores. La confirmación del destino para desarrollo sigue en el primer paso y las reglas de privacidad, archivos temporales y validación del servidor permanecen vigentes. El área y el resumen se actualizan al recibir mediciones del editor geográfico.

## Control de versiones en GitHub

Repositorio del proyecto: https://github.com/smoralesan/integracion

Sites conserva su repositorio de publicación. El remoto adicional `github` apunta al repositorio del proyecto; los cambios futuros deben publicarse explícitamente en ambos destinos según corresponda. Conectar el repositorio no configura por sí solo despliegues desde GitHub Actions. No se deben subir `.env`, claves de Brevo, datos locales de prueba, expedientes ni documentos privados.

## Recorrido de evaluación

El catálogo separa terrenos, proyectos y oportunidades para reactivación. Los filtros se combinan y los resultados distinguen publicaciones autorizadas de fichas de ejemplo. Las publicaciones tienen pestañas de descripción, potencial, documentación y participantes. La consulta guiada permite elegir información, visita o negociación sin enviar datos hasta la confirmación del formulario.
