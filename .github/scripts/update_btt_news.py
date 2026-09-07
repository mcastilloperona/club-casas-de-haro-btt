from pathlib import Path
import re
import sys

# Pages CMS
p = Path('.pages.yml')
s = p.read_text(encoding='utf-8')
old = '''      - { name: published, label: Publicada, type: boolean }
      - { name: title, label: Titular, type: string, required: true }
      - { name: date, label: Fecha, type: date }
      - { name: member, label: Miembro / protagonista, type: string }
      - { name: summary, label: Resumen, type: text }
      - { name: body, label: Noticia, type: text }
      - name: image
        label: Imagen
        type: image
        options:
          media: images
      - { name: image_alt, label: Texto alternativo, type: string }
'''
new = '''      - { name: published, label: Publicada, type: boolean }
      - { name: title, label: Titular, type: string, required: true }
      - { name: date, label: Fecha, type: date }
      - name: category
        label: Categoría
        type: select
        options:
          values:
            - { name: salida, label: Salida }
            - { name: marcha, label: Marcha }
            - { name: evento, label: Evento }
            - { name: miembros, label: Miembros del club }
            - { name: equipacion, label: Equipación }
            - { name: patrocinadores, label: Patrocinadores }
            - { name: general, label: General }
      - { name: member, label: Miembro / protagonista, type: string }
      - { name: summary, label: Resumen, type: text }
      - { name: body, label: Noticia, type: text }
      - name: image
        label: Imagen principal
        type: image
        options:
          media: images
      - { name: image_alt, label: Texto alternativo de la imagen principal, type: string }
      - name: gallery
        label: Galería de imágenes
        type: object
        list: true
        fields:
          - name: image
            label: Foto
            type: image
            required: true
            options:
              media: images
          - { name: alt, label: Texto alternativo, type: string }
          - { name: caption, label: Pie de foto, type: string }
'''
if old not in s:
    sys.exit('Bloque BTT News no encontrado en .pages.yml')
p.write_text(s.replace(old, new, 1), encoding='utf-8')

# news.html
p = Path('news.html')
s = p.read_text(encoding='utf-8')
old = '<main><section class="page-hero"><div class="wrap"><div class="kicker">Actualidad del club</div><h1>BTT News</h1><p style="max-width:760px;color:#dce8ef;font-size:18px">Novedades del Club Casas de Haro BTT, salidas, marchas, retos y noticias de nuestros miembros.</p></div></section><div class="kit-stripes"></div><section class="section"><div class="wrap"><div id="newsList" class="news-grid"><div class="news-empty">Cargando noticias…</div></div></div></section></main>'
new = '<main><section class="page-hero"><div class="wrap"><div class="kicker">Actualidad y memoria del club</div><h1>BTT News</h1><p style="max-width:760px;color:#dce8ef;font-size:18px">Novedades del Club Casas de Haro BTT, salidas, marchas, retos y noticias de nuestros miembros. Las publicaciones se conservan para formar el histórico del club.</p></div></section><div class="kit-stripes"></div><section class="section"><div class="wrap"><div class="kicker">Hemeroteca del club</div><h2>Actualidad e histórico</h2><p class="lead">Consulta lo que ha ido aconteciendo en el Club Casas de Haro BTT. Puedes buscar una noticia o filtrar el histórico por año y categoría.</p><div id="newsFilters" class="news-filters"><label><span>Buscar</span><input id="newsSearch" type="search" placeholder="Buscar en BTT News…" autocomplete="off"></label><label><span>Año</span><select id="newsYear"><option value="">Todos los años</option></select></label><label><span>Categoría</span><select id="newsCategory"><option value="">Todas las categorías</option></select></label></div><div id="newsCount" class="news-count" aria-live="polite"></div><div id="newsList" class="news-archive"><div class="news-empty">Cargando noticias…</div></div></div></section></main>'
if old not in s:
    sys.exit('Bloque principal de news.html no encontrado')
p.write_text(s.replace(old, new, 1), encoding='utf-8')

# v13.js
p = Path('assets/v13.js')
s = p.read_text(encoding='utf-8')
start = s.find('  function newsCard(n,full){')
end = s.find('  async function renderGallery', start)
if start < 0 or end < 0:
    sys.exit('Bloque newsCard/renderNews no encontrado')
replacement = '''  const newsCategoryLabel=v=>({salida:'Salida',marcha:'Marcha',evento:'Evento',miembros:'Miembros del club',equipacion:'Equipación',patrocinadores:'Patrocinadores',general:'General'})[v]||v||'General';
  function newsCard(n,full){
    const img=n.image?relPath(n.image):''; const date=n.date?fmtDate(n.date):'';
    const category=newsCategoryLabel(n.category);
    const gallery=Array.isArray(n.gallery)?n.gallery.filter(x=>x&&x.image):[];
    const galleryHtml=full&&gallery.length?`<div class="news-photo-gallery">${gallery.map((g,i)=>`<figure><img src="${esc(relPath(g.image))}" alt="${esc(g.alt||((n.title||'BTT News')+' · foto '+(i+1)))}" loading="lazy" decoding="async">${g.caption?`<figcaption>${esc(g.caption)}</figcaption>`:''}</figure>`).join('')}</div>`:'';
    return `<article class="news-card">${img?`<img class="news-main-image" src="${esc(img)}" alt="${esc(n.image_alt||n.title||'BTT News')}" loading="lazy" decoding="async">`:''}<div class="news-card-body"><div class="news-meta">${date?`<span>${esc(date)}</span>`:''}<span>· ${esc(category)}</span>${n.member?`<span>· ${esc(n.member)}</span>`:''}</div><h3>${esc(n.title)}</h3>${n.summary?`<p>${esc(n.summary)}</p>`:''}${full&&n.body?`<p class="news-body">${esc(n.body)}</p>`:''}${galleryHtml}</div></article>`;
  }
  async function renderNews(){
    const list=document.getElementById('newsList'), teaser=document.getElementById('newsTeaser'); if(!list&&!teaser)return;
    try{
      const news=(await json('data/news.json')).filter(n=>n.published!==false).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
      if(teaser)teaser.innerHTML=news.length?`<div class="news-grid">${news.slice(0,3).map(n=>newsCard(n,false)).join('')}</div><div class="all-routes"><a class="btn dark" href="news.html">Ver BTT News →</a></div>`:'<div class="news-empty">BTT News está listo. Las próximas novedades del club aparecerán aquí automáticamente.</div>';
      if(list){
        const search=document.getElementById('newsSearch'), year=document.getElementById('newsYear'), category=document.getElementById('newsCategory'), count=document.getElementById('newsCount');
        const years=[...new Set(news.map(n=>(n.date||'').slice(0,4)).filter(Boolean))].sort().reverse();
        if(year)year.innerHTML='<option value="">Todos los años</option>'+years.map(y=>`<option value="${esc(y)}">${esc(y)}</option>`).join('');
        const cats=[...new Set(news.map(n=>n.category||'general'))].sort((a,b)=>newsCategoryLabel(a).localeCompare(newsCategoryLabel(b),'es'));
        if(category)category.innerHTML='<option value="">Todas las categorías</option>'+cats.map(c=>`<option value="${esc(c)}">${esc(newsCategoryLabel(c))}</option>`).join('');
        const paint=()=>{
          const q=(search?.value||'').trim().toLocaleLowerCase('es'), y=year?.value||'', c=category?.value||'';
          const filtered=news.filter(n=>{
            const hay=[n.title,n.summary,n.body,n.member,newsCategoryLabel(n.category)].some(v=>String(v||'').toLocaleLowerCase('es').includes(q));
            return (!q||hay)&&(!y||(n.date||'').startsWith(y))&&(!c||(n.category||'general')===c);
          });
          if(count)count.textContent=`${filtered.length} noticia${filtered.length===1?'':'s'} encontrada${filtered.length===1?'':'s'}`;
          if(!filtered.length){list.innerHTML='<div class="news-empty">No hay noticias que coincidan con estos filtros.</div>';return;}
          const groups={}; filtered.forEach(n=>{const yy=(n.date||'').slice(0,4)||'Sin fecha';(groups[yy]||(groups[yy]=[])).push(n)});
          list.innerHTML=Object.keys(groups).sort().reverse().map(yy=>`<section class="news-year"><div class="news-year-head"><h2>${esc(yy)}</h2><span>${groups[yy].length} noticia${groups[yy].length===1?'':'s'}</span></div><div class="news-grid">${groups[yy].map(n=>newsCard(n,true)).join('')}</div></section>`).join('');
        };
        paint(); [search,year,category].filter(Boolean).forEach(el=>el.addEventListener(el===search?'input':'change',paint));
      }
    }catch(e){if(list)list.innerHTML='<div class="news-empty">No se han podido cargar las noticias.</div>';}
  }

'''
p.write_text(s[:start] + replacement + s[end:], encoding='utf-8')

# CSS
p = Path('assets/v13.css')
s = p.read_text(encoding='utf-8')
marker = '/* BTT News — hemeroteca, filtros y galería múltiple */'
extra = '''\n\n/* BTT News — hemeroteca, filtros y galería múltiple */\n.news-filters{display:grid;grid-template-columns:minmax(240px,1.6fr) minmax(150px,.7fr) minmax(180px,.8fr);gap:12px;margin:26px 0 8px;align-items:end}\n.news-filters label{display:grid;gap:7px;font-size:12px;font-weight:900;color:#53616c;text-transform:uppercase;letter-spacing:.05em}\n.news-filters input,.news-filters select{width:100%;border:1px solid #d7e3e9;background:#fff;color:var(--navy);border-radius:14px;padding:12px 13px;font:inherit;outline:none}\n.news-filters input:focus,.news-filters select:focus{border-color:var(--cyan);box-shadow:0 0 0 3px rgba(19,185,232,.12)}\n.news-count{font-size:12px;color:#71808b;margin:8px 0 24px}\n.news-archive{display:grid;gap:42px}.news-year{display:grid;gap:16px}.news-year-head{display:flex;align-items:end;justify-content:space-between;gap:14px;border-bottom:1px solid #dce6eb;padding-bottom:10px}.news-year-head h2{margin:0;font-size:32px}.news-year-head span{font-size:12px;color:#71808b;font-weight:800}\n.news-photo-gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-top:18px}.news-photo-gallery figure{margin:0}.news-photo-gallery img{width:100%;height:150px;object-fit:cover;border-radius:12px;display:block}.news-photo-gallery figcaption{font-size:11px;color:#78858e;padding:6px 2px 0;line-height:1.35}.news-main-image{width:100%;height:250px;object-fit:cover}\n@media(max-width:760px){.news-filters{grid-template-columns:1fr}.news-photo-gallery{grid-template-columns:1fr 1fr}.news-photo-gallery img{height:130px}.news-year-head h2{font-size:28px}}\n@media(max-width:460px){.news-photo-gallery{grid-template-columns:1fr}.news-photo-gallery img{height:auto;aspect-ratio:4/3}}\n'''
if marker not in s:
    p.write_text(s + extra, encoding='utf-8')

# VERSION
p = Path('VERSION.txt')
s = p.read_text(encoding='utf-8') if p.exists() else ''
msg = 'V13 BTT News: galería múltiple, categorías, buscador e histórico por años.'
if msg not in s:
    p.write_text(s.rstrip() + '\n' + msg + '\n', encoding='utf-8')
