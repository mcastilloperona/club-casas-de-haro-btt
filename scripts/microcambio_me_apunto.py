from pathlib import Path

OLD_PAIR = '<a class="btn secondary" href="https://t.me/mcastilloperona" target="_blank" rel="noopener">Telegram</a><a class="btn secondary" href="mailto:mcastillo@casasdeharobtt.es?subject=Quiero%20apuntarme%20a%20la%20pr%C3%B3xima%20salida">Email</a>'
NEW_BUTTON = '<button class="btn secondary signup-open" type="button">¡Me apunto!</button>'

for name in ['index.html', 'rutas.html']:
    path = Path(name)
    text = path.read_text(encoding='utf-8')
    if OLD_PAIR not in text:
        raise SystemExit(f'No se encontró el bloque Telegram/Email de próxima salida en {name}')
    path.write_text(text.replace(OLD_PAIR, NEW_BUTTON, 1), encoding='utf-8')

sync_path = Path('scripts/sync_next_route.py')
sync = sync_path.read_text(encoding='utf-8')
old_sync = "    actions.append('<a class=\"btn secondary\" href=\"https://t.me/mcastilloperona\" target=\"_blank\" rel=\"noopener\">Telegram</a>')\n    actions.append('<a class=\"btn secondary\" href=\"mailto:mcastillo@casasdeharobtt.es?subject=Quiero%20apuntarme%20a%20la%20pr%C3%B3xima%20salida\">Email</a>')"
new_sync = "    actions.append('<button class=\"btn secondary signup-open\" type=\"button\">¡Me apunto!</button>')"
if old_sync not in sync:
    raise SystemExit('No se encontró el bloque Telegram/Email en sync_next_route.py')
sync_path.write_text(sync.replace(old_sync, new_sync, 1), encoding='utf-8')

js_path = Path('assets/v13.js')
js = js_path.read_text(encoding='utf-8')
if OLD_PAIR not in js:
    raise SystemExit('No se encontró el bloque Telegram/Email de próxima salida en v13.js')
js = js.replace(OLD_PAIR, NEW_BUTTON, 1)

anchor = '  async function renderNextRoute(){\n'
if anchor not in js:
    raise SystemExit('No se encontró el punto de inserción para el modal')

modal_lines = [
"  function setupSignupModal(){",
"    if(document.getElementById('signupModal'))return;",
"    const style=document.createElement('style');",
"    style.id='signupModalStyles';",
"    style.textContent='.signup-open{font:inherit;cursor:pointer}.signup-modal[hidden]{display:none}.signup-modal{position:fixed;inset:0;z-index:10000;background:rgba(3,27,55,.72);display:grid;place-items:center;padding:20px}.signup-modal-card{position:relative;width:min(430px,100%);background:#fff;color:#06264b;border-radius:22px;padding:28px;box-shadow:0 24px 70px #0006}.signup-modal-card h3{margin:0 42px 8px 0;font-size:28px}.signup-modal-card p{margin:0;color:#56606b;line-height:1.55}.signup-modal-close{position:absolute;top:14px;right:14px;width:38px;height:38px;border:0;border-radius:50%;background:#eef5f8;color:#06264b;font-size:24px;line-height:1;cursor:pointer}.signup-modal-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:20px}.signup-modal-actions .btn{display:block;text-align:center;background:#06264b;color:#fff;border:1px solid #1b527d}@media(max-width:520px){.signup-modal-actions{grid-template-columns:1fr}}';",
"    document.head.appendChild(style);",
"    const modal=document.createElement('div');",
"    modal.id='signupModal';",
"    modal.className='signup-modal';",
"    modal.hidden=true;",
"    modal.innerHTML='<div class=\"signup-modal-card\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"signupModalTitle\"><button class=\"signup-modal-close\" type=\"button\" aria-label=\"Cerrar\">×</button><h3 id=\"signupModalTitle\">¡Me apunto!</h3><p>Elige cómo quieres contactar con el club para confirmar que vienes a la salida.</p><div class=\"signup-modal-actions\"><a class=\"btn\" href=\"https://t.me/mcastilloperona\" target=\"_blank\" rel=\"noopener\">Telegram</a><a class=\"btn\" href=\"mailto:mcastillo@casasdeharobtt.es?subject=Quiero%20apuntarme%20a%20la%20pr%C3%B3xima%20salida\">Email</a></div></div>';",
"    document.body.appendChild(modal);",
"    let lastFocus=null;",
"    const open=()=>{lastFocus=document.activeElement;modal.hidden=false;document.body.style.overflow='hidden';modal.querySelector('.signup-modal-close').focus()};",
"    const close=()=>{modal.hidden=true;document.body.style.overflow='';if(lastFocus&&lastFocus.focus)lastFocus.focus()};",
"    document.addEventListener('click',e=>{",
"      const opener=e.target.closest('.signup-open');",
"      if(opener){e.preventDefault();open();return}",
"      if(e.target===modal||e.target.closest('.signup-modal-close'))close();",
"    });",
"    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close()});",
"  }",
"",
]
modal_code = '\n'.join(modal_lines) + '\n'
js = js.replace(anchor, modal_code + anchor, 1)

old_init = "document.addEventListener('DOMContentLoaded',()=>{markCurrentNav();renderNextRoute();renderRoutes();renderWeather();renderNews();renderGallery();enhanceFooter();});"
new_init = "document.addEventListener('DOMContentLoaded',()=>{markCurrentNav();setupSignupModal();renderNextRoute();renderRoutes();renderWeather();renderNews();renderGallery();enhanceFooter();});"
if old_init not in js:
    raise SystemExit('No se encontró el inicializador de v13.js')
js = js.replace(old_init, new_init, 1)
js_path.write_text(js, encoding='utf-8')

for name in ['index.html', 'rutas.html', 'assets/v13.js', 'scripts/sync_next_route.py']:
    text = Path(name).read_text(encoding='utf-8')
    if '¡Me apunto!' not in text:
        raise SystemExit(f'Falta el nuevo botón en {name}')
