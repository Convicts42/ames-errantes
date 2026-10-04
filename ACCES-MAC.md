# Travailler sur les documents depuis le Mac

## Ce qui est prêt

La Raspberry héberge les dossiers communs et un compte personnel réservé aux documents : `ames-documents`. Le connecteur IA et Codex sont installés. La connexion du Mac et l'authentification ChatGPT restent à faire lorsque le Mac sera disponible.

Utiliser le même réseau domestique que la Raspberry. Aucune ouverture Internet n'est nécessaire. Le compte ChatGPT de chaque personne reste personnel ; les dossiers sont partagés, pas les conversations ni les abonnements.

## 1. Vérifier l'application

Ouvrir l'application ChatGPT sur le Mac avec le compte de ta mère et rechercher **Paramètres → Connexions → SSH**. Si cette rubrique est absente, relever la version et le message affiché avant de changer d'abonnement.

La documentation annonce Codex dans Go, avec un déploiement progressif. Elle ne confirme pas clairement l'accès SSH pour chaque compte Go : il reste à le vérifier sur son Mac. Sources : [offres et disponibilité](https://learn.chatgpt.com/docs/pricing) et [connexions SSH](https://learn.chatgpt.com/docs/remote-connections).

## 2. Créer sa clé, une seule fois

Ouvrir Terminal sur le Mac et saisir :

```sh
mkdir -p ~/.ssh
chmod 700 ~/.ssh
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_ames -C ames-documents
```

Choisir une phrase de protection lorsque demandée. Si une clé existe déjà à ce nom, répondre **non** à l'écrasement et demander de l'aide.

Puis afficher sa partie publique :

```sh
cat ~/.ssh/id_ed25519_ames.pub
```

Transmettre cette unique ligne au responsable du projet ou à Codex dans la conversation de configuration. Elle commence par `ssh-ed25519`. Codex l'ajoutera à l'accès `ames-documents` de la Raspberry. Le fichier sans `.pub` reste exclusivement sur le Mac.

## 3. Ajouter sa connexion

Après l'ajout de la clé publique sur la Raspberry, renseigner dans l'application :

| Champ                     | Valeur                                     |
| ------------------------- | ------------------------------------------ |
| Nom de connexion          | Âmes errantes — documents                  |
| Hôte                      | 192.168.1.153                              |
| Port                      | 22                                         |
| Utilisateur               | ames-documents                             |
| Fichier d'identité        | /Users/SON_NOM_MAC/.ssh/id_ed25519_ames    |
| Dossier du projet distant | /home/ames-documents/projets/ames-errantes |

Remplacer `SON_NOM_MAC` par le nom de session du Mac. Dans Terminal, `echo "$HOME/.ssh/id_ed25519_ames"` affiche le chemin exact. Le fichier d'identité est la clé privée locale, sans `.pub` ; la sélectionner n'implique pas de l'envoyer au serveur.

Connecter Codex sur cette machine distante avec **son propre compte ChatGPT**, en suivant la connexion proposée par l'application. Si l'application ne la propose pas, le responsable peut guider la commande `codex login --device-auth` dans la session SSH de ce compte. Ne pas utiliser le compte `convicts` ni copier ses identifiants.

## 4. Vérifier ensemble

Dans une nouvelle conversation du projet distant, demander :

> Utilise le connecteur ames-errantes pour lister nos dossiers et les points à suivre. Ne modifie rien pour cette première vérification.

Comparer la liste avec l'[intranet](http://192.168.1.153:4174). Un projet connecté doit lire les données réelles ; si le connecteur n'apparaît pas, reconnecter la session et demander de l'aide avant de créer des copies.

## Au quotidien

- « Relis le dossier d'accueil et indique les questions encore ouvertes. »
- « Ajoute cette décision au dossier concerné et conserve les réserves. »
- « Compare le budget et l'organisation pour trouver les incohérences. »

L'IA lit la version courante avant chaque modification. L'historique conserve les changements ; une modification concurrente provoque un conflit à résoudre après relecture. Publier sur le site et modifier le logiciel restent réservés au responsable technique.

Le compte de l'intranet, si utilisé, est distinct du compte SSH et de ChatGPT : il devra également être personnel. La connexion ChatGPT n'ouvre pas automatiquement une session dans l'intranet.
