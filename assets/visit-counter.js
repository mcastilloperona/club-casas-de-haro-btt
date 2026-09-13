(function(){
  'use strict';

  const API='https://casas-de-haro-visitas.castillo-perona.workers.dev';
  const SESSION_MS=30*60*1000;
  const SESSION_KEY='cdh_visit_session_v1';
  const DISPLAY_OFFSET=99;

  function readLastVisit(){
    try{return Number(localStorage.getItem(SESSION_KEY)||0)||0}catch(e){return 0}
  }

  function writeLastVisit(value){
    try{localStorage.setItem(SESSION_KEY,String(value))}catch(e){}
  }

  function formatNumber(value){
    try{return new Intl.NumberFormat('es-ES').format(value)}catch(e){return String(value)}
  }

  function mountCounter(){
    if(document.getElementById('cdhVisitCounter')) return document.getElementById('cdhVisitCounter');
    const footer=document.querySelector('.footer .wrap')||document.querySelector('footer .wrap')||document.querySelector('footer');
    if(!footer) return null;

    const counter=document.createElement('div');
    counter.id='cdhVisitCounter';
    counter.className='cdh-visit-counter';
    counter.setAttribute('aria-live','polite');
    counter.style.cssText='margin:14px 0 0;display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 12px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(255,255,255,.06);font-size:13px;color:#bdc7d1';
    counter.innerHTML='<span aria-hidden="true">👁</span><strong data-visit-count style="color:#fff;font-size:15px">—</strong><span>visitas</span><span aria-hidden="true">·</span><span>Desde septiembre de 2026</span>';
    footer.appendChild(counter);
    return counter;
  }

  async function loadCount(){
    const now=Date.now();
    const last=readLastVisit();
    const newVisit=!last||(now-last)>SESSION_MS;
    const endpoint=newVisit?'/visit':'/count';

    const response=await fetch(API+endpoint,{
      method:newVisit?'POST':'GET',
      mode:'cors',
      cache:'no-store'
    });
    if(!response.ok) throw new Error('No se pudo consultar el contador');

    const data=await response.json();
    const visits=Number(data&&data.visits);
    if(!Number.isFinite(visits)) throw new Error('Respuesta de contador no válida');

    writeLastVisit(now);
    return DISPLAY_OFFSET+visits;
  }

  async function init(){
    const counter=mountCounter();
    if(!counter) return;
    try{
      const visits=await loadCount();
      const value=counter.querySelector('[data-visit-count]');
      if(value) value.textContent=formatNumber(visits);
    }catch(e){
      counter.remove();
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init,{once:true});
  }else{
    init();
  }
})();
