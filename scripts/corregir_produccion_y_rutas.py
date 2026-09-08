from pathlib import Path
import json
import re

ROOT = Path('.')
ROUTES_PATH = ROOT / 'data/routes.json'
SITE_PATH = ROOT / 'data/site.json'
JS_PATH = ROOT / 'assets/v13.js'

WIKILOC_BTT = 'https://es.wikiloc.com/rutas/mountain-bike/espana/castilla-la-mancha/ruiperez'
WIKILOC_ROAD = 'https://es.wikiloc.com/rutas/ciclismo/espana/castilla-la-mancha/los-pavos'

new_routes = [
    {
        'id': 'torcas-senda-sisante', 'published': True, 'discipline': 'btt',
        'title': 'Casas de Haro · Torcas · Senda de Sisante',
        'description': 'Ruta circular con tramos de senda y zonas técnicas en el entorno de Sisante.',
        'route_type': 'community', 'author': 'waksmen', 'distance_km': '59,76',
        'elevation_m': 489, 'difficulty': 'Difícil', 'source': 'Wikiloc',
        'source_url': 'https://es.wikiloc.com/rutas-mountain-bike/casas-de-haro-torcas-senda-sisante-19191076', 'gpx': ''
    },
    {
        'id': 'pozoamargo-benitez-trasvase-batanejo-lalosa', 'published': True, 'discipline': 'btt',
        'title': 'Pozo Amargo · Casas de Benítez · Trasvase · Batanejo · La Losa',
        'description': 'Recorrido por caminos de Casas de Haro hacia Pozo Amargo, Casas de Benítez y La Losa.',
        'route_type': 'community', 'author': 'Jesús Moya', 'distance_km': '64,49',
        'elevation_m': 241, 'difficulty': 'Moderado', 'source': 'Wikiloc',
        'source_url': 'https://es.wikiloc.com/rutas-mountain-bike/casas-de-haro-pozo-amargo-casas-de-benitez-trasvase-batanejo-la-losa-casas-de-haro-55233270', 'gpx': ''
    },
    {
        'id': 'teatinos-san-clemente-santiaguillo-provencio', 'published': True, 'discipline': 'btt',
        'title': 'Teatinos · San Clemente · Santiaguillo · El Provencio · Los Pinos',
        'description': 'Ruta larga y rodadora desde Casas de Haro por San Clemente, El Provencio y Casas de los Pinos.',
        'route_type': 'community', 'author': 'Javier Parreño Pérez', 'distance_km': '71,34',
        'elevation_m': 100, 'difficulty': '', 'source': 'Wikiloc',
        'source_url': 'https://es.wikiloc.com/rutas-mountain-bike/casas-de-haro-teatinos-san-clemente-castillo-de-santiaguillo-el-provencio-los-pinos-casas-de-haro-30741866', 'gpx': ''
    },
    {
        'id': 'lalosa-villalgordo-elcarmen', 'published': True, 'discipline': 'btt',
        'title': 'Casas de Haro · La Losa · Villalgordo · El Carmen',
        'description': 'Ruta BTT circular por La Losa, Villalgordo y El Carmen.',
        'route_type': 'community', 'author': 'Javier Parreño Pérez', 'distance_km': '58,58',
        'elevation_m': 230, 'difficulty': 'Moderado', 'source': 'Wikiloc',
        'source_url': WIKILOC_BTT, 'gpx': ''
    },
    {
        'id': 'fuensanta-laroda', 'published': True, 'discipline': 'btt',
        'title': 'Casas de Haro · Fuensanta · La Roda',
        'description': 'Recorrido BTT de perfil rodador hacia Fuensanta y La Roda.',
        'route_type': 'community', 'author': 'Javier Parreño Pérez', 'distance_km': '53,29',
        'elevation_m': 143, 'difficulty': 'Moderado', 'source': 'Wikiloc',
        'source_url': WIKILOC_BTT, 'gpx': ''
    },
    {
        'id': 'elsimarro-varaderey', 'published': True, 'discipline': 'btt',
        'title': 'Casas de Haro · El Simarro · Vara de Rey',
        'description': 'Opción BTT más corta desde Casas de Haro por El Simarro y Vara de Rey.',
        'route_type': 'community', 'author': 'Javier Parreño Pérez', 'distance_km': '32,21',
        'elevation_m': 196, 'difficulty': '', 'source': 'Wikiloc',
        'source_url': WIKILOC_BTT, 'gpx': ''
    },
    {
        'id': 'road-pantano-alarcon', 'published': True, 'discipline': 'road',
        'title': 'Casas de Haro · Pantano de Alarcón',
        'description': 'Ruta de carretera desde Casas de Haro hacia el entorno del pantano de Alarcón.',
        'route_type': 'community', 'author': 'MiguelCastilloPerona', 'distance_km': '87,72',
        'elevation_m': 531, 'difficulty': '', 'source': 'Wikiloc', 'source_url': WIKILOC_ROAD, 'gpx': ''
    },
    {
        'id': 'road-casa-simarro', 'published': True, 'discipline': 'road',
        'title': 'Casas de Haro · Casa Simarro',
        'description': 'Recorrido de carretera de media distancia por el entorno de Casas de Haro y Casa Simarro.',
        'route_type': 'community', 'author': 'MiguelCastilloPerona', 'distance_km': '46,63',
        'elevation_m': 307, 'difficulty': '', 'source': 'Wikiloc', 'source_url': WIKILOC_ROAD, 'gpx': ''
    },
    {
        'id': 'road-alarcon-larga', 'published': True, 'discipline': 'road',
        'title': 'Casas de Haro · Alarcón',
        'description': 'Ruta larga de carretera pasando por Casas de Fernando Alonso, San Clemente, Cañada Juncosa, Tébar y Alarcón.',
        'route_type': 'community', 'author': 'MiguelCastilloPerona', 'distance_km': '119,88',
        'elevation_m': 682, 'difficulty': '', 'source': 'Wikiloc', 'source_url': WIKILOC_ROAD, 'gpx': ''
    },
    {
        'id': 'road-varaderey-sisante', 'published': True, 'discipline': 'road',
        'title': 'Casas de Haro · Vara de Rey · Sisante',
        'description': 'Vuelta de carretera más corta desde Casas de Haro por Vara de Rey y Sisante.',
        'route_type': 'community', 'author': 'MiguelCastilloPerona', 'distance_km': '38,97',
        'elevation_m': 165, 'difficulty': '', 'source': 'Wikiloc', 'source_url': WIKILOC_ROAD, 'gpx': ''
    },
    {
        'id': 'road-lospavos-ruiperez', 'published': True, 'discipline': 'road',
        'title': 'Los Pavos · Ruipérez',
        'description': 'Ruta de carretera de distancia contenida por el entorno inmediato de Casas de Haro.',
        'route_type': 'community', 'author': 'MiguelCastilloPerona', 'distance_km': '43,22',
        'elevation_m': 279, 'difficulty': '', 'source': 'Wikiloc', 'source_url': WIKILOC_ROAD, 'gpx': ''
    },
    {
        'id': 'road-castillo-pantano-ruiperez', 'published': True, 'discipline': 'road',
        'title': 'Castillo de Alarcón · Pantano de Alarcón · Ruipérez',
        'description': 'Recorrido de carretera por el Castillo de Alarcón y el pantano, con regreso hacia Ruipérez.',
        'route_type': 'community', 'author': 'MiguelCastilloPerona', 'distance_km': '87,39',
        'elevation_m': 551, 'difficulty': '', 'source': 'Wikiloc', 'source_url': WIKILOC_ROAD, 'gpx': ''
    }
]

# 1. Ampliar rutas sin duplicados
routes = json.loads(ROUTES_PATH.read_text(encoding='utf-8'))
by_id = {r.get('id'): r for r in routes}
for r in new_routes:
    by_id[r['id']] = r
# Mantener primero las rutas ya existentes y añadir las nuevas al final.
existing_ids = [r.get('id') for r in routes]
merged = [by_id[i] for i in existing_ids if i in by_id]
merged += [r for r in new_routes if r['id'] not in existing_ids]
ROUTES_PATH.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# 2. Limpiar textos técnicos visibles de Rutas
rutas_path = ROOT / 'rutas.html'
rutas = rutas_path.read_text(encoding='utf-8')
rutas = rutas.replace(
    'Tracks de bicicleta de montaña por Casas de Haro y su entorno. Cuando tengamos el GPX propio, podrás descargarlo directamente.',
    'Selección de rutas BTT por Casas de Haro y su entorno, con distancia, desnivel y acceso a la información de cada recorrido.'
)
rutas = rutas.replace(
    'Recorridos de carretera con salida desde Casas de Haro. Los nuevos tracks aparecerán aquí sin tocar el HTML.',
    'Rutas de carretera por Casas de Haro y su entorno, con recorridos de distinta distancia para disfrutar de La Mancha sobre el asfalto.'
)
rutas = re.sub(r'<div class="content-note"><b>Gestión preparada:</b>.*?</div>', '', rutas, flags=re.S)
rutas_path.write_text(rutas, encoding='utf-8')

# 3. Encabezado neutro para la próxima salida en portada
index_path = ROOT / 'index.html'
index = index_path.read_text(encoding='utf-8')
index = index.replace(
    '<section class="section" id="proxima-ruta"><div class="wrap"><div class="kicker">Rutas BTT</div><h2>De Casas de Haro al camino</h2>',
    '<section class="section" id="proxima-ruta"><div class="wrap"><div class="kicker">Próxima salida</div><h2>De Casas de Haro al camino</h2>'
)
index_path.write_text(index, encoding='utf-8')

# 4. Google Maps visible directamente, sin paso intermedio
historia_path = ROOT / 'historia.html'
historia = historia_path.read_text(encoding='utf-8')
map_section = '''<!-- GOOGLE_MAP_SECTION_START -->
<section class="section location-section" id="donde-estamos">
  <div class="wrap">
    <div class="kicker">Dónde estamos</div>
    <h2>Casas de Haro, Cuenca</h2>
    <p class="lead">Casas de Haro es nuestro punto de partida para disfrutar del BTT y la carretera por los caminos y paisajes de La Mancha conquense.</p>
    <div class="google-map-card">
      <iframe class="google-map-frame" src="https://www.google.com/maps?q=Casas%20de%20Haro%2C%20Cuenca%2C%20Espa%C3%B1a&amp;output=embed" title="Mapa de Casas de Haro en Google Maps" loading="eager" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
      <div class="google-map-actions" style="padding:18px">
        <a class="btn dark" href="https://www.google.com/maps/search/?api=1&amp;query=Casas+de+Haro%2C+Cuenca" target="_blank" rel="noopener">Abrir en Google Maps</a>
      </div>
    </div>
  </div>
</section>
<!-- GOOGLE_MAP_SECTION_END -->'''
historia, nmap = re.subn(r'<!-- GOOGLE_MAP_SECTION_START -->.*?<!-- GOOGLE_MAP_SECTION_END -->', map_section, historia, flags=re.S)
if nmap != 1:
    raise SystemExit(f'No se pudo sustituir de forma única el mapa: {nmap}')
historia = historia.replace('<script src="assets/mapa-google.js" defer></script>\n', '')
historia_path.write_text(historia, encoding='utf-8')

# 5. Textos legales coherentes con el mapa automático
privacy_path = ROOT / 'privacidad.html'
privacy = privacy_path.read_text(encoding='utf-8')
privacy = privacy.replace(
    '<li><strong>Google Maps:</strong> el mapa no se conecta con Google hasta que la persona pulsa voluntariamente «Cargar mapa de Google» o abre el enlace externo. Desde ese momento, Google puede recibir información técnica conforme a sus propias políticas.</li>',
    '<li><strong>Google Maps:</strong> la página Historia integra un mapa de Google Maps. Al visitar esa página, Google puede recibir información técnica necesaria para mostrar el mapa conforme a sus propias políticas.</li>'
)
privacy = privacy.replace(
    'Google Maps solo interviene después de una acción voluntaria. Al cargar el mapa o abrir enlaces de Telegram, Wikiloc, Garmin u otros terceros, el tratamiento se rige también por las políticas del servicio correspondiente.',
    'Google Maps interviene al cargar la página Historia, donde el mapa está integrado. Al utilizar el mapa o abrir enlaces de Telegram, Wikiloc, Garmin u otros terceros, el tratamiento se rige también por las políticas del servicio correspondiente.'
)
privacy_path.write_text(privacy, encoding='utf-8')

cookies_path = ROOT / 'cookies.html'
cookies = cookies_path.read_text(encoding='utf-8')
cookies = cookies.replace(
    'El sitio se sirve mediante GitHub Pages y la página de rutas solicita información meteorológica a Open-Meteo. El mapa de Google de la página Historia permanece bloqueado hasta que la persona pulsa voluntariamente el botón para cargarlo. Estas integraciones no se utilizan por el colectivo para crear perfiles publicitarios ni para medir el comportamiento de navegación.',
    'El sitio se sirve mediante GitHub Pages y la página de rutas solicita información meteorológica a Open-Meteo. La página Historia integra un mapa de Google Maps que se carga al acceder a esa página. Estas integraciones no se utilizan por el colectivo para crear perfiles publicitarios ni para medir el comportamiento de navegación.'
)
cookies = cookies.replace(
    'Los botones y enlaces a Telegram, Wikiloc, Garmin, patrocinadores, Google Maps y otros servicios solo conectan con esos terceros cuando la persona los pulsa. Al cargar el mapa o visitar dichos sitios, estos servicios pueden utilizar cookies u otras tecnologías conforme a sus propias políticas y a la configuración del navegador.',
    'Los botones y enlaces a Telegram, Wikiloc, Garmin, patrocinadores y otros servicios conectan con esos terceros cuando la persona los utiliza. Google Maps está integrado en la página Historia y puede utilizar cookies u otras tecnologías conforme a sus propias políticas y a la configuración del navegador.'
)
cookies_path.write_text(cookies, encoding='utf-8')

# 6. Sincronizar el fallback local del JavaScript con el contenido real actual
site = json.loads(SITE_PATH.read_text(encoding='utf-8'))
news = json.loads((ROOT / 'data/news.json').read_text(encoding='utf-8'))
gallery = json.loads((ROOT / 'data/gallery.json').read_text(encoding='utf-8'))
local_data = {
    'data/site.json': site,
    'data/routes.json': merged,
    'data/news.json': news,
    'data/gallery.json': gallery,
}
js = JS_PATH.read_text(encoding='utf-8')
replacement = 'const LOCAL_DATA=' + json.dumps(local_data, ensure_ascii=False, separators=(',', ':')) + ';\n  async function json'
js, nlocal = re.subn(r'const LOCAL_DATA=\{.*?\};\n  async function json', replacement, js, count=1, flags=re.S)
if nlocal != 1:
    raise SystemExit(f'No se pudo sincronizar LOCAL_DATA: {nlocal}')
# Etiqueta más precisa para enlaces de Wikiloc.
old = "const difficulty=r.difficulty?`<span class=\\\"route-metric\\\"><b>${esc(r.difficulty)}</b><small>Dificultad</small></span>`:'';\n    return `<article class=\\\"route-card\\\""
new = "const difficulty=r.difficulty?`<span class=\\\"route-metric\\\"><b>${esc(r.difficulty)}</b><small>Dificultad</small></span>`:'';\n    const sourceLabel=String(r.source||'').toLowerCase()==='wikiloc'?'Ver en Wikiloc':'Ver track';\n    return `<article class=\\\"route-card\\\""
if old not in js:
    raise SystemExit('No se encontró el punto esperado para sourceLabel')
js = js.replace(old, new, 1)
js = js.replace('>${esc(url)}\\">Ver track</a>`:\'\'}</div></article>`;', '>${esc(url)}\\">${esc(sourceLabel)}</a>`:\'\'}</div></article>`;', 1)
JS_PATH.write_text(js, encoding='utf-8')

# 7. Validaciones de contenido publicado
final_routes = json.loads(ROUTES_PATH.read_text(encoding='utf-8'))
btt_count = sum(1 for r in final_routes if r.get('published', True) and r.get('discipline') == 'btt')
road_count = sum(1 for r in final_routes if r.get('published', True) and r.get('discipline') == 'road')
if btt_count != 12 or road_count != 6:
    raise SystemExit(f'Conteo inesperado de rutas: BTT={btt_count}, carretera={road_count}')

if 'Casas de Haro · El Picazo · Tébar' in JS_PATH.read_text(encoding='utf-8') or '"distance_km":144' in JS_PATH.read_text(encoding='utf-8'):
    raise SystemExit('Sigue presente el fallback antiguo de 144 km')

historia_final = historia_path.read_text(encoding='utf-8')
if '<iframe class="google-map-frame"' not in historia_final or 'data-load-google-map' in historia_final or 'mapa-google.js' in historia_final:
    raise SystemExit('El mapa no ha quedado en carga directa')

if 'Cargar mapa de Google' in privacy_path.read_text(encoding='utf-8') or 'permanece bloqueado' in cookies_path.read_text(encoding='utf-8'):
    raise SystemExit('Los textos legales aún describen el mapa antiguo')

# Buscar lenguaje técnico visible en páginas públicas no legales.
def visible_text(raw: str) -> str:
    raw = re.sub(r'<!--.*?-->', ' ', raw, flags=re.S)
    raw = re.sub(r'<script\b.*?</script>', ' ', raw, flags=re.S|re.I)
    raw = re.sub(r'<style\b.*?</style>', ' ', raw, flags=re.S|re.I)
    raw = re.sub(r'<[^>]+>', ' ', raw)
    return re.sub(r'\s+', ' ', raw).lower()

for name in ['index.html','rutas.html','historia.html','galeria.html','news.html','patrocinadores.html']:
    text = visible_text((ROOT / name).read_text(encoding='utf-8'))
    for forbidden in ['sin tocar el html', 'gestión preparada', 'panel conectado a github', 'archivos de contenido']:
        if forbidden in text:
            raise SystemExit(f'Texto técnico visible en {name}: {forbidden}')

if JS_PATH.read_text(encoding='utf-8').count('const LOCAL_DATA=') != 1:
    raise SystemExit('LOCAL_DATA no aparece exactamente una vez')

print(f'OK: {btt_count} rutas BTT y {road_count} de carretera; textos técnicos retirados; mapa directo; fallback sincronizado.')
