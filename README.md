# Âmes errantes — un projet commun

Le point de travail principal est maintenant le **projet SSH sur la Raspberry**. Le code, son historique Git, les sites et la base documentaire y sont réunis. Le PC garde une copie de secours du code.

## Où travailler

| Personne                               | Dossier du projet ChatGPT sur la Raspberry   | Accès                                                         |
| -------------------------------------- | -------------------------------------------- | ------------------------------------------------------------- |
| Responsable technique (`convicts`)     | `/home/convicts/projets/ames-errantes`       | Code des sites, documents et administration via MCP           |
| Équipe documentaire (`ames-documents`) | `/home/ames-documents/projets/ames-errantes` | Documents, historique et points à suivre via un MCP restreint |

Chaque personne utilise son propre compte ChatGPT et sa propre clé SSH. Les conversations sont personnelles ; les documents enregistrés sont communs. Le compte documentaire n'est membre ni de Docker ni de sudo et ne peut utiliser qu'une commande serveur autorisée donnant accès aux outils documentaires. Sa première connexion nécessite encore sa clé publique et son authentification ChatGPT personnelle.

Dans ChatGPT, sélectionner la connexion SSH puis le dossier indiqué. Ouvrir une nouvelle conversation après un changement de configuration pour charger les instructions et outils. La disponibilité des fonctions SSH/MCP doit être vérifiée sur le compte ChatGPT de chaque personne ; l'abonnement à lui seul ne configure pas cet accès.

## Documents et sites

- [Intranet](http://192.168.1.153:4174/) : dossiers, tâches, animaux et administration.
- [Site public](http://192.168.1.153:4173/) : contenus destinés aux visiteurs.
- Dossiers : une seule source, PostgreSQL sur la Raspberry. Le MCP lit et modifie cette base avec versions et historique. Aucun retour à Spaces ni aux anciens SQLite.
- Une modification documentaire enregistrée par l'IA apparaît dans l'intranet. Les documents restent privés tant qu'une publication n'est pas explicitement demandée et effectuée par un accès autorisé.

Exemples : « Relis le dossier d'accueil », « Enregistre cette décision », « Améliore la navigation de l'intranet et teste-la avant de mettre à jour les sites ».

## Faire évoluer le logiciel

Le dépôt de travail et les sites en service sont deux emplacements distincts sur **la même Raspberry**. Les changements de code n'affectent donc pas immédiatement les sites utilisés.

1. Modifier le code dans le projet SSH et faire un commit Git.
2. `pnpm deploy:prepare` : contrôles, construction ARM64, tests PostgreSQL/MCP et navigateur sur des données fictives, puis préparation d'une version liée au commit.
3. `pnpm deploy:activate` : sauvegarde de la base active et mise en service de cette version avec contrôle de santé.

`pnpm deploy` enchaîne ces deux étapes lorsqu'une mise en service est demandée. La préparation seule laisse les sites en service inchangés. L'activation conserve la version précédente et tente de la redémarrer si la nouvelle échoue ; elle n'annule pas une migration de base incompatible.

Les versions exécutées sont dans `/opt/ames-errantes/releases`. `current` désigne la version active. Ne pas modifier leurs fichiers directement. Le code se modifie uniquement dans le dépôt de travail.

## Vérifier et sauvegarder

Dans le projet SSH : `pnpm status`, `pnpm backup`, `pnpm check`, `pnpm test`. Le [guide technique](CONTRIBUTING.md) détaille les commandes.

Le worker conserve 14 sauvegardes quotidiennes PostgreSQL, photos comprises, dans `/opt/ames-errantes/shared/backups`. Depuis le PC, `Sauvegarder.cmd` copie une sauvegarde distante dans `data/backups-raspberry`. Le code est sauvegardé par Git ; le PC récupère les commits de la Raspberry. Une copie sur la même carte SD ne protège pas contre une panne de la carte : conserver également les sauvegardes sur le PC ou un autre support.

Le fonctionnement reste limité au réseau domestique. Accéder depuis ailleurs demandera un accès réseau privé adapté. Les limites matérielles et résultats des vérifications sont dans [VALIDATION.md](VALIDATION.md).

Le [guide Mac](ACCES-MAC.md) détaille la connexion personnelle de ta mère et les premières demandes à l’IA.
