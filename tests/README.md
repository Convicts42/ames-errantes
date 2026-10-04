# Vérification de la plateforme

Suivre l’installation décrite dans [CONTRIBUTING.md](../CONTRIBUTING.md), puis :

```sh
pnpm qa:build
pnpm test
pnpm test:browser
pnpm qa:stop
```

La première commande construit les deux applications. Les suivantes utilisent exclusivement le projet Docker `ames-errantes-qa`, sans accès SSH, export privé ni volume de production. `.env.qa` est créé automatiquement avec un secret aléatoire et reste exclu de Git.

## Tests PostgreSQL et MCP

Les 11 tests de `platform.test.mjs` créent chacun une base temporaire `ames_test_*`, supprimée à la fin. Ils couvrent les conflits de versions, les transactions et acteurs, la publication explicite, les sessions, les limites concurrentes, les animaux, les photos, les demandes, l’import historique et la restauration réelle d’un dump PostgreSQL. Le MCP est testé à travers son transport stdio réel, y compris le profil documentaire limité et son acteur distinct.

L’export de `fixtures/legacy.mjs` est entièrement fictif : 15 documents, plusieurs versions et un compte désactivé sans mot de passe utilisable. Il est recréé pour chaque test. Aucun dossier ou compte réel n’est copié dans la QA.

## Parcours navigateur

`run-browser-tests.mjs` crée une base `ames_qa_*` et deux conteneurs éphémères sur `127.0.0.1:4473/4474`. Il refuse de remplacer des conteneurs QA déjà présents. Il vérifie les comptes partagés, les rôles, les réglages, les demandes, l’édition MCP en direct, les conflits, les publications, les photos privées et l’affichage mobile. Les captures restent dans `data/qa`, hors Git.

Le navigateur est Chrome sous Windows et Chromium Playwright dans un conteneur dédié sous Linux. `PLAYWRIGHT_CHANNEL` peut sélectionner un navigateur installé. Les scripts `browser-check.mjs`, `admin-check.mjs` et `media-check.mjs` seuls supposent cette infrastructure QA déjà démarrée. `public-check.mjs` peut parcourir un site public seul, en lecture seule, avec `SITE_CHECK_URL`.

## Vérifications historiques et distantes

Ces scripts ne sont **pas** lancés par les tests ni par la CI :

- `live-check.mjs` : contrôle ponctuel de l’ancienne migration locale ; dépend de fichiers privés et de nombres datés du 4 octobre 2026.
- `services/mcp/verify-local.mjs` : ancien transport MCP Docker Desktop, remplacé par SSH.
- `services/mcp/verify-raspberry.mjs` : contrôle du MCP distant en lecture seule.
- `raspberry-check.mjs` : interface Raspberry réelle, compte privé et nombres attendus à la date de migration. Actualiser ces attentes après toute évolution métier volontaire.

Sur la Raspberry, la commande de préparation construit et teste directement l’image ARM64 avant sa mise en service. Ne jamais employer les tests historiques comme tests de non-régression après des modifications métier.
