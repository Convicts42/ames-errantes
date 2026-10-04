import Link from "next/link";
export function PrivacyNote({ settings }) {
  return (
    <p className="form-note">
      {settings?.legalName || "L’équipe du site"} utilise vos coordonnées et vos
      réponses pour traiter votre demande. Les champs obligatoires sont
      nécessaires pour vous répondre.{" "}
      {settings?.purgeEnabled
        ? `Les dossiers clôturés sont supprimés de la base active après ${settings.retentionDays} jours.`
        : "La durée de conservation doit encore être confirmée par l’association avant l’ouverture publique."}{" "}
      Vous pouvez demander l’accès, la rectification ou l’effacement de vos
      données.{" "}
      <Link href="/confidentialite" className="text-link">
        Données personnelles et contact
      </Link>
      .
    </p>
  );
}
