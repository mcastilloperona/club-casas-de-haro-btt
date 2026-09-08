from pathlib import Path
import re


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'No se encontró el bloque esperado: {label}')
    return text.replace(old, new, 1)

# 1. Mejorar las tarjetas de rutas y eliminar la etiqueta "Ruta de la comunidad"
js_path = Path('assets/v13.js')
js = js_path.read_text(encoding='utf-8')
old_func = '''  function routeCard(r){
    const url=safeUrl(r.source_url); const gpx=r.gpx?relPath(r.gpx):'';
    const kind=r.route_type==='club'?'Ruta del Club':'Ruta de la comunidad';
    const author=r.author?`<span>Autor: ${esc(r.author)}</span>`:'';
    const meta=[r.distance_km?`<b>${esc(r.distance_km)} km</b>`:'',r.elevation_m!==''&&r.elevation_m!=null?`<span>+${esc(r.elevation_m)} m</span>`:'',r.difficulty?`<span>${esc(r.difficulty)}</span>`:''].filter(Boolean).join('');
    return `<article class="route-card"><span class="pill">${esc(kind)}</span><h3>${esc(r.title)}</h3>${r.description?`<p>${esc(r.description)}</p>`:''}<div class="meta">${meta}</div><p class="route-source">${author}${r.source?`<span>Fuente: ${esc(r.source)}</span>`:''}</p><div class="route-actions">${gpx?`<a class="btn" href="${esc(gpx)}" download>Descargar GPX</a>`:''}${url?`<a class="btn secondary" target="_blank" rel="noopener" href="${esc(url)}">Ver track</a>`:''}</div></article>`;
  }
'''
new_func = '''  function routeCard(r){
    const url=safeUrl(r.source_url); const gpx=r.gpx?relPath(r.gpx):'';
    const isClub=r.route_type==='club';
    const kind=isClub?'RUTA DEL CLUB':String(r.source||'Wikiloc').toUpperCase();
    const originClass=isClub?'route-origin-club':'route-origin-external';
    const author=r.author?`<span>Autor: ${esc(r.author)}</span>`:'';
    const distance=r.distance_km?`<span class="route-metric"><b>${esc(r.distance_km)} km</b><small>Distancia</small></span>`:'';
    const elevation=r.elevation_m!==''&&r.elevation_m!=null?`<span class="route-metric"><b>+${esc(r.elevation_m)} m</b><small>Desnivel</small></span>`:'';
    const difficulty=r.difficulty?`<span class="route-metric"><b>${esc(r.difficulty)}</b><small>Dificultad</small></span>`:'';
    return `<article class="route-card"><span class="pill route-origin ${originClass}">${esc(kind)}</span><h3>${esc(r.title)}</h3>${r.description?`<p class="route-description">${esc(r.description)}</p>`:''}<div class="meta route-metrics">${distance}${elevation}${difficulty}</div><p class="route-source">${author}${r.source?`<span>Fuente: ${esc(r.source)}</span>`:''}</p><div class="route-actions">${gpx?`<a class="btn" href="${esc(gpx)}" download>Descargar GPX</a>`:''}${url?`<a class="btn secondary" target="_blank" rel="noopener" href="${esc(url)}">Ver track</a>`:''}</div></article>`;
  }
'''
js = replace_once(js, old_func, new_func, 'routeCard')
if 'Ruta de la comunidad' in js:
    raise SystemExit('Sigue apareciendo "Ruta de la comunidad" en assets/v13.js')
js_path.write_text(js, encoding='utf-8')

# 2. Añadir estilos de mayor contraste y tarjetas más compactas en Rutas
rutas_path = Path('rutas.html')
rutas = rutas_path.read_text(encoding='utf-8')
route_style = '''
<style id="routes-visual-v13">
/* MEJORA_RUTAS_VISUAL_START */
.route-card{min-height:0!important;padding:22px!important;border:1px solid #d9e5ea!important;border-radius:22px!important;box-shadow:0 10px 28px #09233b0d!important}
.route-card .route-origin{align-self:flex-start!important;padding:7px 12px!important;border-radius:999px!important;font-size:11px!important;line-height:1!important;font-weight:900!important;letter-spacing:.11em!important;color:#fff!important;border:0!important}
.route-card .route-origin-external{background:#06264b!important;color:#fff!important}
.route-card .route-origin-club{background:#087fa6!important;color:#fff!important}
.route-card h3{font-size:22px!important;line-height:1.22!important;margin:15px 0 9px!important;color:#06264b!important}
.route-card .route-description{margin:0 0 4px!important;color:#42525e!important;line-height:1.5!important;font-size:15px!important}
.route-card .route-metrics{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;margin:16px 0 14px!important}
.route-card .route-metric{display:flex!important;flex-direction:column!important;gap:3px!important;padding:10px 9px!important;background:#f1f7f9!important;border:1px solid #e0ebef!important;border-radius:12px!important;min-width:0!important}
.route-card .route-metric b{font-size:16px!important;line-height:1.15!important;color:#06264b!important;white-space:normal!important}
.route-card .route-metric small{font-size:10px!important;line-height:1.1!important;text-transform:uppercase!important;letter-spacing:.06em!important;color:#70808b!important;font-weight:800!important}
.route-card .route-source{display:flex!important;flex-wrap:wrap!important;gap:5px 16px!important;margin:0 0 14px!important;color:#7a8993!important;font-size:12px!important;line-height:1.35!important}
.route-card .route-actions{display:flex!important;gap:8px!important;flex-wrap:wrap!important;margin-top:auto!important}
.route-card .route-actions .btn{margin-top:0!important;padding:11px 15px!important;font-size:13px!important}
@media(max-width:760px){
 .route-card{padding:20px!important;border-radius:20px!important}
 .route-card h3{font-size:21px!important}
 .route-card .route-metrics{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important}
 .route-card .route-metric{padding:9px 7px!important}
 .route-card .route-metric b{font-size:15px!important}
}
@media(max-width:390px){
 .route-card .route-metrics{grid-template-columns:1fr!important}
 .route-card .route-metric{flex-direction:row!important;align-items:baseline!important;justify-content:space-between!important}
}
/* MEJORA_RUTAS_VISUAL_END */
</style>
'''
if 'id="routes-visual-v13"' in rutas:
    rutas = re.sub(r'<style id="routes-visual-v13">.*?</style>\s*', route_style, rutas, count=1, flags=re.S)
else:
    rutas = replace_once(rutas, '</head>', route_style + '</head>', 'cierre head de rutas.html')
rutas_path.write_text(rutas, encoding='utf-8')

# 3. Corregir la presentación móvil de los logos de patrocinadores sin tocar escritorio ni portada
pat_path = Path('patrocinadores.html')
pat = pat_path.read_text(encoding='utf-8')
sponsor_style = '''
<style id="sponsor-mobile-fix-v13">
/* SPONSOR_MOBILE_FIX_START */
@media(max-width:760px){
 .sponsor-priority-section .sponsors{grid-template-columns:1fr!important;gap:16px!important}
 .sponsor-priority-section .sponsor{width:100%!important;min-height:210px!important;height:auto!important;padding:24px!important;overflow:hidden!important;border-radius:20px!important;background:#fff!important}
 .sponsor-priority-section .sponsor img{display:block!important;width:100%!important;max-width:320px!important;height:150px!important;max-height:none!important;object-fit:contain!important;object-position:center center!important;margin:0 auto!important}
}
@media(max-width:420px){
 .sponsor-priority-section .sponsor{min-height:190px!important;padding:20px!important}
 .sponsor-priority-section .sponsor img{height:140px!important;max-width:290px!important}
}
/* SPONSOR_MOBILE_FIX_END */
</style>
'''
if 'id="sponsor-mobile-fix-v13"' in pat:
    pat = re.sub(r'<style id="sponsor-mobile-fix-v13">.*?</style>\s*', sponsor_style, pat, count=1, flags=re.S)
else:
    pat = replace_once(pat, '</head>', sponsor_style + '</head>', 'cierre head de patrocinadores.html')
pat_path.write_text(pat, encoding='utf-8')

# Validaciones de alcance
rutas_check = rutas_path.read_text(encoding='utf-8')
pat_check = pat_path.read_text(encoding='utf-8')
js_check = js_path.read_text(encoding='utf-8')
if 'Wikiloc' not in js_check or 'route-origin-external' not in js_check:
    raise SystemExit('No quedó aplicada la nueva identificación de rutas externas')
if 'Ruta de la comunidad' in js_check:
    raise SystemExit('Queda una etiqueta antigua de comunidad')
if 'MEJORA_RUTAS_VISUAL_START' not in rutas_check:
    raise SystemExit('No se añadieron los estilos de rutas')
if 'SPONSOR_MOBILE_FIX_START' not in pat_check:
    raise SystemExit('No se añadió la corrección móvil de patrocinadores')
print('Cambios aplicados: assets/v13.js, rutas.html y patrocinadores.html')
