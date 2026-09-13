(function(){
  'use strict';

  const isV14=/\/v14(?:\/|$)/.test(location.pathname);
  if(isV14){
    const style=document.createElement('style');
    style.textContent=`
      #collaboratorsGrid.single-collaborator{grid-template-columns:minmax(0,760px);max-width:760px}
      #collaboratorsGrid .collaborator-card-v14{padding:0;min-height:0;overflow:hidden;display:flex;flex-direction:column;border-radius:20px}
      #collaboratorsGrid .collaborator-card-v14 .collaborator-logo{width:100%;height:auto;aspect-ratio:16/9;margin:0;padding:0;border:0;border-radius:20px 20px 0 0;background:#fff;display:block;overflow:hidden}
      #collaboratorsGrid .collaborator-card-v14 .collaborator-logo img{width:100%;height:100%;max-width:none;max-height:none;object-fit:contain;display:block;background:#fff}
      #collaboratorsGrid .collaborator-card-content{padding:20px 22px 22px;display:flex;flex-direction:column;gap:9px}
      #collaboratorsGrid .collaborator-business-type{font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#087b9f}
      #collaboratorsGrid .collaborator-card-v14 h3{font-size:24px;margin:0;color:var(--navy2)}
      #collaboratorsGrid .collaborator-card-v14 p{margin:0;color:#56636d;line-height:1.6;font-size:14px}
      #collaboratorsGrid .collaborator-card-v14 .collaborator-location{margin-top:5px!important;color:#6d7c86!important;font-size:13px!important}
      #collaboratorsGrid .collaborator-phone{display:inline-flex;align-items:center;gap:7px;width:max-content;margin-top:2px;color:#087b9f;font-weight:900;text-decoration:none}
      #collaboratorsGrid .collaborator-phone:hover{text-decoration:underline}
      #collaboratorsGrid .collaborator-card-v14 .btn{align-self:flex-start;margin-top:5px}
      @media(max-width:620px){#collaboratorsGrid.single-collaborator{max-width:none}#collaboratorsGrid .collaborator-card-content{padding:17px 17px 19px}#collaboratorsGrid .collaborator-card-v14 h3{font-size:21px}}
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
    const article=make('article',isV14?'collaborator-card collaborator-card-v14':'collaborator-card');
    article.appendChild(logoNode(item,false));

    if(isV14){
      const content=make('div','collaborator-card-content');
      if(item.business_type)content.appendChild(make('div','collaborator-business-type',item.business_type));
      content.appendChild(make('h3','',item.name||'Colaborador'));
      if(item.description)content.appendChild(make('p','',item.description));
      if(item.location)content.appendChild(make('p','collaborator-location',item.location));
      if(item.phone){
        const phone=make('a','collaborator-phone',`Tel. ${item.phone}`);
        phone.href=`tel:${String(item.phone).replace(/\D/g,'')}`;
        content.appendChild(phone);
      }
      const url=safeUrl(item.url);
      if(url){
        const a=make('a','btn','Conocer colaborador');
        a.href=url;a.target='_blank';a.rel='noopener';
        content.appendChild(a);
      }
      article.appendChild(content);
      return article;
    }

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
        grid.classList.toggle('single-collaborator',isV14&&items.length===1);
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
