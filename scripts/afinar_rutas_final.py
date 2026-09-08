from pathlib import Path

rutas_path = Path('rutas.html')
rutas = rutas_path.read_text(encoding='utf-8')
old_copy = 'Las rutas del club y de la comunidad conectan el pueblo con zonas habituales como Sisante, Pozoamargo, Vara de Rey, El Picazo, Tébar y otros municipios de La Mancha conquense.'
new_copy = 'Los recorridos seleccionados conectan el pueblo con zonas habituales como Sisante, Pozoamargo, Vara de Rey, El Picazo, Tébar y otros municipios de La Mancha conquense.'
rutas = rutas.replace(old_copy, new_copy)
rutas_path.write_text(rutas, encoding='utf-8')

js_path = Path('assets/v13.js')
js = js_path.read_text(encoding='utf-8')
needle = "    const difficulty=r.difficulty?`<span class=\"route-metric\"><b>${esc(r.difficulty)}</b><small>Dificultad</small></span>`:'';\n"
insert = needle + "    const isWikilocListing=/\\/rutas\\/(?:ciclismo|mountain-bike)\\/espana\\//.test(url);\n    const sourceLabel=isWikilocListing?'Ver en Wikiloc':'Ver track';\n"
if 'const sourceLabel=isWikilocListing' not in js:
    if needle not in js:
        raise SystemExit('No se encontró el punto de inserción de sourceLabel')
    js = js.replace(needle, insert, 1)
old_link = '${url?`<a class="btn secondary" target="_blank" rel="noopener" href="${esc(url)}">Ver track</a>`:\'\'}'
new_link = '${url?`<a class="btn secondary" target="_blank" rel="noopener" href="${esc(url)}">${esc(sourceLabel)}</a>`:\'\'}'
if old_link in js:
    js = js.replace(old_link, new_link, 1)
elif new_link not in js:
    raise SystemExit('No se encontró el enlace de ruta esperado')
js_path.write_text(js, encoding='utf-8')

visible = rutas_path.read_text(encoding='utf-8').lower()
for term in ['ruta de la comunidad', 'rutas del club y de la comunidad', 'sin tocar el html', 'gestión preparada', 'panel de contenidos', 'panel conectado a github']:
    if term in visible:
        raise SystemExit('Sigue visible un texto no deseado: ' + term)
print('Ajuste final de rutas aplicado.')
