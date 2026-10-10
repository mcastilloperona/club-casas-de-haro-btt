-- Avisos administrativos por email. Ejecutar tras 002 y 003.
-- Reutiliza el cron de notify-club y Resend ya configurados.
begin;
create table if not exists public.club_admin_email_jobs (
 id uuid primary key default gen_random_uuid(),
 event_key text not null,
 event_type text not null check(event_type in ('membership_pending','membership_approved','membership_rejected','membership_role','ride_join','ride_leave','ride_created','ride_cancelled')),
 recipient_id uuid not null references public.profiles(id) on delete cascade,
 actor_name text not null default '',
 actor_email text not null default '',
 ride_title text not null default '',
 ride_id uuid,
 state text not null default 'pending' check(state in ('pending','processing','sent','failed')),
 created_at timestamptz not null default now(),
 due_at timestamptz not null default now(),
 attempts int not null default 0,
 lease_token uuid,
 locked_until timestamptz,
 sent_at timestamptz,
 last_error text,
 unique(event_key,recipient_id)
);
create index if not exists club_admin_email_jobs_due_idx on public.club_admin_email_jobs(state,due_at);
alter table public.club_admin_email_jobs enable row level security;
revoke all on public.club_admin_email_jobs from public,anon,authenticated;
grant all on public.club_admin_email_jobs to service_role;

create or replace function club_private.enqueue_admin_event()
returns trigger language plpgsql security definer set search_path = '' as $$
declare k text; ty text; person text; addr text; rid uuid; ride_label text;
begin
 if tg_table_name='profiles' then
   if tg_op='INSERT' and new.status='pending' then
     ty:='membership_pending'; k:='member:pending:'||new.id::text;
   elsif tg_op='UPDATE' and new.status is distinct from old.status
       and new.status in ('approved','rejected') then
     ty:=case when new.status='approved' then 'membership_approved' else 'membership_rejected' end;
     k:='member:status:'||new.id::text||':'||new.status::text||':'||new.updated_at::text;
   elsif tg_op='UPDATE' and new.role is distinct from old.role then
     ty:='membership_role'; k:='member:role:'||new.id::text||':'||new.role::text||':'||new.updated_at::text;
   else return new; end if;
   person:=new.name; addr:=new.email;
 elsif tg_table_name='club_ride_members' then
   if tg_op='INSERT' then ty:='ride_join'; k:='join:'||new.ride_id||':'||new.user_id||':'||new.created_at;
   else ty:='ride_leave'; k:='leave:'||old.ride_id||':'||old.user_id||':'||clock_timestamp()::text; end if;
   rid:=coalesce(new.ride_id,old.ride_id);
   select r.title into ride_label from public.club_rides r where r.id=rid;
   if tg_op='INSERT' then person:=new.name;
   else person:=old.name; end if;
   select p.email into addr from public.profiles p where p.id=coalesce(new.user_id,old.user_id);
 elsif tg_table_name='club_rides' then
   if tg_op='INSERT' then ty:='ride_created'; k:='ride:created:'||new.id;
   elsif tg_op='UPDATE' and new.status='cancelled' and old.status is distinct from new.status then
     ty:='ride_cancelled'; k:='ride:cancelled:'||new.id||':'||new.updated_at;
   else return new; end if;
   rid:=new.id; ride_label:=new.title; person:=new.organizer_name;
 else return coalesce(new,old); end if;
 insert into public.club_admin_email_jobs(event_key,event_type,recipient_id,actor_name,actor_email,ride_title,ride_id,due_at)
 select k,ty,p.id,coalesce(person,''),coalesce(addr,''),coalesce(ride_label,''),rid,
        case when ty in ('ride_join','ride_leave','ride_created') then now()+interval '2 minutes' else now() end
 from public.profiles p where p.status='approved' and p.role='admin' and p.email<>''
 -- Evita avisarte de acciones administrativas realizadas por ti en cada alta, pero conserva trazabilidad por email para los demás administradores.
 on conflict(event_key,recipient_id) do nothing;
 return coalesce(new,old);
end $$;
revoke all on function club_private.enqueue_admin_event() from public;
drop trigger if exists club_admin_on_profile on public.profiles;
create trigger club_admin_on_profile after insert or update of status,role on public.profiles
 for each row execute function club_private.enqueue_admin_event();
drop trigger if exists club_admin_on_ride_members on public.club_ride_members;
create trigger club_admin_on_ride_members after insert or delete on public.club_ride_members
 for each row execute function club_private.enqueue_admin_event();
drop trigger if exists club_admin_on_ride on public.club_rides;
create trigger club_admin_on_ride after insert or update of status on public.club_rides
 for each row execute function club_private.enqueue_admin_event();

create or replace function public.club_claim_admin_emails(batch_size integer default 10)
returns table(job_id uuid,token uuid,event_type text,email text,actor_name text,actor_email text,ride_title text,ride_id uuid)
language plpgsql security definer set search_path='' as $$
begin
 update public.club_admin_email_jobs j set state='failed',last_error='Máximo de intentos'
 where j.attempts>=5 and (j.state='pending' or (j.state='processing' and j.locked_until<now()));
 return query with candidates as (
  select j.id from public.club_admin_email_jobs j join public.profiles p on p.id=j.recipient_id
  where j.attempts<5 and j.due_at<=now() and p.status='approved' and p.role='admin' and p.email<>''
   and (j.state='pending' or (j.state='processing' and j.locked_until<now()))
  order by j.due_at,j.id for update of j skip locked limit greatest(1,least(batch_size,20))
 ), claimed as (
  update public.club_admin_email_jobs j set state='processing',attempts=j.attempts+1,
  lease_token=gen_random_uuid(),locked_until=now()+interval '5 minutes'
  from candidates c where j.id=c.id returning j.*
 )
 select j.id,j.lease_token,j.event_type,p.email,j.actor_name,j.actor_email,j.ride_title,j.ride_id
 from claimed j join public.profiles p on p.id=j.recipient_id;
end $$;
revoke all on function public.club_claim_admin_emails(integer) from public,anon,authenticated;
grant execute on function public.club_claim_admin_emails(integer) to service_role;
notify pgrst,'reload schema';
commit;
