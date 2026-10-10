-- 006 · Correos automáticos a socios cuando su alta cambia a approved.
-- Ejecutar en Supabase SQL Editor después de 002. No modifica los perfiles.
-- Reutiliza la función notify-club y el cron avisos-club existentes.
begin;

create table if not exists public.club_member_approval_jobs (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  member_id uuid not null references public.profiles(id) on delete cascade,
  state text not null default 'pending'
    check (state in ('pending','processing','sent','failed','skipped')),
  due_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  attempts integer not null default 0,
  lease_token uuid,
  locked_until timestamptz,
  sent_at timestamptz,
  last_error text
);
create index if not exists club_member_approval_due_idx
  on public.club_member_approval_jobs(state,due_at);
alter table public.club_member_approval_jobs enable row level security;
revoke all on public.club_member_approval_jobs from public,anon,authenticated;
grant all on public.club_member_approval_jobs to service_role;

create schema if not exists club_private;
revoke all on schema club_private from public;

create or replace function club_private.enqueue_member_approval_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Solo las transiciones reales hacia aprobado, no cambios de rol o edición.
  if new.status = 'approved' and old.status is distinct from new.status
     and coalesce(btrim(new.email),'') <> '' then
    insert into public.club_member_approval_jobs(event_key,member_id)
    values (
      'member-approved:'||new.id::text||':'||coalesce(new.updated_at,now())::text,
      new.id
    )
    on conflict(event_key) do nothing;
  end if;
  return new;
end $$;
revoke all on function club_private.enqueue_member_approval_email() from public;
drop trigger if exists club_member_approval_email on public.profiles;
create trigger club_member_approval_email
  after update of status on public.profiles
  for each row execute function club_private.enqueue_member_approval_email();

create or replace function public.club_claim_member_approval_emails(batch_size integer default 10)
returns table(job_id uuid,token uuid,email text,member_name text)
language plpgsql security definer set search_path = '' as $$
begin
  update public.club_member_approval_jobs j
    set state='failed',last_error='Máximo de intentos alcanzado'
  where j.attempts>=5
    and (j.state='pending' or (j.state='processing' and j.locked_until<now()));

  -- Nunca enviar aprobaciones revocadas antes de procesar el correo.
  update public.club_member_approval_jobs j
    set state='skipped'
  where (j.state='pending' or (j.state='processing' and j.locked_until<now()))
    and not exists (
      select 1 from public.profiles p
      where p.id=j.member_id and p.status='approved' and coalesce(btrim(p.email),'')<>''
    );

  return query
  with candidates as (
    select j.id from public.club_member_approval_jobs j
      join public.profiles p on p.id=j.member_id
    where j.attempts<5 and j.due_at<=now()
      and p.status='approved' and coalesce(btrim(p.email),'')<>''
      and (j.state='pending' or (j.state='processing' and j.locked_until<now()))
    order by j.due_at,j.id
    for update of j skip locked
    limit greatest(1,least(batch_size,20))
  ), claimed as (
    update public.club_member_approval_jobs j
    set state='processing',attempts=j.attempts+1,
      lease_token=gen_random_uuid(),locked_until=now()+interval '5 minutes'
    from candidates c where j.id=c.id
    returning j.*
  )
  select j.id,j.lease_token,p.email,p.name
  from claimed j join public.profiles p on p.id=j.member_id;
end $$;
revoke all on function public.club_claim_member_approval_emails(integer)
  from public,anon,authenticated;
grant execute on function public.club_claim_member_approval_emails(integer) to service_role;

notify pgrst,'reload schema';
commit;
