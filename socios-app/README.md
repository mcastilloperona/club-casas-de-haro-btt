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

Ejecutar `supabase/001_profiles.sql` en el SQL Editor de Supabase antes de activar el modo real.

## Compilación

`npm run build` genera la preview dentro de `../v14/socios/`.
