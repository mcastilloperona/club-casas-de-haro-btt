# Correo al socio tras aprobar su alta (006)

## Funcionamiento

El botón **Aprobar** de `/socios/` ya actualiza `public.profiles.status` a `approved`. La migración `006_member_approval_emails.sql` crea un disparador que almacena una notificación una sola vez cuando el perfil **cambia** a aprobado. El cron `avisos-club` ya existente ejecuta `notify-club` periódicamente, y la versión nueva envía a la dirección registrada un correo individual con un enlace al área de socios. Los reintentos y la protección contra duplicados funcionan del lado del servidor.

La migración **no** manda correo a personas aprobadas con anterioridad. Si se vuelve a aprobar un socio tras haberle revocado acceso, se crea una nueva notificación de aprobación.

## Activación en el proyecto Supabase del club

1. Hacer copia o revisión del esquema y comprobar los nombres reales de columnas en `public.profiles` (`id`, `name`, `email`, `status`, `updated_at`). La aplicación usa `name`; el antiguo `001_profiles.sql` documentaba `full_name`, pero no se debe asumir que siga siendo el esquema de producción.
2. Aplicar `socios-app/supabase/006_member_approval_emails.sql` con el SQL Editor o el plugin Supabase. No repetir los scripts `001`/`002` sobre datos de producción.
3. Asegurar que `notify-club` dispone de `RESEND_API_KEY`, `MAIL_FROM`, `WEBHOOK_SECRET` y `SITE_URL=https://casasdeharobtt.es` ya existentes; nunca subir secretos al repositorio.
4. Desplegar el código actualizado de `socios-app/supabase/functions/notify-club/index.ts` como Edge Function `notify-club`, manteniendo el método de autenticación actual mediante `x-webhook-secret`. No crear otro cron: conservar `avisos-club` (cada minuto).
5. Inspeccionar en Supabase si el webhook heredado `notify-membership` envía emails también durante las aprobaciones. Si continúa operativo, evitar doble envío: desactivar únicamente el evento `UPDATE` de ese webhook, o actualizar la función para que esa rama ignore aprobaciones; mantener cualquier evento `INSERT` de nuevas solicitudes para el administrador.
6. Probar con una cuenta de prueba realmente pendiente. Aprobarla desde la web. Comprobar que se genera una fila `pending` en `club_member_approval_jobs`, que el cron devuelve `approvalSent: 1`, que pasa a `sent` y, **especialmente**, que Resend registra entrega y llega a la bandeja de entrada del socio.
7. Verificar que no se envía por editar otros datos del socio, rechazar solicitudes o reaprobar accidentalmente el mismo estado. En caso de error, revisar `last_error` y los logs de `notify-club`.

## Consultas sin exponer datos personales

```sql
select state,attempts,created_at,sent_at,last_error
from public.club_member_approval_jobs
order by created_at desc limit 20;

select status,count(*)
from public.profiles
group by status;
```

`state='sent'` acredita aceptación por Resend, **no entrega garantizada**. Consultar los eventos de entrega/rebote del proveedor.

## Estado de despliegue

GitHub contiene el código y la migración. La fusión a `main` **no** modifica Supabase ni despliega la función. La activación y el test extremo a extremo deben realizarse expresamente mediante el proyecto Supabase conectado.
