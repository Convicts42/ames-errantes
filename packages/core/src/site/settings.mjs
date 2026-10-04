import { getDatabase } from "../database.mjs";
import { defaultSettings, settingFields } from "../data/settings.js";
import { HttpError, record, text } from "./validation.mjs";
export async function getSettings(db = getDatabase()) {
  const row = (await db.query("SELECT * FROM settings WHERE id=1", [])).rows[0];
  return {
    ...defaultSettings,
    retentionDays: 365,
    purgeEnabled: false,
    whatsappTeam: "",
    whatsappTeamConsent: false,
    whatsappEnabled: false,
    ...(row ? row.content : {}),
    version: row?.version || 0,
  };
}
export async function saveSettings(input, db = getDatabase()) {
  record(input);
  const data = {};
  for (const [key, label, max] of settingFields)
    data[key] = text(input[key] ?? "", label, max, 0);
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    throw new HttpError(400, "E-mail invalide.");
  if (data.donationUrl) {
    let url;
    try {
      url = new URL(data.donationUrl);
    } catch {
      throw new HttpError(400, "Lien de collecte invalide.");
    }
    if (
      url.protocol !== "https:" ||
      !["www.helloasso.com", "helloasso.com"].includes(url.hostname) ||
      url.username ||
      url.password ||
      url.port
    )
      throw new HttpError(
        400,
        "Utilisez le lien HTTPS de la collecte sur helloasso.com.",
      );
  }
  if (
    !Number.isInteger(input.retentionDays) ||
    input.retentionDays < 30 ||
    input.retentionDays > 1095
  )
    throw new HttpError(400, "Conservation : entre 30 et 1 095 jours.");
  data.retentionDays = input.retentionDays;
  for (const key of [
    "purgeEnabled",
    "whatsappEnabled",
    "whatsappTeamConsent",
  ]) {
    if (typeof input[key] !== "boolean")
      throw new HttpError(400, "Réglage invalide.");
    data[key] = input[key];
  }
  data.whatsappTeam = text(input.whatsappTeam ?? "", "WhatsApp équipe", 20, 0);
  if (data.whatsappTeam && !/^\+[1-9]\d{7,14}$/.test(data.whatsappTeam))
    throw new HttpError(
      400,
      "Numéro international attendu, par exemple +33612345678.",
    );
  if (data.whatsappEnabled && (!data.whatsappTeam || !data.whatsappTeamConsent))
    throw new HttpError(
      400,
      "Indiquez le numéro de l’équipe et confirmez son accord.",
    );
  if (!Number.isInteger(input.version))
    throw new HttpError(400, "Version manquante.");
  if (input.version === 0) {
    const result = await db.query(
      "INSERT INTO settings(id,content) VALUES(1,$1) ON CONFLICT DO NOTHING",
      [JSON.stringify(data)],
    );
    if (!result.rowCount)
      throw new HttpError(
        409,
        "Les réglages ont changé. Rechargez cette page.",
      );
  } else if (
    !(
      await db.query(
        "UPDATE settings SET content=$1,version=version+1 WHERE id=1 AND version=$2",
        [JSON.stringify(data), input.version],
      )
    ).rowCount
  )
    throw new HttpError(409, "Les réglages ont changé. Rechargez cette page.");
  return await getSettings(db);
}
export async function publicSettings(db = getDatabase()) {
  const s = await getSettings(db);
  return {
    ...Object.fromEntries(settingFields.map(([key]) => [key, s[key]])),
    retentionDays: s.retentionDays,
    purgeEnabled: s.purgeEnabled,
  };
}
