# Medix Web

Application web de production pour Medix — académie médicale gamifiée.
Next.js 14 (App Router) + Supabase (auth, base de données, sécurité).

## Architecture

```
app/
  login/ signup/ forgot-password/ reset-password/   -> Authentification
  dashboard/
    page.js                    -> Tableau de bord principal
    setup/                     -> Creation du profil (post-inscription)
    play/solo/ duel/ personnalise/  -> Modes de jeu
    marathon/                  -> Grand Marathon Medix
    stats/ history/ badges/ leaderboard/  -> Suivi joueur
    triads/ calculators/ stephene/  -> Ressources
    search/                    -> Recherche unifiee
    admin/                     -> Panneau administrateur
  api/admin/                   -> Route Handlers proteges (service_role)
lib/
  supabase/                    -> Clients navigateur/serveur/admin
  services/                    -> Toute la logique d'acces aux donnees
  data/                        -> Contenu statique (questions, formules)
  constants/                   -> Echelles, grades, Marathon
  admin/                       -> Garde-fou serveur pour le panneau admin
tests/
  unit/                        -> Tests Vitest (logique pure)
  e2e/                         -> Tests Playwright (parcours utilisateur)
```

Le backend Supabase (migrations SQL, fonctions RPC securisees, RLS) est
dans le depot separe `medix-backend/`, a deployer AVANT cette application.

## Installation locale

```bash
npm install
cp .env.example .env.local   # puis remplir avec vos vraies valeurs Supabase
npm run dev
```

Ouvrez http://localhost:3000

## Prerequis avant le premier lancement

1. Un projet Supabase cree, avec les 13 migrations SQL executees dans
   l'ordre (`medix-backend/supabase/migrations/`).
2. La fonction Edge `dr-stephene-chat` deployee (`dr-stephene-backend/`)
   pour que le chat IA fonctionne.
3. Au moins un utilisateur promu administrateur pour acceder au panneau
   admin :
   ```sql
   update shared.profiles set is_admin = true where id = 'votre-uuid';
   ```

## Deploiement (Vercel)

1. Poussez ce depot sur GitHub.
2. Sur [vercel.com](https://vercel.com), importez le depot.
3. Renseignez les variables d'environnement (memes noms que `.env.example`)
   dans Project Settings > Environment Variables.
4. Deployez. `vercel.json` est deja configure (framework Next.js detecte
   automatiquement, en-tetes de securite de base inclus).

Pour un deploiement manuel :
```bash
npm run build
npm start
```

## Tests

Voir `tests/README.md` pour le detail. En resume :
```bash
npm test        # tests unitaires (Vitest)
npm run test:e2e  # tests de bout en bout (Playwright, necessite Supabase configure)
```

## Securite — points cles

- Aucun calcul de recompense (XP/coins/badges) ne se fait cote client :
  tout passe par la fonction RPC `medix.record_game_result`, executee
  cote serveur Postgres.
- Le statut administrateur ne peut pas etre auto-attribue par un
  utilisateur (bloque par un trigger SQL), meme en modifiant son propre
  profil.
- Les routes `/api/admin/*` verifient `is_admin` cote serveur a chaque
  appel, independamment de toute verification cote client.
- La cle `service_role` Supabase n'est jamais exposee au navigateur ;
  elle n'est utilisee que dans les Route Handlers serveur.

## Ecosysteme Medix

L'architecture (schemas `shared`/`medix`/`bibliomed` cote base de donnees,
couche `lib/services/` decouplee de l'UI) est concue pour qu'un futur
produit BiblioMed puisse reutiliser `shared.profiles` et l'authentification
sans dupliquer de code.
