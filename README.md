# Âmes errantes

Plateforme de l'association Âmes errantes : un site public, un intranet et une base documentaire partagée, servis depuis une Raspberry Pi du réseau domestique.

| Adresse                                   | Rôle                                        |
| ----------------------------------------- | ------------------------------------------- |
| [Site public](http://192.168.1.153:4173/) | Contenus destinés aux visiteurs             |
| [Intranet](http://192.168.1.153:4174/)    | Dossiers, tâches, animaux et administration |

Les données sont dans PostgreSQL sur la Raspberry. L'IA les lit et les modifie via le MCP `ames-errantes`, avec versions et historique. Les documents restent privés tant qu'une publication n'est pas explicitement demandée.

## Accès IA

| Compte                                 | Outil                                        | Accès                                     |
| -------------------------------------- | -------------------------------------------- | ----------------------------------------- |
| Responsable technique (`convicts`)     | Claude Code (Raspberry, PC) et claude.ai     | Code, documents et administration via MCP |
| Équipe documentaire (`ames-documents`) | Claude Desktop sur le Mac, MCP lancé par SSH | Documents et tâches via un MCP restreint  |

Chaque personne utilise son propre compte Claude et sa propre clé SSH. Les clés du compte documentaire ne peuvent lancer que le MCP documentaire. Le [guide Mac](docs/acces-mac.md) décrit sa première connexion.

## Organisation du dépôt

| Dossier                 | Contenu                                              |
| ----------------------- | ---------------------------------------------------- |
| `ame-errante`           | Site public (Next.js)                                |
| `ames-errantes-interne` | Intranet et toute l'administration (Next.js)         |
| `packages/core`         | Métier, PostgreSQL, migrations, droits, historique   |
| `services`              | MCP (profils complet et documentaire) et worker      |
| `tests`                 | Données fictives et contrôles                        |
| `deploy/raspberry`      | Installation, comptes et activation sur la Raspberry |
| `scripts`               | Commandes `pnpm` (QA, déploiement, pilotage)         |
| `pc`                    | Raccourcis Windows pour piloter la Raspberry         |
| `docs`                  | Guide Mac et journal de validation                   |

## Commandes

```sh
pnpm check && pnpm format:check   # contrôles statiques
pnpm qa:build && pnpm test && pnpm test:browser && pnpm qa:stop   # QA isolée, données fictives
pnpm deploy:prepare               # construit et teste une version, sans toucher la production
pnpm deploy:activate              # sauvegarde puis met en service (sur demande uniquement)
pnpm status | start | stop | backup   # pilotage de la production
```

Le [guide technique](CONTRIBUTING.md) détaille le flux de travail, le déploiement et les sauvegardes.

## Sauvegardes

Le worker conserve 14 sauvegardes quotidiennes sur la Raspberry. Une copie sur la même carte SD ne protège pas d'une panne : depuis le PC, `pc/Sauvegarder.cmd` rapatrie la dernière dans `data/backups-raspberry`.

## Documentation

- [Guide technique](CONTRIBUTING.md)
- [Accès depuis le Mac](docs/acces-mac.md)
- [Journal de validation](docs/journal-validation.md)
