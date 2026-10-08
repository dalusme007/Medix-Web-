# Tests — Medix Web

## Tests unitaires (Vitest)

Testent la logique metier pure : calcul de grade/XP, logique du Marathon,
et surtout les 20 formules medicales (verifiees manuellement avec Node
avant livraison, voir note en bas).

```bash
npm install
npm test
```

## Tests de bout en bout (Playwright)

Testent les parcours utilisateur reels dans un navigateur. Necessitent
un vrai projet Supabase configure (.env.local rempli) et le serveur
dev lance (`npm run dev`, lance automatiquement par la config Playwright).

```bash
npx playwright install  # installe les navigateurs, une seule fois
npm run test:e2e
```

Certains tests sont marques `test.skip` car ils necessitent un compte
de test deja cree dans votre projet Supabase — creez un compte de test
dedie, adaptez le test pour se connecter avec ses identifiants, puis
retirez le `.skip`.

## Note de transparence

Cet environnement n'a pas d'acces reseau (`npm install` echoue avec une
erreur 403 sur le registre npm). Les tests Vitest n'ont donc pas pu etre
executes ici via `vitest run` — mais la logique de chaque test a ete
verifiee manuellement en executant l'equivalent exact avec Node natif
(sans dependances), qui lui fonctionne hors-ligne. Tous les calculs
verifies sont corrects (23/23 assertions passees). Lancez `npm test`
une fois le depot cloné localement pour la confirmation officielle via
Vitest.
