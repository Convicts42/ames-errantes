# Vérification de la plateforme

Depuis `D:\site`, avec Docker Desktop démarré et l’image reconstruite :

```powershell
node scripts/platform-cli.mjs test
node scripts/run-browser-tests.mjs
```

La première commande lance 10 tests PostgreSQL, chacun dans une base temporaire `ames_test_*`. L’export privé de migration est utilisé pour vérifier la reprise réelle des dossiers. Aucune écriture de test ne vise la base du projet.

La deuxième crée une base QA et deux conteneurs éphémères sur les ports locaux 4473/4474, puis vérifie les interfaces avec Chrome : comptes partagés, réglages, demandes, édition par MCP, conflits, publication/retrait, mobile, import de photos et pages publiques. Elle supprime ses conteneurs et sa base à la fin. Elle refuse de remplacer un conteneur QA déjà présent. Les captures restent dans `data/qa`.

Les scripts `browser-check.mjs`, `admin-check.mjs` et `media-check.mjs` seuls supposent cette infrastructure QA déjà démarrée. Les identifiants de test ne sont créés que dans sa base temporaire. Ils vérifient aussi les anciennes routes publiques fermées avec et sans session, l’édition des animaux dans l’intranet, les permissions des deux rôles, le changement de mot de passe et la confidentialité des photos.

`public-check.mjs` peut être lancé seul pour parcourir les pages publiques en lecture seule. `services/mcp/verify-local.mjs` vérifie la connexion réelle enregistrée dans Codex sans écrire de documents.

`live-check.mjs` est une vérification ponctuelle de la migration initiale : elle compare les données avec l’export privé, contrôle les comptes et ferme sa session. Ses nombres attendus correspondent au 4 octobre 2026 ; ne pas l’utiliser après des modifications métier comme test de non-régression.

## Cible Raspberry

La production est sur 192.168.1.153. `node scripts/raspberry.mjs deploy` enchaîne construction, tests PostgreSQL isolés, parcours Chrome QA et construction ARM64 avant transfert. Ne pas relancer les applications de production locales.

`node services/mcp/verify-raspberry.mjs` contrôle la connexion Codex par SSH en lecture seule. Le script historique `verify-local.mjs` concerne seulement l’ancienne installation Docker Desktop et ne représente plus la connexion active.

`node tests/raspberry-check.mjs` vérifie la vraie interface distante en lecture seule avec le compte conservé. Il attend les nombres du jour de migration ; adapter ces attentes après une évolution volontaire des dossiers. Les captures sont dans `data/qa/raspberry`.
