// Compatibility entry point. PostgreSQL is managed by the root Compose project.
const action = process.argv[2];
if (action === 'admin') throw new Error('Créer les comptes dans « Mon compte » de l’espace interne.');
process.argv[2] = action === 'init' ? 'start' : action;
await import('../../scripts/platform-cli.mjs');
