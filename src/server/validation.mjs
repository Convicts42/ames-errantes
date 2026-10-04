import {
  subjects,
  meetingOptions,
  animalStatuses,
  requestStatuses,
} from "../data/form-options.js";
import { pages } from "../data/pages.js";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function record(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new HttpError(400, "Données invalides.");
  return value;
}
export function text(value, label, max, min = 1) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)
  )
    throw new HttpError(400, `${label} : valeur invalide.`);
  return value.trim();
}
export function choice(value, options, label) {
  if (!options.includes(value))
    throw new HttpError(400, `${label} : choix invalide.`);
  return value;
}
function boolean(value, label) {
  if (typeof value !== "boolean")
    throw new HttpError(400, `${label} : valeur invalide.`);
  return value;
}
function list(value, label, count, length) {
  if (!Array.isArray(value) || !value.length || value.length > count)
    throw new HttpError(400, `${label} : liste invalide.`);
  return value.map((item) => text(item, label, length));
}
const reserved = new Set([
  ...pages
    .map((page) => page.slug)
    .filter((slug) => !["soleil", "plume"].includes(slug)),
  "admin",
  "api",
  "assets",
  "_next",
  "favicon",
  "robots",
  "sitemap",
  "confidentialite",
  "mentions-legales",
  "famille-accueil",
  "benevolat",
  "belles-histoires",
  "media",
]);
export function animalInput(input) {
  const data = record(input);
  const slug = text(data.slug, "Adresse", 80);
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(slug) || reserved.has(slug))
    throw new HttpError(400, "Adresse réservée ou invalide.");
  const image = text(data.image, "Image", 200);
  if (
    data.photos !== undefined &&
    (!Array.isArray(data.photos) || data.photos.length > 8)
  )
    throw new HttpError(400, "Huit photos maximum.");
  if (!validImagePath(image))
    throw new HttpError(400, "Utilisez une image locale dans /assets/.");
  return {
    slug,
    name: text(data.name, "Nom", 100),
    type: choice(data.type, ["Chien", "Chat"], "Espèce"),
    image,
    photos: (Array.isArray(data.photos) && data.photos.length <= 8
      ? data.photos
      : []
    ).map((url) => {
      if (!validImagePath(url)) throw new HttpError(400, "Photo invalide.");
      return url;
    }),
    size: text(data.size ?? "", "Gabarit", 200, 0),
    location: text(data.location ?? "", "Localisation approximative", 200, 0),
    health: text(data.health ?? "", "Santé et soins", 1500, 0),
    adoptionStory: text(
      data.adoptionStory ?? "",
      "Nouvelles après adoption",
      3000,
      0,
    ),
    storyConsent: data.storyConsent === true,
    alt: text(data.alt, "Description de l’image", 250),
    traits: list(data.traits, "Traits", 6, 60),
    description: text(data.description, "Description courte", 500),
    copy: text(data.copy, "Présentation du catalogue", 1000),
    lede: text(data.lede, "Introduction", 1000),
    story: text(data.story, "Histoire", 5000),
    needs: list(data.needs, "Besoins", 10, 500),
    home: text(data.home, "Foyer", 2000),
    questions: list(data.questions, "Questions", 10, 500),
    age: text(data.age, "Âge et sexe", 200),
    compatibility: text(data.compatibility, "Ententes", 500),
    children: text(data.children, "Enfants", 500),
    published: boolean(data.published, "Publication"),
    demo: boolean(data.demo, "Démonstration"),
    status: choice(data.status, Object.keys(animalStatuses), "Disponibilité"),
  };
}
export function requestInput(input) {
  const data = record(input);
  const kind = choice(data.kind, ["contact", "meeting"], "Type de demande");
  if (data.consent !== true)
    throw new HttpError(
      400,
      "Confirmez que ces informations peuvent être enregistrées pour traiter votre demande.",
    );
  const email = text(data.email, "Adresse e-mail", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new HttpError(400, "Adresse e-mail invalide.");
  const result = {
    kind,
    name: text(data.name, "Prénom", 100),
    email,
    consent: true,
    whatsappConsent: data.whatsappConsent === true,
    phone:
      data.whatsappConsent === true
        ? text(data.phone, "Numéro WhatsApp", 20)
        : "",
  };
  if (result.whatsappConsent && !/^\+[1-9]\d{7,14}$/.test(result.phone))
    throw new HttpError(
      400,
      "Indiquez un numéro WhatsApp international, par exemple +33612345678.",
    );
  if (kind === "contact") {
    result.subject = choice(data.subject, subjects, "Sujet");
    result.message = text(data.message, "Message", 5000);
    for (const key of ["location", "availability", "experience", "housing"])
      result[key] = text(data[key] ?? "", key, 1000, 0);
  } else {
    result.animal = text(data.animal, "Compagnon", 80);
    for (const [key, options] of Object.entries(meetingOptions))
      result[key] = choice(data[key], options, key);
    result.message = text(data.message ?? "", "Message", 3000, 0);
    result.summary = text(data.summary ?? "", "Récapitulatif", 8000, 0);
  }
  return result;
}
export function validImagePath(value) {
  return (
    typeof value === "string" &&
    (/^\/assets\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(webp|png|jpe?g)$/.test(
      value,
    ) ||
      /^\/media\/[a-f0-9-]{36}$/.test(value))
  );
}
export function requestStatus(value) {
  return choice(value, Object.keys(requestStatuses), "État");
}
