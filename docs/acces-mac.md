# Travailler sur les documents depuis le Mac

## Principe

La Raspberry héberge les dossiers communs. Sur le Mac, l'application **Claude Desktop**, ouverte avec le compte Claude personnel de ta mère, lance le connecteur `ames-errantes` à travers SSH. La clé SSH du Mac ne peut rien faire d'autre que lancer ce connecteur documentaire : pas de shell, pas de Docker, pas de publication.

Le Mac doit être sur le même réseau domestique que la Raspberry. Aucune ouverture Internet n'est nécessaire. Chaque personne garde son propre compte Claude : les dossiers sont partagés, pas les conversations ni les abonnements.

Plus simple, sans rien installer : l'intranet propose aussi un assistant Claude dans la page « Activité & Claude », accessible depuis n'importe quel navigateur du réseau, dès que le responsable technique a configuré la clé de l'API Claude. La suite de ce guide n'est utile que pour travailler depuis Claude Desktop.

## 1. Créer sa clé, une seule fois

Ouvrir Terminal sur le Mac et saisir :

```sh
mkdir -p ~/.ssh && chmod 700 ~/.ssh
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_ames -C ames-documents
ssh-add --apple-use-keychain ~/.ssh/id_ed25519_ames
```

Choisir une phrase de protection lorsque demandée ; la dernière commande la range dans le trousseau du Mac pour que Claude Desktop puisse utiliser la clé. Si une clé existe déjà à ce nom, répondre **non** à l'écrasement et demander de l'aide.

Afficher ensuite sa partie publique et la transmettre au responsable technique :

```sh
cat ~/.ssh/id_ed25519_ames.pub
```

Cette ligne commence par `ssh-ed25519`. Le fichier sans `.pub` reste exclusivement sur le Mac.

## 2. Autoriser la clé sur la Raspberry (responsable technique)

```sh
sudo bash deploy/raspberry/add-documents-key.sh "ssh-ed25519 AAAA… ames-documents"
```

La clé est enregistrée avec `restrict` et une commande imposée : elle lance uniquement `/usr/local/libexec/ames-documents-mcp`.

## 3. Déclarer la Raspberry dans SSH

Ajouter à la fin de `~/.ssh/config` sur le Mac (créer le fichier s'il n'existe pas) :

```
Host ames-documents
  HostName 192.168.1.153
  User ames-documents
  IdentityFile ~/.ssh/id_ed25519_ames
  IdentitiesOnly yes
  UseKeychain yes
  AddKeysToAgent yes
```

Puis vérifier une fois dans Terminal avec `ssh ames-documents` et accepter l'empreinte du serveur. La commande reste ouverte sans rien afficher : c'est le connecteur qui attend. Quitter avec `Ctrl+C`.

## 4. Connecter Claude Desktop

Dans Claude Desktop : **Réglages → Développeur → Modifier la configuration**, puis mettre dans `claude_desktop_config.json` :

```json
{
  "mcpServers": {
    "ames-errantes": {
      "command": "/usr/bin/ssh",
      "args": ["-T", "-o", "BatchMode=yes", "ames-documents"]
    }
  }
}
```

Quitter complètement puis rouvrir Claude Desktop. Le connecteur `ames-errantes` doit apparaître avec 9 outils.

Créer ensuite un projet Claude « Âmes errantes — documents » et coller dans ses instructions le contenu de [`deploy/raspberry/documents-instructions.md`](../deploy/raspberry/documents-instructions.md).

## 5. Vérifier ensemble

Dans une conversation du projet, demander :

> Utilise le connecteur ames-errantes pour lister nos dossiers et les points à suivre. Ne modifie rien pour cette première vérification.

Comparer la liste avec l'[intranet](http://192.168.1.153:4174). Si le connecteur n'apparaît pas, vérifier `ssh ames-documents` dans Terminal et demander de l'aide avant de créer des copies.

## Au quotidien

- « Relis le dossier d'accueil et indique les questions encore ouvertes. »
- « Ajoute cette décision au dossier concerné et conserve les réserves. »
- « Compare le budget et l'organisation pour trouver les incohérences. »

L'IA lit la version courante avant chaque modification. L'historique conserve les changements ; une modification concurrente provoque un conflit à résoudre après relecture. Publier sur le site et modifier le logiciel restent réservés au responsable technique.

Le compte de l'intranet, si utilisé, est distinct de la clé SSH et du compte Claude : il devra également être personnel.
