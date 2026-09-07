(function(){
  'use strict';
  document.addEventListener('click',function(e){
    const button=e.target.closest('[data-load-google-map]');
    if(!button)return;
    const holder=button.closest('[data-map-holder]');
    if(!holder)return;
    const iframe=document.createElement('iframe');
    iframe.className='google-map-frame';
    iframe.src=button.dataset.src;
    iframe.title='Mapa de Casas de Haro en Google Maps';
    iframe.loading='lazy';
    iframe.referrerPolicy='no-referrer-when-downgrade';
    iframe.allowFullscreen=true;
    holder.replaceChildren(iframe);
  });
})();
