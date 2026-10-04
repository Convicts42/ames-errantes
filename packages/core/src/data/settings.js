export const settingFields = [
  ["legalName", "Nom légal de l’association", 200],
  ["registration", "Numéro RNA / SIREN", 100],
  ["address", "Adresse du siège", 500],
  ["email", "E-mail de contact et de confidentialité", 254],
  ["phone", "Téléphone public", 40],
  ["area", "Zone géographique d’intervention", 500],
  ["hours", "Horaires et modalités de visite", 500],
  ["responseTime", "Délai habituel de réponse", 250],
  ["fees", "Frais d’adoption et prestations comprises", 2000],
  ["conditions", "Conditions d’adoption", 3000],
  ["documents", "Documents demandés et déroulement", 2000],
  ["publisher", "Responsable de publication", 200],
  ["host", "Hébergeur : nom, adresse et contact", 1000],
  ["donationUrl", "Lien de collecte HelloAsso", 500],
];
export const defaultSettings = Object.fromEntries(
  settingFields.map(([key]) => [key, ""]),
);
export const workflowStages = {
  received: "Demande reçue",
  conversation: "Premier échange",
  meeting: "Rencontre prévue",
  decision: "Décision",
  adopted: "Adoption réalisée",
  followup: "Suivi après adoption",
  declined: "Projet non retenu",
};
