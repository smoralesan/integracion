import {
  MAPBOX_TOKEN,
  MAPBOX_VERSION,
  MAPBOX_STYLES,
} from "./mapbox-config.js";
import { isCoordinate, extent, toPolygon, locationBounds } from "./geo.js";

let sdkPromise;
function loadSDK() {
  if (window.mapboxgl) return Promise.resolve(window.mapboxgl);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    if (!MAPBOX_TOKEN.startsWith("pk."))
      return reject(Error("public_token_required"));
    const script = document.createElement("script");
    script.src = `https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_VERSION}/mapbox-gl.js`;
    script.async = true;
    const timer = setTimeout(() => {
      script.remove();
      sdkPromise = null;
      reject(Error("map_sdk_timeout"));
    }, 15000);
    script.onload = () => {
      clearTimeout(timer);
      window.mapboxgl
        ? resolve(window.mapboxgl)
        : reject(Error("map_sdk_unavailable"));
    };
    script.onerror = () => {
      clearTimeout(timer);
      script.remove();
      sdkPromise = null;
      reject(Error("map_sdk_unavailable"));
    };
    document.head.append(script);
  });
  return sdkPromise;
}
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const emptyFeatures = () => ({ type: "FeatureCollection", features: [] });

export class LandMap {
  constructor() {
    this.map = null;
    this.root = null;
    this.markers = [];
    this.generation = 0;
    this.fitKey = "";
    this.selection = null;
  }
  async mount(host, options) {
    this.options = options;
    const generation = ++this.generation;
    try {
      const sdk = await loadSDK();
      if (generation !== this.generation || !host.isConnected) return;
      if (this.map) {
        if (host !== this.root) host.replaceWith(this.root);
        this.resize();
        this.update();
        return;
      }
      this.root = host;
      this.root.replaceChildren();
      this.root.dataset.mapReady = "false";
      this.map = new sdk.Map({
        container: host,
        accessToken: MAPBOX_TOKEN,
        style: MAPBOX_STYLES[options.style] || MAPBOX_STYLES.map,
        center: [-75.5, 10.54],
        zoom: 11.3,
        language: "es",
        locale: {
          "AttributionControl.ToggleAttribution":
            "Mostrar atribuciones del mapa",
          "ScrollZoomBlocker.CtrlMessage":
            "Usa Ctrl + desplazamiento para acercar el mapa",
          "ScrollZoomBlocker.CmdMessage":
            "Usa ⌘ + desplazamiento para acercar el mapa",
          "TouchPanBlocker.Message": "Usa dos dedos para mover el mapa",
        },
        cooperativeGestures: true,
        attributionControl: { compact: true },
        minZoom: 3,
        maxZoom: 20,
        renderWorldCopies: false,
      });
      this.style = options.style;
      this.map
        .getCanvas()
        .setAttribute(
          "aria-label",
          "Mapa de Colombia. Usa los controles o las teclas para navegar.",
        );
      this.map.on("style.load", () => {
        clearTimeout(this.loadTimer);
        this.root.dataset.mapReady = "true";
        this.options.onReady?.();
        this.addDrawLayers();
        this.updateDraw();
      });
      this.startLoadTimer();
      this.map.on("load", () => {
        clearTimeout(this.loadTimer);
        this.root.dataset.mapReady = "true";
        this.options.onReady?.();
        this.update();
      });
      this.map.on("error", (event) => {
        const status = event.error?.status;
        if (status === 401 || status === 403) {
          clearTimeout(this.loadTimer);
          this.root.dataset.mapReady = "error";
          this.options.onError?.(
            "No se pudo autorizar el mapa. Revisa el token y los dominios permitidos en Mapbox.",
          );
        }
      });
      this.map.on("webglcontextlost", () => {
        clearTimeout(this.loadTimer);
        this.root.dataset.mapReady = "error";
        this.options.onError?.(
          "El mapa perdió su contexto gráfico. Puedes reintentar o usar la lista.",
        );
      });
      this.map.on("webglcontextrestored", () => {
        this.root.dataset.mapReady = "true";
        this.options.onReady?.();
      });
      this.map.on('moveend',()=>{if(this.options.context==='search'){const center=this.map.getCenter();this.options.onViewChange?.({center:[center.lng,center.lat],zoom:this.map.getZoom(),bearing:this.map.getBearing(),pitch:this.map.getPitch()});}});
      this.map.on("click", (event) => {
        if (this.options.drawing || this.options.pinPicking)
          this.options.onPoint?.([
            Number(event.lngLat.lng.toFixed(7)),
            Number(event.lngLat.lat.toFixed(7)),
          ]);
      });
      this.viewportSize = {width:this.root.clientWidth,height:this.root.clientHeight};
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.root);
      this.update();
    } catch {
      if (generation === this.generation)
        this.options.onError?.(
          "No fue posible cargar Mapbox. Reintenta o continúa con la lista.",
        );
    }
  }
  startLoadTimer() {
    clearTimeout(this.loadTimer);
    this.loadTimer = setTimeout(() => {
      if (!this.map || this.root?.dataset.mapReady === "true") return;
      this.root.dataset.mapReady = "error";
      this.options.onError?.(
        "El mapa está tardando demasiado en cargar. Reintenta o continúa con la lista.",
      );
    }, 20000);
  }
  update() {
    if (!this.map) return;
    const o = this.options;
    if (this.style !== o.style) {
      this.style = o.style;
      this.root.dataset.mapReady = "false";
      this.options.onLoading?.();
      this.startLoadTimer();
      this.map.setStyle(MAPBOX_STYLES[o.style] || MAPBOX_STYLES.map, {
        diff: false,
      });
    }
    if (o.drawing) this.map.doubleClickZoom.disable();
    else this.map.doubleClickZoom.enable();
    this.map.getCanvas().style.cursor = o.drawing || o.pinPicking ? "crosshair" : "";
    this.updateDraw();
    this.updateMarkers();
    if (this.fitKey !== o.fitKey) {
      this.fitKey = o.fitKey;
      this.fitView();
    }
  }
  updateMarkers() {
    if (!this.map || !window.mapboxgl) return;
    const o = this.options;
    for (const marker of this.markers) marker.remove();
    this.markers = [];
    if(o.hideMarkers){this.popup?.remove();this.popup=null;this.selection=null;return;}
    if(o.context==='parcel'&&o.geometry?.type==='Point'&&isCoordinate(o.geometry.coordinates)){
      const marker=new window.mapboxgl.Marker({color:'#1265e9'}).setLngLat(o.geometry.coordinates).addTo(this.map);
      marker.getElement().setAttribute('role','img');
      marker.getElement().setAttribute('aria-label','Pin de ubicación aproximada del terreno. No define sus linderos.');
      this.markers.push(marker);
    }
    for (const item of o.items.filter((p) => isCoordinate(p.coordinates))) {
      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "real-map-pin" + (item.id === o.selectedId ? " selected" : "");
      button.setAttribute(
        "aria-label",
        `Ver ${item.title}. Ubicación de ejemplo.`,
      );
      button.innerHTML =
        '<svg viewBox="0 0 30 39" aria-hidden="true"><path d="M15 0C6.7 0 0 6.7 0 15c0 11 15 24 15 24s15-13 15-24C30 6.7 23.3 0 15 0Z"/><circle cx="15" cy="14" r="5" fill="white"/></svg>';
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        if (!this.options.drawing) this.options.onSelect?.(item.id);
      });
      const marker = new window.mapboxgl.Marker({
        element: button,
        anchor: "bottom",
      })
        .setLngLat(item.coordinates)
        .addTo(this.map);
      button.setAttribute("role", "button");
      this.markers.push(marker);
    }
    const selected = o.items.find((p) => p.id === o.selectedId);
    if (o.drawing || !selected) {
      this.popup?.remove();
      this.popup = null;
      this.selection = null;
      return;
    }
    const selectionKey=selected.id+":"+(o.richPopup?"rich":"basic");
    if (this.selection !== selectionKey || !this.popup || !this.popup.isOpen()) {
      this.popup?.remove();
      const content = document.createElement("div");
      content.className = "real-map-popup";
      const detailHref=o.context==='project-needs'?'#/necesidades/'+selected.projectId:'#/oportunidad/'+selected.id;
      const detailLabel=o.context==='project-needs'?'Ver proyecto y necesidades →':'Ver oportunidad →';
      content.innerHTML = o.richPopup ? `<img src="${escape(selected.image)}" alt=""><div><strong>${escape(selected.city)}, ${escape(selected.region)}</strong><small>${selected.area ? new Intl.NumberFormat("es-CO").format(selected.area) + " m² · " : ""}${escape(selected.mode)}</small>${selected.price?`<span class="hero-popup-price">COP $${new Intl.NumberFormat("es-CO").format(selected.price)}</span>`:""}<span>Ejemplo · Ubicación no predial</span><a href="${escape(detailHref)}">${detailLabel}</a></div>` : `<img src="${escape(selected.image)}" alt=""><div><strong>${escape(o.context==='project-needs'?selected.title:selected.city)} · Ejemplo</strong><small>${selected.area ? new Intl.NumberFormat("es-CO").format(selected.area) + " m² · " : ""}${escape(selected.mode)}</small><span>${selected.land_status === "searching" ? "Proyecto sin terreno; referencia municipal" : "Ubicación ilustrativa, no predial"}</span><a href="${escape(detailHref)}">${detailLabel}</a></div>`;
      this.popup = new window.mapboxgl.Popup({
        offset: o.richPopup ? 12 : 30,
        closeButton: true,
        closeOnClick: false,
        focusAfterOpen: false,
        maxWidth: o.richPopup ? "300px" : "230px",
      })
        .setLngLat(selected.coordinates)
        .setDOMContent(content)
        .addTo(this.map);
      this.popup
        .getElement()
        .querySelector(".mapboxgl-popup-close-button")
        ?.setAttribute("aria-label", "Cerrar información del marcador");
      this.selection = selectionKey;
    }
  }
  addDrawLayers() {
    if (!this.map || this.map.getSource("ii-search-geometry")) return;
    this.map.addSource("ii-search-geometry", {
      type: "geojson",
      data: emptyFeatures(),
    });
    this.map.addLayer({
      id: "ii-search-fill",
      type: "fill",
      source: "ii-search-geometry",
      filter: ["==", ["geometry-type"], "Polygon"],
      paint: { "fill-color": "#1265e9", "fill-opacity": 0.16 },
    });
    this.map.addLayer({
      id: "ii-search-outline",
      type: "line",
      source: "ii-search-geometry",
      filter: ["in", ["geometry-type"], ["literal", ["LineString", "Polygon"]]],
      paint: { "line-color": "#1265e9", "line-width": 2.5 },
    });
    this.map.addLayer({
      id: "ii-search-vertices",
      type: "circle",
      source: "ii-search-geometry",
      filter: ["==", ["geometry-type"], "Point"],
      paint: {
        "circle-color": "#ffffff",
        "circle-radius": 4.5,
        "circle-stroke-color": "#1265e9",
        "circle-stroke-width": 2,
      },
    });
  }
  updateDraw() {
    const source = this.map?.getSource("ii-search-geometry");
    if (!source) return;
    const o = this.options,
      points = o.drawing ? o.drawPoints : o.zone,
      features = [];
    if (o.geometry && !o.drawing) features.push({type:"Feature",properties:{},geometry:o.geometry});
    if (!o.geometry && points.length >= 3) {
      try {
        features.push({
          type: "Feature",
          properties: {},
          geometry: toPolygon(points),
        });
      } catch {}
    }
    if (o.drawing && points.length >= 2)
      features.push({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: points },
      });
    for (const p of points)
      if (isCoordinate(p))
        features.push({
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: p },
        });
    source.setData({ type: "FeatureCollection", features });
  }
  resize() {
    if(!this.map||!this.root)return;
    const size={width:this.root.clientWidth,height:this.root.clientHeight};
    if(!size.width||!size.height)return;
    const changed=this.viewportSize&&(Math.abs(size.width-this.viewportSize.width)>1||Math.abs(size.height-this.viewportSize.height)>1);
    this.viewportSize=size;
    this.map.resize();
    if(this.options.drawing)return;
    if(changed&&this.options.context==='search')this.fitView({restoreCamera:false});
    else if(['parcel','detail'].includes(this.options.context)&&this.options.geometry)this.fitView();
  }
  fitView({restoreCamera=true}={}) {
    const o = this.options;
    if(o.context==='search'&&o.initialCamera&&restoreCamera){this.map.jumpTo({...o.initialCamera,padding:0});return;}
    if (o.place) {
      this.locate(o.place);
      return;
    }
    if (o.context === "home") {
      this.map.jumpTo({ center: [-75.5, 10.54], zoom: 11.3, padding:0 });
      return;
    }
    const points = o.geometry
      ? (o.geometry.type === "Point" ? [o.geometry.coordinates] : o.geometry.type === "Polygon" ? o.geometry.coordinates.flat() : o.geometry.coordinates.flat(2))
      : o.zone.length ? o.zone : o.items.map((p) => p.coordinates).filter(isCoordinate);
    const bounds = extent(points);
    if (!bounds) return;
    if (points.length === 1)
      this.map.easeTo({
        center: points[0],
        zoom: o.context === "parcel" ? 16 : o.context === "detail" ? 11.6 : 11,
        duration: 450,
        padding:0,
      });
    else
      this.map.fitBounds(
        [
          [bounds[0], bounds[1]],
          [bounds[2], bounds[3]],
        ],
        {
          padding: (o.context === "parcel" || (o.context === "detail" && o.geometry)) ? {top:60,bottom:60,left:45,right:45} : o.context==='search' ? {top:o.drawing?160:100,bottom:o.drawing?170:135,left:65,right:65} : { top: 100, bottom: 105, left: 45, right: 45 },
          retainPadding: false,
          maxZoom: (o.context === "parcel" || (o.context === "detail" && o.geometry)) ? 19 : 14,
          duration: 450,
        },
      );
  }
  locate(place) {
    if (!this.map) return;
    const bounds = locationBounds(place);
    if (bounds)
      this.map.fitBounds(
        [
          [bounds[0], bounds[1]],
          [bounds[2], bounds[3]],
        ],
        {
          padding: { top: 80, bottom: 135, left: 45, right: 45 },
          retainPadding: false,
          maxZoom: 14,
          duration: 500,
        },
      );
    else if (isCoordinate(place.geometry?.coordinates))
      this.map.easeTo({
        center: place.geometry.coordinates,
        zoom: 13,
        duration: 500,
        padding:0,
      });
  }
  zoom(delta) {
    if (this.map)
      this.map.easeTo({ zoom: this.map.getZoom() + delta, duration: 250 });
  }
  destroy() {
    clearTimeout(this.loadTimer);
    this.generation++;
    this.resizeObserver?.disconnect();
    this.popup?.remove();
    this.map?.remove();
    this.map = null;
    this.root = null;
    this.markers = [];
    this.popup = null;
    this.selection = null;
    this.fitKey = "";
  }
}

// Resultados temporales: solo se muestran en memoria; no se guardan en localStorage.
export async function geocodeLocation(query, signal) {
  const text = String(query).trim();
  if (
    !text ||
    text.length > 256 ||
    text.split(/\s+/).length > 20 ||
    text.includes(";")
  )
    throw Error("invalid_query");
  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  for (const [key, value] of Object.entries({
    q: text,
    access_token: MAPBOX_TOKEN,
    country: "co",
    language: "es",
    autocomplete: "false",
    limit: "5",
    types: "place,locality,neighborhood,region",
    permanent: "false",
  }))
    url.searchParams.set(key, value);
  const response = await fetch(url, {
    signal: signal || AbortSignal.timeout(10000),
  });
  if (!response.ok) throw Error("location_service_unavailable");
  const data = await response.json();
  return (Array.isArray(data.features) ? data.features : []).filter((f) =>
    isCoordinate(f.geometry?.coordinates),
  );
}

export function staticMapHTML() {
  const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/-75.49,10.52,11.3,0/600x320?access_token=${encodeURIComponent(MAPBOX_TOKEN)}`;
  return `<img class="mapbox-static-preview" src="${url}" alt="Mapa de referencia de Cartagena, Mapbox" loading="lazy">`;
}
