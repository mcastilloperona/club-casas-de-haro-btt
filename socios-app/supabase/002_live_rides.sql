-- V14 · Proyecto tjdtbsroqpbpkyysqjuv · Ejecutar completo en SQL Editor.
-- Conserva usuarios/perfiles. Sustituye las políticas de profiles por acceso
-- propio/administrador; ningún socio puede asignarse permisos a sí mismo.
begin;

do $$
begin
  if not exists (select 1 from public.profiles where status = 'approved' and role = 'admin') then
    raise exception 'Falta un administrador aprobado. La migración se cancela.';
  end if;
end $$;

create schema if not exists club_private;
revoke all on schema club_private from public;
grant usage on schema club_private to authenticated;

create or replace function club_private.approved_role()
returns text language sql stable security definer set search_path = '' as $$
  select p.role from public.profiles p where p.id = auth.uid() and p.status = 'approved';
$$;
revoke all on function club_private.approved_role() from public;
grant execute on function club_private.approved_role() to authenticated;

alter table public.profiles enable row level security;
do $$ declare p record; begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'profiles'
  loop execute format('drop policy %I on public.profiles', p.policyname); end loop;
end $$;
revoke all on public.profiles from anon, authenticated;
revoke insert(id,name,email,status,role,created_at,updated_at),
  update(id,name,email,status,role,created_at,updated_at),
  select(id,name,email,status,role,created_at,updated_at),
  references(id,name,email,status,role,created_at,updated_at)
  on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update(name,status,role,updated_at) on public.profiles to authenticated;
create policy club_profiles_read on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select club_private.approved_role()) = 'admin');
create policy club_profiles_update on public.profiles for update to authenticated
  using ((select club_private.approved_role()) = 'admin')
  with check ((select club_private.approved_role()) = 'admin');

create table if not exists public.club_rides (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles(id),
  organizer_name text not null default '',
  title text not null check (char_length(btrim(title)) between 3 and 120),
  description text not null default '' check (char_length(description) <= 3000),
  starts_at timestamptz not null,
  meeting_point text not null check (char_length(btrim(meeting_point)) between 2 and 200),
  discipline text not null default 'BTT' check (discipline in ('BTT','Carretera','Gravel')),
  difficulty text not null default 'Medio' check (difficulty in ('Fácil','Medio','Exigente')),
  distance_km numeric(6,1) check (distance_km > 0 and distance_km <= 2000),
  status text not null default 'active' check (status in ('active','archived','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.club_ride_members (
  ride_id uuid not null references public.club_rides(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default '',
  created_at timestamptz not null default now(),
  primary key (ride_id,user_id)
);
create table if not exists public.club_ride_messages (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.club_rides(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  author_name text not null default '',
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists club_rides_starts_idx on public.club_rides(starts_at);
create index if not exists club_members_user_idx on public.club_ride_members(user_id);
create index if not exists club_messages_ride_idx on public.club_ride_messages(ride_id,created_at,id);

create or replace function club_private.can_manage_ride(ride uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(club_private.approved_role() = 'admin' or
    (club_private.approved_role() = 'organizer' and exists (
      select 1 from public.club_rides r where r.id = ride and r.organizer_id = auth.uid()
    )), false);
$$;
create or replace function club_private.can_read_chat(ride uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select club_private.approved_role() is not null and exists (
    select 1 from public.club_rides r where r.id = ride and (
      club_private.approved_role() = 'admin' or r.organizer_id = auth.uid() or exists (
        select 1 from public.club_ride_members m where m.ride_id = r.id and m.user_id = auth.uid()
      )
    )
  );
$$;
revoke all on function club_private.can_manage_ride(uuid), club_private.can_read_chat(uuid) from public;
grant execute on function club_private.can_manage_ride(uuid), club_private.can_read_chat(uuid) to authenticated;

-- Los nombres proceden del perfil, nunca de valores enviados por el navegador.
create or replace function club_private.prepare_ride()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.starts_at <= now() then raise exception 'La salida debe ser futura'; end if;
    select name into new.organizer_name from public.profiles where id = new.organizer_id;
  end if;
  new.updated_at := now();
  return new;
end $$;
create or replace function club_private.prepare_member()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r public.club_rides;
begin
  select * into r from public.club_rides where id = new.ride_id for share;
  if r.id is null or r.status <> 'active' or r.starts_at <= now() then
    raise exception 'Esta salida ya no admite inscripciones';
  end if;
  select name into new.name from public.profiles where id = new.user_id;
  return new;
end $$;
create or replace function club_private.prepare_message()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r public.club_rides;
begin
  select * into r from public.club_rides where id = new.ride_id for share;
  if r.id is null or r.status <> 'active' then raise exception 'El chat está cerrado'; end if;
  select name into new.author_name from public.profiles where id = new.user_id;
  new.body := btrim(new.body);
  return new;
end $$;
revoke all on function club_private.prepare_ride(), club_private.prepare_member(), club_private.prepare_message() from public;
drop trigger if exists club_prepare_ride on public.club_rides;
create trigger club_prepare_ride before insert or update on public.club_rides for each row execute function club_private.prepare_ride();
drop trigger if exists club_prepare_member on public.club_ride_members;
create trigger club_prepare_member before insert on public.club_ride_members for each row execute function club_private.prepare_member();
drop trigger if exists club_prepare_message on public.club_ride_messages;
create trigger club_prepare_message before insert on public.club_ride_messages for each row execute function club_private.prepare_message();

alter table public.club_rides enable row level security;
alter table public.club_ride_members enable row level security;
alter table public.club_ride_messages enable row level security;
revoke all on public.club_rides, public.club_ride_members, public.club_ride_messages from anon, authenticated;
grant select on public.club_rides, public.club_ride_members, public.club_ride_messages to authenticated;
grant insert(organizer_id,title,description,starts_at,meeting_point,discipline,difficulty,distance_km)
  on public.club_rides to authenticated;
grant update(title,description,starts_at,meeting_point,discipline,difficulty,distance_km,status)
  on public.club_rides to authenticated;
grant insert(ride_id,user_id) on public.club_ride_members to authenticated;
grant delete on public.club_ride_members to authenticated;
grant insert(ride_id,user_id,body) on public.club_ride_messages to authenticated;

drop policy if exists club_rides_read on public.club_rides;
create policy club_rides_read on public.club_rides for select to authenticated
  using ((select club_private.approved_role()) is not null);
drop policy if exists club_rides_create on public.club_rides;
create policy club_rides_create on public.club_rides for insert to authenticated
  with check (organizer_id = (select auth.uid()) and (select club_private.approved_role()) in ('organizer','admin'));
drop policy if exists club_rides_edit on public.club_rides;
create policy club_rides_edit on public.club_rides for update to authenticated
  using (club_private.can_manage_ride(id)) with check (club_private.can_manage_ride(id));
drop policy if exists club_members_read on public.club_ride_members;
create policy club_members_read on public.club_ride_members for select to authenticated
  using ((select club_private.approved_role()) is not null);
drop policy if exists club_members_join on public.club_ride_members;
create policy club_members_join on public.club_ride_members for insert to authenticated
  with check (user_id = (select auth.uid()) and (select club_private.approved_role()) is not null
    and exists (select 1 from public.club_rides r where r.id = ride_id and r.status = 'active' and r.starts_at > now()));
drop policy if exists club_members_leave on public.club_ride_members;
create policy club_members_leave on public.club_ride_members for delete to authenticated
  using (user_id = (select auth.uid()) and (select club_private.approved_role()) is not null
    and exists (select 1 from public.club_rides r where r.id = ride_id and r.status = 'active' and r.starts_at > now()));
drop policy if exists club_messages_read on public.club_ride_messages;
create policy club_messages_read on public.club_ride_messages for select to authenticated
  using (club_private.can_read_chat(ride_id));
drop policy if exists club_messages_send on public.club_ride_messages;
create policy club_messages_send on public.club_ride_messages for insert to authenticated
  with check (user_id = (select auth.uid()) and club_private.can_read_chat(ride_id)
    and exists (select 1 from public.club_rides r where r.id = ride_id and r.status = 'active'));

notify pgrst, 'reload schema';
commit;

select 'Salidas, inscripciones y chat preparados' as resultado;
