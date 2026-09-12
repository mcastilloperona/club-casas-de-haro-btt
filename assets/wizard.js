(function(){
  'use strict';

  const modal=document.querySelector('[data-club-fit-modal]');
  const root=document.querySelector('[data-club-fit]');
  const openButtons=Array.from(document.querySelectorAll('[data-club-fit-open]'));
  if(!modal||!root||!openButtons.length)return;

  const form=root.querySelector('[data-club-fit-form]');
  const steps=Array.from(root.querySelectorAll('[data-step]'));
  const back=root.querySelector('[data-back]');
  const next=root.querySelector('[data-next]');
  const result=root.querySelector('[data-result]');
  const progress=root.querySelector('.club-fit-progress');
  const progressLabel=root.querySelector('[data-progress-label]');
  const progressPercent=root.querySelector('[data-progress-percent]');
  const progressBar=root.querySelector('[data-progress-bar]');
  const closeButton=modal.querySelector('[data-club-fit-close]');
  let current=0;
  let returnFocus=null;

  function openWizard(trigger){
    returnFocus=trigger;
    modal.hidden=false;
    document.body.classList.add('club-fit-lock');
    closeButton.focus({preventScroll:true});
  }

  function closeWizard(){
    modal.hidden=true;
    document.body.classList.remove('club-fit-lock');
    if(returnFocus)returnFocus.focus({preventScroll:true});
  }

  const selectedValue=name=>{
    const input=form.querySelector('input[name="'+name+'"]:checked');
    return input?input.value:'';
  };

  const currentSelection=()=>steps[current].querySelector('input:checked');

  function showStep(index,focus){
    current=index;
    steps.forEach((step,i)=>{
      const active=i===current;
      step.hidden=!active;
      step.classList.toggle('is-active',active);
    });
    const percent=Math.round(((current+1)/steps.length)*100);
    progressLabel.textContent='Pregunta '+(current+1)+' de '+steps.length;
    progressPercent.textContent=percent+'%';
    progressBar.style.width=percent+'%';
    back.hidden=current===0;
    next.textContent=current===steps.length-1?'Ver mi resultado':'Siguiente';
    next.disabled=!currentSelection();
    if(focus){
      const legend=steps[current].querySelector('legend');
      legend.setAttribute('tabindex','-1');
      legend.focus({preventScroll:true});
    }
  }

  function profile(){
    const experience=selectedValue('experience');
    const bike=selectedValue('bike');
    const frequency=selectedValue('frequency');
    const distance=selectedValue('distance');
    if(experience==='new'||bike==='none'||distance==='short'){
      return {
        title:'Tu primera salida puede empezar aquí',
        copy:'Te propondríamos una toma de contacto tranquila, con pocos kilómetros y margen para aprender sin presión.',
        label:'salida de iniciación'
      };
    }
    if(frequency==='rare'||frequency==='monthly'||distance==='medium'){
      return {
        title:'Una salida social encaja contigo',
        copy:'Ya puedes disfrutar del grupo. Lo importante será elegir una distancia cómoda y recuperar la continuidad poco a poco.',
        label:'salida social de nivel tranquilo'
      };
    }
    if(distance==='very-long'||frequency==='often'){
      return {
        title:'Estás preparado para compartir kilómetros',
        copy:'Tienes experiencia suficiente para incorporarte a nuestras rutas habituales y descubrir nuevos caminos en grupo.',
        label:'próxima salida del club'
      };
    }
    return {
      title:'Tienes una buena base para unirte',
      copy:'Una ruta de nivel medio te permitirá conocer al grupo y disfrutar del terreno sin convertir la salida en una competición.',
      label:'salida de nivel medio'
    };
  }

  function reassurance(){
    const messages={
      level:'No necesitas demostrar nada: buscamos ajustar la primera salida para que disfrutes desde el primer kilómetro.',
      'left-behind':'En una salida de bienvenida acordamos el ritmo y el recorrido para que nadie se quede solo.',
      routes:'Tú solo tienes que traer ganas de pedalear; el grupo se ocupa del recorrido.',
      people:'La primera salida sirve precisamente para conocernos. Te recibiremos y te presentaremos al grupo.',
      ready:'Perfecto: el siguiente paso es elegir una salida y venir a conocernos sin compromiso.'
    };
    return messages[selectedValue('barrier')]||messages.ready;
  }

  function showResult(){
    const recommendation=profile();
    const message='Hola, he hecho el cuestionario de la web y me gustaría probar una '+recommendation.label+' con el Club Casas de Haro BTT.';
    root.querySelector('[data-result-title]').textContent=recommendation.title;
    root.querySelector('[data-result-copy]').textContent=recommendation.copy;
    root.querySelector('[data-result-reassurance]').textContent=reassurance();
    root.querySelector('[data-result-telegram]').href='https://t.me/mcastilloperona?text='+encodeURIComponent(message);
    root.querySelector('[data-result-email]').href='mailto:mcastillo@casasdeharobtt.es?subject='+encodeURIComponent('Quiero probar una salida con el club')+'&body='+encodeURIComponent(message);
    form.hidden=true;
    progress.hidden=true;
    result.hidden=false;
    const title=root.querySelector('[data-result-title]');
    title.setAttribute('tabindex','-1');
    title.focus({preventScroll:true});
  }

  form.addEventListener('change',event=>{
    if(event.target.matches('input[type="radio"]'))next.disabled=false;
  });
  next.addEventListener('click',()=>{
    if(!currentSelection())return;
    if(current<steps.length-1)showStep(current+1,true);
    else showResult();
  });
  back.addEventListener('click',()=>{
    if(current>0)showStep(current-1,true);
  });
  root.querySelector('[data-restart]').addEventListener('click',()=>{
    form.reset();
    result.hidden=true;
    form.hidden=false;
    progress.hidden=false;
    showStep(0,true);
  });
  openButtons.forEach(button=>button.addEventListener('click',()=>openWizard(button)));
  closeButton.addEventListener('click',closeWizard);
  modal.addEventListener('click',event=>{
    if(event.target===modal)closeWizard();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!modal.hidden)closeWizard();
  });

  showStep(0,false);
})();
