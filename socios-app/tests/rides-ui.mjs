import assert from 'node:assert/strict';
import { mkdir, rm } from 'node:fs/promises';
import { build } from 'esbuild';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

// Renderiza el componente real; solo se sustituye el transporte a Supabase.
globalThis.document = { body: { style: {} }, activeElement: null, addEventListener() {}, removeEventListener() {} };
globalThis.window = { location: { search: '' }, confirm: () => true };
const future = '2099-10-04T06:30:00.000Z';
globalThis.__ridesFixture = {
  club_rides: [{ id:'ride1',organizer_id:'org',organizer_name:'Organizador',title:'Ruta del domingo',description:'Ritmo tranquilo',starts_at:future,meeting_point:'Parque',discipline:'BTT',difficulty:'Medio',distance_km:null,status:'active' }],
  club_ride_members: [], club_ride_messages: [], fail: false,
};
const mock = `export const supabase = { from(table) {
  let op='select',payload,filters=[];
  const query = {
    select(){return query}, order(){return query}, limit(){return query},
    eq(key,value){filters.push([key,value]);return query},
    insert(value){op='insert';payload=value;return query},
    update(value){op='update';payload=value;return query}, delete(){op='delete';return query},
    single(){return query.then(result=>({...result,data:result.data?.[0]||null}))},
    then(resolve,reject){return Promise.resolve().then(()=>{
      const f=globalThis.__ridesFixture;
      if(f.fail && op!=='select') return {data:null,error:{message:'Error de prueba al guardar'}};
      const matches=row=>filters.every(([key,value])=>row[key]===value);
      let data;
      if(op==='select') data=f[table].filter(matches);
      if(op==='insert') {const row={id:'new'+f[table].length,created_at:new Date().toISOString(),name:'Socio',author_name:'Socio',...payload};f[table].push(row);data=[row]}
      if(op==='update') {data=f[table].filter(matches);data.forEach(row=>Object.assign(row,payload))}
      if(op==='delete') {data=f[table].filter(matches);f[table]=f[table].filter(row=>!matches(row))}
      return {data:structuredClone(data),error:null};
    }).then(resolve,reject)}
  }; return query;
}};`;
await mkdir(new URL('../node_modules/.cache/', import.meta.url), { recursive: true });
const out = new URL('../node_modules/.cache/rides-ui.mjs', import.meta.url).pathname;
await build({entryPoints:[new URL('../src/LiveRides.jsx',import.meta.url).pathname],outfile:out,bundle:true,format:'esm',platform:'node',jsx:'automatic',external:['react','react/jsx-runtime','lucide-react'],plugins:[{name:'mock-supabase',setup(b){b.onLoad({filter:/\/src\/supabase\.js$/},()=>({contents:mock,loader:'js'}))}}]});
const {default:LiveRides} = await import(out);
let renderer;
const text = node => typeof node === 'string' ? node : (Array.isArray(node) ? node : node?.children || []).map(text).join('');
const button = name => renderer.root.findAllByType('button').find(b=>text(b).includes(name) || b.props['aria-label'] === name);
async function click(name){const b=button(name);assert.ok(b,`Botón ${name}`);await act(async()=>{await b.props.onClick()})}
const profile = {id:'member',name:'Socio de prueba'};
await act(async()=>{renderer=TestRenderer.create(React.createElement(LiveRides,{role:'member',profile}))});
assert.equal(button('Publicar'),undefined);
assert.equal(button('Editar'),undefined);
assert.equal(button('Chat'),undefined);
await click('Me apunto');
assert.ok(button('Chat'));
assert.ok(button('Darme de baja'));
globalThis.__ridesFixture.club_ride_messages.push({id:'msg-other',ride_id:'ride1',user_id:'org',author_name:'Organizador',body:'Mensaje nuevo',created_at:new Date().toISOString()});
await click('Actualizar');
assert.ok(text(renderer.toJSON()).includes('Tienes nuevos mensajes'));
await click('Chat');
assert.ok(!text(renderer.toJSON()).includes('Tienes nuevos mensajes'));
const message = renderer.root.findByProps({'aria-label':'Mensaje'});
await act(async()=>message.props.onChange({target:{value:'Hola al grupo'}}));
await act(async()=>{await renderer.root.findByProps({className:'chat-composer'}).props.onSubmit({preventDefault(){}})});
assert.ok(text(renderer.toJSON()).includes('Hola al grupo'));
await click('Cerrar');
await click('Darme de baja');
assert.equal(button('Chat'),undefined);
globalThis.__ridesFixture.fail=true;
await click('Me apunto');
assert.ok(text(renderer.toJSON()).includes('Error de prueba al guardar'));
assert.equal(button('Chat'),undefined);
globalThis.__ridesFixture.fail=false;
await act(async()=>renderer.unmount());
await act(async()=>{renderer=TestRenderer.create(React.createElement(LiveRides,{role:'organizer',profile:{id:'org',name:'Organizador'}}))});
assert.ok(button('Publicar'));
assert.ok(button('Editar'));
assert.equal(button('Eliminar definitivamente'),undefined);
await click('Archivar y cerrar chat');
await click('Historial');
await click('Chat');
assert.ok(text(renderer.toJSON()).includes('solo lectura'));
assert.equal(renderer.root.findAllByProps({className:'chat-composer'}).length,0);
await act(async()=>renderer.unmount());
await act(async()=>{renderer=TestRenderer.create(React.createElement(LiveRides,{role:'organizer',profile:{id:'other',name:'Otro organizador'}}))});
await click('Historial');
assert.equal(button('Reactivar'),undefined);
assert.equal(button('Chat'),undefined);
await act(async()=>renderer.unmount());
globalThis.__ridesFixture.club_rides[0].status='active';
await act(async()=>{renderer=TestRenderer.create(React.createElement(LiveRides,{role:'admin',profile:{id:'admin',name:'Administrador'}}))});
assert.ok(button('Eliminar definitivamente'));
await click('Eliminar definitivamente');
assert.equal(globalThis.__ridesFixture.club_rides.length,0);
await act(async()=>renderer.unmount());
await rm(out);
console.log('Interfaz: permisos, inscripción/baja, envío, errores, chat archivado y borrado exclusivo de admin superados.');
