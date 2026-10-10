# Avisos administrativos del Club Casas de Haro BTT

La migración `005_admin_email_events.sql` añade avisos de nuevas solicitudes de alta, aprobaciones, rechazos, cambios de rol, nuevas salidas, cancelaciones, inscripciones y bajas. Solo crea trabajos para los perfiles `approved/admin`. No envía correos desde el navegador.

## Activación en Supabase

1. Revisar que `003_email_notifications.sql`, la función `notify-club`, el cron `avisos-club`, `RESEND_API_KEY`, `MAIL_FROM`, `WEBHOOK_SECRET` y `SITE_URL` ya estén configurados (no copiar secretos a GitHub).
2. En el SQL Editor del proyecto, ejecutar `socios-app/supabase/005_admin_email_events.sql` una sola vez. El script es repetible y no modifica los datos de socios.
3. Desplegar la versión modificada de `socios-app/supabase/functions/notify-club/index.ts` como función `notify-club`, usando el mecanismo habitual de Supabase. No crear un segundo cron.
4. Verificar que `avisos-club` sigue ejecutándose una vez por minuto y retorna `adminSent` y `adminFailed` además de `sent` y `failed`.
5. Crear una solicitud de alta real de prueba y comprobar que se genera un trabajo `membership_pending` en `club_admin_email_jobs`. Esperar al cron y comprobar `state='sent'`; confirmar entrega real en Resend y bandeja de entrada.
6. Probar inscripción y baja de una ruta. Los movimientos de rutas tienen un retraso mínimo de dos minutos. Confirmar recepción por el administrador.

## Consultas de diagnóstico

```sql
select event_type,state,attempts,created_at,sent_at,last_error
from public.club_admin_email_jobs order by created_at desc limit 30;
select role,status,count(*) from public.profiles group by role,status;
```

El campo `sent` significa aceptación por Resend, no recepción efectiva. Revisar también spam/rebotes. No ejecutar ninguna función de envío con una API key en el navegador. El sistema actual `notify-membership` es independiente: si ya existe un webhook de altas conectado, debe desactivarse o coordinarse antes de activar estos avisos para evitar duplicados.

**Importante:** Hacer merge en GitHub no aplica SQL ni despliega una Supabase Edge Function. Ambas operaciones requieren acceso al proyecto Supabase.
