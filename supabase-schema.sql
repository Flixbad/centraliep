-- À exécuter dans le SQL Editor de ton projet Supabase (supabase.com)
-- Cela crée les tables et active le Realtime pour la synchronisation entre utilisateurs.

-- Table: Bases joueurs
create table if not exists player_bases (
  id uuid primary key default gen_random_uuid(),
  membre text not null,
  nom_groupe text not null,
  coordonnees text,
  status text not null check (status in ('En cours', 'Abandonné', 'Surveillance')),
  notes text,
  region text,
  type_base text,
  dernier_contact timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Table: Joueurs bannis
create table if not exists banned_players (
  id uuid primary key default gen_random_uuid(),
  pseudo text not null,
  steamid text not null,
  raison text not null,
  duree_ban text,
  type_infraction text,
  notes_supp text,
  date_ban timestamptz default now(),
  created_at timestamptz default now()
);

-- Table: Todo list (à faire)
create table if not exists todos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date,
  stade text not null check (stade in ('Urgent', 'Moyen', 'Pas urgent')) default 'Moyen',
  status text not null check (status in ('À faire', 'En cours', 'Terminé')) default 'À faire',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Migration: ajouter colonnes si les tables existent déjà (exécuter après la 1ère création)
-- alter table player_bases add column if not exists region text;
-- alter table player_bases add column if not exists type_base text;
-- alter table player_bases add column if not exists dernier_contact timestamptz;
-- alter table banned_players add column if not exists type_infraction text;
-- alter table banned_players add column if not exists notes_supp text;

-- Activer Realtime sur les tables (pour que les autres voient les mises à jour)
alter publication supabase_realtime add table player_bases;
alter publication supabase_realtime add table banned_players;
alter publication supabase_realtime add table todos;

-- Politique d'accès : lecture/écriture pour tous (à restreindre en prod si besoin)
alter table player_bases enable row level security;
alter table banned_players enable row level security;
alter table todos enable row level security;

create policy "Allow all on player_bases" on player_bases for all using (true) with check (true);
create policy "Allow all on banned_players" on banned_players for all using (true) with check (true);
create policy "Allow all on todos" on todos for all using (true) with check (true);
