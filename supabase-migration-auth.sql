-- ============================================================
-- Migration pour base Supabase EXISTANTE
-- À exécuter dans le SQL Editor (une seule fois).
-- Ajoute : colonnes manquantes, table profiles, Auth + rôles, RLS.
-- ============================================================

-- 1) Colonnes manquantes sur les tables existantes
alter table public.player_bases add column if not exists region text;
alter table public.player_bases add column if not exists type_base text;
alter table public.player_bases add column if not exists dernier_contact timestamptz;

alter table public.banned_players add column if not exists type_infraction text;
alter table public.banned_players add column if not exists notes_supp text;

-- 2) Table profiles (Auth + rôles)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'Helpeur' check (role in ('Fondateur', 'SuperAdmin', 'Dev', 'Admin', 'Modérateur', 'Helpeur')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3) Créer un profil à chaque inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'Helpeur')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) RLS sur profiles
alter table public.profiles enable row level security;

drop policy if exists "Profiles read for authenticated" on public.profiles;
create policy "Profiles read for authenticated"
  on public.profiles for select to authenticated using (true);

drop policy if exists "Profiles update own" on public.profiles;
create policy "Profiles update own"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- 5) Trigger : empêcher de modifier son propre rôle (sauf Fondateur/SuperAdmin/Dev)
create or replace function public.prevent_self_role_change()
returns trigger language plpgsql
as $$
begin
  if auth.uid() = old.id and old.role is distinct from new.role then
    if not exists (select 1 from public.profiles where id = auth.uid() and role in ('Fondateur', 'SuperAdmin', 'Dev')) then
      raise exception 'Seuls Fondateur, SuperAdmin et Dev peuvent modifier les rôles.';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists prevent_self_role_change on public.profiles;
create trigger prevent_self_role_change
  before update on public.profiles
  for each row execute function public.prevent_self_role_change();

drop policy if exists "Profiles update by managers" on public.profiles;
create policy "Profiles update by managers"
  on public.profiles for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Fondateur', 'SuperAdmin', 'Dev')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Fondateur', 'SuperAdmin', 'Dev')));

-- 6) Fonction pour le rôle de l'utilisateur connecté
create or replace function public.get_my_role()
returns text language sql security definer stable
as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$;

-- 7) Remplacer les anciennes politiques sur player_bases et banned_players
drop policy if exists "Allow all on player_bases" on public.player_bases;
drop policy if exists "player_bases select authenticated" on public.player_bases;
drop policy if exists "player_bases insert authenticated" on public.player_bases;
drop policy if exists "player_bases update authenticated" on public.player_bases;
drop policy if exists "player_bases delete not helpeur" on public.player_bases;

create policy "player_bases select authenticated" on public.player_bases for select to authenticated using (true);
create policy "player_bases insert authenticated" on public.player_bases for insert to authenticated with check (true);
create policy "player_bases update authenticated" on public.player_bases for update to authenticated using (true) with check (true);
create policy "player_bases delete not helpeur" on public.player_bases for delete to authenticated
  using (public.get_my_role() is distinct from 'Helpeur');

drop policy if exists "Allow all on banned_players" on public.banned_players;
drop policy if exists "banned_players select authenticated" on public.banned_players;
drop policy if exists "banned_players insert authenticated" on public.banned_players;
drop policy if exists "banned_players update authenticated" on public.banned_players;
drop policy if exists "banned_players delete not helpeur" on public.banned_players;

create policy "banned_players select authenticated" on public.banned_players for select to authenticated using (true);
create policy "banned_players insert authenticated" on public.banned_players for insert to authenticated with check (true);
create policy "banned_players update authenticated" on public.banned_players for update to authenticated using (true) with check (true);
create policy "banned_players delete not helpeur" on public.banned_players for delete to authenticated
  using (public.get_my_role() is distinct from 'Helpeur');

-- 8) (Optionnel) Créer les profils pour les utilisateurs déjà présents dans auth.users
insert into public.profiles (id, email, role)
select id, email, 'Helpeur'
from auth.users
on conflict (id) do update set email = excluded.email;

-- Ensuite, pour donner le rôle Fondateur à un compte :
-- update public.profiles set role = 'Fondateur' where email = 'ton@email.com';
