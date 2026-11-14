# Salir

Web meteorológica instalable: pronóstico local, ventanas para correr, radar reciente y análisis de rutas GPX/TCX para bici.

Dirección: https://casasdeharobtt.es/salir/

La página no tiene enlace visible en el menú del club ni se añade al sitemap. Incluye noindex. Sigue siendo pública para quien conozca la dirección; estas medidas no equivalen a autenticación.

## Actualizar

1. Editar los archivos de esta carpeta.
2. Incrementar `salir/VERSION`.
3. Ejecutar `node tools/build-salir.mjs` desde la raíz.
4. Ejecutar `node --test tools/salir-tests/*.test.mjs`.
5. Publicar los cambios en `main`, siguiendo el procedimiento existente de GitHub Pages.

Las versiones previas se alojaban en un Site independiente. A partir de 1.4, este directorio de GitHub es la fuente para esta dirección.

## Datos

Open-Meteo: pronóstico y búsqueda, consultados directamente desde el navegador. RainViewer: radar reciente con atribución. OpenStreetMap: mapa base. Leaflet 1.9.4 y su licencia se incluyen localmente. Las consultas necesitan conexión. Los datos guardados se identifican como tales y no generan recomendaciones nuevas.

El GPX/TCX se procesa en la pestaña; solo las coordenadas muestreadas se envían al proveedor de previsión. La ubicación y las preferencias se guardan en el navegador del visitante.
