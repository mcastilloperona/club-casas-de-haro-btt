from pathlib import Path

# 1) Portada: Ayuntamiento como patrocinador y Villaciclos sin referencia a colaborador.
p = Path('index.html')
s = p.read_text(encoding='utf-8')
old = s
s = s.replace('<div class="club-partner-copy"><span>COLABORADOR DEL CLUB</span><h3>Ayuntamiento de Casas de Haro</h3><p>Descubre Casas de Haro en Turismo de Castilla-La Mancha.</p></div>', '<div class="club-partner-copy"><span>PATROCINADOR DEL CLUB</span><h3>Ayuntamiento de Casas de Haro</h3><p>Gracias por apoyar al Club Casas de Haro BTT y al deporte en nuestro pueblo.</p></div>')
s = s.replace('<div class="club-partner-copy"><span>PATROCINADOR DEL CLUB</span><h3>Villaciclos</h3><p>Tienda y taller ciclista desde 1991. Colaborador del club y referente para los amantes de la bici.</p></div>', '<div class="club-partner-copy"><span>PATROCINADOR DEL CLUB</span><h3>Villaciclos</h3><p>Tienda y taller ciclista desde 1991 y patrocinador del Club Casas de Haro BTT.</p></div>')
if s == old:
    raise SystemExit('No se encontraron los textos esperados en index.html')
p.write_text(s, encoding='utf-8')

# 2) Patrocinadores: retirar la expresión "máxima visibilidad".
p = Path('patrocinadores.html')
s = p.read_text(encoding='utf-8')
old_text = 'Nuestros patrocinadores hacen posible una parte esencial del proyecto del Club Casas de Haro BTT y cuentan con la máxima visibilidad dentro de nuestros espacios y acciones de patrocinio.'
new_text = 'Nuestros patrocinadores hacen posible una parte esencial del proyecto del Club Casas de Haro BTT y cuentan con un espacio propio y destacado dentro de la web y de las acciones del club.'
if old_text not in s:
    raise SystemExit('No se encontró el texto de patrocinadores esperado')
s = s.replace(old_text, new_text)
p.write_text(s, encoding='utf-8')

# 3) Historia: el mapa de Google Maps se muestra directamente, sin botón previo.
p = Path('historia.html')
s = p.read_text(encoding='utf-8')
start = s.index('<!-- GOOGLE_MAP_SECTION_START -->')
end = s.index('<!-- GOOGLE_MAP_SECTION_END -->') + len('<!-- GOOGLE_MAP_SECTION_END -->')
new_section = '''<!-- GOOGLE_MAP_SECTION_START -->
<section class="section location-section" id="donde-estamos">
  <div class="wrap">
    <div class="kicker">Dónde estamos</div>
    <h2>Casas de Haro, Cuenca</h2>
    <p class="lead">Casas de Haro es nuestro punto de partida para disfrutar del BTT y la carretera por los caminos y paisajes de La Mancha conquense.</p>
    <div class="google-map-card">
      <iframe class="google-map-frame" src="https://www.google.com/maps?q=Casas%20de%20Haro%2C%20Cuenca%2C%20Espa%C3%B1a&output=embed" title="Mapa de Casas de Haro en Google Maps" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
      <div class="google-map-actions google-map-actions-loaded">
        <a class="btn dark" href="https://www.google.com/maps/search/?api=1&query=Casas+de+Haro%2C+Cuenca" target="_blank" rel="noopener">Abrir en Google Maps</a>
      </div>
    </div>
  </div>
</section>
<!-- GOOGLE_MAP_SECTION_END -->'''
s = s[:start] + new_section + s[end:]
p.write_text(s, encoding='utf-8')

# 4) Ajuste visual mínimo para el enlace situado bajo el mapa.
p = Path('assets/v13.css')
s = p.read_text(encoding='utf-8')
marker = '/* GOOGLE_MAP_ALWAYS_LOADED */'
if marker not in s:
    s += '\n' + marker + '\n.google-map-actions-loaded{padding:0 18px 18px;margin-top:18px}\n'
p.write_text(s, encoding='utf-8')

# 5) Privacidad: reflejar que Google Maps se carga automáticamente.
p = Path('privacidad.html')
s = p.read_text(encoding='utf-8')
s = s.replace('<li><strong>Previsión meteorológica:</strong> la página de rutas consulta la API de Open-Meteo. El proveedor indica que puede registrar direcciones IP con fines técnicos y de prevención de abusos.</li>', '<li><strong>Previsión meteorológica:</strong> la página de rutas consulta la API de Open-Meteo. El proveedor indica que puede registrar direcciones IP con fines técnicos y de prevención de abusos.</li><li><strong>Google Maps:</strong> la página Historia incorpora un mapa incrustado que se carga automáticamente. Al mostrarse, el navegador realiza una conexión con servicios de Google, que puede recibir información técnica como la dirección IP, el dispositivo o datos de navegación conforme a sus propias políticas.</li>')
s = s.replace('Pueden intervenir proveedores necesarios para el funcionamiento del sitio, como GitHub Pages y Open-Meteo.', 'Pueden intervenir proveedores necesarios para el funcionamiento del sitio, como GitHub Pages, Open-Meteo y Google Maps.')
p.write_text(s, encoding='utf-8')

# 6) Cookies: reflejar la carga automática del mapa y evitar afirmar que todos los terceros solo se activan al pulsar.
p = Path('cookies.html')
s = p.read_text(encoding='utf-8')
s = s.replace('<p>El sitio se sirve mediante GitHub Pages. La página de rutas solicita información meteorológica a Open-Meteo. Esta integración no se utiliza para crear perfiles publicitarios ni para medir el comportamiento de navegación.</p>', '<p>El sitio se sirve mediante GitHub Pages. La página de rutas solicita información meteorológica a Open-Meteo. La página Historia incorpora un mapa incrustado de Google Maps que se carga automáticamente al visualizar la sección. Estas integraciones no se utilizan por el club para crear perfiles publicitarios ni para medir el comportamiento de navegación.</p>')
s = s.replace('<p>Los botones y enlaces a Telegram, Wikiloc, patrocinadores y otros servicios solo llevan a esos sitios cuando la persona los pulsa. Una vez fuera de casasdeharobtt.es, esos proveedores pueden utilizar sus propias cookies conforme a sus políticas.</p>', '<p>Los botones y enlaces a Telegram, Wikiloc, patrocinadores y otros servicios llevan a esos sitios cuando la persona los pulsa. Google Maps, en cambio, está incrustado en la página Historia y se carga automáticamente. Los servicios de terceros pueden utilizar cookies u otras tecnologías conforme a sus propias políticas y a la configuración del navegador.</p>')
p.write_text(s, encoding='utf-8')

# Validaciones de alcance.
idx = Path('index.html').read_text(encoding='utf-8')
if '<span>COLABORADOR DEL CLUB</span><h3>Ayuntamiento de Casas de Haro</h3>' in idx:
    raise SystemExit('El Ayuntamiento sigue marcado como colaborador')
if 'Colaborador del club y referente' in idx:
    raise SystemExit('Villaciclos sigue descrito como colaborador')
if 'máxima visibilidad' in Path('patrocinadores.html').read_text(encoding='utf-8'):
    raise SystemExit('Sigue presente máxima visibilidad')
h = Path('historia.html').read_text(encoding='utf-8')
if 'Cargar Google Maps' in h or 'data-load-google-map' in h:
    raise SystemExit('El mapa sigue requiriendo carga manual')
if '<iframe class="google-map-frame"' not in h:
    raise SystemExit('No se encontró el mapa incrustado')
print('Ajustes aplicados correctamente')
