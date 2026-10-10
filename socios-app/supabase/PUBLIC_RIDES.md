# Salidas públicas desde Socios

Inicio y Rutas consultan `public-rides` cada minuto, al volver a la pestaña y al recuperar el foco. Ambas páginas muestran todas las salidas activas, ordenadas por fecha, hasta terminar su día en `Europe/Madrid`. El cambio de día también se comprueba cada segundo sin necesidad de recargar. Si no quedan salidas, se muestra un aviso de próxima salida pendiente de publicar. Un fallo de conexión muestra un error y permite reintentar, sin recuperar la antigua ruta estática.

La Edge Function es un endpoint GET público e intencionadamente se despliega con `verify_jwt: false`. Utiliza la clave de servicio únicamente en el servidor para devolver la proyección: identificador, título, descripción, fecha/hora, punto de encuentro, modalidad, dificultad y distancia. No devuelve organizadores, participantes, mensajes, correos ni trabajos de notificación. No cambia permisos de tablas, perfiles, rutas ni cron; tampoco duplica registros. Cancelar o eliminar una salida en Socios retira su tarjeta en la siguiente consulta pública.

El enlace de cada tarjeta lleva a `/socios/?ride=<id>`; las inscripciones y el chat siguen usando la autenticación y los permisos actuales. El archivo de tracks de Rutas sigue siendo independiente de las próximas salidas.

Se ha retirado el formulario manual «Próxima ruta» de Pages CMS y su workflow de sincronización estática. No volver a activar `sync-next-route.yml` ni usar `scripts/sync_next_route.py` para estas tarjetas.

Despliegue: publicar `functions/public-rides/index.ts` como `public-rides` en el proyecto del club. Usa las variables `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` que Supabase proporciona al runtime. El código web y sus estilos se sirven desde GitHub Pages.

Validación: `npm test` en `socios-app`; incluye cancelación, varias rutas, escape de HTML, errores y medianoche de Madrid en horario de verano/invierno. La prueba del endpoint verifica la lista de columnas públicas y el rechazo de escrituras.
