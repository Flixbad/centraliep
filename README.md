# Central IEP

Gestionnaire d’informations pour **bases joueurs** et **joueurs bannis**, avec interface moderne et synchronisation en temps réel (optionnelle via Supabase).

## Fonctionnalités

- **Bases joueurs** : Membre, nom de groupe, coordonnées, statut, région, type, dernier contact, notes. Ajout, modification, suppression (avec confirmation).
- **Joueurs bannis** : Pseudo, Steam ID, raison, type d’infraction, notes supplémentaires. Ajout, modification, suppression (avec confirmation).
- **Connexion (Supabase Auth)** : pour accéder à l’app avec Supabase, il faut créer un compte. Rôles : Fondateur, SuperAdmin, Dev, Admin, Modérateur, Helpeur. Les **Helpeur** peuvent tout faire sauf supprimer.
- **Confirmation avant suppression** : « Êtes-vous sûr ? » pour éviter les suppressions accidentelles.
- **Gestion des membres** : les rôles **Fondateur**, **SuperAdmin** et **Dev** voient l’onglet « Gestion des membres » et peuvent attribuer les rôles aux autres.
- **Menu utilisateur** (icône en haut à droite) : Paramètres du compte, Gestion des membres (si autorisé), Déconnexion.

## Démarrage rapide

```bash
npm install
npm run dev
```

Ouvre [http://localhost:5173](http://localhost:5173). Sans configuration Supabase, les données sont stockées en **local** (localStorage) sur ton navigateur.

## Synchronisation pour tout le monde (Supabase)

Pour que les infos se mettent à jour pour tous les utilisateurs en temps réel :

1. Crée un projet sur [supabase.com](https://supabase.com) (gratuit).
2. Dans le **SQL Editor** de ton projet, exécute le script `supabase-schema.sql` (il crée les tables et active le Realtime).
3. Dans **Settings → API**, copie l’**URL** et la clé **anon public**.
4. À la racine du projet, crée un fichier `.env` :

```env
VITE_SUPABASE_URL=https://ton-projet.supabase.co
VITE_SUPABASE_ANON_KEY=ta_cle_anon
```

5. Redémarre le serveur (`npm run dev`). La bannière verte confirme la sync.

### Activer l’authentification et les rôles

1. Dans le **SQL Editor** Supabase, exécute le script **`supabase-auth-schema.sql`** (après le schéma principal). Cela crée la table `profiles`, les rôles et les politiques RLS (lecture/écriture réservées aux utilisateurs connectés, suppression interdite pour le rôle Helpeur).
2. Dans Supabase : **Authentication → Providers** : active « Email » si besoin.
3. Chaque nouvel inscrit reçoit par défaut le rôle **Helpeur** (peut ajouter/modifier, pas supprimer). Pour donner le rôle **Fondateur** au premier compte, exécute dans le SQL Editor :

```sql
update public.profiles set role = 'Fondateur' where email = 'ton@email.com';
```

Les rôles **Fondateur**, **SuperAdmin** et **Dev** ont accès à l’onglet « Gestion des membres » pour modifier les rôles des autres.

Sur Netlify, ajoute les mêmes variables dans **Site settings → Environment variables** pour que la version déployée soit aussi synchronisée.

## Déploiement Netlify

- Build command : `npm run build`
- Publish directory : `dist`
- Les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` doivent être définies dans les variables d’environnement du site.

Le fichier `netlify.toml` est déjà configuré pour un déploiement par défaut.

## Stack

- **React** + **Vite**
- **Supabase** (optionnel) : base PostgreSQL + Realtime pour la sync multi-utilisateurs
