# SEO Watch Casas de Haro

Monitor SEO automático de casasdeharobtt.es.

## Qué hace

Se ejecuta cada lunes y también cuando cambian páginas SEO relevantes. Comprueba title, description, H1, canonical, robots, sitemap, imágenes sin alt y presencia de la señal local Casas de Haro.

Cuando Search Console está conectado, compara los últimos 28 días con los 28 anteriores, vigila consultas objetivo, inspecciona las URL prioritarias y publica el resultado en el issue SEO Watch Casas de Haro.

No genera tráfico, búsquedas ni clics artificiales.

## Consultas objetivo

- casas de haro
- casas de haro cuenca
- btt casas de haro
- rutas casas de haro
- ciclismo casas de haro
- club casas de haro btt

## Conectar Google Search Console

El workflow necesita una cuenta de servicio con acceso a la propiedad de Search Console.

1. En Google Cloud, habilitar Google Search Console API.
2. Crear una cuenta de servicio y una clave JSON.
3. Añadir el correo de esa cuenta de servicio como usuario de la propiedad casasdeharobtt.es en Search Console.
4. En GitHub: Settings > Secrets and variables > Actions > New repository secret.
5. Crear el secreto GSC_SERVICE_ACCOUNT_JSON y pegar el JSON completo de la clave.
6. Opcional: crear la variable GSC_SITE_URL si se quiere fijar una propiedad concreta. Si no existe, el script intenta detectar sc-domain:casasdeharobtt.es o https://casasdeharobtt.es/.

El workflow usa el scope oficial webmasters. En ejecuciones disparadas por cambios de contenido intenta reenviar el sitemap; en la ejecución semanal solo consulta datos.

## Informes

Cada ejecución añade el informe al resumen de GitHub Actions, guarda un artefacto seo-watch-report durante 30 días y crea o comenta el issue SEO Watch Casas de Haro.
