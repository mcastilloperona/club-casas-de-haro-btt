/* V14 — galería: filtros, 12 iniciales, ver más y lightbox */
(function(){
  'use strict';
  const PAGE_SIZE=12;
  const grid=document.getElementById('galleryGrid');
  if(!grid)return;

  let visible=PAGE_SIZE;
  let activeCategory='all';
  let filterSignature='';

  const labels={all:'Todas',club:'El club',rutas:'Rutas',momentos:'Momentos',equipacion:'Equipación'};
  const figures=()=>Array.from(grid.querySelectorAll('figure'));

  function categoryFor(fig){
    if(fig.dataset.category)return fig.dataset.category;
    const text=((fig.querySelector('figcaption')?.textContent||'')+' '+(fig.querySelector('img')?.alt||'')).toLocaleLowerCase('es');
    let cat='rutas';
    if(/equipaci[oó]n|maillot|culote|chaleco|calcetines/.test(text))cat='equipacion';
    else if(/parada|descanso|compa[nñ][ií]a|a la sombra|estaci[oó]n|plaza|compartiendo/.test(text))cat='momentos';
    else if(/grupo|club casas de haro|girasoles|btt con vistas|patrimonio|[uú]ltimas luces/.test(text))cat='club';
    fig.dataset.category=cat;
    return cat;
  }

  function matchingFigures(){
    return figures().filter(fig=>activeCategory==='all'||categoryFor(fig)===activeCategory);
  }

  function ensureFilters(){
    const all=figures();
    all.forEach(categoryFor);
    const present=['club','rutas','momentos','equipacion'].filter(cat=>all.some(fig=>categoryFor(fig)===cat));
    const signature=present.join('|');
    let bar=document.querySelector('.gallery-filter-bar');
    if(!bar){
      bar=document.createElement('nav');
      bar.className='gallery-filter-bar';
      bar.setAttribute('aria-label','Filtrar fotografías');
      grid.insertAdjacentElement('beforebegin',bar);
    }
    if(signature===filterSignature&&bar.children.length)return bar;
    filterSignature=signature;
    if(activeCategory!=='all'&&!present.includes(activeCategory))activeCategory='all';
    const cats=['all',...present];
    bar.innerHTML=cats.map(cat=>`<button class="gallery-filter-btn${cat===activeCategory?' active':''}" type="button" data-gallery-filter="${cat}" aria-pressed="${cat===activeCategory?'true':'false'}">${labels[cat]}</button>`).join('');
    bar.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{
      activeCategory=btn.dataset.galleryFilter||'all';
      visible=PAGE_SIZE;
      bar.querySelectorAll('button').forEach(b=>{const on=b===btn;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
      paint();
    }));
    return bar;
  }

  function ensureControls(){
    let wrap=document.querySelector('.gallery-more-wrap');
    if(wrap)return wrap;
    wrap=document.createElement('div');
    wrap.className='gallery-more-wrap';
    wrap.innerHTML='<button class="gallery-more-btn" type="button">Ver más fotos</button>';
    const counter=document.createElement('p');
    counter.className='gallery-counter';
    grid.insertAdjacentElement('afterend',wrap);
    wrap.insertAdjacentElement('afterend',counter);
    wrap.querySelector('button').addEventListener('click',()=>{visible+=PAGE_SIZE;paint();});
    return wrap;
  }

  function paint(){
    ensureFilters();
    const all=figures();
    const matching=matchingFigures();
    const matchSet=new Set(matching);
    let pos=0;
    all.forEach(fig=>{
      const matches=matchSet.has(fig);
      fig.classList.toggle('gallery-filtered-out',!matches);
      if(matches){fig.classList.toggle('gallery-hidden',pos>=visible);pos++;}
      else fig.classList.remove('gallery-hidden');
    });

    const wrap=ensureControls();
    const counter=document.querySelector('.gallery-counter');
    const shown=Math.min(visible,matching.length);
    wrap.style.display=matching.length>PAGE_SIZE&&shown<matching.length?'flex':'none';
    if(counter){
      counter.textContent=matching.length?`${shown} de ${matching.length} fotos`:'';
      counter.style.display=matching.length>PAGE_SIZE?'block':'none';
    }
    all.forEach((fig,i)=>{
      const img=fig.querySelector('img');
      if(!img)return;
      img.loading='lazy';img.decoding='async';img.tabIndex=0;img.setAttribute('role','button');
      img.setAttribute('aria-label',`Abrir foto ${i+1} de ${all.length}`);
    });
  }

  const lb=document.createElement('div');
  lb.className='gallery-lightbox';
  lb.setAttribute('aria-hidden','true');
  lb.innerHTML='<div class="gallery-lightbox-stage" role="dialog" aria-modal="true" aria-label="Visor de fotografías"><button class="gallery-lightbox-close" type="button" aria-label="Cerrar">×</button><button class="gallery-lightbox-prev" type="button" aria-label="Foto anterior">‹</button><img alt=""><div class="gallery-lightbox-caption"></div><button class="gallery-lightbox-next" type="button" aria-label="Foto siguiente">›</button></div>';
  document.body.appendChild(lb);
  const lbImg=lb.querySelector('img');
  const lbCaption=lb.querySelector('.gallery-lightbox-caption');
  let current=0;

  function lightboxItems(){return matchingFigures()}
  function openAt(index){
    const items=lightboxItems();if(!items.length)return;
    current=(index+items.length)%items.length;
    const fig=items[current],img=fig.querySelector('img');
    lbImg.src=img.currentSrc||img.src;lbImg.alt=img.alt||'';
    lbCaption.textContent=(fig.querySelector('figcaption')?.textContent||img.alt||'').trim();
    lb.classList.add('open');lb.setAttribute('aria-hidden','false');document.body.classList.add('gallery-lightbox-open');
    lb.querySelector('.gallery-lightbox-close').focus();
  }
  function openFigure(fig){const idx=lightboxItems().indexOf(fig);if(idx>=0)openAt(idx)}
  function close(){lb.classList.remove('open');lb.setAttribute('aria-hidden','true');document.body.classList.remove('gallery-lightbox-open')}
  function step(n){openAt(current+n)}

  grid.addEventListener('click',e=>{const img=e.target.closest('figure img');if(img)openFigure(img.closest('figure'))});
  grid.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('figure img')){e.preventDefault();openFigure(e.target.closest('figure'))}});
  lb.querySelector('.gallery-lightbox-close').addEventListener('click',close);
  lb.querySelector('.gallery-lightbox-prev').addEventListener('click',()=>step(-1));
  lb.querySelector('.gallery-lightbox-next').addEventListener('click',()=>step(1));
  lb.addEventListener('click',e=>{if(e.target===lb)close()});
  document.addEventListener('keydown',e=>{if(!lb.classList.contains('open'))return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')step(-1);if(e.key==='ArrowRight')step(1)});

  const mo=new MutationObserver(()=>{filterSignature='';paint()});
  mo.observe(grid,{childList:true});
  paint();
})();
