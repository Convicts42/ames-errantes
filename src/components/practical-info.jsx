import { publicSettings } from "../server/settings.mjs";
export function PracticalInfo({ adoption = false }) {
  const s = publicSettings();
  const fields = adoption
    ? [
        ["area", "Où adopter ?"],
        ["fees", "Participation aux frais"],
        ["conditions", "Conditions d’adoption"],
        ["documents", "Documents et préparation"],
        ["responseTime", "Délai de réponse"],
      ]
    : [
        ["legalName", "L’association"],
        ["area", "Notre secteur"],
        ["hours", "Nous rencontrer"],
        ["phone", "Téléphone"],
        ["email", "E-mail"],
        ["responseTime", "Délai de réponse"],
      ];
  return (
    <section className="practical-info shell">
      <span className="eyebrow">LES REPÈRES UTILES</span>
      <h2>
        {adoption ? "Une adoption, en confiance." : "Restons en contact."}
      </h2>
      <dl>
        {fields.map(([key, label]) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd>{s[key] || "Information à confirmer auprès de l’équipe."}</dd>
          </div>
        ))}
      </dl>
      {adoption && (
        <>
          <h3>Le temps de bien préparer la rencontre</h3>
          <p>
            Pour un chien ou un chat, prévoyez un certificat d’engagement et de
            connaissance signé. Il ne devient valable que sept jours après sa
            délivrance. L’équipe vous précisera les documents et les modalités
            avant toute adoption.
          </p>
          <a
            className="text-link"
            href="https://www.service-public.gouv.fr/particuliers/vosdroits/F34877"
            target="_blank"
            rel="noreferrer"
          >
            Consulter les règles sur Service Public ↗
          </a>
          <p>
            Une demande ne réserve pas un animal. Après votre message viennent
            l’échange avec l’équipe, la rencontre, la décision et la préparation
            du départ. Un suivi peut ensuite être organisé avec vous.
          </p>
        </>
      )}
    </section>
  );
}
