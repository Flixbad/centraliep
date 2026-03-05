-- Exécuter ce script si tes tables existaient déjà avant l’ajout des nouveaux champs.
-- (Supabase : SQL Editor)

alter table player_bases add column if not exists region text;
alter table player_bases add column if not exists type_base text;
alter table player_bases add column if not exists dernier_contact timestamptz;

alter table banned_players add column if not exists type_infraction text;
alter table banned_players add column if not exists notes_supp text;
