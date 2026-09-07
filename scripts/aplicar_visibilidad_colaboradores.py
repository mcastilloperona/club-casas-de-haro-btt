from pathlib import Path
import re

# 1. Texto y enfoque en la página de patrocinadores y colaboradores
p = Path('patrocinadores.html')
s = p.read_text(encoding='utf-8')

old_lead = '<p class="lead">Abrimos este espacio a comercios, empresas, profesionales, entidades y personas que quieran apoyar al Club Casas de Haro BTT y formar parte de su comunidad de colaboradores.</p>'
new_lead = '<p class="lead">El Club Casas de Haro BTT abre este espacio a comercios, empresas, profesionales, entidades y personas que quieran apoyar al club.</p><p class="lead">Como colaborador, tendrás presencia en nuestra web con tu logo, nombre e información del comercio o actividad que quieras destacar. La forma de colaboración y su visibilidad dentro de los espacios del club se gestionarán conforme a los criterios establecidos por Club Casas de Haro BTT.</p>'
if old_lead not in s:
    raise SystemExit('No se encontró el texto actual de colaboradores')
s = s.replace(old_lead, new_lead, 1)

old_cta = '<p>Si tienes un comercio, una empresa, eres profesional o simplemente quieres apoyar las actividades del club, cuéntanos tu propuesta. Estaremos encantados de estudiarla contigo.</p>'
new_cta = '<p>Si quieres apoyar al club y formar parte de nuestra red de colaboradores, ponte en contacto con nosotros por Telegram o email. Te indicaremos cómo funciona la colaboración y qué información necesitamos para darte visibilidad en nuestra web.</p>'
if old_cta not in s:
    raise SystemExit('No se encontró el CTA actual de colaboradores')
s = s.replace(old_cta, new_cta, 1)
p.write_text(s, encoding='utf-8')

# 2. Bloque discreto de colaboradores en la portada
p = Path('index.html')
s = p.read_text(encoding='utf-8')

home_section = '''
<section class="home-collaborators-section" id="colaboradores-portada" hidden>
  <div class="wrap">
    <div class="home-collaborators-head">
      <div>
        <div class="kicker">Colaboradores del club</div>
        <h2>Comercios y personas que suman</h2>
      </div>
      <a class="home-collaborators-link" href="patrocinadores.html#colaboradores-club">Ver colaboradores</a>
    </div>
    <div id="homeCollaboratorsTrack" class="home-collaborators-track" aria-label="Colaboradores del Club Casas de Haro BTT"></div>
  </div>
</section>
'''

if 'id="colaboradores-portada"' not in s:
    m = re.search(r'(<section class="club-partners-band".*?</section>)', s, flags=re.S)
    if not m:
        raise SystemExit('No se encontró el carrusel de patrocinadores en index.html')
    s = s[:m.end()] + '\n' + home_section + s[m.end():]

css_link = '<link rel="stylesheet" href="assets/colaboradores.css">'
if css_link not in s:
    s = s.replace('</head>', css_link + '\n</head>', 1)

js_link = '<script src="assets/colaboradores.js" defer></script>'
if js_link not in s:
    s = s.replace('</body>', js_link + '\n</body>', 1)

s = s.replace('Novedades del Club Casas de Haro BTT, salidas, retos, marchas y noticias de sus miembros.', 'Novedades del Club Casas de Haro BTT, salidas, retos, marchas, nuevos colaboradores y noticias de sus miembros.')
p.write_text(s, encoding='utf-8')

# 3. JavaScript compartido: listado completo y franja de portada
Path('assets/colaboradores.js').write_text(r'''(function(){
  'use strict';
  const grid=document.getElementById('collaboratorsGrid');
  const homeSection=document.getElementById('colaboradores-portada');
  const homeTrack=document.getElementById('homeCollaboratorsTrack');
  if(!grid&&!homeTrack)return;

  function safeUrl(value){
    if(!value)return '';
    try{const u=new URL(String(value),location.href);return ['http:','https:'].includes(u.protocol)?u.href:''}catch(e){return ''}
  }

  function make(tag,className,text){
    const el=document.createElement(tag);
    if(className)el.className=className;
    if(text)el.textContent=text;
    return el;
  }

  function logoNode(item,compact){
    const logo=make('div',compact?'home-collaborator-logo':'collaborator-logo');
    if(item.logo){
      const img=document.createElement('img');
      img.src=String(item.logo).replace(/^\/+/, '');
      img.alt=item.name?`Logo de ${item.name}`:'Logo de colaborador';
      img.loading='lazy';
      img.decoding='async';
      logo.appendChild(img);
    }else{
      logo.appendChild(make('div',compact?'home-collaborator-fallback':'collaborator-logo-fallback',(item.name||'C').trim().charAt(0).toUpperCase()||'C'));
    }
    return logo;
  }

  function card(item){
    const article=make('article','collaborator-card');
    article.appendChild(logoNode(item,false));
    article.appendChild(make('h3','',item.name||'Colaborador'));
    if(item.description)article.appendChild(make('p','',item.description));
    if(item.location)article.appendChild(make('p','collaborator-location',item.location));
    const url=safeUrl(item.url);
    if(url){
      const a=make('a','btn','Conocer colaborador');
      a.href=url;a.target='_blank';a.rel='noopener';
      article.appendChild(a);
    }
    return article;
  }

  function compactItem(item){
    const url=safeUrl(item.url);
    const node=make(url?'a':'div','home-collaborator-item');
    if(url){node.href=url;node.target='_blank';node.rel='noopener'}
    node.appendChild(logoNode(item,true));
    node.appendChild(make('span','home-collaborator-name',item.name||'Colaborador'));
    return node;
  }

  fetch('data/collaborators.json',{cache:'no-store'})
    .then(r=>{if(!r.ok)throw new Error('No se pudieron cargar los colaboradores');return r.json()})
    .then(data=>{
      const items=(Array.isArray(data)?data:[])
        .filter(x=>x&&x.published!==false&&x.name)
        .sort((a,b)=>(Number(a.order)||999)-(Number(b.order)||999)||String(a.name).localeCompare(String(b.name),'es'));

      if(grid){
        grid.replaceChildren();
        if(!items.length){
          grid.appendChild(make('div','collaborators-empty','Este espacio está abierto a nuevos colaboradores. Si quieres sumar tu apoyo al Club Casas de Haro BTT, puedes contactar con nosotros por Telegram o por email.'));
        }else{
          items.forEach(item=>grid.appendChild(card(item)));
        }
      }

      if(homeTrack&&homeSection){
        homeTrack.replaceChildren();
        if(items.length){
          items.forEach(item=>homeTrack.appendChild(compactItem(item)));
          homeSection.hidden=false;
        }else{
          homeSection.hidden=true;
        }
      }
    })
    .catch(()=>{
      if(grid)grid.replaceChildren(make('div','collaborators-empty','Ahora mismo no se puede cargar el listado de colaboradores.'));
      if(homeSection)homeSection.hidden=true;
    });
})();
''', encoding='utf-8')

# 4. CSS de la franja secundaria en portada
p = Path('assets/colaboradores.css')
s = p.read_text(encoding='utf-8')
s = re.sub(r'/\* HOME_COLLABORATORS_START \*/.*?/\* HOME_COLLABORATORS_END \*/', '', s, flags=re.S)
s += r'''

/* HOME_COLLABORATORS_START */
.home-collaborators-section{padding:34px 0 38px;background:#fff;border-bottom:1px solid #e5edf1}
.home-collaborators-section[hidden]{display:none!important}
.home-collaborators-head{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:20px}
.home-collaborators-head h2{font-size:clamp(25px,3.6vw,36px);margin:5px 0 0}
.home-collaborators-link{font-size:13px;font-weight:900;color:#087b9f;white-space:nowrap}
.home-collaborators-track{display:flex;gap:12px;overflow-x:auto;padding:2px 2px 8px;scrollbar-width:thin}
.home-collaborator-item{flex:0 0 168px;min-height:112px;background:#f8fbfc;border:1px solid #e3ebef;border-radius:16px;padding:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;transition:transform .18s ease,box-shadow .18s ease}
a.home-collaborator-item:hover{transform:translateY(-2px);box-shadow:0 8px 22px #09233b12}
.home-collaborator-logo{height:60px;width:100%;display:grid;place-items:center}
.home-collaborator-logo img{max-width:100%;max-height:56px;width:auto;height:auto;object-fit:contain}
.home-collaborator-fallback{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:var(--navy);color:#fff;font-weight:900;font-size:19px}
.home-collaborator-name{font-size:12px;font-weight:800;color:#56636d;line-height:1.2}
@media(max-width:620px){.home-collaborators-head{align-items:flex-start;flex-direction:column;gap:8px}.home-collaborator-item{flex-basis:145px}.home-collaborators-section{padding:28px 0 30px}}
/* HOME_COLLABORATORS_END */
'''
p.write_text(s, encoding='utf-8')

# 5. BTT News: categoría específica de colaboradores en panel y render
p = Path('.pages.yml')
s = p.read_text(encoding='utf-8')
needle = '            - { name: patrocinadores, label: Patrocinadores }\n'
addition = '            - { name: colaboradores, label: Colaboradores }\n'
if addition not in s:
    if needle not in s:
        raise SystemExit('No se encontró la categoría Patrocinadores en .pages.yml')
    s = s.replace(needle, needle + addition, 1)
p.write_text(s, encoding='utf-8')

p = Path('assets/v13.js')
s = p.read_text(encoding='utf-8')
old = "patrocinadores:'Patrocinadores',general:'General'"
new = "patrocinadores:'Patrocinadores',colaboradores:'Colaboradores',general:'General'"
if old not in s:
    raise SystemExit('No se encontró el mapa de categorías en assets/v13.js')
s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')

# Validaciones
checks = {
    'patrocinadores.html': ['criterios establecidos por Club Casas de Haro BTT', 'Te indicaremos cómo funciona la colaboración'],
    'index.html': ['id="colaboradores-portada"', 'assets/colaboradores.css', 'assets/colaboradores.js', 'nuevos colaboradores'],
    '.pages.yml': ['name: colaboradores, label: Colaboradores'],
    'assets/v13.js': ["colaboradores:'Colaboradores'"],
}
for filename, needles in checks.items():
    text = Path(filename).read_text(encoding='utf-8')
    for needle in needles:
        if needle not in text:
            raise SystemExit(f'Validación fallida en {filename}: {needle}')

if 'estudiarla contigo' in Path('patrocinadores.html').read_text(encoding='utf-8'):
    raise SystemExit('Sigue presente el texto de estudiar la propuesta')

print('Visibilidad de colaboradores actualizada correctamente')
