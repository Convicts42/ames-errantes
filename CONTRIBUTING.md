# Développer Âmes errantes

## Un dépôt, un lieu de travail principal

Le dépôt principal est `/home/convicts/projets/ames-errantes` sur la Raspberry. Le projet SSH ChatGPT du responsable technique pointe sur ce dossier. Il réunit le code des deux sites, le cœur partagé, le MCP, les tests et les commandes de déploiement. Les deux historiques originaux sont conservés.

`D:\site` est une copie de secours sur le PC. Ne pas y poursuivre des modifications concurrentes sans synchronisation Git. Depuis le PC, `git fetch raspberry` puis `git merge --ff-only raspberry/main` récupèrent le travail validé. Un refus de fusion signale une divergence à examiner, pas une raison d'écraser l'une des copies.

| Dossier                 | Responsabilité                                      |
| ----------------------- | --------------------------------------------------- |
| `ame-errante`           | Site public                                         |
| `ames-errantes-interne` | Intranet et toute l'administration                  |
| `packages/core`         | Métier, PostgreSQL, migrations, droits, historique  |
| `services/mcp`          | Outils IA communs ; profils complet et documentaire |
| `tests`                 | Données fictives et contrôles                       |
| `deploy/raspberry`      | Installation, comptes et activation                 |

## Installation du poste de développement Raspberry

Git et Docker sont requis. `bash deploy/raspberry/install-dev-tools.sh` installe Node.js 24 ARM64 et pnpm 11.25.0 dans le compte utilisateur, en vérifiant le téléchargement. Ouvrir ensuite un nouveau shell de connexion et lancer `pnpm install --frozen-lockfile`.

Le Dockerfile limite la compilation à un worker Next et le tas Node à 512 Mo. Les tests se déroulent en séquence. Sous Linux, Chromium et ses bibliothèques sont installés dans une image de test séparée, pas dans le système hôte. Son port d'automatisation 4475 écoute uniquement sur loopback et le conteneur est supprimé à la fin.

## Vérification et livraison

```sh
pnpm check
pnpm format:check
pnpm qa:build
pnpm test
pnpm test:browser
pnpm qa:stop
```

La QA utilise son propre projet Docker `ames-errantes-qa`, son réseau, son volume et son secret `.env.qa`. Les bases de test sont temporaires. Les ports 4473/4474 sont réservés à loopback. Aucun export privé ni accès à la base active n'est nécessaire.

Après modification, faire un commit, puis :

```sh
pnpm deploy:prepare
pnpm deploy:activate
```

La préparation refuse un arbre Git sale, construit et teste l'image native, vérifie que le code et l'image n'ont pas changé, archive le commit et écrit une fiche de version. L'activation vérifie ce résultat, crée une sauvegarde de production puis attend la santé des services. `pnpm deploy` enchaîne les deux. La base n'est jamais écrasée ; un retour applicatif ne constitue pas un retour de migration SQL.

Ne pas lancer plusieurs préparations ou suites QA en parallèle. Après interruption, vérifier les processus avant de retirer un verrou dans `data`. Ne jamais supprimer de volume pour résoudre un problème de test. Les contrôles GitHub Actions sont prêts, mais aucun hébergement GitHub n'est configuré.

`pnpm start`, `pnpm stop`, `pnpm status` et `pnpm backup` pilotent la production depuis la Raspberry. La procédure SSH Windows reste un accès de maintenance ; elle ne remplace pas le dépôt principal distant.

## Accès IA documentaire

Le profil MCP `documents` expose uniquement 9 outils de lecture/édition des dossiers, versions et tâches. Il ne permet pas la publication, l'administration du site, les fiches animales ou les demandes. Les appels à ces outils absents sont refusés côté serveur ; les consignes du modèle ne sont pas le mécanisme d'autorisation.

Le compte Linux `ames-documents` possède son propre répertoire et sa propre connexion ChatGPT. Il n'appartient pas au groupe Docker. Une règle sudo précise autorise uniquement `/usr/local/libexec/ames-documents-mcp` sans argument, fichier appartenant à root qui impose le profil et l'acteur d'audit. Le pont lance une entrée dédiée `services/mcp/documents.mjs` qui impose le profil, même si une variable demande le profil complet. Une ancienne release dépourvue de cette entrée refuse la connexion documentaire : aucun élargissement de droits au retour arrière. Ne pas lui donner accès au socket Docker ou aux secrets de production.

Installation administrative : `sudo bash deploy/raspberry/setup-documents-user.sh`. Ajouter ensuite la clé **publique** créée sur son Mac dans `/home/ames-documents/.ssh/authorized_keys`, puis effectuer l'authentification ChatGPT avec son propre compte. Ne pas copier le compte du responsable technique. Les limites de son abonnement et la disponibilité SSH/MCP se vérifient dans son application.

## Données et sauvegardes

Les secrets, fichiers de configuration locaux, bases, dumps, captures et archives restent hors de Git. Les anciennes copies SQLite et locales sont des archives, jamais une source de travail. `data/repository-backup/20261004` sur le PC contient les bundles des anciens dépôts et du dépôt unifié.

Le code en service n'est jamais édité dans `/opt/ames-errantes/current`. Les dossiers métier ne sont jamais dupliqués dans Git pour contourner le MCP.
