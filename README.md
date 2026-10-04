# Site public Âmes errantes

Cette interface fait partie de la plateforme commune située dans le dossier parent.
Consulter [le guide commun](../README.md) pour démarrer Docker, se connecter, sauvegarder et utiliser Codex.

Les animaux, photos publiées, demandes et réglages utilisent la même base PostgreSQL que l’intranet.
Toute l’administration et la gestion des comptes sont dans l’intranet. Ce site ne propose plus `/admin` ni `/api/admin/*` et n’utilise pas la session d’équipe pour donner accès à des contenus privés.
Les pages publiques `/projet` montrent uniquement les versions explicitement publiées depuis les dossiers privés.
Le code métier commun est dans `../packages/core` ; les anciens fichiers SQLite sont des archives.
