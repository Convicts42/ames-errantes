# Âmes errantes — notre espace de travail

Application privée, installée à côté du site public dans `D:\site\ames-errantes-interne`.
Elle réunit les 15 documents repris de Spaces, les points à suivre et les comptes de l’équipe.
Les nouvelles modifications sont enregistrées ici ; il n’y a pas de synchronisation vers Spaces.

## Utilisation

1. Double-cliquer sur **Demarrer.cmd**. L’application s’ouvre dans le navigateur.
2. Au premier accès seulement, utiliser le code contenu dans **data/acces-initial.txt**, puis choisir son identifiant et son mot de passe (12 caractères minimum).
3. Dans **Mon compte & l’équipe**, choisir **Créer le compte d’un proche** pour ajouter le compte de votre mère. Elle pourra consulter, créer et modifier tous les documents et les points à suivre, puis changer son mot de passe.

Sur ce PC : **http://localhost:4174**. Sur un autre appareil du même réseau, utiliser l’adresse inscrite dans **data/adresses.txt**, recalculée au démarrage. L’adresse peut changer si le routeur réattribue une adresse au PC.

Le PC doit rester allumé et sans mise en veille. Le téléphone doit utiliser le Wi-Fi de la maison. Si Windows demande une autorisation réseau, l’accès est destiné au réseau privé. Ne pas ouvrir de port sur la box : cette installation HTTP est prévue pour votre réseau local de confiance, pas pour Internet. Un passage à Internet nécessiterait notamment HTTPS et une configuration dédiée.

**Arreter.cmd** arrête uniquement le serveur identifié comme celui de cette application. Fermer le navigateur laisse le serveur fonctionner. Aucun démarrage automatique de Windows n’est ajouté.

### Accès depuis le Wi-Fi : réglage Windows appliqué

Le 4 octobre 2026, avec l’accord explicite de l’utilisateur, la connexion domestique **Ethernet** a été classée **Privée**. Une autorisation entrante **TCP 4174** a été créée pour le programme de l’application, uniquement sur cette interface et depuis **LocalSubnet**. L’application répond à son adresse réseau depuis le PC ; le parcours depuis un téléphone physique reste à essayer. Les anciennes règles Node du profil public étaient des autorisations, conservées sans modification.

Le fichier **Activer-Wifi.cmd** permet de réappliquer ce réglage. À utiliser uniquement sur le réseau de la maison : il demande les droits administrateur Windows. Le changement de profil peut aussi activer d’autres règles Windows déjà définies pour les réseaux privés. Aucun port de la box n’est ouvert. Le lanceur retient le chemin réel de Node dans `data/node-path.txt` pour conserver le même programme entre les démarrages.

## Les fonctions

- Dossiers par thème, recherche dans les titres et les textes, liens entre documents et sources externes.
- Éditeur avec titres, listes, liens et tableaux ; bouton **Enregistrer** explicite.
- Historique complet, consultation et restauration d’une ancienne version.
- Brouillon conservé dans l’onglet du navigateur après un rechargement ou une navigation ; les brouillons ne sont pas partagés et sont supprimés à la déconnexion explicite.
- Si un autre membre enregistre le même document, l’application bloque l’écrasement, conserve le brouillon et permet de consulter la version enregistrée ou de télécharger le brouillon.
- Points à suivre avec responsable, document lié et états « À examiner », « En cours », « Terminé », « En suspens ».
- Export des documents, de leurs versions et des points à suivre depuis **Mon compte**.

Le rôle « responsable de l’espace » est un rôle informatique ; il ne détermine pas la présidence ou la trésorerie de l’association. Les brouillons, les archives et les réserves de l’audit sont conservés. Une étiquette « Document de référence » ne constitue pas une validation juridique ou financière.

## Données et sauvegardes

Les fichiers **data/** sont privés et exclus de Git et du dossier public. Ne pas placer ce dossier dans l’hébergement du site public.

- `data/projet.sqlite` : documents, versions, points à suivre et comptes (mots de passe hachés).
- `data/import-spaces.json` : copie d’origine des 15 documents, conservée sans modification ; les liens Spaces ont été transformés en liens internes lors de l’import.
- `data/backups/` : une copie SQLite automatique au premier accès connecté de la journée UTC ; 14 copies automatiques conservées. Les sauvegardes manuelles sont conservées séparément.
- `data/acces-initial.txt` : code à usage unique, valable sept jours. À supprimer après la création du premier compte.

Les sauvegardes locales ne protègent pas d’une panne du disque. Copier régulièrement une sauvegarde **data/backups/\*.sqlite** sur un autre support. L’export JSON de l’application est lisible et contient les textes et leurs versions, mais pas les comptes, sessions ou mots de passe.

Pour créer une sauvegarde complète à la demande : `pnpm db:backup`. Pour une restauration, arrêter l’application, conserver une copie de l’ensemble du dossier `data`, puis remplacer `projet.sqlite` par la sauvegarde choisie ; déplacer aussi les éventuels `projet.sqlite-wal` et `projet.sqlite-shm` avec l’ancienne base avant de relancer. Une restauration de la base restaure les comptes et sessions enregistrés à cette date.

## Installation et maintenance technique

Node.js **24 ou plus récent**, pnpm **11.25.0**. Les lanceurs Windows recherchent Node dans le PATH puis dans le runtime local de Codex. Les scripts ne téléchargent rien au démarrage.

```powershell
pnpm install --frozen-lockfile
# Placer la copie privée data/import-spaces.json avant l’initialisation.
pnpm db:init
pnpm build
pnpm start:lan
```

L’import est idempotent : un document déjà présent n’est jamais remplacé. Si aucun compte n’existe encore, `pnpm db:init` régénère le code initial ; après création du premier compte, ce parcours est fermé. Aucun mot de passe de démonstration n’est présent dans la base réelle.

Pour le démarrage HTTP local en mode production, `.env.local` contient `COOKIE_SECURE=false`. Après une modification du code, arrêter le serveur, reconstruire avec `pnpm build`, puis relancer. Le site public voisin utilise son propre dossier, sa propre base et son propre port.

### Vérifications

```powershell
pnpm test:unit
pnpm build
pnpm test
```

Les tests navigateur utilisent Chrome installé et une base isolée sous `data/test-runs`, sur le port 4184. Ils ne créent aucun compte dans la base réelle. Pour un autre navigateur Playwright installé, renseigner `PLAYWRIGHT_CHANNEL`.

Stack : Next.js / React, SQLite intégré à Node, Tiptap, `sanitize-html`. API privée contrôlée côté serveur ; cookies HttpOnly/SameSite=Strict, sessions de huit heures, contrôle Origin pour les écritures, limitation des connexions, HTML filtré, contrôle de version pour les modifications concurrentes. Polices locales : DM Sans et Cormorant Garamond (licences OFL dans `public/fonts`).
