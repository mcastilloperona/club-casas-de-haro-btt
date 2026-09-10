(function(){
  'use strict';

  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const safeUrl=u=>{try{const x=new URL(String(u||''),location.href);return ['http:','https:'].includes(x.protocol)?x.href:''}catch(e){return ''}};
  const relPath=p=>String(p||'').replace(/^\/+/, '');
  const LOCAL_DATA={"data/site.json":{"next_route":{"title":"Ruta circular Carretera","date":"2026-09-11","time":"18:00","discipline":"Carretera","description":"Vuelta circular con carretera. Casas de haro- Benitez- Sisante-Pozoamargo-Casas de Haro","image":"assets/1000015927.jpg","image_alt":"Camino de Casas de Haro al atardecer","distance_km":43,"elevation_m":200,"track_url":"https://connect.garmin.com/modern/activity/24140425659?share_unique_id=4"}},"data/routes.json":[{"id":"pozoamargo-la-losa-el-picazo","published":true,"discipline":"btt","title":"Pozoamargo · La Losa · El Picazo","description":"Ruta circular desde Casas de Haro por caminos del entorno.","route_type":"community","author":"Javier Parreño Pérez","distance_km":"54,41","elevation_m":214,"difficulty":"Moderado","source":"Wikiloc","source_url":"https://es.wikiloc.com/rutas-mountain-bike/casas-de-haro-pozoamargo-la-losa-el-picazo-pozoamargo-casas-de-haro-30564316","gpx":""},{"id":"vara-de-rey-la-muela-pozoamargo","published":true,"discipline":"btt","title":"Vara de Rey · La Muela · Pozoamargo","description":"Recorrido BTT desde Casas de Haro hacia Vara de Rey y Pozoamargo.","route_type":"community","author":"Javier Parreño Pérez","distance_km":"55,39","elevation_m":350,"difficulty":"Moderado","source":"Wikiloc","source_url":"https://es.wikiloc.com/rutas-mountain-bike/casas-de-haro-vara-de-rey-parque-eolico-la-muela-pozoamargo-casas-de-haro-31711594","gpx":""},{"id":"buenavista-la-roda-la-lobera-minaya","published":true,"discipline":"btt","title":"Buenavista · La Roda · La Lobera · Minaya","description":"Ruta por pistas y caminos de la llanura manchega.","route_type":"community","author":"Jesús Moya","distance_km":"51,33","elevation_m":50,"difficulty":"Moderado","source":"Wikiloc","source_url":"https://es.wikiloc.com/rutas-mountain-bike/casas-de-haro-buenavista-la-roda-la-lobera-minaya-20601871","gpx":""},{"id":"pozoamargo-sisante-vara-de-rey-san-clemente","published":true,"discipline":"btt","title":"Pozoamargo · Sisante · Vara de Rey · San Clemente","description":"Ruta larga por varios municipios del entorno de Casas de Haro.","route_type":"community","author":"Jesús Moya","distance_km":"69,72","elevation_m":197,"difficulty":"Moderado","source":"Wikiloc","source_url":"https://es.wikiloc.com/rutas-mountain-bike/casas-de-haro-pozo-amargo-sisante-vara-de-rey-villar-de-cantos-rus-san-clemente-teatinos-casas-de-19417136","gpx":""},{"id":"villalgordo-del-jucar","published":true,"discipline":"btt","title":"Casas de Haro · Villalgordo del Júcar","description":"Ruta BTT circular de mayor exigencia.","route_type":"community","author":"Jesús Moya","distance_km":"70,63","elevation_m":356,"difficulty":"Difícil","source":"Wikiloc","source_url":"https://es.wikiloc.com/rutas-mountain-bike/casas-de-haro-villargordo-del-jucar-79120939","gpx":""},{"id":"sisante","published":true,"discipline":"btt","title":"Casas de Haro · Sisante","description":"Track desde Casas de Haro hacia Sisante.","route_type":"community","author":"davidanaya","distance_km":"41,68","elevation_m":397,"difficulty":"Moderado","source":"Wikiloc","source_url":"https://es.wikiloc.com/rutas-mountain-bike/casas-de-haro-sisante-108357994","gpx":""},{"id":"torcas-senda-sisante","published":true,"discipline":"btt","title":"Casas de Haro · Torcas · Senda de Sisante","description":"Ruta circular con tramos de senda y zonas técnicas en el entorno de Sisante.","route_type":"community","author":"waksmen","distance_km":"59,76","elevation_m":489,"difficulty":"Difícil","source":"Wikiloc","source_url":"https://es.wikiloc.com/rutas-mountain-bike/casas-de-haro-torcas-senda-sisante-19191076","gpx":""},{"id":"pozoamargo-benitez-trasvase-batanejo-lalosa","published":true,"discipline":"btt","title":"Pozo Amargo · Casas de Benítez · Trasvase · Batanejo · La Losa","description":"Recorrido por caminos de Casas de Haro hacia Pozo Amargo, Casas de Benítez y La Losa.","route_type":"community","author":"Jesús Moya","distance_km":"64,49","elevation_m":241,"difficulty":"Moderado","source":"Wikiloc","source_url":"https://es.wikiloc.com/rutas-mountain-bike/casas-de-haro-pozo-amargo-casas-de-benitez-trasvase-batanejo-la-losa-casas-de-haro-55233270","gpx":""},{"id":"teatinos-san-clemente-santiaguillo-provencio","published":true,"discipline":"btt","title":"Teatinos · San Clemente · Santiaguillo · El Provencio · Los Pinos","description":"Ruta larga y rodadora desde Casas de Haro por San Clemente, El Provencio y Casas de los Pinos.","route_type":"community","author":"Javier Parreño Pérez","distance_km":"71,34","elevation_m":100,"difficulty":"","source":"Wikiloc","source_url":"https://es.wikiloc.com/rutas-mountain-bike/casas-de-haro-teatinos-san-clemente-castillo-de-santiaguillo-el-provencio-los-pinos-casas-de-haro-30741866","gpx":""},{"id":"lalosa-villalgordo-elcarmen","published":true,"discipline":"btt","title":"Casas de Haro · La Losa · Villalgordo · El Carmen","description":"Ruta BTT circular por La Losa, Villalgordo y El Carmen.","route_type":"community","author":"Javier Parreño Pérez","distance_km":"58,58","elevation_m":230,"difficulty":"Moderado","source":"Wikiloc","source_url":"https://es.wikiloc.com/rutas/mountain-bike/espana/castilla-la-mancha/ruiperez","gpx":""},{"id":"fuensanta-laroda","published":true,"discipline":"btt","title":"Casas de Haro · Fuensanta · La Roda","description":"Recorrido BTT de perfil rodador hacia Fuensanta y La Roda.","route_type":"community","author":"Javier Parreño Pérez","distance_km":"53,29","elevation_m":143,"difficulty":"Moderado","source":"Wikiloc","source_url":"https://es.wikiloc.com/rutas/mountain-bike/espana/castilla-la-mancha/ruiperez","gpx":""},{"id":"elsimarro-varaderey","published":true,"discipline":"btt","title":"Casas de Haro · El Simarro · Vara de Rey","description":"Opción BTT más corta desde Casas de Haro por El Simarro y Vara de Rey.","route_type":"community","author":"Javier Parreño Pérez","distance_km":"32,21","elevation_m":196,"difficulty":"","source":"Wikiloc","source_url":"https://es.wikiloc.com/rutas/mountain-bike/espana/castilla-la-mancha/ruiperez","gpx":""},{"id":"road-pantano-alarcon","published":true,"discipline":"road","title":"Casas de Haro · Pantano de Alarcón","description":"Ruta de carretera desde Casas de Haro hacia el entorno del pantano de Alarcón.","route_type":"community","author":"MiguelCastilloPerona","distance_km":"87,72","elevation_m":531,"difficulty":"","source":"Wikiloc","source_url":"https://es.wikiloc.com/rutas/ciclismo/espana/castilla-la-mancha/los-pavos","gpx":""},{"id":"road-casa-simarro","published":true,"discipline":"road","title":"Casas de Haro · Casa Simarro","description":"Recorrido de carretera de media distancia por el entorno de Casas de Haro y Casa Simarro.","route_type":"community","author":"MiguelCastilloPerona","distance_km":"46,63","elevation_m":307,"difficulty":"","source":"Wikiloc","source_url":"https://es.wikiloc.com/rutas/ciclismo/espana/castilla-la-mancha/los-pavos","gpx":""},{"id":"road-alarcon-larga","published":true,"discipline":"road","title":"Casas de Haro · Alarcón","description":"Ruta larga de carretera pasando por Casas de Fernando Alonso, San Clemente, Cañada Juncosa, Tébar y Alarcón.","route_type":"community","author":"MiguelCastilloPerona","distance_km":"119,88","elevation_m":682,"difficulty":"","source":"Wikiloc","source_url":"https://es.wikiloc.com/rutas/ciclismo/espana/castilla-la-mancha/los-pavos","gpx":""},{"id":"road-varaderey-sisante","published":true,"discipline":"road","title":"Casas de Haro · Vara de Rey · Sisante","description":"Vuelta de carretera más corta desde Casas de Haro por Vara de Rey y Sisante.","route_type":"community","author":"MiguelCastilloPerona","distance_km":"38,97","elevation_m":165,"difficulty":"","source":"Wikiloc","source_url":"https://es.wikiloc.com/rutas/ciclismo/espana/castilla-la-mancha/los-pavos","gpx":""},{"id":"road-lospavos-ruiperez","published":true,"discipline":"road","title":"Los Pavos · Ruipérez","description":"Ruta de carretera de distancia contenida por el entorno inmediato de Casas de Haro.","route_type":"community","author":"MiguelCastilloPerona","distance_km":"43,22","elevation_m":279,"difficulty":"","source":"Wikiloc","source_url":"https://es.wikiloc.com/rutas/ciclismo/espana/castilla-la-mancha/los-pavos","gpx":""},{"id":"road-castillo-pantano-ruiperez","published":true,"discipline":"road","title":"Castillo de Alarcón · Pantano de Alarcón · Ruipérez","description":"Recorrido de carretera por el Castillo de Alarcón y el pantano, con regreso hacia Ruipérez.","route_type":"community","author":"MiguelCastilloPerona","distance_km":"87,39","elevation_m":551,"difficulty":"","source":"Wikiloc","source_url":"https://es.wikiloc.com/rutas/ciclismo/espana/castilla-la-mancha/los-pavos","gpx":""}],"data/news.json":[{"published":true,"title":"Salida BTT domingo 6 de septiembre","date":"2026-09-07","category":"salida","summary":"Ruta dominical de 65 kilómetros por el entorno de Casas de Haro, disfrutando de los caminos, los paisajes y el buen ambiente del grupo.","body":"Este domingo volvimos a disfrutar de una estupenda mañana de bicicleta de montaña por los caminos de nuestra comarca.\n\nCompletamos una ruta de 65 kilómetros y unos 565 metros de desnivel positivo, con salida y llegada en Casas de Haro. Fueron alrededor de 3 horas de pedaleo compartiendo caminos, conversación y muy buen ambiente.\n\nDurante el recorrido encontramos algunos de esos paisajes que hacen especiales nuestras salidas, como los campos de girasoles que todavía ponen una nota de color al final del verano.\n\nMás allá de los kilómetros, nos quedamos con lo mejor de cada domingo: disfrutar de la bicicleta, descubrir nuestro entorno y compartir la ruta con buenos compañeros.\n\n¡Nos vemos en la próxima salida!","image":"assets/20260906110615.jpg"},{"published":true,"title":"Gran Premio BTT Rujamar","date":"2026-09-27","category":"evento","summary":"https://www.circuitodiputacioncuencamtb.com/v2/index.php/calendario/02-10","body":"El Gran Premio BTT Rujamar Ciudad de Cuenca llega el próximo 27 de septiembre de 2026 como una de las citas destacadas del XVII Circuito MTB Diputación Provincial de Cuenca.\n\nUna prueba para disfrutar del mejor mountain bike, con recorridos de 17 y 34 kilómetros y un ambiente marcado por la competición, el esfuerzo y la pasión por la bicicleta.\n\nDesde Casas de Haro BTT queremos desear mucha suerte a todos los corredores que tomen la salida\n¡A disfrutar, darlo todo y volver con grandes sensaciones!","image":"assets/captura-de-pantalla-2026-09-07-180836.png","image_alt":"Infografía"},{"published":true,"title":"José María “Látigo” completa el Triatlón de Honrubia","date":"2026-09-05","category":"evento","summary":"Nuestro compañero José María “Látigo” completó el Triatlón de Honrubia con un tiempo de 2 horas, 41 minutos y 18 segundos.","body":"El pasado sábado, nuestro amigo y compañero José María López Pérez, más conocido entre nosotros como “Látigo”, participó en el Triatlón de Honrubia y consiguió completar con éxito todo el recorrido.\n\nJosé María cruzó la meta con un tiempo de 2 horas, 41 minutos y 18 segundos, ocupando el puesto 74 de la clasificación general, el 69 en categoría masculina y el 22 entre los 27 participantes de Veterano 1 Masculino.\n\nUna magnífica experiencia deportiva en la que volvió a demostrar su esfuerzo, constancia y capacidad para enfrentarse a nuevos retos, combinando natación, ciclismo y carrera a pie.\n\nDesde el Club Casas de Haro BTT queremos darle nuestra enhorabuena por completar la prueba. ¡Enhorabuena, Látigo, y a por el próximo desafío!","image":"assets/captura-de-pantalla-2026-09-08-005608.png"}],"data/gallery.json":[{"published":true,"image":"assets/campos-atardecer.jpg","alt":"Campos de Casas de Haro al atardecer durante una ruta BTT","caption":"Campos de Casas de Haro al atardecer"},{"published":true,"image":"assets/ermita-bici.jpg","alt":"Bicicleta de montaña en una ruta por el entorno de Casas de Haro","caption":"BTT por el entorno de Casas de Haro"},{"published":true,"image":"assets/iglesia-atardecer.jpg","alt":"Iglesia y paisaje de Casas de Haro al atardecer","caption":"Casas de Haro al atardecer"},{"published":true,"image":"assets/canal.jpg","alt":"Camino y canal en una ruta ciclista cerca de Casas de Haro","caption":"Caminos del entorno"},{"published":true,"image":"assets/bici-pino.jpg","alt":"Bicicleta BTT junto a un pino en los caminos de Casas de Haro","caption":"Bicicleta y caminos de Casas de Haro"}]};
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
    style.textContent='.signup-open{font:inherit;font-weight:800!important;cursor:pointer;background:#65d7a1!important;color:#031b37!important;border:1px solid #65d7a1!important;box-shadow:0 8px 20px rgba(101,215,161,.28)!important;transition:transform .18s ease,background .18s ease,box-shadow .18s ease}.signup-open:hover{background:#7ee2b2!important;transform:translateY(-1px);box-shadow:0 10px 24px rgba(101,215,161,.36)!important}.signup-open:focus-visible{outline:3px solid #b9e9f4!important;outline-offset:3px}.signup-modal[hidden]{display:none}.signup-modal{position:fixed;inset:0;z-index:10000;background:rgba(3,27,55,.76);display:grid;place-items:center;padding:18px;overflow:auto}.signup-modal-card{position:relative;width:min(520px,100%);max-height:calc(100vh - 36px);overflow:auto;background:#fff;color:#06264b;border-radius:22px;padding:28px;box-shadow:0 24px 70px #0006}.signup-modal-card h3{margin:0 42px 6px 0;font-size:28px}.signup-modal-card>p{margin:0;color:#56606b;line-height:1.5}.signup-modal-close{position:absolute;top:14px;right:14px;width:40px;height:40px;border:0;border-radius:50%;background:#eef5f8;color:#06264b;font-size:24px;line-height:1;cursor:pointer}.signup-route-summary{margin:18px 0!important;padding:13px 15px;border-radius:14px;background:#eef8fb;color:#06264b!important;font-weight:750}.signup-form{display:grid;gap:14px;margin-top:18px}.signup-field{display:grid;gap:6px;font-weight:800;font-size:14px}.signup-field input,.signup-field select,.signup-field textarea{width:100%;font:inherit;color:#06264b;background:#fff;border:1px solid #bdcbd4;border-radius:11px;padding:11px 12px}.signup-field textarea{min-height:76px;resize:vertical}.signup-field input:focus,.signup-field select:focus,.signup-field textarea:focus{outline:3px solid rgba(19,185,232,.25);border-color:#078db5}.signup-privacy{font-size:12px!important;color:#687782!important}.signup-mode{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid #e1eaee;padding-top:13px}.signup-mode button{border:0;background:none;color:#075da0;padding:4px 0;font:inherit;font-size:13px;font-weight:850;text-decoration:underline;cursor:pointer}.signup-modal-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}.signup-channel{border:1px solid #1b527d;border-radius:999px;padding:12px 16px;background:#06264b;color:#fff;font:inherit;font-weight:850;cursor:pointer}.signup-channel.telegram{background:#229ed9;border-color:#229ed9}.signup-channel:hover{filter:brightness(1.08)}.signup-status{min-height:20px;margin:0!important;font-size:13px;color:#56606b!important}.signup-field[hidden]{display:none}@media(max-width:520px){.signup-modal{padding:10px}.signup-modal-card{padding:24px 20px;max-height:calc(100vh - 20px);border-radius:18px}.signup-modal-actions{grid-template-columns:1fr}.signup-mode{align-items:flex-start;flex-direction:column}}';
    document.head.appendChild(style);
    const modal=document.createElement('div');
    modal.id='signupModal';
    modal.className='signup-modal';
    modal.hidden=true;
    modal.innerHTML='<div class="signup-modal-card" role="dialog" aria-modal="true" aria-labelledby="signupModalTitle"><button class="signup-modal-close" type="button" aria-label="Cerrar">×</button><h3 id="signupModalTitle">Apuntarme a la salida</h3><p id="signupModalIntro">Completa tus datos y elige cómo quieres enviar la solicitud al club.</p><p class="signup-route-summary" id="signupRouteSummary"></p><form class="signup-form" id="signupForm"><label class="signup-field">Nombre o apodo<input id="signupName" name="name" type="text" maxlength="60" autocomplete="name" required></label><label class="signup-field" id="signupPaceField">Ritmo previsto<select id="signupPace" name="pace"><option value="">Prefiero no indicarlo</option><option>Tranquilo</option><option>Medio</option><option>Rápido</option><option>No lo sé</option></select></label><label class="signup-field">Comentario opcional<textarea id="signupComment" name="comment" maxlength="180" placeholder="Cualquier información útil para la salida"></textarea></label><p class="signup-privacy">Estos datos no se guardan en la web. Se incorporan al mensaje que enviarás por Telegram o correo electrónico.</p><div class="signup-modal-actions"><button class="signup-channel telegram" type="button" data-channel="telegram">Enviar por Telegram</button><button class="signup-channel email" type="button" data-channel="email">Enviar por email</button></div><p class="signup-status" id="signupStatus" aria-live="polite">La plaza quedará pendiente de confirmación por parte del club.</p><div class="signup-mode"><span id="signupModeHint">¿Ya te habías apuntado?</span><button id="signupModeToggle" type="button">Comunicar una baja</button></div></form></div>';
    document.body.appendChild(modal);

    const form=modal.querySelector('#signupForm');
    const title=modal.querySelector('#signupModalTitle');
    const intro=modal.querySelector('#signupModalIntro');
    const summary=modal.querySelector('#signupRouteSummary');
    const paceField=modal.querySelector('#signupPaceField');
    const hint=modal.querySelector('#signupModeHint');
    const toggle=modal.querySelector('#signupModeToggle');
    const status=modal.querySelector('#signupStatus');
    let lastFocus=null;
    let mode='signup';
    let routeTitle='Próxima salida';
    let routeDate='Fecha por confirmar';

    function setMode(next){
      mode=next;
      const signup=mode==='signup';
      title.textContent=signup?'Apuntarme a la salida':'Comunicar una baja';
      intro.textContent=signup?'Completa tus datos y elige cómo quieres enviar la solicitud al club.':'Indica tu nombre y avisa al club de que finalmente no podrás asistir.';
      paceField.hidden=!signup;
      hint.textContent=signup?'¿Ya te habías apuntado?':'¿Finalmente quieres asistir?';
      toggle.textContent=signup?'Comunicar una baja':'Volver a apuntarme';
      status.textContent=signup?'La plaza quedará pendiente de confirmación por parte del club.':'La baja quedará pendiente hasta que el club reciba tu mensaje.';
    }

    function routeDetails(opener){
      const card=opener&&opener.closest('[data-next-route]');
      const h3=card&&card.querySelector('.info h3');
      const date=card&&card.querySelector('.next-route-date');
      routeTitle=h3&&h3.textContent.trim()?h3.textContent.trim():'Próxima salida';
      routeDate=date&&date.textContent.trim()?date.textContent.trim():'Fecha por confirmar';
      summary.textContent=routeTitle+' · '+routeDate;
    }

    function buildMessage(){
      const name=form.querySelector('#signupName').value.trim();
      const pace=form.querySelector('#signupPace').value;
      const comment=form.querySelector('#signupComment').value.trim();
      const lines=mode==='signup'
        ? ['Hola, quiero apuntarme a la próxima salida del Club Casas de Haro BTT.','Ruta: '+routeTitle,'Fecha: '+routeDate,'Nombre o apodo: '+name]
        : ['Hola, finalmente no podré asistir a la próxima salida del Club Casas de Haro BTT.','Ruta: '+routeTitle,'Fecha: '+routeDate,'Nombre o apodo: '+name];
      if(mode==='signup'&&pace)lines.push('Ritmo previsto: '+pace);
      if(comment)lines.push('Comentario: '+comment);
      return lines.join('\n');
    }

    function openChannel(channel){
      if(!form.reportValidity())return;
      const message=buildMessage();
      status.textContent='Abriendo '+(channel==='telegram'?'Telegram':'tu aplicación de correo')+'…';
      if(channel==='telegram'){
        const url='https://t.me/mcastilloperona?text='+encodeURIComponent(message);
        window.location.href=url;
      }else{
        const subject=mode==='signup'?'Quiero apuntarme a la próxima salida':'Baja de la próxima salida';
        window.location.href='mailto:mcastillo@casasdeharobtt.es?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(message);
      }
    }

    const open=opener=>{
      lastFocus=document.activeElement;
      form.reset();
      routeDetails(opener);
      setMode('signup');
      modal.hidden=false;
      document.body.style.overflow='hidden';
      window.setTimeout(()=>form.querySelector('#signupName').focus(),0);
    };
    const close=()=>{
      modal.hidden=true;
      document.body.style.overflow='';
      if(lastFocus&&lastFocus.focus)lastFocus.focus();
    };

    toggle.addEventListener('click',()=>setMode(mode==='signup'?'cancel':'signup'));
    modal.querySelectorAll('[data-channel]').forEach(button=>button.addEventListener('click',()=>openChannel(button.dataset.channel)));
    document.addEventListener('click',e=>{
      const opener=e.target.closest('.signup-open');
      if(opener){e.preventDefault();open(opener);return}
      if(e.target===modal||e.target.closest('.signup-modal-close'))close();
    });
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close()});
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
      if(teaser)teaser.innerHTML=news.length?`<div class="news-grid">${news.slice(0,3).map(n=>newsCard(n,false)).join('')}</div><div class="all-routes"><a class="btn dark" href="news.html">Ver BTT News</a></div>`:'<div class="news-empty">BTT News está listo. Las próximas novedades del club aparecerán aquí automáticamente.</div>';
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

  document.addEventListener('DOMContentLoaded',()=>{markCurrentNav();setupSignupModal();renderNextRoute();renderRoutes();renderWeather();renderNews();renderGallery();enhanceFooter();});
})();
