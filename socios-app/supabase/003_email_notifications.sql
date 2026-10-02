-- Ejecutar tras 002_live_rides.sql. Prepara una cola; no envía correos
-- hasta desplegar notify-club y programarlo con el servicio de correo.
begin;
create table if not exists public.club_notification_jobs (
  id uuid primary key default gen_random_uuid(),
  event_key text not null,
  kind text not null check (kind in ('ride','chat')),
  ride_id uuid not null references public.club_rides(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  state text not null default 'pending' check (state in ('pending','processing','sent','skipped','failed')),
  due_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  attempts integer not null default 0,
  lease_token uuid,
  locked_until timestamptz,
  sent_at timestamptz,
  last_error text,
  unique(event_key,recipient_id)
);
create index if not exists club_notification_due_idx on public.club_notification_jobs(state,due_at);
alter table public.club_notification_jobs enable row level security;
revoke all on public.club_notification_jobs from public, anon, authenticated;
grant all on public.club_notification_jobs to service_role;

create or replace function club_private.enqueue_ride_notice()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.club_notification_jobs(event_key,kind,ride_id,recipient_id)
    select 'ride:' || new.id::text,'ride',new.id,p.id from public.profiles p
    where p.status = 'approved' and p.email <> ''
    on conflict(event_key,recipient_id) do nothing;
  return new;
end $$;
create or replace function club_private.enqueue_chat_notice()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Una notificación por destinatario/salida/bloque de cinco minutos.
  insert into public.club_notification_jobs(event_key,kind,ride_id,recipient_id,due_at)
    select 'chat:' || new.ride_id::text || ':' || floor(extract(epoch from new.created_at)/300)::text,
      'chat',new.ride_id,p.id,now() + interval '5 minutes'
    from public.profiles p where p.status = 'approved' and p.email <> '' and p.id <> new.user_id
      and (exists(select 1 from public.club_ride_members m where m.ride_id=new.ride_id and m.user_id=p.id)
        or exists(select 1 from public.club_rides r where r.id=new.ride_id and r.organizer_id=p.id))
    on conflict(event_key,recipient_id) do nothing;
  return new;
end $$;
revoke all on function club_private.enqueue_ride_notice(),club_private.enqueue_chat_notice() from public;
drop trigger if exists club_enqueue_ride_notice on public.club_rides;
create trigger club_enqueue_ride_notice after insert on public.club_rides for each row execute function club_private.enqueue_ride_notice();
drop trigger if exists club_enqueue_chat_notice on public.club_ride_messages;
create trigger club_enqueue_chat_notice after insert on public.club_ride_messages for each row execute function club_private.enqueue_chat_notice();

-- Solo la función de servidor, con service_role, puede reclamar trabajos.
create or replace function public.club_claim_notifications(batch_size integer default 20)
returns table(job_id uuid,token uuid,kind text,ride_id uuid,recipient_id uuid,
  email text,name text,title text,starts_at timestamptz,meeting_point text)
language plpgsql security definer set search_path = '' as $$
begin
  update public.club_notification_jobs j set state='failed',last_error='Máximo de intentos alcanzado'
    where j.attempts >= 5 and (j.state='pending' or (j.state='processing' and j.locked_until < now()));
  update public.club_notification_jobs j set state='skipped'
    where (j.state='pending' or (j.state='processing' and j.locked_until < now()))
      and not exists(select 1 from public.profiles p join public.club_rides r on r.id=j.ride_id
        where p.id=j.recipient_id and p.status='approved' and p.email <> '' and r.status='active'
          and ((j.kind='ride' and r.starts_at > now()) or (j.kind='chat' and (r.organizer_id=p.id or exists(
            select 1 from public.club_ride_members m where m.ride_id=r.id and m.user_id=p.id)))));
  return query
  with candidates as (
    select j.id from public.club_notification_jobs j
    where j.attempts < 5 and j.due_at <= now()
      and (j.state='pending' or (j.state='processing' and j.locked_until < now()))
    order by j.due_at,j.id for update skip locked limit greatest(1,least(batch_size,50))
  ), claimed as (
    update public.club_notification_jobs j set state='processing',attempts=j.attempts+1,
      lease_token=gen_random_uuid(),locked_until=now()+interval '5 minutes'
    from candidates c where j.id=c.id returning j.*
  )
  select j.id,j.lease_token,j.kind,j.ride_id,j.recipient_id,p.email,p.name,r.title,r.starts_at,r.meeting_point
    from claimed j join public.profiles p on p.id=j.recipient_id join public.club_rides r on r.id=j.ride_id;
end $$;
revoke all on function public.club_claim_notifications(integer) from public,anon,authenticated;
grant execute on function public.club_claim_notifications(integer) to service_role;
notify pgrst,'reload schema';
commit;
select 'Cola de avisos preparada; falta activar el servicio de envío' as resultado;
