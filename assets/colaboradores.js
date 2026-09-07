(function(){
  'use strict';
  const grid=document.getElementById('collaboratorsGrid');
  if(!grid)return;

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

  function card(item){
    const article=make('article','collaborator-card');
    const logo=make('div','collaborator-logo');
    if(item.logo){
      const img=document.createElement('img');
      img.src=String(item.logo).replace(/^\/+/, '');
      img.alt=item.name?`Logo de ${item.name}`:'Logo de colaborador';
      img.loading='lazy';
      img.decoding='async';
      logo.appendChild(img);
    }else{
      logo.appendChild(make('div','collaborator-logo-fallback',(item.name||'C').trim().charAt(0).toUpperCase()||'C'));
    }
    article.appendChild(logo);
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

  fetch('data/collaborators.json',{cache:'no-store'})
    .then(r=>{if(!r.ok)throw new Error('No se pudieron cargar los colaboradores');return r.json()})
    .then(data=>{
      const items=(Array.isArray(data)?data:[])
        .filter(x=>x&&x.published!==false&&x.name)
        .sort((a,b)=>(Number(a.order)||999)-(Number(b.order)||999)||String(a.name).localeCompare(String(b.name),'es'));
      grid.replaceChildren();
      if(!items.length){
        grid.appendChild(make('div','collaborators-empty','Este espacio está abierto a nuevos colaboradores. Si quieres sumar tu apoyo al Club Casas de Haro BTT, puedes contactar con nosotros por Telegram o por email.'));
        return;
      }
      items.forEach(item=>grid.appendChild(card(item)));
    })
    .catch(()=>grid.replaceChildren(make('div','collaborators-empty','Ahora mismo no se puede cargar el listado de colaboradores.')));
})();
