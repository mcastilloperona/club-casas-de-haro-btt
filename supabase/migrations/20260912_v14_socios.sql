-- Club Casas de Haro BTT · Área de socios V14.1
-- Ejecutar en un proyecto Supabase antes de activar VITE_SOCIOS_ENABLED=true.

create table if not exists public.club_member_private (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  role text not null default 'member' check (role in ('member','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.club_member_directory (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text not null default ''
);

create table if not exists public.club_outings (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '' check (char_length(description) <= 3000),
  activity text not null default 'btt' check (activity in ('btt','road','running')),
  outing_date date not null,
  outing_time time not null,
  meeting_point text not null check (char_length(meeting_point) between 2 and 180),
  distance_km numeric(6,1),
  elevation_m integer,
  difficulty text not null default 'media' check (difficulty in ('suave','media','alta')),
  max_participants integer check (max_participants is null or max_participants >= 2),
  organizer_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  status text not null default 'open' check (status in ('open','cancelled','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.club_outing_attendees (
  outing_id uuid not null references public.club_outings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (outing_id,user_id)
);

create table if not exists public.club_outing_messages (
  id uuid primary key default gen_random_uuid(),
  outing_id uuid not null references public.club_outings(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.club_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null default '',
  outing_id uuid references public.club_outings(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.club_member_private enable row level security;
alter table public.club_member_directory enable row level security;
alter table public.club_outings enable row level security;
alter table public.club_outing_attendees enable row level security;
alter table public.club_outing_messages enable row level security;
alter table public.club_notifications enable row level security;

create or replace function public.club_is_approved(p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.club_member_private where user_id=p_user_id and status='approved') $$;

create or replace function public.club_is_admin(p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.club_member_private where user_id=p_user_id and status='approved' and role='admin') $$;

create or replace function public.club_is_outing_participant(p_outing_id uuid,p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public
as $$
  select exists(select 1 from public.club_outings where id=p_outing_id and organizer_id=p_user_id)
    or exists(select 1 from public.club_outing_attendees where outing_id=p_outing_id and user_id=p_user_id)
$$;

revoke all on function public.club_is_approved(uuid) from public;
revoke all on function public.club_is_admin(uuid) from public;
revoke all on function public.club_is_outing_participant(uuid,uuid) from public;
grant execute on function public.club_is_approved(uuid) to authenticated;
grant execute on function public.club_is_admin(uuid) to authenticated;
grant execute on function public.club_is_outing_participant(uuid,uuid) to authenticated;

create policy "member reads own private record" on public.club_member_private
for select to authenticated using (user_id=auth.uid());
create policy "admin reads member records" on public.club_member_private
for select to authenticated using (public.club_is_admin());
create policy "approved members read directory" on public.club_member_directory
for select to authenticated using (public.club_is_approved());

create policy "approved members read outings" on public.club_outings
for select to authenticated using (public.club_is_approved());
create policy "approved members create outings" on public.club_outings
for insert to authenticated with check (public.club_is_approved() and organizer_id=auth.uid());
create policy "organizer or admin updates outings" on public.club_outings
for update to authenticated using (organizer_id=auth.uid() or public.club_is_admin())
with check (organizer_id=auth.uid() or public.club_is_admin());
create policy "organizer or admin deletes outings" on public.club_outings
for delete to authenticated using (organizer_id=auth.uid() or public.club_is_admin());

create policy "approved members read attendees" on public.club_outing_attendees
for select to authenticated using (public.club_is_approved());

create policy "participants read chat" on public.club_outing_messages
for select to authenticated using (public.club_is_outing_participant(outing_id));
create policy "participants write chat" on public.club_outing_messages
for insert to authenticated with check (user_id=auth.uid() and public.club_is_outing_participant(outing_id));
create policy "authors delete own chat messages" on public.club_outing_messages
for delete to authenticated using (user_id=auth.uid() or public.club_is_admin());

create policy "members read own notifications" on public.club_notifications
for select to authenticated using (user_id=auth.uid());
create policy "members mark own notifications" on public.club_notifications
for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

create or replace function public.club_on_auth_user()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  insert into public.club_member_private(user_id,full_name,phone)
  values(new.id,coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),'Socio pendiente'),coalesce(new.raw_user_meta_data->>'phone',''))
  on conflict(user_id) do nothing;
  return new;
end $$;

drop trigger if exists club_auth_user_created on auth.users;
create trigger club_auth_user_created after insert on auth.users for each row execute function public.club_on_auth_user();

-- Incluye cuentas creadas antes de esta migración como solicitudes pendientes.
insert into public.club_member_private(user_id,full_name,phone)
select id,coalesce(nullif(trim(raw_user_meta_data->>'full_name'),''),'Socio pendiente'),coalesce(raw_user_meta_data->>'phone','')
from auth.users on conflict(user_id) do nothing;

create or replace function public.club_sync_directory()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  if new.status='approved' then
    insert into public.club_member_directory(user_id,display_name)
    values(new.user_id,new.full_name)
    on conflict(user_id) do update set display_name=excluded.display_name;
  else
    delete from public.club_member_directory where user_id=new.user_id;
  end if;
  new.updated_at=now();
  return new;
end $$;

drop trigger if exists club_member_directory_sync on public.club_member_private;
create trigger club_member_directory_sync before update on public.club_member_private
for each row execute function public.club_sync_directory();

create or replace function public.club_admin_set_member(p_user_id uuid,p_status text,p_role text default 'member')
returns void language plpgsql security definer set search_path=public
as $$
begin
  if not public.club_is_admin(auth.uid()) then raise exception 'Acceso reservado a administradores'; end if;
  if p_status not in ('pending','approved','rejected','suspended') then raise exception 'Estado no válido'; end if;
  if p_role not in ('member','admin') then raise exception 'Rol no válido'; end if;
  update public.club_member_private set status=p_status,role=p_role where user_id=p_user_id;
end $$;
revoke all on function public.club_admin_set_member(uuid,text,text) from public;
grant execute on function public.club_admin_set_member(uuid,text,text) to authenticated;

create or replace function public.club_after_outing_created()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  insert into public.club_outing_attendees(outing_id,user_id) values(new.id,new.organizer_id) on conflict do nothing;
  insert into public.club_notifications(user_id,title,body,outing_id)
  select user_id,'Nueva salida del club',new.title||' · '||to_char(new.outing_date,'DD/MM')||' a las '||to_char(new.outing_time,'HH24:MI'),new.id
  from public.club_member_private where status='approved' and user_id<>new.organizer_id;
  return new;
end $$;
drop trigger if exists club_outing_created on public.club_outings;
create trigger club_outing_created after insert on public.club_outings for each row execute function public.club_after_outing_created();

create or replace function public.club_join_outing(p_outing_id uuid)
returns void language plpgsql security definer set search_path=public
as $$
declare v_outing public.club_outings%rowtype; v_count integer;
begin
  if not public.club_is_approved(auth.uid()) then raise exception 'Socio no autorizado'; end if;
  select * into v_outing from public.club_outings where id=p_outing_id and status='open' for update;
  if not found then raise exception 'La salida no está disponible'; end if;
  select count(*) into v_count from public.club_outing_attendees where outing_id=p_outing_id;
  if v_outing.max_participants is not null and v_count>=v_outing.max_participants then raise exception 'La salida está completa'; end if;
  insert into public.club_outing_attendees(outing_id,user_id) values(p_outing_id,auth.uid()) on conflict do nothing;
  if auth.uid()<>v_outing.organizer_id then
    insert into public.club_notifications(user_id,title,body,outing_id)
    select v_outing.organizer_id,'Nuevo participante',display_name||' se ha apuntado a "'||v_outing.title||'"',p_outing_id
    from public.club_member_directory where user_id=auth.uid();
  end if;
end $$;

create or replace function public.club_leave_outing(p_outing_id uuid)
returns void language plpgsql security definer set search_path=public
as $$
begin
  if exists(select 1 from public.club_outings where id=p_outing_id and organizer_id=auth.uid()) then raise exception 'El organizador no puede abandonar su salida'; end if;
  delete from public.club_outing_attendees where outing_id=p_outing_id and user_id=auth.uid();
end $$;
revoke all on function public.club_join_outing(uuid) from public;
revoke all on function public.club_leave_outing(uuid) from public;
grant execute on function public.club_join_outing(uuid) to authenticated;
grant execute on function public.club_leave_outing(uuid) to authenticated;

create or replace function public.club_after_message()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  insert into public.club_notifications(user_id,title,body,outing_id)
  select a.user_id,'Nuevo mensaje en el chat',left(new.body,120),new.outing_id
  from public.club_outing_attendees a where a.outing_id=new.outing_id and a.user_id<>new.user_id;
  return new;
end $$;
drop trigger if exists club_message_created on public.club_outing_messages;
create trigger club_message_created after insert on public.club_outing_messages for each row execute function public.club_after_message();

alter publication supabase_realtime add table public.club_outings;
alter publication supabase_realtime add table public.club_outing_attendees;
alter publication supabase_realtime add table public.club_outing_messages;
alter publication supabase_realtime add table public.club_notifications;

-- Tras registrarte, convierte manualmente tu primera cuenta en administradora desde
-- Supabase SQL Editor, sustituyendo EL_UUID_DE_TU_USUARIO:
-- update public.club_member_private set status='approved',role='admin' where user_id='EL_UUID_DE_TU_USUARIO';
