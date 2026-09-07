(function(){
  'use strict';

  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const safeUrl=u=>{try{const x=new URL(String(u||''),location.href);return ['http:','https:'].includes(x.protocol)?x.href:''}catch(e){return ''}};
  const relPath=p=>String(p||'').replace(/^\/+/, '');
  const LOCAL_DATA={"data/site.json":{"next_route":{"title":"Casas de Haro · El Picazo · Tébar","date":"","time":"Hora por confirmar","distance_km":144,"elevation_m":1050,"discipline":"BTT","description":"Ruta circular con salida y llegada en Casas de Haro.","image":"assets/camino-atardecer.jpg","image_alt":"Camino de Casas de Haro al atardecer","track_url":"","gpx":""}},"data/routes.json":[{"id":"pozoamargo-la-losa-el-picazo","published":true,"discipline":"btt","title":"Pozoamargo · La Losa · El Picazo","description":"Ruta circular desde Casas de Haro por caminos del entorno.","distance_km":"54,41","elevation_m":214,"difficulty":"Moderado","source":"Wikiloc","source_url":"https://es.wikiloc.com/rutas-mountain-bike/casas-de-haro-pozoamargo-la-losa-el-picazo-pozoamargo-casas-de-haro-30564316","gpx":""},{"id":"vara-de-rey-la-muela-pozoamargo","published":true,"discipline":"btt","title":"Vara de Rey · La Muela · Pozoamargo","description":"Recorrido BTT desde Casas de Haro hacia Vara de Rey y Pozoamargo.","distance_km":"55,39","elevation_m":350,"difficulty":"Moderado","source":"Wikiloc","source_url":"https://es.wikiloc.com/rutas-mountain-bike/casas-de-haro-vara-de-rey-parque-eolico-la-muela-pozoamargo-casas-de-haro-31711594","gpx":""},{"id":"buenavista-la-roda-la-lobera-minaya","published":true,"discipline":"btt","title":"Buenavista · La Roda · La Lobera · Minaya","description":"Ruta por pistas y caminos de la llanura manchega.","distance_km":"51,33","elevation_m":50,"difficulty":"Moderado","source":"Wikiloc","source_url":"https://es.wikiloc.com/rutas-mountain-bike/casas-de-haro-buenavista-la-roda-la-lobera-minaya-20601871","gpx":""},{"id":"pozoamargo-sisante-vara-de-rey-san-clemente","published":true,"discipline":"btt","title":"Pozoamargo · Sisante · Vara de Rey · San Clemente","description":"Ruta larga por varios municipios del entorno de Casas de Haro.","distance_km":"69,72","elevation_m":197,"difficulty":"Moderado","source":"Wikiloc","source_url":"https://es.wikiloc.com/rutas-mountain-bike/casas-de-haro-pozo-amargo-sisante-vara-de-rey-villar-de-cantos-rus-san-clemente-teatinos-casas-de-19417136","gpx":""},{"id":"villalgordo-del-jucar","published":true,"discipline":"btt","title":"Casas de Haro · Villalgordo del Júcar","description":"Ruta BTT circular de mayor exigencia.","distance_km":"70,63","elevation_m":356,"difficulty":"Difícil","source":"Wikiloc","source_url":"https://es.wikiloc.com/rutas-mountain-bike/casas-de-haro-villargordo-del-jucar-79120939","gpx":""},{"id":"sisante","published":true,"discipline":"btt","title":"Casas de Haro · Sisante","description":"Track desde Casas de Haro hacia Sisante.","distance_km":"41,68","elevation_m":397,"difficulty":"Moderado","source":"Wikiloc","source_url":"https://es.wikiloc.com/rutas-mountain-bike/casas-de-haro-sisante-108357994","gpx":""}],"data/news.json":[],"data/gallery.json":[{"published":true,"image":"assets/campos-atardecer.jpg","alt":"Campos de Casas de Haro al atardecer durante una ruta BTT","caption":"Campos de Casas de Haro al atardecer"},{"published":true,"image":"assets/ermita-bici.jpg","alt":"Bicicleta de montaña en una ruta por el entorno de Casas de Haro","caption":"BTT por el entorno de Casas de Haro"},{"published":true,"image":"assets/iglesia-atardecer.jpg","alt":"Iglesia y paisaje de Casas de Haro al atardecer","caption":"Casas de Haro al atardecer"},{"published":true,"image":"assets/canal.jpg","alt":"Camino y canal en una ruta ciclista cerca de Casas de Haro","caption":"Caminos del entorno"},{"published":true,"image":"assets/bici-pino.jpg","alt":"Bicicleta BTT junto a un pino en los caminos de Casas de Haro","caption":"Bicicleta y caminos de Casas de Haro"}]};
  async function json(path){if(location.protocol==='file:'&&LOCAL_DATA[path])return LOCAL_DATA[path];const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw new Error('No se pudo cargar '+path);return r.json()}
  const fmtDate=iso=>{if(!iso)return 'Fecha por confirmar';const d=new Date(iso+'T12:00:00');return new Intl.DateTimeFormat('es-ES',{weekday:'long',day:'numeric',month:'long'}).format(d)};

  function markCurrentNav(){
    const file=(location.pathname.split('/').pop()||'index.html').toLowerCase();
    document.querySelectorAll('.links a').forEach(a=>{const href=(a.getAttribute('href')||'').split('#')[0].toLowerCase();if(href===file||(file===''&&href==='index.html'))a.setAttribute('aria-current','page')});
  }

  async function renderNextRoute(){
    const targets=document.querySelectorAll('[data-next-route]');
    if(!targets.length)return;
    try{
      const data=await json('data/site.json'); const r=data.next_route||{};
      const gpx=r.gpx?relPath(r.gpx):''; const url=safeUrl(r.track_url);
      targets.forEach(t=>{
        const img=relPath(r.image||'assets/camino-atardecer.jpg');
        t.innerHTML=`<img src="${esc(img)}" alt="${esc(r.image_alt||'Próxima ruta del Club Casas de Haro BTT')}" loading="lazy" decoding="async"><div class="info"><span class="pill">Próxima salida</span><p class="next-route-date">${esc(fmtDate(r.date))}${r.time?' · '+esc(r.time):''}</p><h3>${esc(r.title||'Próxima ruta')}</h3><p class="next-route-desc">${esc(r.description||'Ruta con salida desde Casas de Haro.')}</p><div class="stats"><div class="stat"><b>${esc(r.distance_km||'—')} km</b><span>DISTANCIA</span></div><div class="stat"><b>+${esc(r.elevation_m||'—')} m</b><span>DESNIVEL</span></div><div class="stat"><b>${esc((r.discipline||'BTT').toUpperCase())}</b><span>MODALIDAD</span></div></div><div class="route-actions-wide">${gpx?`<a class="btn" href="${esc(gpx)}" download>Descargar GPX</a>`:''}${url?`<a class="btn secondary" href="${esc(url)}" target="_blank" rel="noopener">Ver track</a>`:''}<a class="btn secondary" href="https://wa.me/34696894161?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20la%20pr%C3%B3xima%20ruta%20de%20Casas%20de%20Haro%20BTT">Quiero apuntarme</a></div></div>`;
      });
    }catch(e){console.warn(e)}
  }

  function routeCard(r){
    const url=safeUrl(r.source_url); const gpx=r.gpx?relPath(r.gpx):'';
    const kind=r.route_type==='club'?'Ruta del Club':'Ruta de la comunidad';
    const author=r.author?`<span>Autor: ${esc(r.author)}</span>`:'';
    const meta=[r.distance_km?`<b>${esc(r.distance_km)} km</b>`:'',r.elevation_m!==''&&r.elevation_m!=null?`<span>+${esc(r.elevation_m)} m</span>`:'',r.difficulty?`<span>${esc(r.difficulty)}</span>`:''].filter(Boolean).join('');
    return `<article class="route-card"><span class="pill">${esc(kind)}</span><h3>${esc(r.title)}</h3>${r.description?`<p>${esc(r.description)}</p>`:''}<div class="meta">${meta}</div><p class="route-source">${author}${r.source?`<span>Fuente: ${esc(r.source)}</span>`:''}</p><div class="route-actions">${gpx?`<a class="btn" href="${esc(gpx)}" download>Descargar GPX</a>`:''}${url?`<a class="btn secondary" target="_blank" rel="noopener" href="${esc(url)}">Ver track</a>`:''}</div></article>`;
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

  function newsCard(n,full){
    const img=n.image?relPath(n.image):''; const date=n.date?fmtDate(n.date):'';
    return `<article class="news-card">${img?`<img src="${esc(img)}" alt="${esc(n.image_alt||n.title||'BTT News')}" loading="lazy" decoding="async">`:''}<div class="news-card-body"><div class="news-meta">${date?`<span>${esc(date)}</span>`:''}${n.member?`<span>· ${esc(n.member)}</span>`:''}</div><h3>${esc(n.title)}</h3>${n.summary?`<p>${esc(n.summary)}</p>`:''}${full&&n.body?`<p class="news-body">${esc(n.body)}</p>`:''}</div></article>`;
  }
  async function renderNews(){
    const list=document.getElementById('newsList'), teaser=document.getElementById('newsTeaser'); if(!list&&!teaser)return;
    try{
      const news=(await json('data/news.json')).filter(n=>n.published!==false).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
      if(list)list.innerHTML=news.length?news.map(n=>newsCard(n,true)).join(''):'<div class="news-empty">Todavía no hay noticias publicadas. Este espacio recogerá novedades del club, salidas, retos y noticias de sus miembros.</div>';
      if(teaser)teaser.innerHTML=news.length?`<div class="news-grid">${news.slice(0,3).map(n=>newsCard(n,false)).join('')}</div><div class="all-routes"><a class="btn dark" href="news.html">Ver BTT News →</a></div>`:'<div class="news-empty">BTT News está listo. Las próximas novedades del club aparecerán aquí automáticamente.</div>';
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
    if(!wrap||wrap.querySelector('.legal-links'))return;
    const nav=document.createElement('nav');
    nav.className='legal-links';
    nav.setAttribute('aria-label','Información legal');
    nav.innerHTML='<a href="aviso-legal.html">Aviso legal</a><a href="privacidad.html">Privacidad</a><a href="cookies.html">Cookies</a>';
    wrap.append(nav);
  }

  document.addEventListener('DOMContentLoaded',()=>{markCurrentNav();renderNextRoute();renderRoutes();renderWeather();renderNews();renderGallery();enhanceFooter();});
})();
