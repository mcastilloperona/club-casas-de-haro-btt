# Área de socios · V14.1

Aplicación privada del Club Casas de Haro BTT para gestionar socios, salidas,
inscripciones, chat y avisos internos.

## Modo seguro

La compilación pública utiliza `VITE_SOCIOS_ENABLED=false` y muestra una pantalla
de «En construcción». Para activar la aplicación:

1. Ejecutar `supabase/migrations/20260912_v14_socios.sql` en Supabase.
2. Registrar la primera cuenta y asignarle `status='approved'` y `role='admin'`.
3. Configurar `VITE_SOCIOS_ENABLED=true`.
4. Ejecutar `npm run build`.

La clave usada por Vite es la clave pública de Supabase. No se debe incluir nunca
una `service_role` en el frontend ni en el repositorio.
