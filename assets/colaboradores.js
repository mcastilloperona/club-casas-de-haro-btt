(function(){
  'use strict';

  const isV14=/\/v14(?:\/|$)/.test(location.pathname);
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
    #collaboratorsGrid .collaborator-card-v14 .collaborator-closing{margin-top:7px!important;font-weight:800;color:var(--navy2)!important;font-size:15px!important}
    #collaboratorsGrid .collaborator-card-v14 .collaborator-location{margin-top:5px!important;color:#6d7c86!important;font-size:13px!important}
    #collaboratorsGrid .collaborator-phone{display:inline-flex;align-items:center;gap:7px;width:max-content;margin-top:2px;color:#087b9f;font-weight:900;text-decoration:none}
    #collaboratorsGrid .collaborator-phone:hover{text-decoration:underline}
    #collaboratorsGrid .collaborator-card-v14 .btn{align-self:flex-start;margin-top:5px}
    .club-partners-band .supporters-label{position:absolute;z-index:4;top:10px;right:4%;font-size:11px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:#b9e9f4;opacity:.95}
    .club-partner-card.is-collaborator .club-partner-copy span{color:#65d7a1}
    .club-partner-card.is-collaborator img{object-fit:contain}
    @media(max-width:760px){.club-partners-band .supporters-label{top:8px;right:4%;font-size:10px}}
    @media(max-width:620px){#collaboratorsGrid.single-collaborator{max-width:none}#collaboratorsGrid .collaborator-card-content{padding:17px 17px 19px}#collaboratorsGrid .collaborator-card-v14 h3{font-size:21px}}
  `;
  document.head.appendChild(style);

  const homeTitle=document.querySelector('.home-v12 .hero-v12-content h1');
  if(homeTitle&&homeTitle.textContent.trim()==='Nuestro terreno')homeTitle.textContent='Somos Casas de Haro';

  const grid=document.getElementById('collaboratorsGrid');
  const homeSection=document.getElementById('colaboradores-portada');
  const homeTrack=document.getElementById('homeCollaboratorsTrack');
  const partnersCarousel=document.querySelector('.club-partners-carousel');
  const partnersBand=document.querySelector('.club-partners-band');
  if(!grid&&!homeTrack&&!partnersCarousel)return;

  function safeUrl(value){
    if(!value)return '';
    try{const u=new URL(String(value),location.href);return ['http:','https:'].includes(u.protocol)?u.href:''}catch(e){return ''}
  }
  function make(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text)el.textContent=text;return el}
  function logoNode(item,compact){
    const logo=make('div',compact?'home-collaborator-logo':'collaborator-logo');
    if(item.logo){const img=document.createElement('img');img.src=String(item.logo).replace(/^\/+/, '');img.alt=item.name?`Logo de ${item.name}`:'Logo de colaborador';img.loading='lazy';img.decoding='async';logo.appendChild(img)}
    else logo.appendChild(make('div',compact?'home-collaborator-fallback':'collaborator-logo-fallback',(item.name||'C').trim().charAt(0).toUpperCase()||'C'));
    return logo;
  }
  function card(item){
    const article=make('article','collaborator-card collaborator-card-v14');
    article.appendChild(logoNode(item,false));
    const content=make('div','collaborator-card-content');
    if(item.business_type)content.appendChild(make('div','collaborator-business-type',item.business_type));
    content.appendChild(make('h3','',item.name||'Colaborador'));
    if(item.description)content.appendChild(make('p','',item.description));
    if(item.closing)content.appendChild(make('p','collaborator-closing',item.closing));
    if(item.location)content.appendChild(make('p','collaborator-location',item.location));
    if(item.phone){const label=item.phone_label?`${item.phone_label} ${item.phone}`:`Tel. ${item.phone}`;const phone=make('a','collaborator-phone',label);phone.href=`tel:${String(item.phone).replace(/\D/g,'')}`;content.appendChild(phone)}
    const url=safeUrl(item.url);if(url){const a=make('a','btn','Conocer colaborador');a.href=url;a.target='_blank';a.rel='noopener';content.appendChild(a)}
    article.appendChild(content);return article;
  }
  function compactItem(item){const url=safeUrl(item.url);const node=make(url?'a':'div','home-collaborator-item');if(url){node.href=url;node.target='_blank';node.rel='noopener'}node.appendChild(logoNode(item,true));node.appendChild(make('span','home-collaborator-name',item.name||'Colaborador'));return node}
  function addCollaboratorsToPartnerCarousel(items){
    if(!partnersCarousel)return;
    if(partnersBand&&!partnersBand.querySelector('.supporters-label')){partnersBand.appendChild(make('div','supporters-label','Nos apoyan'));partnersBand.setAttribute('aria-label','Patrocinadores y colaboradores del Club Casas de Haro BTT')}
    partnersCarousel.querySelectorAll('.club-partner-card.is-collaborator').forEach(el=>el.remove());
    items.forEach(item=>{
      const a=document.createElement('a');a.className='club-partner-card is-collaborator';a.href='patrocinadores.html#colaboradores-club';a.setAttribute('aria-label',`${item.name||'Colaborador'} · colaborador del club`);
      const img=document.createElement('img');img.src=item.logo?String(item.logo).replace(/^\/+/, ''):(isV14?'../assets/logo-cdh-oficial-2026.png':'assets/logo-cdh-oficial-2026.png');img.alt=item.name||'Colaborador del club';img.loading='lazy';img.decoding='async';a.appendChild(img);
      const copy=make('div','club-partner-copy');copy.appendChild(make('span','','COLABORADOR DEL CLUB'));copy.appendChild(make('h3','',item.name||'Colaborador'));copy.appendChild(make('p','',item.carousel_text||'Colaborador del Club Casas de Haro BTT.'));a.appendChild(copy);partnersCarousel.appendChild(a);
    });
    const cards=[...partnersCarousel.querySelectorAll('.club-partner-card')],slotSeconds=4,totalSeconds=Math.max(slotSeconds,cards.length*slotSeconds);
    cards.forEach((el,index)=>{el.style.animationDuration=`${totalSeconds}s`;el.style.animationDelay=`${index*slotSeconds}s`});
  }

  fetch('data/collaborators.json',{cache:'no-store'})
    .then(r=>{if(!r.ok)throw new Error('No se pudieron cargar los colaboradores');return r.json()})
    .then(data=>{
      const items=(Array.isArray(data)?data:[]).filter(x=>x&&x.published!==false&&x.name).sort((a,b)=>(Number(a.order)||999)-(Number(b.order)||999)||String(a.name).localeCompare(String(b.name),'es'));
      if(grid){grid.classList.toggle('single-collaborator',items.length===1);grid.replaceChildren();if(!items.length)grid.appendChild(make('div','collaborators-empty','Este espacio está abierto a nuevos colaboradores. Si quieres sumar tu apoyo al Club Casas de Haro BTT, puedes contactar con nosotros por Telegram o por email.'));else items.forEach(item=>grid.appendChild(card(item)))}
      if(homeTrack&&homeSection){homeTrack.replaceChildren();if(items.length){items.forEach(item=>homeTrack.appendChild(compactItem(item));homeSection.hidden=false}else homeSection.hidden=true}
      addCollaboratorsToPartnerCarousel(items);
    })
    .catch(()=>{if(grid)grid.replaceChildren(make('div','collaborators-empty','Ahora mismo no se puede cargar el listado de colaboradores.'));if(homeSection)homeSection.hidden=true;addCollaboratorsToPartnerCarousel([])});
})();
