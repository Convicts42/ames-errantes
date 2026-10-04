# Développer Âmes errantes

Un seul dépôt Git, une seule installation pnpm et un seul verrou de dépendances pour toute la plateforme. La branche principale est `main`. Les sept commits d’origine sont conservés via deux imports d’historique ; les branches `history/ame-errante` et `history/ames-errantes-interne` servent de repères, pas de branches de développement.

## Organisation

| Dossier                 | Responsabilité                                              |
| ----------------------- | ----------------------------------------------------------- |
| `ame-errante`           | Site public, pages et demandes des visiteurs                |
| `ames-errantes-interne` | Connexion, documents et toute l’administration              |
| `packages/core`         | Règles métier, PostgreSQL, migrations, droits et historique |
| `services/mcp`          | Outils Codex utilisant les mêmes règles métier              |
| `scripts`               | Commandes de maintenance, tests et déploiement              |
| `tests`                 | Tests et données entièrement fictives                       |
| `deploy/raspberry`      | Installation et activation des versions distantes           |

Conserver les noms des deux dossiers d’application évite de casser les chemins de déploiement existants. Les petits adaptateurs dans leurs dossiers `server` redirigent vers le cœur commun ; ne pas y recopier les règles métier.

## Installation et vérification locale

Prérequis : Git, Node.js 24, pnpm 11.25.0 et Docker avec Compose. Sous Windows, Docker Desktop doit être démarré et Chrome installé. Sous Linux, installer Chromium avec `pnpm exec playwright install --with-deps chromium` avant les tests de navigateur. `PLAYWRIGHT_CHANNEL` permet de choisir un navigateur installé ; `DOCKER_COMMAND` permet de préciser le chemin de Docker.

Depuis la racine :

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm format:check
pnpm qa:build
pnpm test
pnpm test:browser
pnpm qa:stop
```

La QA crée automatiquement `.env.qa`, son réseau et son volume PostgreSQL sous le projet Docker `ames-errantes-qa`. Elle n’a besoin ni de `.env`, ni d’une clé SSH, ni de dossiers réels. Chaque test utilise une base temporaire. Les interfaces QA utilisent uniquement `127.0.0.1:4473` et `127.0.0.1:4474`, puis sont supprimées. L’arrêt conserve le volume QA ; aucune commande de cette procédure n’efface les volumes existants.

`pnpm check` analyse la syntaxe JS/JSX, les imports locaux, les sous-modules accidentels et les chemins privés interdits. Il détecte aussi quelques motifs de secrets : ce contrôle ne remplace pas une revue de sécurité. `pnpm format` harmonise le cœur commun, les scripts et la documentation ; les styles des interfaces restent séparés.

Le workflow GitHub reprend ces étapes sans secret de production et sans déploiement automatique. Il ne s’exécutera qu’après création et connexion d’un dépôt distant.

## Faire une modification

1. Partir de `main` et créer une branche courte, par exemple `fix/document-conflict`.
2. Modifier le bon module, puis vérifier le comportement concerné et les tests ci-dessus.
3. Faire un commit explicite. Ne jamais ajouter les données ou les secrets avec `git add -f`.
4. Intégrer sur `main` après revue. Déployer séparément, lorsque la Raspberry est disponible, avec `node scripts/raspberry.mjs deploy`.

Le déploiement exige un arbre Git propre. Il archive uniquement les fichiers du commit, inscrit sa référence dans `release.json` et dans les métadonnées de l’image, puis vérifie que le code n’a pas changé pendant la préparation. Les données locales ignorées ne sont jamais incluses dans cette archive.

Les commandes `start`, `stop` et `backup` pilotent la production si `deploy/raspberry/active.json` existe. Elles ne servent pas à tester une modification. Les anciennes commandes des sous-projets sont des raccourcis de compatibilité vers la racine.

## Réglages locaux et données privées

`deploy/raspberry/target.json` et `active.json` sont propres à chaque installation et exclus de Git. Pour configurer un nouveau poste, copier les fichiers `.example.json`, renseigner la cible réelle et installer la clé SSH sur ce poste. Ne pas activer la cible distante avant de l’avoir vérifiée. Les exemples n’affectent pas la configuration existante.

Les fichiers `.env*` (sauf `.env.example`), bases, exports, sauvegardes, captures QA et références graphiques brutes restent hors de Git. Les ressources finales du site sont versionnées dans son dossier `public`. `data/repository-backup/20261004` conserve les deux dépôts originaux et leurs bundles vérifiés.

Le dépôt contient du code et des guides internes. Si un hébergement Git est créé, privilégier un dépôt privé. Aucun dépôt distant n’est configuré par cette réorganisation.
