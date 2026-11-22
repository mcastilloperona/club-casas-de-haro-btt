// Route geometry stays in this browser tab. Only sampled coordinates go to the forecast service.
let bikeRoute=null,routeForecast=null,routeBusy=false,routeMessage='',routeError=false,routeGeneration=0;
let routeDeparture=localDateTime(new Date(Date.now()+3600000)),routeSpeed=22;
function localDateTime(d){return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}
const rad=n=>n*Math.PI/180;
function routeDistance(a,b){const x=rad(b.lat-a.lat),y=rad(b.lon-a.lon),v=Math.sin(x/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(y/2)**2;return 6371*2*Math.atan2(Math.sqrt(v),Math.sqrt(Math.max(0,1-v)));}
function routeBearing(a,b){const d=rad(b.lon-a.lon),y=Math.sin(d)*Math.cos(rad(b.lat)),x=Math.cos(rad(a.lat))*Math.sin(rad(b.lat))-Math.sin(rad(a.lat))*Math.cos(rad(b.lat))*Math.cos(d);return(Math.atan2(y,x)*180/Math.PI+360)%360;}
function parseBikeRoute(xml,filename){
if(xml.length>750000&&/<gpx\b/i.test(xml)){
  // Extensions are per-point metadata, not coordinates. Reducing them avoids
  // creating tens of thousands of unnecessary XML nodes on Android.
  xml=xml.replace(/<extensions\b[^>]*>[\s\S]*?<\/extensions\s*>/gi,'');
}
const doc=new DOMParser().parseFromString(xml,'application/xml');if(doc.querySelector('parsererror'))throw Error('El archivo no es un GPX o TCX válido. Vuelve a exportarlo desde tu aplicación de rutas.');
const root=doc.documentElement.localName.toLowerCase();if(!['gpx','trainingcenterdatabase'].includes(root))throw Error('Selecciona una ruta en formato GPX o TCX.');
const byName=(node,name)=>Array.from(node.getElementsByTagNameNS('*',name));let raw=[];
if(root==='gpx'){let groups=byName(doc,'trkseg');if(!groups.length)groups=byName(doc,'rte');if(!groups.length)throw Error('El GPX no contiene un recorrido. Exporta una ruta con track o puntos de ruta.');raw=groups.flatMap(group=>byName(group,group.localName==='rte'?'rtept':'trkpt').map(n=>({lat:Number(n.getAttribute('lat')),lon:Number(n.getAttribute('lon')),valid:n.hasAttribute('lat')&&n.hasAttribute('lon')})));}
else{raw=byName(doc,'Trackpoint').flatMap(n=>{const lat=byName(n,'LatitudeDegrees')[0],lon=byName(n,'LongitudeDegrees')[0];return lat&&lon?[{lat:Number(lat.textContent),lon:Number(lon.textContent),valid:lat.textContent.trim()!==''&&lon.textContent.trim()!==''}]:[];});}
if(raw.length>100000)throw Error('La ruta tiene demasiados puntos. Exporta una versión simplificada de hasta 100.000 puntos.');
if(raw.length<2)throw Error('Necesitamos al menos dos puntos con coordenadas.');if(raw.some(p=>!p.valid||!Number.isFinite(p.lat)||!Number.isFinite(p.lon)||Math.abs(p.lat)>90||Math.abs(p.lon)>180))throw Error('El archivo contiene coordenadas no válidas.');
const points=[{...raw[0],km:0}];for(const p of raw.slice(1)){const last=points.at(-1),d=routeDistance(last,p);if(d>100)throw Error('La ruta contiene un salto de más de 100 km entre puntos. Revisa el archivo.');if(d>.0001)points.push({...p,km:last.km+d});}
if(points.length<2||points.at(-1).km<.1)throw Error('La ruta debe tener al menos 100 metros.');if(points.at(-1).km>1500)throw Error('Esta consulta está pensada para salidas de hasta 1.500 km. Divide la ruta en etapas.');
const name=byName(doc,'name')[0]?.textContent?.trim()||byName(doc,'Name')[0]?.textContent?.trim()||filename.replace(/\.(gpx|tcx)$/i,'');return {name:name.slice(0,160),points,km:points.at(-1).km};}
function sampleBikeRoute(route){const samples=[],pts=route.points;let j=1;for(let i=0;i<8;i++){const km=route.km*i/7;while(j<pts.length-1&&pts[j].km<km)j++;const a=pts[j-1],b=pts[j],f=(km-a.km)/(b.km-a.km);let dl=b.lon-a.lon;if(dl>180)dl-=360;if(dl< -180)dl+=360;const lon=((a.lon+f*dl+540)%360)-180;samples.push({lat:a.lat+(b.lat-a.lat)*f,lon,km,bearing:routeBearing(a,b)});}return samples;}
// Real GPX map: the path remains local; forecast is sampled at eight positions.
let bikeLeafletMap=null;
function routeMap(){
 if(!bikeRoute)return '';
 return `<div class="bike-map-section"><div class="bike-map-top"><div><strong>Tu recorrido en el mapa</strong><small>${routeForecast?'Flechas y datos a tu hora estimada de paso':'8 puntos de análisis · el pronóstico aparecerá al analizar'}</small></div><span class="bike-map-distance">${num(bikeRoute.km,1)} km</span></div>
 <div class="bike-map-container" id="bikeMap" role="region" aria-label="Mapa del recorrido y viento previsto en ocho puntos">
 <div class="bike-map-overlay">↗ Flecha = hacia dónde sopla el viento<br>Toca un punto para ver todos sus datos</div></div>
 <div id="bikeMapFallback" class="bike-map-fallback" hidden>El mapa no está disponible. Los puntos y sus datos se muestran debajo.</div>
 <div class="bike-map-legend"><span><i class="bike-legend-dot tail"></i> A favor</span><span><i class="bike-legend-dot head"></i> De cara</span><span><i class="bike-legend-dot side"></i> Lateral</span><span><i class="bike-legend-dot pending"></i> Sin analizar</span></div>
 <p class="routekey">Dirección y fuerza del viento calculadas en la hora estimada de paso a velocidad constante. La flecha indica hacia dónde sopla, no hacia dónde avanzas. © OpenStreetMap contributors.</p></div>`;
}
function disposeBikeMap(){if(bikeLeafletMap){bikeLeafletMap.remove();bikeLeafletMap=null;}}
function attachBikeMap(){
 const container=document.getElementById('bikeMap');
 if(!container||!bikeRoute)return;
 if(!window.L){document.getElementById('bikeMapFallback').hidden=false;return;}
 try{
  const map=L.map(container,{scrollWheelZoom:false,zoomControl:false,preferCanvas:true});
  bikeLeafletMap=map;
  L.control.zoom({position:'bottomright'}).addTo(map);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(map);
  const points=bikeRoute.points,step=Math.max(1,Math.ceil(points.length/2500)),line=points.filter((_,i)=>i%step===0||i===points.length-1).map(p=>[p.lat,p.lon]);
  const track=L.polyline(line,{color:'#2456ef',weight:5,opacity:.9,lineJoin:'round'}).addTo(map);
  map.fitBounds(track.getBounds().pad(.13),{animate:false,maxZoom:15});
  const samples=sampleBikeRoute(bikeRoute);
  samples.forEach((p,i)=>{
   const forecast=routeForecast?.[i],h=forecast?.h;
   const relation=h?windRelation(h,p.bearing):null;
   const kind=relation?.cls||'pending';
   const windTo=h?((h.dir+180)%360):0;
   const departure=new Date(routeDeparture).getTime()/1000;
   const passage=forecast?.time||departure+p.km/routeSpeed*3600;
   const tooltip=h?`${num(h.temp)}° · ${num(h.gust)} km/h`:`${i+1}`;
   const arrow=h?`<span class="bike-wind-arrow" style="transform:rotate(${windTo}deg)" aria-hidden="true">↑</span>`:`<span class="bike-point-number">${i+1}</span>`;
   const marker=L.marker([p.lat,p.lon],{icon:L.divIcon({className:'bike-wind-marker '+kind,html:`<span class="bike-marker-inner">${arrow}</span><span class="bike-marker-data">${tooltip}</span>`,iconSize:[92,53],iconAnchor:[46,24]})}).addTo(map);
   marker.bindPopup(`<div class="bike-popup"><strong>Punto ${i+1} · km ${num(p.km,1)}</strong><br>Pasarías: ${Number.isFinite(passage)?routeTime(passage):'—'}<br>${h?`<b>${num(h.temp)} °C</b> · sensación ${num(h.feel)} °C<br>Lluvia ${num(h.p)} % · ${num(h.mm,1)} mm<br>Viento ${num(h.speed)} km/h · rachas ${num(h.gust)} km/h<br><b>${relation.text}</b> · sopla hacia el ${cardinal(windTo)}`:'Pendiente de consulta meteorológica'}</div>`,{maxWidth:260});
  });
  setTimeout(()=>{if(bikeLeafletMap===map)map.invalidateSize();},50);
 }catch(err){disposeBikeMap();const fallback=document.getElementById('bikeMapFallback');if(fallback)fallback.hidden=false;}
}
function windRelation(h,bearing){const c=component(h,bearing);return {text:Math.abs(c.head)<2?'Lateral':c.head>0?'De cara':'A favor',cls:Math.abs(c.head)<2?'side':c.head>0?'head':'tail',...c};}
function routePanel(){return `<section class="routebox" aria-labelledby="routeTitle"><div class="routehead"><div><span class="eyebrow">TU RUTA + EL TIEMPO</span><h2 id="routeTitle">Cada kilómetro cuenta.</h2></div><div class="route-upload-control"><label for="routeFile" class="route-upload-label">${bikeRoute?'Cambiar GPX':'Selecciona tu GPX'}</label><input id="routeFile" type="file" accept=".gpx,.tcx,application/gpx+xml,application/vnd.garmin.tcx+xml,text/xml,application/xml" aria-label="Seleccionar un archivo GPX o TCX de tu dispositivo"><small>Desde archivos o descargas · GPX / TCX</small></div></div><p class="muted">Carga tu recorrido y descubre qué tiempo te espera a medida que avanzas.</p><div id="routeStatus" class="routestatus ${routeError?'error':''}" role="status">${esc(routeMessage)}</div>${bikeRoute?`<div class="routemeta"><strong>${esc(bikeRoute.name)}</strong><span>${num(bikeRoute.km,1)} km</span><span>${num(bikeRoute.km/routeSpeed,1)} h estimadas · sin paradas</span><button class="linkbutton" id="removeRoute">Quitar ruta</button></div><div class="controls"><label>Salida · hora de tu dispositivo<input id="routeDeparture" type="datetime-local" value="${esc(routeDeparture)}" required></label><label>Velocidad media · km/h<input id="routeSpeed" type="number" value="${routeSpeed}" min="5" max="60" step="1" inputmode="numeric"></label><button class="primary" id="analyzeRoute" ${routeBusy?'disabled':''}>${routeBusy?'Consultando…':'Analizar ruta'}</button></div>${routeBusy?'<div class="routeprogress" role="progressbar" aria-label="Consultando el tiempo en ocho puntos"></div>':''}${routeMap()}<div class="routevisual">${routeForecast?routeSummary():`<div><span class="eyebrow">PREPARA TU SALIDA</span><h3>El viento cambia con tu rumbo.</h3><p class="muted">Consultaré 8 puntos del recorrido a tu hora estimada de paso, usando la dirección de cada tramo para calcular el viento de cara, lateral o a favor.</p><p class="muted">Elige una salida dentro de los próximos 6 días. La consulta debe cubrir también la llegada.</p></div>`}</div>${routeForecast?routeTable():''}`:`<div class="routeempty"><svg viewBox="0 0 100 65" fill="none" aria-hidden="true"><path d="M10 50C10 10 80 60 80 18S25 10 45 45" stroke="currentColor" stroke-width="2.5" stroke-dasharray="4 4"/><circle cx="10" cy="50" r="5" fill="currentColor"/><circle cx="45" cy="45" r="5" fill="#e96a37"/></svg><div><h3>Trae la ruta. Nosotros, el pronóstico.</h3><p class="muted">GPX o TCX · hasta 10 MB<br>Exporta tu recorrido desde tu aplicación de ciclismo.</p></div></div>`}<p class="routekey">El archivo se procesa en tu navegador. Solo se envían 8 coordenadas a Open-Meteo. Las horas de paso son estimaciones a velocidad constante, sin desnivel, descansos ni tráfico.</p></section>`;}
function routeSummary(){const good=routeForecast.filter(x=>x.h);if(!good.length)return '<p>No hay pronóstico disponible para esta salida.</p>';const temps=good.map(x=>x.h.temp).filter(Number.isFinite),gusts=good.map(x=>x.h.gust).filter(Number.isFinite),probs=good.map(x=>x.h.p).filter(Number.isFinite);return `<div class="routesummary"><div><small>Temperatura en los puntos</small><strong>${temps.length?num(Math.min(...temps))+'° — '+num(Math.max(...temps))+'°':'—'}</strong></div><div><small>Racha máxima prevista</small><strong>${gusts.length?num(Math.max(...gusts))+' km/h':'—'}</strong></div><div><small>Lluvia · probabilidad máxima</small><strong>${probs.length?num(Math.max(...probs))+' %':'—'}</strong></div><div><small>Puntos con viento de cara*</small><strong>${good.filter(x=>windRelation(x.h,x.bearing).cls==='head').length} de ${good.length}</strong></div><p class="routekey" style="grid-column:1/-1">*En el rumbo muestreado. No equivale al porcentaje de kilómetros de la ruta. ${good.length<8?'Consulta parcial: faltan puntos.':''}</p></div>`;}
const routeTime=t=>new Intl.DateTimeFormat('es-ES',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'short'}).format(new Date(t*1000));
function routeTable(){return `<div class="sectiontitle"><h3>El tiempo a tu paso</h3><span class="routekey">Horas de tu dispositivo · toca un punto</span></div><div class="tablewrap"><table class="route-table"><thead><tr><th>PUNTO / KM</th><th>PASO ESTIMADO</th><th>TEMPERATURA</th><th>LLUVIA</th><th>VIENTO EN TU RUMBO</th><th>RACHAS</th></tr></thead><tbody>${routeForecast.map((p,i)=>{const w=p.h?windRelation(p.h,p.bearing):null;return `<tr><td><button data-route-point="${i}">${i+1} · ${num(p.km,1)} km</button></td><td>${routeTime(p.time)}</td>${p.h?`<td>${wx(p.h.code)[0]} ${num(p.h.temp)} °C<small>Sensación ${num(p.h.feel)} °C</small></td><td>${num(p.h.p)} %<small>${num(p.h.mm,1)} mm · hora anterior</small></td><td><span class="windtag ${w.cls}">${w.text}</span><small>Del ${cardinal(p.h.dir)} · ${num(p.h.speed)} km/h</small></td><td>${num(p.h.gust)} km/h</td>`:'<td colspan="4">Sin pronóstico para este punto. Vuelve a consultar.</td>'}</tr>`;}).join('')}</tbody></table></div><p class="routekey">Open-Meteo · pronóstico horario más próximo (±30 min) a cada paso. La lluvia en mm corresponde a la hora anterior del pronóstico, no a todo el tramo. No es una garantía de tiempo seco entre puntos.</p>`;}
async function analyzeBikeRoute(){if(!bikeRoute||routeBusy)return;const departure=new Date(routeDeparture).getTime()/1000,speed=Number(routeSpeed);routeError=false;routeForecast=null;if(!Number.isFinite(departure)||departure<now()-60||departure>now()+6*86400||!Number.isFinite(speed)||speed<5||speed>60){routeError=true;routeMessage='Elige una salida futura dentro de 6 días y una velocidad entre 5 y 60 km/h.';render();return;}const id=++routeGeneration,samples=sampleBikeRoute(bikeRoute).map(p=>({...p,time:departure+p.km/speed*3600}));if(samples.at(-1).time>now()+6*86400){routeError=true;routeMessage='La llegada supera el margen de 6 días. Adelanta la salida o divide la ruta en etapas.';render();return;}routeBusy=true;routeMessage='Consultando las condiciones de tus 8 puntos…';render();
const results=await Promise.allSettled(samples.map(async p=>{const qs=new URLSearchParams({latitude:p.lat.toFixed(5),longitude:p.lon.toFixed(5),timezone:'auto',timeformat:'unixtime',forecast_days:7,models:'best_match',hourly:'temperature_2m,apparent_temperature,precipitation_probability,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code,relative_humidity_2m'});const d=await getJSON('/api/weather?'+qs);if(!d.hourly?.time?.length)throw Error('Sin datos');const h=d.hourly;let j=0;for(let k=1;k<h.time.length;k++)if(Math.abs(h.time[k]-p.time)<Math.abs(h.time[j]-p.time))j=k;if(Math.abs(h.time[j]-p.time)>1800)throw Error('Fuera del pronóstico');const row={t:h.time[j],temp:h.temperature_2m[j],feel:h.apparent_temperature[j],p:h.precipitation_probability[j],mm:h.precipitation[j],speed:h.wind_speed_10m[j],gust:h.wind_gusts_10m[j],dir:h.wind_direction_10m[j],code:h.weather_code[j]};if(![row.speed,row.dir,row.temp].every(Number.isFinite))throw Error('Datos incompletos');return {...p,h:row};}));if(id!==routeGeneration)return;routeBusy=false;routeForecast=results.map((r,i)=>r.status==='fulfilled'?r.value:{...samples[i],h:null});const good=routeForecast.filter(p=>p.h).length;routeError=good<8;routeMessage=good===8?'Consulta completada · 8 puntos · '+new Date().toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}):`Consulta parcial: ${good} de 8 puntos disponibles. Pulsa Analizar ruta para reintentar.`;if(tab==='wind')render();}
function showRoutePoint(i){const p=routeForecast?.[i];if(!p)return;const h=p.h,w=h?windRelation(h,p.bearing):null;modal(`<span class="eyebrow">BICI · PUNTO ${i+1} / 8</span><h2>Kilómetro ${num(p.km,1)}</h2><p class="muted">Paso estimado: ${routeTime(p.time)} · hora de tu dispositivo<br>Coordenadas: ${num(p.lat,4)}, ${num(p.lon,4)}<br>Rumbo del tramo: ${cardinal(p.bearing)} · ${num(p.bearing)}°</p>${h?`<div class="detailgrid">${[['Temperatura',num(h.temp)+' °C'],['Sensación',num(h.feel)+' °C'],['Lluvia',num(h.p)+' % · '+num(h.mm,1)+' mm'],['Viento',w.text+' · '+num(h.speed)+' km/h'],['Componente frontal',num(Math.abs(w.head))+' km/h '+(w.head>=0?'de cara':'a favor')],['Componente lateral',num(w.cross)+' km/h'],['Rachas',num(h.gust)+' km/h'],['Procedencia',cardinal(h.dir)+' · '+num(h.dir)+'°']].map(([l,v])=>`<div><small>${l}</small><strong>${v}</strong></div>`).join('')}</div><p class="muted">Pronóstico horario de ${routeTime(h.t)}. Lluvia acumulada entre ${routeTime(h.t-3600)} y ${routeTime(h.t)}. Aproximación a velocidad constante y en terreno abierto.</p>`:'<p>Sin datos para este punto. Reintenta la consulta.</p>'}`);}
function readBikeFile(file){
 // FileReader is supported by older Android WebViews as well as regular mobile browsers.
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onload=()=>resolve(String(reader.result||''));
  reader.onerror=()=>reject(Error('No se pudo leer el archivo. Guárdalo en Descargas y vuelve a seleccionarlo.'));
  reader.onabort=()=>reject(Error('Se canceló la lectura del archivo.'));
  reader.readAsText(file,'UTF-8');
 });
}
document.addEventListener('change',async e=>{if(e.target.id==='routeFile'){
 const input=e.target,file=input.files?.[0];
 if(!file)return;
 // Show progress immediately, before reading or decoding XML.
 routeError=false;routeMessage='Leyendo '+file.name+'…';
 const statusEl=document.getElementById('routeStatus');if(statusEl){statusEl.textContent=routeMessage;statusEl.classList.remove('error');}
 let success=false;
 try{
  if(!/\\.(gpx|tcx)$/i.test(file.name))throw Error('Elige un archivo .gpx o .tcx. Si está comprimido en ZIP, extráelo primero.');
  if(file.size===0)throw Error('El archivo está vacío.');
  if(file.size>10*1024*1024)throw Error('El archivo supera 10 MB. Exporta una versión simplificada.');
  const xml=await readBikeFile(file);
  const parsed=parseBikeRoute(xml,file.name);
  ++routeGeneration;routeBusy=false;bikeRoute=parsed;routeForecast=null;routeError=false;
  routeMessage='✓ '+parsed.name+' · '+num(parsed.km,1)+' km. Ruta cargada; calculando las condiciones…';
  success=true;
 }catch(err){routeError=true;routeMessage='No se pudo cargar '+file.name+': '+(err?.message||'Error de lectura.');}
 finally{
  // Reset so that reselecting the same file also fires change.
  input.value='';
  if(tab==='wind'){
    render();
    if(success){
      document.getElementById('bikeMap')?.scrollIntoView({behavior:'smooth',block:'center'});
      analyzeBikeRoute();
    }else document.getElementById('routeStatus')?.scrollIntoView({behavior:'smooth',block:'center'});
  }
 }
}
if(e.target.id==='routeDeparture'||e.target.id==='routeSpeed'){if(e.target.id==='routeDeparture')routeDeparture=e.target.value;else routeSpeed=Number(e.target.value);++routeGeneration;routeBusy=false;routeForecast=null;routeMessage='Calculando el pronóstico con tu nuevo horario y velocidad…';routeError=false;if(tab==='wind'){render();analyzeBikeRoute();}}});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.id==='analyzeRoute')analyzeBikeRoute();if(b.id==='removeRoute'){++routeGeneration;routeBusy=false;bikeRoute=null;routeForecast=null;routeMessage='';routeError=false;render();}if(b.dataset.routePoint!==undefined)showRoutePoint(+b.dataset.routePoint);});
