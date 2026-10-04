# Âme Errante

Site en français de démonstration pour une association de protection animale, migré vers **Next.js 16.3.8**, **React 19.3.0** et l’**App Router**. L’interface, les 12 pages, les photographies, les polices locales et les parcours existants sont conservés.

## Démarrer

Prérequis : Node.js 20.9 ou plus récent et pnpm 11.25.0. La migration a été vérifiée avec Node.js 24.19.0.

```powershell
cd D:\site\ame-errante
pnpm install --frozen-lockfile
pnpm dev
```

Ouvrir http://127.0.0.1:4173. Le serveur de développement actualise les pages après modification des sources.

Pour un autre appareil du même réseau, utiliser `pnpm dev:lan`, puis `http://<IPv4-de-ce-PC>:4173`. Le PC doit rester allumé et le pare-feu doit autoriser Node.js sur le réseau privé. L’adresse IPv4 est disponible dans `ipconfig`.

## Production

```powershell
pnpm build
pnpm start
```

`pnpm start:lan` expose la version de production sur le réseau local. Les scripts peuvent aussi être lancés avec `npm run` après installation des dépendances ; le fichier de verrouillage de référence reste `pnpm-lock.yaml`.

Les pages sont préconstruites par Next.js. L’hébergement doit prendre en charge Next.js/Node.js, par exemple Vercel ou un serveur Node. Le dossier `.next` n’est pas un site statique autonome. Aucun déploiement n’a été effectué.

## Structure

- `src/app/` : routes, métadonnées françaises, icône et page 404.
- `src/components/pages/` : contenu JSX de chacune des 12 pages.
- `src/components/` : navigation, dialogues, catalogue, formulaires et scène Three.js.
- `src/data/` : métadonnées des pages et informations des compagnons de démonstration.
- `src/styles/` : styles communs et styles des profils, formatés pour leur maintenance.
- `public/assets/` : images et polices locales, avec leurs licences.
- `tests/` : parcours navigateur de non-régression.
- `legacy/` : ancienne version statique et ses scripts, conservés pour référence ; elle n’est pas utilisée par Next.js.
- `backup-before-refonte/` : sauvegarde antérieure, conservée.

Les pages de contenu sont des composants serveur. Les composants interactifs utilisent React côté navigateur. Les liens internes utilisent `next/link`. Les adresses sont `/`, `/association`, `/animaux`, `/adopter`, `/nous-aider`, `/blog`, `/contact`, `/soleil`, `/plume`, `/rencontre`, `/nouveau-foyer` et `/avant-adoption`.

Les 12 anciennes adresses `.html` redirigent en 308 vers les nouvelles pages, en conservant les paramètres de requête. Les anciens liens de sections de l’accueil, comme `/#mission`, restent pris en charge côté navigateur.

## Fonctionnalités préservées

- Catalogue filtrable et profils fictifs de Soleil et Plume, avec portrait agrandissable.
- Parcours de rencontre en trois étapes, validation, présélection du compagnon, réponses modifiables et récapitulatif éditable à copier.
- Contact avec sujet présélectionné, préparation d’un message et copie avec sélection de secours.
- Navigation mobile, fil d’Ariane, dialogues accessibles au clavier et FAQ.
- Scène Three.js chargée à la demande sur l’accueil, avec photographie de secours si WebGL échoue.
- Animation plafonnée à 30 images par seconde, mise en pause hors écran et dans un onglet masqué, respect de la réduction des animations et libération des ressources lors des changements de page.

Les formulaires ne transmettent rien à un serveur et ne stockent pas les réponses. Le bouton de don explique que la collecte n’est pas encore ouverte. Les profils sont explicitement fictifs ; les détails des illustrations figurent dans `docs/visuels.md`.

## Vérifier

Après `pnpm build` :

```powershell
pnpm check
pnpm test
```

`pnpm check` inspecte les HTML réellement produits par Next.js : 12 pages, titres, descriptions, régions principales, identifiants, navigation, ancres, liens et ressources locales.

`pnpm test` démarre automatiquement un serveur de production sur le port 4183 et utilise Google Chrome installé sur le PC. Le port 4183 doit être libre. Pour un autre navigateur compatible installé, définir `PLAYWRIGHT_CHANNEL`, par exemple `msedge`. Les captures et traces éventuelles sont dans `test-results/`, ignoré par Git. Les copies de messages sont simulées dans le navigateur de test pour préserver le presse-papiers réel.

Validation de la migration : compilation de production réussie, 12 pages et 146 références locales vérifiées, 6 tests navigateur réussis. Les parcours couvrent les redirections et paramètres, la page 404, la navigation React sans rechargement, les filtres, les dialogues, les formulaires, la conservation puis l’effacement des réponses, la FAQ, le menu mobile, l’absence de débordement à 320 px sur toutes les pages, la réduction des animations et le démontage/remontage de la scène Three.js. La scène était active dans Chrome. L’accueil sur ordinateur et le parcours de rencontre sur mobile ont aussi été inspectés visuellement.

Aucun test sur téléphone physique ni score Lighthouse n’est revendiqué.

Contrôle complémentaire après correction de l’hydratation : les 7 tests passent en développement sur le réseau local et en production. Les animations d’apparition utilisent Web Animations sans modifier les attributs HTML attendus par React. Un test vérifie cette stabilité ainsi que la réduction des animations.

Pour tester un serveur déjà lancé, définir `PLAYWRIGHT_BASE_URL` avant `pnpm test`, par exemple `$env:PLAYWRIGHT_BASE_URL='http://192.168.1.7:4173'` sous PowerShell. Supprimer cette variable avec `Remove-Item Env:PLAYWRIGHT_BASE_URL` pour revenir au serveur de test automatique.

## Avant une ouverture au public

Renseigner les informations réelles de l’association et les mentions légales, remplacer les profils fictifs, puis connecter les envois de messages et la collecte de dons. Ces connexions ne font pas partie de cette migration.
