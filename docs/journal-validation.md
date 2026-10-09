# Organisation Raspberry — 5 octobre 2026

> Journal historique. Les mentions de Codex et ChatGPT décrivent l'outillage IA de l'époque, remplacé depuis par Claude (voir le guide technique et le guide Mac).

État : **opérationnel pour le responsable technique ; connexion du Mac à terminer ultérieurement**.

## Organisation vérifiée

- Le dépôt Git complet est désormais dans le dossier déjà choisi pour le projet SSH : `/home/convicts/projets/ames-errantes`. Les sources des deux interfaces, le cœur partagé, le MCP et les tests y sont disponibles. L'ancien dossier contenant seulement deux fichiers d'instructions est conservé dans `/home/convicts/archives`.
- La copie Windows suit le dépôt Raspberry via le remote `raspberry`, avec fusion rapide uniquement. Les historiques originaux et les bundles de secours sont conservés.
- Node.js 24.21.0, pnpm 11.25.0 et Codex CLI 0.160.0 sont accessibles dans un shell SSH de connexion normal. Le compte technique reste authentifié à ChatGPT.
- Le compte `ames-documents` possède son propre Codex et un connecteur limité à 9 outils. Il ne peut pas utiliser Docker, consulter les secrets de production, les sauvegardes ou l'authentification du responsable technique, ni lire le dépôt principal. Aucun identifiant ChatGPT du responsable n'a été copié.
- Le pont appartenant à root impose une entrée documentaire dédiée. La connexion sur l'ancienne image, dépourvue de cette entrée, a réellement été refusée. Le test d'intégration vérifie aussi qu'une variable demandant le profil complet ne change pas les droits documentaires.

## Validation du logiciel

- Contrôle des 234 fichiers et 155 modules, formatage et vérification Git réussis sur la Raspberry.
- Compilation native ARM64 des deux applications, limitée à un worker et 512 Mo de tas Node.
- 11/11 tests PostgreSQL et MCP réussis sur données fictives, incluant conflits, audit, historique, permissions, publication explicite et sauvegarde/restauration.

- Parcours Chromium réussis sur la version finale : modifications IA/humaines, conflits, gestion interne, publication/retrait, médias privés, mobile et 18 pages publiques sans erreur JavaScript. Environnement QA arrêté et conteneurs éphémères supprimés à la fin.
- Version réellement activée : `20261004-222713`, code du commit `0b71b38834ff4ca775b3efbf53884fe9a81a7851`. Préparation, sauvegarde et activation ont été exécutées directement sur la Raspberry.
- Quatre services permanents sains après activation ; santé publique et intranet HTTP 200 ; anciennes routes publiques d'administration HTTP 404.
- Les deux transports MCP réels ont été interrogés après déploiement : 18 outils pour le responsable, 9 pour le compte documentaire ; mêmes 15 documents et 5 tâches. Les appels d'administration tentés avec le compte documentaire sont refusés. Aucun contenu de test n'a été écrit en production.
- Sauvegardes avant et après activation. La copie PC du dump `ames-auto-2026-10-04T22-28-41-771Z.dump` a la même empreinte SHA256 que l'original Raspberry.
- Dernier contrôle matériel : `get_throttled=0x0`, environ 8,6 Go libres. La restriction des limites mémoire Docker liée au noyau reste celle décrite dans l'historique ; le plafond du tas Node à la compilation est actif.

## À terminer avec le Mac

Le Mac n'était pas disponible ; la configuration a été volontairement reportée à la demande de l'utilisateur. Sa clé publique n'a pas encore été ajoutée et son compte ChatGPT n'est pas encore authentifié sur la Raspberry. La disponibilité des connexions SSH sur son compte Go reste à vérifier dans l'application. Le [guide Mac](acces-mac.md) décrit ces étapes.

L'accès reste limité au réseau domestique. Les builds natifs prennent plusieurs minutes sur cette Raspberry 2 Go et sa carte mémoire ; surveiller l'espace disponible avec `pnpm status`. Le redémarrage complet de l'OS n'a pas été testé pendant cette intervention.

---

# Historique des interventions précédentes

# Nettoyage du dépôt — 4 octobre 2026

État : **vérifié localement, non déployé**. Aucun accès à la Raspberry pendant le remplacement de son alimentation. Les résultats distants ci-dessous décrivent la vérification précédente, pas son état pendant cette maintenance.

- Dépôt unique sur `main` ; sept commits historiques conservés et deux bundles de secours vérifiés.
- Installation à verrou figé réussie ; dépendances de développement centralisées, 12 paquets retirés du verrou.
- Construction Linux des deux applications réussie dans Docker.
- Contrôle de syntaxe/imports/exclusions Git réussi ; formatage et `git diff --check` sans erreur.
- 10/10 tests PostgreSQL/MCP réussis dans le projet Docker QA séparé, avec des données fictives : conflits, permissions, publication, import et restauration compris.
- Parcours navigateur réussis : gestion des animaux, réglages partagés, demandes, écritures MCP, conflits humains/IA, publication/retrait, comptes, photos privées, mobile et 18 pages publiques sans erreur JavaScript.
- Configuration GitHub Actions préparée ; aucune exécution sur GitHub, aucun dépôt distant configuré.
- Déploiement désormais lié à un commit propre et à une archive Git. Cette nouvelle procédure de transfert/activation n’a pas été exécutée contre la Raspberry pendant cette intervention.

---

# Déploiement Raspberry — 4 octobre 2026

État actuel : **opérationnel sur le réseau domestique, avec les réserves matérielles et réseau ci-dessous**.

## Résultat vérifié

- Raspberry Pi 4 Model B, 2 Go, Debian 13 arm64, SSH convicts@192.168.1.153. Docker 29.8.2 et Compose 5.6.0 installés via le dépôt officiel ; service Docker activé au démarrage.
- Intranet : http://192.168.1.153:4174 ; site : http://192.168.1.153:4173. Le nom raspberry.local répond également depuis ce PC. L’accès est limité au réseau local ; aucune publication Internet ni redirection de port de box ajoutée.
- Version active : 20261004-205141 ; précédente : 20261004-01. Les quatre services permanents (site, espace, PostgreSQL, worker) sont sains.
- Base locale figée avant export. Import PostgreSQL transactionnel dans une base vide, avec vérification SHA256 du dump. Les empreintes des 15 tables métier concordent : documents, versions, tâches, animaux, photos, utilisateurs, publications, demandes et historique conservés. Les sessions, compteurs temporaires et états de maintenance sont exclus de la comparaison car ils changent pendant le fonctionnement normal.
- Contrôle navigateur réel avec le compte existant : 15 dossiers, 15 révisions conservées par la comparaison, 5 points à suivre, 2 fiches, photos chargées, réglages, comptes, liens vers le site et mobile sans débordement. Ancienne administration publique inaccessible même avec une session. Captures inspectées dans data/qa/raspberry.
- Les 10 tests PostgreSQL passent directement sur ARM64, dans des bases temporaires : sauvegarde/restauration réelle, écritures MCP, conflits, audit, migration, comptes et confidentialité. Aucun document de test ajouté à la base active.
- MCP Codex configuré sur SSH, et protocole réellement testé depuis Windows : 18 outils, lecture du projet et d’un document sur la Raspberry. PROGRAMDATA ajouté à l’environnement du transport, requis par OpenSSH Windows. Aucune clé privée copiée sur la Raspberry.
- Le workflow de mise à jour a été exécuté de bout en bout : construction et 10 tests PostgreSQL sur PC, parcours Chrome QA complet et 18 pages publiques, construction ARM64, transfert SSH, sauvegarde avant mise à jour, contrôles de santé, activation et conservation de la version précédente. Le scénario d’échec déclenchant le retour arrière automatique n’a pas été provoqué.
- Sauvegarde quotidienne prévue par le worker, 14 dernières conservées sur la Raspberry. Sauvegardes distantes réellement créées et copies sur PC vérifiées dans data/backups-raspberry, dont ames-auto-2026-10-04T20-56-53-897Z.dump. La copie vers le PC est manuelle via pc/Sauvegarder.cmd.
- Dernier relevé : environ 497 Mo de mémoire utilisés sur 1,8 Gio, 1,3 Gio disponibles, aucun swap utilisé, 21 Go de disque disponibles. Ces mesures correspondent à cette petite base et ne constituent pas un test de charge.
- Les services locaux de l’ancienne plateforme sont tous arrêtés ; leurs volumes sont conservés. Les raccourcis et scripts de démarrage/sauvegarde pilotent maintenant la Raspberry.

## Réserves précises

- L’adresse 192.168.1.153 doit être réservée dans le DHCP de la box. Son statut de réservation n’a pas été vérifié ; la configuration de la box n’a pas été modifiée.
- Le firmware a renvoyé get_throttled=0x50000 : sous-tension et réduction des performances enregistrées dans l’historique, sans indicateur actif lors du contrôle. Vérifier l’alimentation et le câble. Température relevée : environ 53 °C. Interprétation selon la [documentation officielle Raspberry Pi](https://www.raspberrypi.com/documentation/computers/os.html#get_throttled).
- Le noyau démarre avec cgroup_disable=memory : les plafonds Docker ne sont pas appliqués. Les limites du tas Node et les réglages PostgreSQL sont actifs. Aucun paramètre de démarrage du noyau n’a été modifié.
- La recréation/redémarrage des services a été testée par une vraie mise à jour. Le redémarrage complet de l’OS et une coupure d’alimentation n’ont pas été effectués. Docker est activé au démarrage et les services utilisent unless-stopped.
- Une conversation Codex ouverte avant ce déploiement peut nécessiter une reconnexion MCP ou un redémarrage de Codex.

Guide quotidien et procédure de mise à jour : README.md. Sources et déploiement : deploy/raspberry. Aucun contenu privé publié sur le site pendant ce travail.

---

# Validation du 4 octobre 2026

État : **prêt pour un usage sur le réseau domestique**.

- Les deux applications ont été construites dans Docker ; services web et PostgreSQL sains.
- 10 tests d’intégration PostgreSQL réussis : conflits concurrents, rollback, audit, comptes, limites, tâches, animaux, médias, réglages, demandes, migration, sauvegarde/restauration réelle et MCP stdio.
- Parcours Chrome complet réussi sur une base QA isolée : connexion commune, changement des réglages visible sur le site, remontée des demandes, changement MCP visible dans l’interface, brouillon humain conservé en cas de conflit, publication d’une version puis retrait, affichage mobile et photos partagées.
- 18 pages publiques parcourues sans erreur JavaScript ; page projet vérifiée sur mobile.
- Migration réelle contrôlée : 15 documents et leurs textes, 15 révisions, 5 points à suivre, 2 fiches. Le compte administrateur et son mot de passe existants sont conservés. Aucun dossier publié pendant la migration.
- 18 outils MCP exposés par la connexion locale enregistrée dans Codex ; lecture réelle du projet vérifiée.
- Sauvegarde PostgreSQL créée puis exportée sous `data/backups-export/20261004-220324`. Sauvegardes automatiques quotidiennes dans le volume Docker.
- Accès HTTP vérifié sur localhost et l’adresse LAN du PC `192.168.1.7`, ports 4173 et 4174. Règle pare-feu limitée au profil privé, à l’interface Ethernet et au sous-réseau local. Aucun essai physique depuis le téléphone ou le PC de la deuxième personne.
- Anciennes bases et code conservés sous `data/pre-postgres`. Anciennes suites SQLite archivées ; SQLite n’est plus utilisé en fonctionnement, uniquement pour l’export de migration.
- Les conteneurs et bases QA sont supprimés après les tests. Aucun contenu QA ajouté à la base réelle.

L’accès Internet et l’hébergement distant ne sont pas configurés. Le PC et Docker Desktop doivent rester démarrés. Une conversation Codex déjà ouverte peut nécessiter un rechargement pour voir le nouveau serveur MCP.

## Administration regroupée dans l’intranet — 4 octobre 2026

- Les écrans, styles et routes de gestion sont maintenant dans `ames-errantes-interne`. L’intranet n’importe plus le code du site public.
- `/admin` et toutes les anciennes routes publiques `/api/admin/*` répondent 404, avec ou sans session valide. Les photos privées restent inaccessibles sur le site public, même à un membre connecté.
- Une seule connexion et un seul écran de gestion des comptes dans l’intranet. Le rôle équipe peut gérer les animaux ; seul le propriétaire crée des comptes. Changement de mot de passe, révocation de session, contrôle d’origine et attribution dans le journal vérifiés.
- 10 tests PostgreSQL réussis. Parcours Chrome réussis sur une base temporaire : édition des animaux, réglages communs, demandes, documents et MCP, conflits, publication/retrait, mobile et médias. Les 18 pages publiques restent accessibles sans erreur JavaScript. Captures bureau et mobile inspectées.
- Image Docker reconstruite et mise en service ; services web et PostgreSQL sains. Contrôle réel réussi avec le compte existant : textes des 15 documents, 15 révisions, 5 points et 2 fiches conservés ; anciennes adresses publiques fermées ; accès localhost et LAN vérifié. Aucun contenu métier publié ou ajouté par ces tests.

Commandes de vérification reproductibles : voir `tests/README.md`. Captures visuelles : `data/qa/`. Guide quotidien : `README.md`.
