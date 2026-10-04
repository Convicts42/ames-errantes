import { getSettings, saveSettings } from "@ames/core/site/settings.mjs";
import {
  notificationState,
  retryNotification,
} from "@ames/core/site/notifications.mjs";
import {
  maintenanceState,
  createBackup,
} from "@ames/core/site/maintenance.mjs";
import {
  endpoint,
  json,
  body,
  requireAdmin,
} from "../../../../server/admin-http.js";
import { HttpError } from "@ames/core/site/validation.mjs";
import { consumeLimit } from "@ames/core/site/repository.mjs";
export const runtime = "nodejs";
const snapshot = async () => ({
  settings: await getSettings(),
  notifications: await notificationState(),
  maintenance: await maintenanceState(),
});
export const GET = endpoint(async (request) => {
  await requireAdmin(request);
  return json(await snapshot());
});
export const PUT = endpoint(async (request) => {
  await requireAdmin(request);
  await saveSettings(await body(request));
  return json(await snapshot());
});
export const POST = endpoint(async (request) => {
  await requireAdmin(request);
  const data = await body(request);
  if (data.action === "backup") {
    await consumeLimit("backup", 6, 3600000);
    await createBackup();
  } else if (data.action === "retry") await retryNotification(data.id);
  else throw new HttpError(400, "Action inconnue.");
  return json(await snapshot());
});
