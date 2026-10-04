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
- Sauvegarde quotidienne prévue par le worker, 14 dernières conservées sur la Raspberry. Sauvegardes distantes réellement créées et copies sur PC vérifiées dans data/backups-raspberry, dont ames-auto-2026-10-04T20-56-53-897Z.dump. La copie vers le PC est manuelle via Sauvegarder.cmd.
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
