-- Migration : ajouter la table todos (à faire)
-- Exécuter dans le SQL Editor Supabase si le projet existait déjà sans cette table.

create table if not exists todos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date,
  stade text not null check (stade in ('Urgent', 'Moyen', 'Pas urgent')) default 'Moyen',
  status text not null check (status in ('À faire', 'En cours', 'Terminé')) default 'À faire',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter publication supabase_realtime add table todos;

alter table todos enable row level security;
create policy "Allow all on todos" on todos for all using (true) with check (true);
