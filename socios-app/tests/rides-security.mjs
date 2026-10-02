// PostgreSQL embebido para validar la migración y RLS sin datos reales.
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { madridToISO, madridInput, rideAccess } from '../src/ride-utils.js';

const db = new PGlite();
const ids = Object.fromEntries(['admin','organizer','other','member','outsider','pending'].map((role, i) => [role, `00000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`]));
await db.exec(`create role anon; create role authenticated; create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create table public.profiles(id uuid primary key,name text,email text,status text,role text,created_at timestamptz default now(),updated_at timestamptz default now());
insert into public.profiles(id,name,email,status,role) values ${Object.entries(ids).map(([key,id]) => `('${id}','${key}','${key}@example.test','${key === 'pending' ? 'pending' : 'approved'}','${['admin','organizer'].includes(key) ? key : key === 'other' ? 'organizer' : 'member'}')`).join(',')};
grant usage on schema auth to authenticated;`);
const migration = await readFile(new URL('../supabase/002_live_rides.sql', import.meta.url), 'utf8');
await db.exec(migration);
await db.exec(migration); // Se puede repetir sin borrar datos.
async function asUser(user, query) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [ids[user] || '']);
  await db.exec(`set role ${user === 'anon' ? 'anon' : 'authenticated'}`);
  return db.query(query);
}
let checks = 0;
async function denied(user, query) {
  await assert.rejects(() => asUser(user, query)); checks++;
}
async function rows(user, query, expected) {
  const r = await asUser(user, query); assert.equal(r.rows.length, expected); checks++; return r.rows;
}
const createRide = `insert into public.club_rides(organizer_id,title,starts_at,meeting_point) values ('${ids.organizer}','Ruta de prueba',now()+interval '3 days','Parque') returning id`;
const [ride] = await rows('organizer', createRide, 1);
await denied('member', createRide);
await denied('pending', createRide);
await denied('other', createRide);
await denied('anon', 'select * from public.club_rides');
await rows('member','select * from public.club_rides',1);
await rows('pending','select * from public.club_rides',0);
await rows('member','select * from public.profiles',1);
await rows('admin','select * from public.profiles',6);
await rows('member',`update public.profiles set role='admin',status='approved' where id='${ids.member}' returning id`,0);
await rows('pending',`update public.profiles set status='approved' where id='${ids.pending}' returning id`,0);
await denied('member',`insert into public.profiles(id,name,role) values(gen_random_uuid(),'Intruso','admin')`);
await rows('admin',`update public.profiles set name='Socio autorizado' where id='${ids.member}' returning id`,1);
await rows('other',`update public.club_rides set title='Ajena' where id='${ride.id}' returning id`,0);
await rows('member',`update public.club_rides set title='Ajena' where id='${ride.id}' returning id`,0);
await denied('organizer',`update public.club_rides set organizer_id='${ids.other}' where id='${ride.id}'`);
await rows('organizer',`update public.club_rides set title='Ruta editada' where id='${ride.id}' returning id`,1);
await rows('admin',`update public.club_rides set description='Revisada' where id='${ride.id}' returning id`,1);
const join = user => `insert into public.club_ride_members(ride_id,user_id) values('${ride.id}','${ids[user]}') returning *`;
await denied('outsider',join('member'));
await denied('pending',join('pending'));
const [enrollment] = await rows('member',join('member'),1);
assert.equal(enrollment.name,'Socio autorizado'); checks++;
await denied('member',join('member'));
await denied('member',`insert into public.club_ride_members(ride_id,user_id,name) values('${ride.id}','${ids.member}','Impostor')`);
const send = (user,text='Hola') => `insert into public.club_ride_messages(ride_id,user_id,body) values('${ride.id}','${ids[user]}','${text}') returning *`;
await denied('outsider',send('outsider'));
await denied('member',send('organizer'));
const [message] = await rows('member',send('member'),1);
assert.equal(message.author_name,'Socio autorizado'); checks++;
await rows('organizer',send('organizer'),1);
await rows('admin',send('admin'),1);
await rows('outsider','select * from public.club_ride_messages',0);
await rows('other','select * from public.club_ride_messages',0);
await rows('pending','select * from public.club_ride_messages',0);
await rows('member','select * from public.club_ride_messages',3);
await denied('member',send('member',' '));
await rows('outsider',`delete from public.club_ride_members where ride_id='${ride.id}' returning user_id`,0);
await rows('member',`delete from public.club_ride_members where ride_id='${ride.id}' returning user_id`,1);
await rows('member','select * from public.club_ride_messages',0);
await denied('member',send('member'));
await rows('member',join('member'),1);
await rows('organizer',`update public.club_rides set status='archived' where id='${ride.id}' returning id`,1);
await denied('member',send('member'));
await denied('organizer',send('organizer'));
await denied('outsider',join('outsider'));
await rows('member','select * from public.club_ride_messages',3);
await rows('organizer',`update public.club_rides set status='active' where id='${ride.id}' returning id`,1);
await rows('organizer',`update public.club_rides set status='cancelled' where id='${ride.id}' returning id`,1);
await denied('admin',send('admin'));
await rows('member','select * from public.club_ride_messages',3);
await rows('organizer',`update public.club_rides set status='active',starts_at=now()-interval '1 day' where id='${ride.id}' returning id`,1);
await denied('outsider',join('outsider'));
await rows('admin',`update public.profiles set status='rejected' where id='${ids.member}' returning id`,1);
await rows('member','select * from public.club_rides',0);
await rows('member','select * from public.club_ride_messages',0);
await denied('member',send('member'));

assert.equal(madridToISO('2026-10-04T08:30'),'2026-10-04T06:30:00.000Z');
assert.equal(madridToISO('2026-12-04T08:30'),'2026-12-04T07:30:00.000Z');
assert.equal(madridInput('2026-10-04T06:30:00Z'),'2026-10-04T08:30');
assert.throws(() => madridToISO('2026-03-29T02:30'));
assert.throws(() => madridToISO('2026-10-25T02:30'));
assert.throws(() => madridToISO('2026-02-30T08:30'));
const sample = {organizer_id:ids.organizer,status:'active',starts_at:'2099-01-01T08:30:00Z'};
assert.equal(rideAccess(sample,{id:ids.member},'member',[]).canChat,false);
assert.equal(rideAccess(sample,{id:ids.member},'member',[{user_id:ids.member}]).canChat,true);
assert.equal(rideAccess(sample,{id:ids.other},'organizer',[]).canManage,false);
assert.equal(rideAccess(sample,{id:ids.admin},'admin',[]).canManage,true);
console.log(`${checks} comprobaciones SQL/RLS y 10 de fecha/permisos de interfaz superadas.`);
await db.close();
