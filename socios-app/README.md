# Área de socios · Club Casas de Haro BTT

Aplicación React para el área privada del club.

## Estado

- Producción (`/socios/`): aplicación real de acceso, aprobación, salidas, inscripciones y chat.
- Preview (`/v14/socios/`): acceso, aprobación, roles, salidas, inscripciones y chat; compilación conectada al proyecto `tjdtbsroqpbpkyysqjuv`.
- La tabla actual utiliza `name` y las columnas `id`, `email`, `status`, `role`, `created_at`, `updated_at`. Las actualizaciones no requieren `approved_at` ni `approved_by`.
- En modo conectado se usan exclusivamente las tablas reales. Es necesario activar `supabase/002_live_rides.sql`. Los avisos por correo aún no están configurados.
- Con `VITE_SOCIOS_ENABLED=false`, la preview funciona con datos de demostración.
- Con `VITE_SOCIOS_ENABLED=true`, utiliza Supabase Auth y la tabla `profiles`.

`npm run build` genera producción en `/socios/`; `npm run build:preview` genera `/v14/socios/`. Los scripts seleccionan explícitamente `vite.config.mjs` para evitar la configuración JS antigua. Ambas versiones usan los mismos usuarios y datos reales.

Los avisos dentro de la web detectan mensajes de otros usuarios recibidos desde que se abrió la sesión, con contador por salida y aviso superior. No son notificaciones push con la web cerrada. Organizadores y administradores tienen un botón para compartir la salida por WhatsApp; el usuario selecciona el destino y confirma el envío en WhatsApp.

El correo se prepara con `supabase/003_email_notifications.sql` y la función `notify-club`. Ver instrucciones en `supabase/NOTIFICATIONS.md`. La cola tiene destinatarios individuales, agrupación de chat, exclusión del autor, reclamación exclusiva y reintentos; los correos no están activos hasta configurar Resend y Cron. Las nuevas rutas avisan a socios aprobados; los chats avisan a inscritos y organizador. La migración 003 y el worker también se prueban con `npm test` sin enviar correos reales.

## Desarrollo

1. Copiar `.env.example` a `.env` y completar las variables.
2. Ejecutar `npm install`.
3. Ejecutar `npm run dev`.

## Base de datos

### Activación de salidas en el proyecto actual

Ejecutar completo `supabase/002_live_rides.sql` desde SQL Editor, con la cuenta propietaria del proyecto. La clave pública del navegador no permite aplicar migraciones.

La transacción conserva usuarios y perfiles, añade `club_rides`, `club_ride_members`, `club_ride_messages`, y sustituye las políticas de `profiles` por lectura propia/administrador y edición exclusiva del administrador. Cancela la operación si no existe un administrador aprobado. El trigger de altas existente se conserva.

- Socios aprobados: ven salidas y nombres de inscritos, se inscriben o dan de baja antes del inicio.
- Organizadores: publican y gestionan sus propias salidas. Administradores: gestionan todas.
- Chat: inscritos, organizador propietario y administradores aprobados. Baja o rechazo del perfil retiran el acceso. Cancelar/archivar conserva los mensajes y cierra la escritura.
- Los nombres de autor e inscritos los fija el servidor desde `profiles`; nunca se publican correos de socios a otros socios.
- Las fechas se introducen y muestran en Europe/Madrid. Se rechazan horas ambiguas/inexistentes del cambio de horario.
- Mensajes guardados en PostgreSQL; consulta cada 5 segundos, salidas cada 10 segundos. No requiere activar Supabase Realtime. Carga inicial de los 100 mensajes más recientes y paginación para anteriores.
- No hay borrado de salidas ni edición/borrado de mensajes en esta fase.

Validación: `npm test` ejecuta la migración dos veces contra PostgreSQL embebido (PGlite) y prueba RLS con anon, pendiente, socio, organizadores y administrador; `npm run build` compila la preview. Estos tests no inspeccionan otras funciones RPC o triggers ya existentes en el proyecto remoto. Antes de producción, repetir la prueba con cuentas reales y revisar los objetos existentes.

Prueba manual tras activar SQL: publicar una salida futura como organizador; abrirla como socio; inscribirse; enviar mensajes desde ambos usuarios; recargar y comprobar persistencia; darse de baja y comprobar que desaparece el acceso al chat; volver a inscribirse; archivar y comprobar lectura sin envío. Verificar también que un segundo organizador no puede editar una salida ajena.

### Esquema antiguo

La migración `001_profiles.sql` es la propuesta original con `full_name`; no ejecutarla sobre el nuevo proyecto sin reconciliar antes la estructura y las políticas existentes. El nuevo proyecto ya tiene una migración distinta con `name`, ejecutada desde el panel por el propietario. Antes de abrir producción, verificar su trigger de alta y sus políticas RLS con pruebas de permisos.

Para reproducir la compilación conectada, configurar `.env.local` con la URL y clave pública del proyecto nuevo y `VITE_SOCIOS_ENABLED=true`. La clave pública se incorpora al cliente; nunca usar claves secretas o `service_role`.

Las instrucciones siguientes describen el esquema original y deben adaptarse antes de volver a utilizarlas:

1. Ejecutar `supabase/001_profiles.sql` en el SQL Editor de Supabase.
2. Registrarse desde la preview con la cuenta que administrará el club.
3. Ejecutar la consulta final del SQL, sustituyendo `TU_CORREO`, para convertir esa cuenta en administradora.
4. Configurar en Supabase Auth la URL del sitio y añadir `https://casasdeharobtt.es/v14/socios/` como URL de redirección.
5. Cambiar `VITE_SOCIOS_ENABLED=true` y volver a compilar.

La autorización no depende de la interfaz: las políticas RLS impiden que un socio se apruebe, cambie su rol o consulte otros perfiles. Una cuenta administradora tampoco puede degradarse accidentalmente desde el panel.

## Avisos por correo

La función `supabase/functions/notify-membership/index.ts` contempla dos avisos:

- nueva solicitud para el administrador;
- confirmación para el socio cuando se aprueba su acceso.

Para activarlos hay que desplegar `notify-membership`, configurar los secretos `RESEND_API_KEY`, `MAIL_FROM`, `ADMIN_EMAIL`, `SITE_URL` y `WEBHOOK_SECRET`, y crear un Database Webhook sobre `public.profiles` para los eventos `INSERT` y `UPDATE`. El webhook debe enviar `x-webhook-secret` con el mismo valor guardado en la función.

## Compilación

`npm run build` genera la preview dentro de `../v14/socios/`.

- Los administradores pueden eliminar definitivamente una salida; el borrado elimina también inscripciones, mensajes y avisos asociados mediante cascada en base de datos. Los organizadores no tienen permiso de borrado.
