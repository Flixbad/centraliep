-- ============================================================
-- Central IEP – Auth + rôles + RLS
-- Exécuter dans le SQL Editor Supabase après le schéma principal.
-- ============================================================

-- Rôles possibles (ordre hiérarchique pour affichage)
-- Fondateur, SuperAdmin, Dev : peuvent gérer les membres (attribuer les rôles)
-- Admin, Modérateur : peuvent tout faire sauf gérer les rôles
-- Helpeur : peut ajouter/modifier mais PAS supprimer

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'Helpeur' check (role in ('Fondateur', 'SuperAdmin', 'Dev', 'Admin', 'Modérateur', 'Helpeur')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Créer un profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'Helpeur');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS profiles
alter table public.profiles enable row level security;

-- Tout utilisateur connecté peut lire les profils (pour la liste des membres)
create policy "Profiles read for authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- Un utilisateur peut mettre à jour son propre profil (display_name, email) mais PAS son rôle
create policy "Profiles update own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Trigger : empêcher un utilisateur de modifier son propre rôle (seuls les managers le font)
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

-- Les Fondateur, SuperAdmin, Dev peuvent modifier n'importe quel profil (dont les rôles)
create policy "Profiles update by managers"
  on public.profiles for update
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Fondateur', 'SuperAdmin', 'Dev'))
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Fondateur', 'SuperAdmin', 'Dev'))
  );

-- Fonction pour connaître le rôle de l'utilisateur courant
create or replace function public.get_my_role()
returns text language sql security definer stable
as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$;

-- Supprimer les anciennes politiques "Allow all" si elles existent
drop policy if exists "Allow all on player_bases" on public.player_bases;
drop policy if exists "Allow all on banned_players" on public.banned_players;

-- player_bases : lecture / écriture pour tout connecté ; suppression interdite pour Helpeur
create policy "player_bases select authenticated"
  on public.player_bases for select to authenticated using (true);
create policy "player_bases insert authenticated"
  on public.player_bases for insert to authenticated with check (true);
create policy "player_bases update authenticated"
  on public.player_bases for update to authenticated using (true) with check (true);
create policy "player_bases delete not helpeur"
  on public.player_bases for delete to authenticated
  using (public.get_my_role() is distinct from 'Helpeur');

-- banned_players : idem
create policy "banned_players select authenticated"
  on public.banned_players for select to authenticated using (true);
create policy "banned_players insert authenticated"
  on public.banned_players for insert to authenticated with check (true);
create policy "banned_players update authenticated"
  on public.banned_players for update to authenticated using (true) with check (true);
create policy "banned_players delete not helpeur"
  on public.banned_players for delete to authenticated
  using (public.get_my_role() is distinct from 'Helpeur');

-- Premier utilisateur : passer un compte en Fondateur manuellement après la 1ère inscription :
-- update public.profiles set role = 'Fondateur' where email = 'ton@email.com';
