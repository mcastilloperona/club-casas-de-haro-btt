# Activar los correos del club

La web en /socios/ funciona sin esta configuración. Los correos no están activos hasta completar y probar estos pasos. Los avisos dentro de la web sí funcionan mientras la página permanece abierta; no son push con el navegador cerrado.

1. Crear/iniciar sesión en Resend. Añadir un subdominio de envío (por ejemplo avisos.casasdeharobtt.es) y verificar los registros DNS indicados por Resend. No sustituir registros MX del correo principal.
2. Crear una API key de Resend restringida al envío en ese dominio. Guardarla directamente en Supabase, nunca en el chat, GitHub ni en variables VITE.
3. Ejecutar `003_email_notifications.sql` completo en SQL Editor. Solo se encolan eventos nuevos; no envía las rutas antiguas.
4. En Supabase, Edge Functions → Secrets: configurar `RESEND_API_KEY`, `MAIL_FROM` (por ejemplo `Club Casas de Haro BTT <club@avisos.casasdeharobtt.es>`), `SITE_URL=https://casasdeharobtt.es` y `WEBHOOK_SECRET` (secreto aleatorio de al menos 32 caracteres). Los nombres/dominios anteriores son ejemplos; usar el remitente verificado que el propietario elija.
5. Desplegar `supabase/functions/notify-club/index.ts` como función `notify-club`. Desactivar la comprobación JWT de la plataforma para esta función: el código valida obligatoriamente `x-webhook-secret`. Alternativa CLI: `supabase functions deploy notify-club --project-ref tjdtbsroqpbpkyysqjuv --no-verify-jwt`. `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` se proporcionan automáticamente en el entorno de las Edge Functions; no copiar la clave al navegador.
6. Programar en Integrations → Cron una llamada POST cada minuto (`* * * * *`) a `https://tjdtbsroqpbpkyysqjuv.supabase.co/functions/v1/notify-club`. Header `x-webhook-secret`: el mismo secreto. Body `{}`. Preferir almacenar el secreto en Vault y referenciarlo desde SQL del cron, siguiendo la documentación oficial: https://supabase.com/docs/guides/functions/schedule-functions . No escribir secretos en SQL versionado.
7. Publicar una ruta de prueba: un correo individual por socio aprobado, incluido el organizador; no se comparten direcciones de los demás. Enviar varios mensajes: los inscritos y el organizador reciben un aviso agrupado por bloque de cinco minutos, sin avisar al autor de su propio mensaje. El envío se demora unos 5–6 minutos desde el primer mensaje de cada bloque, y más si hay cola.
8. Revisar `club_notification_jobs`: estado `sent` indica aceptación por Resend, no entrega en la bandeja de entrada. Revisar los eventos de entrega/rebote en Resend. `pending` reintenta; tras cinco intentos pasa a `failed`. Para reintentar un fallo corregido, el propietario puede resetear `state='pending',attempts=0,due_at=now()` desde SQL Editor.

La cola comprueba aprobación y participación al reclamar los trabajos. Los correos de chats nunca contienen el texto de los mensajes. Cancelar/archivar antes de reclamar un aviso lo omite. No se integra WhatsApp automático: necesita WhatsApp Business Platform, teléfonos y consentimiento, y plantillas aprobadas. El botón Compartir por WhatsApp abre el selector y el usuario decide dónde enviarlo.

## URL de autenticación de producción

En Authentication → URL Configuration:
- Site URL: `https://casasdeharobtt.es/socios/`
- Redirect URLs: `https://casasdeharobtt.es/socios/` y `https://casasdeharobtt.es/v14/socios/`

Conservar la URL preview para que sigan funcionando enlaces antiguos. Los registros nuevos desde producción solicitan la redirección a /socios/.
