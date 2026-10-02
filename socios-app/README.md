# Área de socios · Club Casas de Haro BTT

Aplicación React para el área privada del club.

## Estado

- Producción (`/socios/`): mantiene el cartel de «En construcción».
- Preview (`/v14/socios/`): fase 1 de acceso, aprobación y roles; compilación conectada al proyecto `tjdtbsroqpbpkyysqjuv`.
- La tabla actual utiliza `name` y las columnas `id`, `email`, `status`, `role`, `created_at`, `updated_at`. Las actualizaciones no requieren `approved_at` ni `approved_by`.
- En modo conectado no se muestran salidas ni chat de demostración. Esas funciones y los avisos por correo aún están pendientes de activación.
- Con `VITE_SOCIOS_ENABLED=false`, la preview funciona con datos de demostración.
- Con `VITE_SOCIOS_ENABLED=true`, utiliza Supabase Auth y la tabla `profiles`.

## Desarrollo

1. Copiar `.env.example` a `.env` y completar las variables.
2. Ejecutar `npm install`.
3. Ejecutar `npm run dev`.

## Base de datos

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
