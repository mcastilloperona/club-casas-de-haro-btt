# Área de socios · Club Casas de Haro BTT

Aplicación React para el área privada del club.

## Estado

- Producción (`/socios/`): mantiene el cartel de «En construcción».
- Preview (`/v14/socios/`): fase 1 de acceso, aprobación y roles.
- Con `VITE_SOCIOS_ENABLED=false`, la preview funciona con datos de demostración.
- Con `VITE_SOCIOS_ENABLED=true`, utiliza Supabase Auth y la tabla `profiles`.

## Desarrollo

1. Copiar `.env.example` a `.env` y completar las variables.
2. Ejecutar `npm install`.
3. Ejecutar `npm run dev`.

## Base de datos

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
