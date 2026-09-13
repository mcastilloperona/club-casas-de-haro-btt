(function(){
  'use strict';

  const isV14=/\/v14(?:\/|$)/.test(location.pathname);
  if(isV14){
    const style=document.createElement('style');
    style.textContent=`
      #collaboratorsGrid .collaborator-card{padding:0;min-height:0;aspect-ratio:16/9;overflow:hidden;display:block}
      #collaboratorsGrid .collaborator-logo{width:100%;height:100%;margin:0;padding:0;border:0;border-radius:inherit;background:#fff;display:block;overflow:hidden}
      #collaboratorsGrid .collaborator-logo img{width:100%;height:100%;max-width:none;max-height:none;object-fit:cover;display:block}
      #collaboratorsGrid .collaborator-card>h3,
      #collaboratorsGrid .collaborator-card>p,
      #collaboratorsGrid .collaborator-card>.btn{display:none}
    `;
    document.head.appendChild(style);
  }

  const homeTitle=document.querySelector('.home-v12 .hero-v12-content h1');
  if(homeTitle&&homeTitle.textContent.trim()==='Nuestro terreno'){
    homeTitle.textContent='Somos Casas de Haro';
  }

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
