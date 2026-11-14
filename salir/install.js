(()=>{
let pending=null,installed=false;
const dialog=document.querySelector('#installModal'),steps=document.querySelector('#installSteps'),action=document.querySelector('#installAction'),header=document.querySelector('#install');
const isStandalone=()=>installed||matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const read=key=>{try{return sessionStorage.getItem(key);}catch{return null;}};
const remember=()=>{try{sessionStorage.setItem('salir-install-offered','1');}catch{}};
function help(){const ua=navigator.userAgent,ios=/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),android=/Android/.test(ua),samsung=/SamsungBrowser/.test(ua),firefox=/Firefox|FxiOS/.test(ua),safari=/Safari/.test(ua)&&!/Chrome|Chromium|Edg|OPR/.test(ua);
if(pending)return '<p>Tu navegador permite instalar Salir directamente. Pulsa el botón y confirma la instalación.</p>';
if(ios)return '<ol><li>Abre el menú <b>Compartir</b> de tu navegador.</li><li>Elige <b>Añadir a pantalla de inicio</b> y confirma.</li></ol><p>Si no aparece, abre esta dirección en Safari y repite los pasos.</p>';
if(samsung)return '<ol><li>Abre el menú <b>☰</b> de Samsung Internet.</li><li>Busca <b>Añadir página a → Pantalla de inicio</b> o la opción de instalación disponible.</li><li>Confirma para guardar Salir.</li></ol>';
if(android)return '<ol><li>Abre el menú <b>⋮</b> del navegador.</li><li>Busca <b>Instalar aplicación</b> o <b>Añadir a pantalla de inicio</b>.</li><li>Confirma para guardar Salir.</li></ol><p>Si no aparece la opción, abre esta dirección en Chrome. Desde una vista dentro de otra app, usa primero «Abrir en el navegador».</p>';
if(safari)return '<ol><li>En Safari de Mac, abre <b>Archivo → Añadir al Dock</b>, si está disponible.</li><li>Confirma el nombre Salir.</li></ol>';
if(firefox)return '<p>Busca una opción para instalar o añadir la web en el menú del navegador. Si tu versión no la ofrece, abre esta dirección en Chrome o Edge para instalarla, o guárdala en marcadores.</p>';
return '<ol><li>Busca el icono de instalación en la barra de direcciones.</li><li>También puedes abrir el menú del navegador y buscar <b>Instalar Salir</b> o <b>Instalar esta página como aplicación</b>.</li></ol><p>Si tu navegador no ofrece instalación, puedes guardar la página en marcadores o abrirla en Chrome o Edge.</p>';
}
function update(){steps.innerHTML=help();action.textContent=pending?'Instalar Salir':'Entendido';header.hidden=isStandalone();}
function show(){if(isStandalone())return;update();if(!dialog.open){remember();dialog.showModal();}}
function close(){remember();dialog.close();}
header.onclick=show;document.querySelector('#dismissInstall').onclick=close;document.querySelector('#laterInstall').onclick=close;dialog.addEventListener('cancel',remember);dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
action.onclick=async()=>{if(!pending){close();return;}const event=pending;pending=null;dialog.close();try{await event.prompt();const result=await event.userChoice;if(result.outcome==='accepted')header.hidden=true;}catch{show();}update();};
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();pending=e;update();});
window.addEventListener('appinstalled',()=>{installed=true;pending=null;header.hidden=true;if(dialog.open)dialog.close();remember();});
matchMedia('(display-mode: standalone)').addEventListener('change',update);
update();let attempts=0;function autoOffer(){if(isStandalone()||read('salir-install-offered'))return;if(document.querySelector('dialog[open]')){if(++attempts<12)setTimeout(autoOffer,2500);return;}show();}setTimeout(autoOffer,1800);
})();
