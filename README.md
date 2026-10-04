# Âme Errante

Site d’association de protection animale en français : **Next.js 16.3.8**, **React 19.3.0** et **SQLite**. Le catalogue, les profils, les messages de contact et les demandes de rencontre utilisent un backend intégré à Next.js. Les exemples Soleil et Plume restent explicitement fictifs.

## Démarrer

Prérequis : **Node.js 24 ou plus récent** et pnpm 11.25.0. Le pilote SQLite est fourni par Node.js : aucun serveur de base de données ni module natif supplémentaire à installer.

```powershell
cd D:\site\ame-errante
pnpm install --frozen-lockfile
pnpm db:init
pnpm dev:lan
```

Sur ce PC : http://127.0.0.1:4173. Sur le réseau local actuel : http://192.168.1.7:4173. `pnpm dev` limite l’écoute à ce PC. Si l’adresse IPv4 change, adapter `allowedDevOrigins` dans `next.config.mjs`.

La base est créée au premier accès dans `data/ame-errante.sqlite`. Une migration versionnée crée les tables et ajoute une seule fois les deux animaux d’exemple. Redémarrer ou reconstruire le site ne remet pas les données à zéro. `DATABASE_PATH` permet de déplacer la base ; copier `.env.example` en `.env.local` pour configurer ce chemin. Les commandes de gestion lisent également `.env.local`.

## Administration

Ouvrir `/admin`. L’administration permet de :

- consulter les demandes, leur détail et leur récapitulatif ;
- classer une demande comme à lire, en cours ou traitée ; supprimer ses données si nécessaire ;
- créer et modifier les fiches des animaux, conserver des brouillons, publier ou retirer une fiche ;
- indiquer la disponibilité et distinguer les profils fictifs ;
- importer jusqu’à huit photos, renseigner le gabarit, la localisation approximative et les besoins de santé ;
- suivre les dossiers : responsable, étape, notes privées, rendez-vous, prochaine action et suivi après adoption ;
- renseigner l’identité de l’association, ses conditions et frais, sa collecte HelloAsso et la conservation des dossiers ;
- configurer le numéro destinataire WhatsApp et consulter l’état des notifications ;
- changer son mot de passe et se déconnecter.

Pour créer un compte local, sans inscription publique :

```powershell
pnpm admin:create
```

Cette commande crée l’identifiant `admin` avec un mot de passe aléatoire et écrit les accès dans `data/acces-admin.txt`, ignoré par Git et non servi par le site. Elle ne remplace jamais un compte existant. Un autre identifiant peut être fourni avec `node --env-file-if-exists=.env.local scripts/database.mjs admin autre-identifiant`. Changer le mot de passe dans « Mon compte », puis supprimer le fichier d’accès initial.

Les mots de passe sont dérivés avec scrypt et un sel aléatoire. Les sessions ont une durée maximale de huit heures et un jeton aléatoire dont seul le condensat est stocké. Le cookie est HttpOnly et SameSite=Strict. La déconnexion invalide la session ; un changement de mot de passe invalide toutes les sessions du compte. Chaque route privée contrôle elle-même l’authentification. Aucun compte de test n’est créé dans la vraie base par les tests.

Les photos s’importent dans l’éditeur (JPEG, PNG, WebP, 8 Mo et 25 millions de pixels maximum). Sharp les réencode en WebP, retire les métadonnées EXIF/GPS et limite leur taille à 1 920 pixels. Elles sont stockées dans SQLite et incluses dans ses sauvegardes. Une photo importée reste privée tant qu’aucune fiche publiée ne la référence. Les anciennes illustrations dans `public/assets` restent compatibles. Retirer une photo de la fiche ne supprime pas immédiatement ses octets ; les médias orphelins doivent être nettoyés lors de la maintenance éditoriale. Une fiche conserve son adresse.

## Formulaires et données

Le contact enregistre le prénom, l’adresse e-mail, le sujet et le message. Le parcours de rencontre conserve ses trois étapes, ajoute l’adresse e-mail et permet de relire un récapitulatif éditable avant un envoi explicite. Le récapitulatif modifié est aussi enregistré.

Les deux formulaires demandent l’accord de la personne pour enregistrer sa demande. Ils montrent une confirmation et une référence seulement après une réponse positive du serveur. En cas d’erreur, les champs restent remplis. Une clé d’envoi empêche la création de doublons lors d’une nouvelle tentative identique. Un animal masqué, réservé ou adopté ne peut plus recevoir une nouvelle demande de rencontre.

Les demandes ne sont accessibles que depuis l’administration. Les requêtes utilisent des paramètres SQL, la taille des corps JSON est limitée et les champs sont validés côté serveur. Les écritures vérifient l’origine des requêtes. Des limites persistantes encadrent les tentatives de connexion et les envois. Une version sur chaque fiche évite d’écraser silencieusement une modification faite dans un autre onglet.

Les formulaires `/famille-accueil` et `/benevolat` enregistrent aussi le secteur, les disponibilités et l’expérience proposés. `/belles-histoires` affiche uniquement les nouvelles de vrais animaux adoptés, publiées avec l’autorisation confirmée dans l’administration. Les pages `/mentions-legales` et `/confidentialite` utilisent les réglages de l’association. Les champs encore vides sont signalés : ces pages ne constituent pas une validation juridique automatique.

**Les notifications utilisent WhatsApp, sans e-mail automatique.** Après configuration et activation, chaque nouvelle demande réelle crée une alerte pour l’équipe. Un visiteur peut choisir un accusé WhatsApp avec consentement distinct. Seuls le numéro du destinataire et la référence sont transmis à Meta. Les demandes sur les animaux fictifs ne déclenchent aucun envoi. L’intégration reste inactive tant que les accès Meta ne sont pas renseignés. Voir [le guide de configuration WhatsApp](docs/whatsapp.md).

Le lien de collecte HelloAsso se configure dans l’administration : le paiement reste entièrement chez le prestataire, sans données bancaires dans ce site. Aucun compte, collecte, reçu fiscal ou paiement réel n’est créé automatiquement. Le blog et les autres textes éditoriaux restent dans les composants JSX.

## Production et sauvegardes

```powershell
pnpm build
pnpm start
pnpm db:backup
```

Cette version requiert un **serveur Node avec disque persistant et une seule instance d’application** partageant ce disque. Elle ne doit pas être déployée telle quelle sur un environnement serverless dont le disque est éphémère. `.next` est le résultat de compilation ; `data/` contient les données et doit être conservé entre déploiements.

`pnpm db:backup` utilise l’API de sauvegarde SQLite pour produire une copie cohérente, y compris si le mode WAL est actif. Les copies sont placées dans `data/backups/`. Pour restaurer, arrêter le serveur, mettre de côté l’ensemble de la base courante et de ses éventuels fichiers `-wal`/`-shm`, puis remettre une sauvegarde à l’emplacement `DATABASE_PATH` avant de redémarrer. Ne pas mélanger une ancienne sauvegarde avec les journaux d’une autre base. Tester une restauration sur une copie avant de remplacer des données utiles.

Les bases, sauvegardes et accès initiaux sont ignorés par Git et doivent rester accessibles uniquement aux personnes autorisées sur la machine. Les tests génèrent des bases séparées dans `data/test-runs/` ; ce dossier peut être nettoyé quand aucun test ne tourne.

Le service interne tourne toutes les minutes tant que le serveur Node reste actif. Il traite les notifications, applique la suppression des dossiers clôturés si elle a été activée, et crée une sauvegarde quotidienne vérifiée (`PRAGMA integrity_check`). Les 14 dernières copies automatiques sont conservées, sans supprimer les archives manuelles. `BACKUP_DIRECTORY` permet de choisir un disque externe ou un partage réseau protégé ; sans ce réglage, les copies restent sur le même disque, ce qui ne protège pas contre sa perte. `DISABLE_MAINTENANCE=true` désactive le service, notamment lors d’une restauration de test. L’administration affiche le dernier passage et les erreurs de sauvegarde. Un arrêt complet du serveur ne peut pas être signalé par ce même service ; une surveillance extérieure reste nécessaire pour un hébergement public.

La suppression automatique est désactivée initialement. Choisir une durée justifiée entre 30 et 1 095 jours après clôture, puis l’activer explicitement dans les réglages. Les dossiers ouverts restent conservés. La suppression retire également leurs notes, historique et notifications. Les copies de sauvegarde peuvent contenir les données jusqu’à leur rotation : conserver séparément un registre des demandes d’effacement et les réappliquer avant de rouvrir une restauration. Les archives manuelles ne sont pas purgées automatiquement.

En production, servir le site en HTTPS : les cookies de session sont alors Secure par défaut. Derrière un proxy HTTPS, renseigner `APP_ORIGIN` avec l’origine publique exacte. `COOKIE_SECURE=false` est uniquement prévu pour une exécution de production en HTTP sur un réseau local de test. Aucun déploiement en ligne n’a été réalisé.

## Vérifier

```powershell
pnpm test:backend
pnpm build
pnpm check
pnpm test
```

- `test:backend` teste de vraies bases SQLite : migration, persistance après réouverture, visibilité des brouillons, conflits de modification, validation, idempotence, limites, suppression des données, mots de passe et sessions.
- `check` lance un serveur de production sur un port libre avec une base séparée. Il inspecte les 17 pages déclarées et leurs ressources, titres, descriptions, ancres et régions principales.
- `test` lance le serveur sur le port 4183, avec sa propre base et son propre compte temporaire. Chrome doit être installé ; `PLAYWRIGHT_CHANNEL=msedge` permet d’utiliser Edge. Les tests envoient réellement des demandes à cette base isolée. Ils ne ciblent plus un serveur existant via `PLAYWRIGHT_BASE_URL`.

Les tests couvrent aussi les réglages, les conflits de suivi, les imports d’images et leur visibilité, la restauration des photos, la purge et la file de notifications. Les appels Meta sont simulés : aucun envoi WhatsApp réel n’est revendiqué sans configuration du compte et essai de livraison. Les copies dans le presse-papiers sont simulées. Aucun score Lighthouse ni essai sur téléphone physique n’est revendiqué.

## Structure

- `src/app/` : pages, administration et routes API.
- `src/server/` : migration SQLite, accès aux données, validation, authentification et contrôles HTTP.
- `src/components/admin/` : connexion, tableau de bord, édition des fiches et consultation des demandes.
- `src/components/animal-profile.jsx` : fiche commune alimentée par SQLite.
- `src/data/` : métadonnées éditoriales, choix des formulaires et source des exemples initiaux.
- `src/styles/` et `public/assets/` : présentation, photographies, polices et licences locales.
- `scripts/` et `tests/` : gestion de la base et contrôles reproductibles.

Les anciennes adresses `.html` conservent leurs redirections. Les liens internes utilisent `next/link`. Les animations respectent la réduction des mouvements et la scène Three.js libère ses ressources à la navigation. Les détails des visuels figurent dans `docs/visuels.md`.

Avant une ouverture publique, renseigner et vérifier les informations réelles de l’association, ses conditions d’adoption, sa politique de conservation, son hébergeur, les annonces et les autorisations photo. Configurer et tester Meta, la collecte HelloAsso et une sauvegarde hors machine. Conserver HTTPS et un serveur Node actif sur un disque persistant.
