import {developmentSectors} from './development-sectors.js';
// Decorative reference photos. Only the active landing loads its image.
export const specialistPhotos = {
  "abogados": {
    "src": "./assets/specialists/fiduciarias.jpg",
    "subject": "Revisión de documentos y acuerdos",
    "position": "center",
    "mobilePosition": "center"
  },
  "estructuradores": {
    "src": "./assets/specialists/estructuradores.jpg",
    "subject": "Planos y evaluación del proyecto",
    "position": "center",
    "mobilePosition": "center"
  },
  "desarrolladores": {
    "src": "./assets/specialists/desarrolladores.jpg",
    "subject": "Desarrollo urbano",
    "position": "center",
    "mobilePosition": "center"
  },
  "inversionistas": {
    "src": "./assets/specialists/inversionistas.jpg",
    "subject": "Evaluación de oportunidades",
    "position": "center",
    "mobilePosition": "center"
  },
  "financiadores": {
    "src": "./assets/specialists/financiadores.jpg",
    "subject": "Análisis financiero",
    "position": "center",
    "mobilePosition": "center"
  },
  "fiduciarias": {
    "src": "./assets/specialists/fiduciarias.jpg",
    "subject": "Administración y acuerdos",
    "position": "center",
    "mobilePosition": "center"
  },
  "comercializadores": {
    "src": "./assets/specialists/comercializadores.jpg",
    "subject": "Gestión comercial",
    "position": "center",
    "mobilePosition": "center"
  },
  "tecnicos": {
    "src": "./assets/specialists/tecnicos.jpg",
    "subject": "Coordinación técnica",
    "position": "center",
    "mobilePosition": "center"
  },
  "ingenieros-estructurales": {
    "src": "./assets/specialists/ingenieros-estructurales.jpg",
    "subject": "Diseño estructural",
    "position": "center",
    "mobilePosition": "center"
  },
  "ingenieros-electricos": {
    "src": "./assets/specialists/ingenieros-electricos.jpg",
    "subject": "Instalaciones eléctricas",
    "position": "center",
    "mobilePosition": "center"
  },
  "disenadores-de-interiores": {
    "src": "./assets/specialists/disenadores-de-interiores.jpg",
    "subject": "Diseño interior",
    "position": "center",
    "mobilePosition": "20% center"
  },
  "interventores": {
    "src": "./assets/specialists/interventores.jpg",
    "subject": "Inspección de obra",
    "position": "center",
    "mobilePosition": "center"
  },
  "disenadores-hidraulicos": {
    "src": "./assets/specialists/disenadores-hidraulicos.jpg",
    "subject": "Redes e instalaciones hidráulicas",
    "position": "center",
    "mobilePosition": "center"
  },
  "topografos": {
    "src": "./assets/specialists/topografos.jpg",
    "subject": "Levantamiento topográfico",
    "position": "center",
    "mobilePosition": "center"
  },
  "geotecnistas": {
    "src": "./assets/specialists/geotecnistas.jpg",
    "subject": "Condiciones del suelo",
    "position": "center",
    "mobilePosition": "center"
  },
  "consultores-ambientales": {
    "src": "./assets/specialists/consultores-ambientales.jpg",
    "subject": "Entorno natural",
    "position": "center",
    "mobilePosition": "center"
  },
  "disenadores-viales-urbanismo": {
    "src": "./assets/specialists/disenadores-viales-urbanismo.jpg",
    "subject": "Infraestructura vial",
    "position": "center",
    "mobilePosition": "center"
  },
  "presupuestos-programacion": {
    "src": "./assets/specialists/presupuestos-programacion.jpg",
    "subject": "Planeación y costos",
    "position": "center",
    "mobilePosition": "5% center"
  },
  "coordinadores-bim": {
    "src": "./assets/specialists/coordinadores-bim.jpg",
    "subject": "Coordinación digital del diseño",
    "position": "center",
    "mobilePosition": "center"
  },
  "arquitectos": {
    "src": "./assets/desarrollo-urbano.jpg",
    "subject": "Arquitectura",
    "position": "center 53%",
    "mobilePosition": "59% top"
  },
  "constructores": {
    "src": "./assets/proyecto-construccion.jpg",
    "subject": "Ejecución de obra",
    "position": "center",
    "mobilePosition": "center"
  }
};

for(const sector of developmentSectors)specialistPhotos[sector.slug]={...specialistPhotos.desarrolladores,subject:sector.focus};

Object.assign(specialistPhotos['desarrolladores-hoteleros'],{...specialistPhotos['disenadores-de-interiores'],subject:'Espacios interiores · Imagen de referencia'});
Object.assign(specialistPhotos['desarrolladores-logisticos'],{...specialistPhotos['disenadores-viales-urbanismo'],subject:'Conectividad urbana, vial y férrea · Imagen de referencia'});
Object.assign(specialistPhotos['desarrolladores-industriales'],{src:'./assets/proyecto-construccion.jpg',subject:'Desarrollo y ejecución de obra · Imagen de referencia'});
Object.assign(specialistPhotos['desarrolladores-de-infraestructura'],specialistPhotos['disenadores-viales-urbanismo']);
Object.assign(specialistPhotos['desarrolladores-comerciales'],{...specialistPhotos.comercializadores,subject:'Desarrollo comercial · Imagen de referencia'});
