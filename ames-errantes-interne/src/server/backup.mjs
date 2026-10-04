// The Compose worker backs up the shared PostgreSQL database for both apps.
export { createBackup as backupDatabase } from "@ames/core/site/maintenance.mjs";
export async function maybeBackup() {}
