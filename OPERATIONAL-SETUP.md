# UX y activación de avisos

La publicación conserva su audiencia. Las páginas de Términos y condiciones y Política de privacidad son versiones informativas: falta completar razón social, NIT, dirección, responsable y canal de atención, plazos de conservación aplicables y revisión del contenido final por el responsable.

## Fichas públicas

La autorización anterior `summary-v1` conserva exclusivamente el resumen. El titular prepara contenido independiente en su expediente y autoriza `detail-v2`; una ficha publicada vuelve a revisión cuando cambia esa autorización. No se copia la descripción privada. Compartir fotos o perímetro requiere selección expresa; los documentos de soporte permanecen privados. Las fotos públicas conservan el vencimiento original de 60 días y se comprueba la autorización en cada solicitud. Retirar la autorización corta el acceso.

La disponibilidad es una confirmación fechada del titular, no una certificación del portal. Retirado impide nuevos intereses. La revisión de soportes registra alcance y pendientes; no acredita titularidad ni viabilidad. Las coincidencias de terrenos son sugerencias; la vinculación manual de expedientes al mismo inmueble exige administración, nota y confirmación. Cada expediente mantiene su contacto, autorización y declaración de exclusividad.

## Avisos y Brevo

El centro de actividad conserva avisos en la cuenta. La preferencia de correo es opt-in y usa el correo de la identidad autenticada, no un destinatario ingresado en un formulario. Los avisos incluyen referencia y acceso al portal; excluyen documentos, coordenadas, mensajes y contactos de terceros.

Configurar mediante variables de entorno de Sites, nunca en el código ni en el navegador:

- `BREVO_API_KEY` como secreto.
- `BREVO_SENDER_EMAIL`: remitente verificado en Brevo.
- `II_EMAIL_ENABLED=true` para activar envíos.
- Opcional: `BREVO_TEAM_EMAIL` para avisos al equipo. El correo debe corresponder al equipo configurado en `II_TEAM_ROLES` y esa cuenta debe activar su preferencia. Se vincula únicamente la cuenta autenticada que registra ese correo.

Sin configuración se conservan avisos con estado pendiente de configuración. No se envían correos. Las respuestas inciertas del proveedor se marcan sin confirmar y no se reenvían automáticamente, para evitar duplicados. No hay campaña masiva, suscripción publicitaria ni matching automático de aliados. Los avisos operativos se originan en altas y cambios de expedientes, intereses y solicitudes de servicio. La entrega de correo no condiciona el guardado de una operación. Los historiales anteriores a este módulo no se convierten en correos retroactivos.

La notificación se programa tras la mutación con `waitUntil`. No es una cola con garantía de entrega exactamente una vez ni un servicio cron; el estado de proveedor aceptado no significa entrega a la bandeja del destinatario. Antes de activar producción, realizar una prueba autorizada con un destinatario controlado y revisar la verificación del remitente en Brevo.

Referencia técnica: https://developers.brevo.com/reference/send-transac-email

## Mapbox en el navegador

`MAPBOX_PUBLIC_TOKEN` se configura en Sites y se entrega exclusivamente mediante `/mapbox-config.js`. Debe ser un token público `pk` con alcance de navegador. Los tokens secretos `sk` se rechazan. Esta configuración es pública por diseño cuando se utiliza el mapa, aunque Sites guarde el valor de forma reservada. El archivo del repositorio contiene un valor vacío. Para el preview local se admite `MAPBOX_PUBLIC_TOKEN` en el entorno o `.local-data/mapbox-public.json` (ignorado por Git).

GitHub recibió una copia inicial del código mediante la conexión autorizada de la app. Git de este equipo usa otra cuenta y requiere ajustar su autenticación antes de enviar por terminal; no se cambiaron sus credenciales. Los historiales de Sites y de la copia inicial de GitHub son independientes.

## Consulta pública y retorno a resultados

Solo GET de `/api/catalog`, `/api/catalog/:id` y `/api/catalog/:id/photos/:photoId` admiten visitantes sin identidad. Se verifica de nuevo estado publicado, consentimiento y selección/vigencia de cada fotografía. No se publica el registro interno, contacto del propietario, documentos originales ni notas del equipo. Las mutaciones, reportes y seguimientos siguen exigiendo identidad y origen autorizado.

El contexto de búsqueda se conserva en sessionStorage y el historial de la misma pestaña durante un máximo de 24 horas: filtros, lista/mapa, encuadre, posición y referencia de la ficha. La restauración permite solo campos de búsqueda; no restaura identidad ni roles. El selector de Mi espacio guarda una preferencia de navegación en el almacenamiento local, sin cambiar permisos.

La asesoría de valor base usa el seguimiento existente de solicitudes de servicio. Su alcance, honorarios, impuestos, responsable y plazo se acuerdan mediante una cotización; no hay tarifa fija ni checkout activado. El piloto con personas reales está preparado en `GUIA-PRUEBAS-USABILIDAD.md`; aún requiere participantes.


### Maqueta de acceso por correo electrónico

Las rutas de publicar muestran una entrada de correo electrónico y código de prueba 123456. Es una demostración de interfaz: no envía correos, no verifica titularidad, no crea identidad ni modifica permisos. No persiste el correo ni el código. Una marca `preview` en sessionStorage permite retomar la maqueta en la misma pestaña; no autoriza llamadas privadas. Los borradores siguen guardados solo en localStorage y se muestran como locales. En modo maqueta no se suben documentos, importan archivos al servidor ni envían expedientes. El acceso actual del portal sigue disponible mediante la autenticación de Sites y `acceso=actual`, que exige identidad real. El guardado en cuenta y la recuperación entre dispositivos siguen pendientes de integración.
