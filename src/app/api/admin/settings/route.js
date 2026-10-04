import { getSettings, saveSettings } from "../../../../server/settings.mjs";
import {
  notificationState,
  retryNotification,
} from "../../../../server/notifications.mjs";
import {
  maintenanceState,
  createBackup,
} from "../../../../server/maintenance.mjs";
import { endpoint, json, body, requireAdmin } from "../../../../server/http";
import { HttpError } from "../../../../server/validation.mjs";
import { consumeLimit } from "../../../../server/repository.mjs";
export const runtime = "nodejs";
const snapshot = () => ({
  settings: getSettings(),
  notifications: notificationState(),
  maintenance: maintenanceState(),
});
export const GET = endpoint(async (request) => {
  requireAdmin(request);
  return json(snapshot());
});
export const PUT = endpoint(async (request) => {
  requireAdmin(request);
  saveSettings(await body(request));
  return json(snapshot());
});
export const POST = endpoint(async (request) => {
  requireAdmin(request);
  const data = await body(request);
  if (data.action === "backup") {
    consumeLimit("backup", 6, 3600000);
    await createBackup();
  } else if (data.action === "retry") retryNotification(data.id);
  else throw new HttpError(400, "Action inconnue.");
  return json(snapshot());
});
