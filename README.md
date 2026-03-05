# Central IEP

Gestionnaire d’informations pour **bases joueurs** et **joueurs bannis**, avec interface moderne et synchronisation en temps réel (optionnelle via Supabase).

## Fonctionnalités

- **Bases joueurs** : Membre, nom de groupe, coordonnées, statut, région, type, dernier contact, notes. Ajout, modification, suppression (avec confirmation).
- **Joueurs bannis** : Pseudo, Steam ID, raison, type d’infraction, notes supplémentaires. Ajout, modification, suppression (avec confirmation).
- **Protection par mot de passe** (optionnelle) : un mot de passe unique pour accéder au site (voir ci‑dessous).
- **Confirmation avant suppression** : « Êtes-vous sûr ? » pour éviter les suppressions accidentelles.

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

Sur Netlify, ajoute les mêmes variables dans **Site settings → Environment variables** pour que la version déployée soit aussi synchronisée.

### Protection par mot de passe (optionnel)

Pour demander un mot de passe avant d’accéder au site, ajoute dans ton `.env` (et dans les variables d’environnement Netlify si déployé) :

```env
VITE_APP_PASSWORD=ton_mot_de_passe_secret
```

Si `VITE_APP_PASSWORD` n’est pas défini ou est vide, le site est accessible sans mot de passe. Une fois le bon mot de passe saisi, l’accès reste ouvert pour la session (onglet) en cours.

## Déploiement Netlify

- Build command : `npm run build`
- Publish directory : `dist`
- Les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` doivent être définies dans les variables d’environnement du site. Optionnel : `VITE_APP_PASSWORD` pour protéger l’accès au site.

Le fichier `netlify.toml` est déjà configuré pour un déploiement par défaut.

## Stack

- **React** + **Vite**
- **Supabase** (optionnel) : base PostgreSQL + Realtime pour la sync multi-utilisateurs
