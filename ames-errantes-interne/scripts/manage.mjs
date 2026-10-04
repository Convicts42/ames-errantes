// Compatibility entry point. There is no second database or Spaces import.
process.argv[2] = process.argv[2] === 'init' ? 'start' : process.argv[2];
await import('../../scripts/platform-cli.mjs');
