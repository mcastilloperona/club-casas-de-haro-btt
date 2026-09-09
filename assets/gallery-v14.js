/* V14 — galería: 12 iniciales, ver más y lightbox */
(function(){
  'use strict';
  const PAGE_SIZE=12;
  const grid=document.getElementById('galleryGrid');
  if(!grid)return;

  let visible=PAGE_SIZE;
  let observer;

  function figures(){return Array.from(grid.querySelectorAll('figure'))}

  function ensureControls(){
    let wrap=document.querySelector('.gallery-more-wrap');
    if(wrap)return wrap;
    wrap=document.createElement('div');
    wrap.className='gallery-more-wrap';
    wrap.innerHTML='<button class="gallery-more-btn" type="button">Ver más fotos</button>';
    const counter=document.createElement('p');
    counter.className='gallery-counter';
    wrap.after(counter);
    grid.insertAdjacentElement('afterend',wrap);
    wrap.insertAdjacentElement('afterend',counter);
    wrap.querySelector('button').addEventListener('click',()=>{visible+=PAGE_SIZE;paint();});
    return wrap;
  }

  function paint(){
    const items=figures();
    const wrap=ensureControls();
    items.forEach((fig,i)=>fig.classList.toggle('gallery-hidden',i>=visible));
    const btn=wrap.querySelector('button');
    const counter=document.querySelector('.gallery-counter');
    const shown=Math.min(visible,items.length);
    wrap.style.display=items.length>PAGE_SIZE && shown<items.length?'flex':'none';
    if(counter){counter.textContent=items.length?`${shown} de ${items.length} fotos`:'';counter.style.display=items.length>PAGE_SIZE?'block':'none'}
    items.forEach((fig,i)=>{
      const img=fig.querySelector('img');
      if(!img)return;
      img.loading='lazy'; img.decoding='async';
      img.tabIndex=0;
      img.setAttribute('role','button');
      img.setAttribute('aria-label',`Abrir foto ${i+1} de ${items.length}`);
    });
  }

  const lb=document.createElement('div');
  lb.className='gallery-lightbox';
  lb.setAttribute('aria-hidden','true');
  lb.innerHTML='<div class="gallery-lightbox-stage" role="dialog" aria-modal="true" aria-label="Visor de fotografías"><button class="gallery-lightbox-close" type="button" aria-label="Cerrar">×</button><button class="gallery-lightbox-prev" type="button" aria-label="Foto anterior">‹</button><img alt=""><div class="gallery-lightbox-caption"></div><button class="gallery-lightbox-next" type="button" aria-label="Foto siguiente">›</button></div>';
  document.body.appendChild(lb);
  const lbImg=lb.querySelector('img'), lbCaption=lb.querySelector('.gallery-lightbox-caption');
  let current=0;

  function openAt(index){
    const items=figures(); if(!items.length)return;
    current=(index+items.length)%items.length;
    const fig=items[current], img=fig.querySelector('img');
    lbImg.src=img.currentSrc||img.src; lbImg.alt=img.alt||'';
    lbCaption.textContent=(fig.querySelector('figcaption')?.textContent||img.alt||'').trim();
    lb.classList.add('open'); lb.setAttribute('aria-hidden','false'); document.body.classList.add('gallery-lightbox-open');
    lb.querySelector('.gallery-lightbox-close').focus();
  }
  function close(){lb.classList.remove('open');lb.setAttribute('aria-hidden','true');document.body.classList.remove('gallery-lightbox-open')}
  function step(n){openAt(current+n)}

  grid.addEventListener('click',e=>{const img=e.target.closest('figure img');if(!img)return;openAt(figures().indexOf(img.closest('figure')))});
  grid.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('figure img')){e.preventDefault();openAt(figures().indexOf(e.target.closest('figure')))}});
  lb.querySelector('.gallery-lightbox-close').addEventListener('click',close);
  lb.querySelector('.gallery-lightbox-prev').addEventListener('click',()=>step(-1));
  lb.querySelector('.gallery-lightbox-next').addEventListener('click',()=>step(1));
  lb.addEventListener('click',e=>{if(e.target===lb)close()});
  document.addEventListener('keydown',e=>{if(!lb.classList.contains('open'))return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')step(-1);if(e.key==='ArrowRight')step(1)});

  const mo=new MutationObserver(()=>paint());
  mo.observe(grid,{childList:true});
  paint();
})();
