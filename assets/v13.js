(function(){
  'use strict';

  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const safeUrl=u=>{try{const x=new URL(String(u||''),location.href);return ['http:','https:'].includes(x.protocol)?x.href:''}catch(e){return ''}};
  const relPath=p=>String(p||'').replace(/^\/+/, '');
  const LOCAL_DATA={};
  async function json(path){if(location.protocol==='file:'&&LOCAL_DATA[path])return LOCAL_DATA[path];const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw new Error('No se pudo cargar '+path);return r.json()}
  const fmtDate=iso=>{if(!iso)return 'Fecha por confirmar';const d=new Date(iso+'T12:00:00');return new Intl.DateTimeFormat('es-ES',{weekday:'long',day:'numeric',month:'long'}).format(d)};

  function markCurrentNav(){
    const file=(location.pathname.split('/').pop()||'index.html').toLowerCase();
    document.querySelectorAll('.links a').forEach(a=>{const href=(a.getAttribute('href')||'').split('#')[0].toLowerCase();if(href===file||(file===''&&href==='index.html'))a.setAttribute('aria-current','page')});
  }

  function setupSignupModal(){
    if(document.getElementById('signupModal'))return;
    const style=document.createElement('style');
    style.id='signupModalStyles';
    style.textContent='.signup-open{font:inherit;font-weight:800!important;cursor:pointer;background:#65d7a1!important;color:#031b37!important;border:1px solid #65d7a1!important;box-shadow:0 8px 20px rgba(101,215,161,.28)!important;transition:transform .18s ease,background .18s ease,box-shadow .18s ease}.signup-open:hover{background:#7ee2b2!important;transform:translateY(-1px);box-shadow:0 10px 24px rgba(101,215,161,.36)!important}.signup-open:focus-visible{outline:3px solid #b9e9f4!important;outline-offset:3px}.signup-modal[hidden]{display:none}.signup-modal{position:fixed;inset:0;z-index:10000;background:rgba(3,27,55,.72);display:grid;place-items:center;padding:20px}.signup-modal-card{position:relative;width:min(430px,100%);background:#fff;color:#06264b;border-radius:22px;padding:28px;box-shadow:0 24px 70px #0006}.signup-modal-card h3{margin:0 42px 8px 0;font-size:28px}.signup-modal-card p{margin:0;color:#56606b;line-height:1.55}.signup-modal-close{position:absolute;top:14px;right:14px;width:38px;height:38px;border:0;border-radius:50%;background:#eef5f8;color:#06264b;font-size:24px;line-height:1;cursor:pointer}.signup-modal-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:20px}.signup-modal-actions .btn{display:block;text-align:center;background:#06264b;color:#fff;border:1px solid #1b527d}@media(max-width:520px){.signup-modal-actions{grid-template-columns:1fr}}';
    document.head.appendChild(style);
    const modal=document.createElement('div');
    modal.id='signupModal';
    modal.className='signup-modal';
    modal.hidden=true;
    modal.innerHTML='<div class="signup-modal-card" role="dialog" aria-modal="true" aria-labelledby="signupModalTitle"><button class="signup-modal-close" type="button" aria-label="Cerrar">×</button><h3 id="signupModalTitle">¡Me apunto!</h3><p>Elige cómo quieres contactar con el club para confirmar que vienes a la salida.</p><div class="signup-modal-actions"><a class="btn" href="https://t.me/mcastilloperona" target="_blank" rel="noopener">Telegram</a><a class="btn" href="mailto:info@casasdeharobtt.es?subject=Quiero%20apuntarme%20a%20la%20pr%C3%B3xima%20salida">Email</a></div></div>';
    document.body.appendChild(modal);
    let lastFocus=null;
    const open=()=>{lastFocus=document.activeElement;modal.hidden=false;document.body.style.overflow='hidden';modal.querySelector('.signup-modal-close').focus()};
    const close=()=>{modal.hidden=true;document.body.style.overflow='';if(lastFocus&&lastFocus.focus)lastFocus.focus()};
    document.addEventListener('click',e=>{
      const opener=e.target.closest('.signup-open');
      if(opener){e.preventDefault();open();return}
      if(e.target===modal||e.target.closest('.signup-modal-close'))close();
    });
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close()});
  }

  function enhanceInstagram(){
    const instagramUrl='https://www.instagram.com/casasdeharobtt/';
    if(!document.getElementById('instagramIntegrationStyles')){
      const style=document.createElement('style');
      style.id='instagramIntegrationStyles';
      style.textContent='.contact-fab.instagram{background:linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)}.contact-fab.instagram svg{fill:none}.footer .instagram-link{font-weight:700}';
      document.head.appendChild(style);
    }

    const wrap=document.querySelector('.contact-wrap');
    if(wrap){
      const note=wrap.querySelector('.contact-note');
      if(note&&!/Instagram/i.test(note.textContent||''))note.textContent='Instagram · '+(note.textContent||'Telegram · Email');
      const actions=wrap.querySelector('.contact-actions');
      if(actions&&!actions.querySelector('a[href*="instagram.com/casasdeharobtt"]')){
        const a=document.createElement('a');
        a.className='contact-fab instagram';
        a.href=instagramUrl;
        a.target='_blank';
        a.rel='noopener';
        a.setAttribute('aria-label','Instagram del Club Casas de Haro BTT, @casasdeharobtt');
        a.title='Instagram @casasdeharobtt';
        a.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none"/></svg>';
        actions.prepend(a);
      }
    }

    const footerWrap=document.querySelector('.footer .wrap');
    if(footerWrap&&!footerWrap.querySelector('a[href*="instagram.com/casasdeharobtt"]')){
      const p=document.createElement('p');
      p.className='instagram-link';
      p.innerHTML='<a href="'+instagramUrl+'" target="_blank" rel="noopener">Instagram @casasdeharobtt</a>';
      const locationP=footerWrap.querySelector('p');
      if(locationP)locationP.insertAdjacentElement('afterend',p); else footerWrap.appendChild(p);
    }

    document.querySelectorAll('script[type="application/ld+json"]').forEach(script=>{
      try{
        const data=JSON.parse(script.textContent||'{}');
        let changed=false;
        const visit=node=>{
          if(!node||typeof node!=='object')return;
          if(Array.isArray(node)){node.forEach(visit);return;}
          if(node['@type']==='SportsOrganization'){
            const same=Array.isArray(node.sameAs)?node.sameAs:(node.sameAs?[node.sameAs]:[]);
            if(!same.includes(instagramUrl)){node.sameAs=[...same,instagramUrl];changed=true;}
          }
          Object.values(node).forEach(visit);
        };
        visit(data);
        if(changed)script.textContent=JSON.stringify(data);
      }catch(e){}
    });
  }

  async function renderNextRoute(){
    const targets=document.querySelectorAll('[data-next-route]');
    if(!targets.length)return;
    try{
      const data=await json('data/site.json'); const r=data.next_route||{};
      const gpx=r.gpx?relPath(r.gpx):''; const url=safeUrl(r.track_url);
      targets.forEach(t=>{
        const img=relPath(r.image||'assets/camino-atardecer.jpg');
        t.innerHTML=`<img src="${esc(img)}" alt="${esc(r.image_alt||'Próxima ruta del Club Casas de Haro BTT')}" loading="lazy" decoding="async"><div class="info"><span class="pill">Próxima salida</span><p class="next-route-date">${esc(fmtDate(r.date))}${r.time?' · '+esc(r.time):''}</p><h3>${esc(r.title||'Próxima ruta')}</h3><p class="next-route-desc">${esc(r.description||'Ruta con salida desde Casas de Haro.')}</p><div class="stats"><div class="stat"><b>${esc(r.distance_km||'—')} km</b><span>DISTANCIA</span></div><div class="stat"><b>+${esc(r.elevation_m||'—')} m</b><span>DESNIVEL</span></div><div class="stat"><b>${esc((r.discipline||'BTT').toUpperCase())}</b><span>MODALIDAD</span></div></div><div class="route-actions-wide">${gpx?`<a class="btn" href="${esc(gpx)}" download>Descargar GPX</a>`:''}${url?`<a class="btn secondary" href="${esc(url)}" target="_blank" rel="noopener">Ver track</a>`:''}<button class="btn secondary signup-open" type="button">¡Me apunto!</button></div></div>`;
      });
    }catch(e){console.warn(e)}
  }

  function routeCard(r){
    const url=safeUrl(r.source_url); const gpx=r.gpx?relPath(r.gpx):'';
    const isClub=r.route_type==='club';
    const kind=isClub?'RUTA DEL CLUB':String(r.source||'Wikiloc').toUpperCase();
    const originClass=isClub?'route-origin-club':'route-origin-external';
    const author=r.author?`<span>Autor: ${esc(r.author)}</span>`:'';
    const distance=r.distance_km?`<span class="route-metric"><b>${esc(r.distance_km)} km</b><small>Distancia</small></span>`:'';
    const elevation=r.elevation_m!==''&&r.elevation_m!=null?`<span class="route-metric"><b>+${esc(r.elevation_m)} m</b><small>Desnivel</small></span>`:'';
    const difficulty=r.difficulty?`<span class="route-metric"><b>${esc(r.difficulty)}</b><small>Dificultad</small></span>`:'';
    const isWikilocListing=/\/rutas\/(?:ciclismo|mountain-bike)\/espana\//.test(url);
    const sourceLabel=isWikilocListing?'Ver en Wikiloc':'Ver track';
    return `<article class="route-card"><span class="pill route-origin ${originClass}">${esc(kind)}</span><h3>${esc(r.title)}</h3>${r.description?`<p class="route-description">${esc(r.description)}</p>`:''}<div class="meta route-metrics">${distance}${elevation}${difficulty}</div><p class="route-source">${author}${r.source?`<span>Fuente: ${esc(r.source)}</span>`:''}</p><div class="route-actions">${gpx?`<a class="btn" href="${esc(gpx)}" download>Descargar GPX</a>`:''}${url?`<a class="btn secondary" target="_blank" rel="noopener" href="${esc(url)}">${esc(sourceLabel)}</a>`:''}</div></article>`;
  }

  async function renderRoutes(){
    const b=document.getElementById('routesBtt'), c=document.getElementById('routesRoad'); if(!b&&!c)return;
    try{
      const routes=(await json('data/routes.json')).filter(r=>r.published!==false);
      const search=document.getElementById('routeSearch'), count=document.getElementById('routeCount');
      const paint=()=>{
        const q=(search?.value||'').trim().toLocaleLowerCase('es');
        const filtered=q?routes.filter(r=>[r.title,r.description,r.difficulty,r.source,r.author,r.route_type].some(v=>String(v||'').toLocaleLowerCase('es').includes(q))):routes;
        const btt=filtered.filter(r=>r.discipline==='btt');
        const road=filtered.filter(r=>r.discipline==='road');
        if(b)b.innerHTML=btt.length?btt.map(routeCard).join(''):'<div class="route-empty">No hay rutas BTT que coincidan con la búsqueda.</div>';
        if(c)c.innerHTML=road.length?road.map(routeCard).join(''):'<div class="route-empty">No hay rutas de carretera que coincidan con la búsqueda.</div>';
        if(count)count.textContent=`${filtered.length} ruta${filtered.length===1?'':'s'} encontrada${filtered.length===1?'':'s'}`;
      };
      paint(); if(search)search.addEventListener('input',paint);
    }catch(e){
      const msg='<div class="route-empty">No se han podido cargar las rutas.</div>'; if(b)b.innerHTML=msg;if(c)c.innerHTML=msg;
    }
  }

  const weatherText=code=>({0:['☀️','Despejado'],1:['🌤️','Principalmente despejado'],2:['⛅','Parcialmente nuboso'],3:['☁️','Cubierto'],45:['🌫️','Niebla'],48:['🌫️','Niebla'],51:['🌦️','Llovizna'],53:['🌦️','Llovizna'],55:['🌧️','Llovizna intensa'],61:['🌧️','Lluvia débil'],63:['🌧️','Lluvia'],65:['🌧️','Lluvia intensa'],80:['🌦️','Chubascos'],81:['🌧️','Chubascos'],82:['⛈️','Chubascos fuertes'],95:['⛈️','Tormenta'],96:['⛈️','Tormenta'],99:['⛈️','Tormenta']})[code]||['🌤️','Variable'];
  const compass=deg=>{const pts=['N','NE','E','SE','S','SO','O','NO'];return pts[Math.round((((Number(deg)||0)%360)+360)%360/45)%8]};
  async function renderWeather(){
    const box=document.getElementById('weatherGrid'); if(!box)return;
    const credit=document.getElementById('weatherCredit');
    const endpoint='https://api.open-meteo.com/v1/forecast?latitude=39.3333&longitude=-2.2724&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&timezone=Europe%2FMadrid&forecast_days=7';
    try{
      const r=await fetch(endpoint,{cache:'no-store'});if(!r.ok)throw new Error('weather');const j=await r.json(),d=j.daily;
      box.innerHTML=d.time.map((date,i)=>{const w=weatherText(d.weather_code[i]);const day=new Intl.DateTimeFormat('es-ES',{weekday:'short',day:'numeric'}).format(new Date(date+'T12:00:00'));return `<article class="weather-card"><div class="weather-day">${esc(day)}</div><div class="weather-icon" aria-hidden="true">${w[0]}</div><div class="weather-temp">${Math.round(d.temperature_2m_max[i])}° / ${Math.round(d.temperature_2m_min[i])}°</div><div class="weather-summary">${esc(w[1])} · lluvia ${Math.round(d.precipitation_probability_max[i]||0)}%</div><div class="wind-box"><div class="wind-main">💨 ${Math.round(d.wind_speed_10m_max[i])} km/h · ${compass(d.wind_direction_10m_dominant[i])}</div><div class="wind-gust">Rachas hasta ${Math.round(d.wind_gusts_10m_max[i])} km/h</div></div></article>`}).join('');
      if(credit)credit.innerHTML='Previsión para Casas de Haro · Datos meteorológicos: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a> (CC BY 4.0).';
    }catch(e){box.innerHTML='<div class="weather-error">Ahora mismo no se puede cargar la previsión. Inténtalo de nuevo en unos minutos.</div>';}
  }

  const newsCategoryLabel=v=>({salida:'Salida',marcha:'Marcha',evento:'Evento',miembros:'Miembros del club',equipacion:'Equipación',patrocinadores:'Patrocinadores',colaboradores:'Colaboradores',general:'General'})[v]||v||'General';

  function localIsoDate(d=new Date()){
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,'0');
    const day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }

  async function renderNewsBadge(){
    const links=[...document.querySelectorAll('.links a[href$="news.html"]')];
    if(!links.length)return;
    if(!document.getElementById('newsBadgeStyles')){
      const style=document.createElement('style');
      style.id='newsBadgeStyles';
      style.textContent='.links a[href$="news.html"]{display:inline-flex;align-items:center;gap:6px}.news-recent-badge{display:inline-grid;place-items:center;min-width:19px;height:19px;padding:0 5px;border-radius:999px;background:#facc15;color:#031b37;font-size:11px;font-weight:900;line-height:1;box-shadow:0 0 0 2px rgba(255,255,255,.12)}@media(max-width:760px){.news-recent-badge{min-width:17px;height:17px;padding:0 4px;font-size:10px}}';
      document.head.appendChild(style);
    }
    try{
      const now=new Date();
      const today=localIsoDate(now);
      const cutoffDate=new Date(now.getFullYear(),now.getMonth(),now.getDate()-6);
      const cutoff=localIsoDate(cutoffDate);
      const news=(await json('data/news.json')).filter(n=>n.published!==false);
      const count=news.filter(n=>{
        const publication=String(n.published_date||n.date||'');
        return /^\d{4}-\d{2}-\d{2}$/.test(publication)&&publication>=cutoff&&publication<=today;
      }).length;
      links.forEach(link=>{
        link.querySelector('.news-recent-badge')?.remove();
        link.querySelector('.news-future-badge')?.remove();
        link.removeAttribute('title');
        if(!count)return;
        const badge=document.createElement('span');
        badge.className='news-recent-badge';
        badge.textContent=count>99?'99+':String(count);
        badge.setAttribute('aria-label',`${count} noticia${count===1?' nueva':'s nuevas'} de los últimos 7 días`);
        link.appendChild(badge);
        link.title=`${count} noticia${count===1?' nueva':'s nuevas'} publicada${count===1?'':'s'} en los últimos 7 días`;
      });
    }catch(e){console.warn('No se pudo calcular el contador de BTT News',e)}
  }

  function newsCard(n,full){
    const img=n.image?relPath(n.image):''; const date=n.date?fmtDate(n.date):'';
    const category=newsCategoryLabel(n.category);
    const gallery=Array.isArray(n.gallery)?n.gallery.filter(x=>x&&x.image):[];
    const galleryHtml=full&&gallery.length?`<div class="news-photo-gallery">${gallery.map((g,i)=>`<figure><img src="${esc(relPath(g.image))}" alt="${esc(g.alt||((n.title||'BTT News')+' · foto '+(i+1)))}" loading="lazy" decoding="async">${g.caption?`<figcaption>${esc(g.caption)}</figcaption>`:''}</figure>`).join('')}</div>`:'';
    return `<article class="news-card">${img?`<img class="news-main-image" src="${esc(img)}" alt="${esc(n.image_alt||n.title||'BTT News')}" loading="lazy" decoding="async">`:''}<div class="news-card-body"><div class="news-meta">${date?`<span>${esc(date)}</span>`:''}<span>· ${esc(category)}</span>${n.member?`<span>· ${esc(n.member)}</span>`:''}</div><h3>${esc(n.title)}</h3>${n.summary?`<p>${esc(n.summary)}</p>`:''}${full&&n.body?`<div class="news-body-wrap"><p class="news-body">${esc(n.body)}</p><button type="button" class="news-read-more" aria-expanded="false">Leer más</button></div>`:''}${galleryHtml}</div></article>`;
  }
  async function renderNews(){
    const list=document.getElementById('newsList'), teaser=document.getElementById('newsTeaser'); if(!list&&!teaser)return;
    try{
      const publicationDate=n=>String(n.published_date||n.date||'');
      const news=(await json('data/news.json')).filter(n=>n.published!==false).sort((a,b)=>publicationDate(b).localeCompare(publicationDate(a)));
      if(teaser)teaser.innerHTML=news.length?`<div class="news-grid">${news.slice(0,3).map(n=>newsCard(n,false)).join('')}</div><div class="all-routes"><a class="btn dark" href="news.html">Ver BTT News</a></div>`:'<div class="news-empty">BTT News está listo. Las próximas novedades del club aparecerán aquí automáticamente.</div>';
      if(list){
        const search=document.getElementById('newsSearch'), year=document.getElementById('newsYear'), category=document.getElementById('newsCategory'), count=document.getElementById('newsCount');
        const years=[...new Set(news.map(n=>publicationDate(n).slice(0,4)).filter(Boolean))].sort().reverse();
        if(year)year.innerHTML='<option value="">Todos los años</option>'+years.map(y=>`<option value="${esc(y)}">${esc(y)}</option>`).join('');
        const cats=[...new Set(news.map(n=>n.category||'general'))].sort((a,b)=>newsCategoryLabel(a).localeCompare(newsCategoryLabel(b),'es'));
        if(category)category.innerHTML='<option value="">Todas las categorías</option>'+cats.map(c=>`<option value="${esc(c)}">${esc(newsCategoryLabel(c))}</option>`).join('');
        const paint=()=>{
          const q=(search?.value||'').trim().toLocaleLowerCase('es'), y=year?.value||'', c=category?.value||'';
          const filtered=news.filter(n=>{
            const hay=[n.title,n.summary,n.body,n.member,newsCategoryLabel(n.category)].some(v=>String(v||'').toLocaleLowerCase('es').includes(q));
            return (!q||hay)&&(!y||publicationDate(n).startsWith(y))&&(!c||(n.category||'general')===c);
          });
          if(count)count.textContent=`${filtered.length} noticia${filtered.length===1?'':'s'} encontrada${filtered.length===1?'':'s'}`;
          if(!filtered.length){list.innerHTML='<div class="news-empty">No hay noticias que coincidan con estos filtros.</div>';return;}
          const groups={}; filtered.forEach(n=>{const yy=publicationDate(n).slice(0,4)||'Sin fecha';(groups[yy]||(groups[yy]=[])).push(n)});
          list.innerHTML=Object.keys(groups).sort().reverse().map(yy=>`<section class="news-year"><div class="news-year-head"><h2>${esc(yy)}</h2><span>${groups[yy].length} noticia${groups[yy].length===1?'':'s'}</span></div><div class="news-grid">${groups[yy].map(n=>newsCard(n,true)).join('')}</div></section>`).join('');
        };
        paint(); [search,year,category].filter(Boolean).forEach(el=>el.addEventListener(el===search?'input':'change',paint));
      }
    }catch(e){if(list)list.innerHTML='<div class="news-empty">No se han podido cargar las noticias.</div>';}
  }

  async function renderGallery(){
    const g=document.getElementById('galleryGrid'); if(!g)return;
    try{
      const photos=(await json('data/gallery.json')).filter(x=>x.published!==false);
      g.innerHTML=photos.map(p=>`<figure><img src="${esc(relPath(p.image))}" alt="${esc(p.alt||p.caption||'Club Casas de Haro BTT')}" loading="lazy" decoding="async">${p.caption?`<figcaption>${esc(p.caption)}</figcaption>`:''}</figure>`).join('');
    }catch(e){g.innerHTML='<div class="news-empty">No se ha podido cargar la galería.</div>'}
  }

  function enhanceFooter(){
    const wrap=document.querySelector('.footer .wrap');
    if(!wrap||wrap.querySelector('.legal-links')||wrap.querySelector('a[href="aviso-legal.html"]'))return;
    const nav=document.createElement('nav');
    nav.className='legal-links';
    nav.setAttribute('aria-label','Información legal');
    nav.innerHTML='<a href="aviso-legal.html">Aviso legal</a><a href="privacidad.html">Privacidad</a><a href="cookies.html">Cookies</a>';
    wrap.append(nav);
  }

  document.addEventListener('DOMContentLoaded',()=>{markCurrentNav();setupSignupModal();enhanceInstagram();renderNextRoute();renderRoutes();renderWeather();renderNewsBadge();renderNews();renderGallery();enhanceFooter();});
  /* MOBILE_NEWS_READ_MORE */
  const newsStyle=document.createElement('style');
  newsStyle.textContent=`@media(max-width:1024px){.news-body-wrap:not(.expanded) .news-body{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:5;overflow:hidden}.news-read-more{display:inline-flex;margin-top:10px;padding:8px 12px;border:1px solid #13b9e8;border-radius:999px;background:#fff;color:#06264b;font:inherit;font-weight:800;cursor:pointer}.news-body-wrap.expanded .news-read-more{margin-top:12px}}@media(min-width:1025px){.news-read-more{display:none!important}}`;
  document.head.appendChild(newsStyle);
  document.addEventListener('click',function(e){const b=e.target.closest('.news-read-more');if(!b)return;const w=b.closest('.news-body-wrap');if(!w)return;const open=w.classList.toggle('expanded');b.textContent=open?'Leer menos':'Leer más';b.setAttribute('aria-expanded',String(open));});

})();
