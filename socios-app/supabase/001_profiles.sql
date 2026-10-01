-- Fase 1 · Acceso, aprobación y permisos del área de socios
-- Ejecutar una sola vez en el SQL Editor del proyecto Supabase.

do $$ begin
  create type public.member_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.member_role as enum ('member', 'organizer', 'admin');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 100),
  email text not null,
  status public.member_status not null default 'pending',
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id)
);

create index if not exists profiles_status_created_at_idx
  on public.profiles (status, created_at desc);

alter table public.profiles enable row level security;

create or replace function public.is_club_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and status = 'approved'
      and role = 'admin'
  );
$$;

revoke all on function public.is_club_admin() from public;
grant execute on function public.is_club_admin() to authenticated;

create or replace function public.handle_new_club_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_club_member_created on auth.users;
create trigger on_club_member_created
  after insert on auth.users
  for each row execute procedure public.handle_new_club_member();

drop policy if exists "members_read_own_profile" on public.profiles;
create policy "members_read_own_profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or public.is_club_admin());

drop policy if exists "admins_manage_profiles" on public.profiles;
create policy "admins_manage_profiles"
  on public.profiles for update
  to authenticated
  using (
    public.is_club_admin()
    and id <> (select auth.uid())
    and role <> 'admin'
  )
  with check (
    public.is_club_admin()
    and id <> (select auth.uid())
    and role <> 'admin'
  );

revoke all on public.profiles from anon;
revoke all on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (status, role, approved_at, approved_by, updated_at) on public.profiles to authenticated;

-- 1. Regístrate desde la preview con tu correo.
-- 2. Convierte esa primera cuenta en administradora sustituyendo el correo:
-- update public.profiles p
-- set status = 'approved',
--     role = 'admin',
--     approved_at = now(),
--     updated_at = now()
-- from auth.users u
-- where p.id = u.id
--   and lower(u.email) = lower('TU_CORREO');
