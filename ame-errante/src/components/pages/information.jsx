import Link from "next/link";
import { publicSettings } from "@ames/core/site/settings.mjs";
import { whatsappAvailable } from "@ames/core/site/notifications.mjs";
import { listAnimals } from "@ames/core/site/repository.mjs";
import { ContactForm } from "../contact-form";
import { PracticalInfo } from "../practical-info";
export async function LegalPage() {
  const s = await publicSettings();
  return (
    <article className="reading-page shell">
      <span className="eyebrow">TRANSPARENCE</span>
      <h1>Mentions légales</h1>
      {(!s.legalName || !s.address || !s.publisher || !s.host) && (
        <p className="notice">
          Les informations légales de l’association sont en cours de
          renseignement. Le site reste une version de préparation.
        </p>
      )}
      <dl>
        {[
          ["legalName", "Éditeur"],
          ["registration", "Identification de l’association"],
          ["address", "Siège"],
          ["email", "Contact"],
          ["phone", "Téléphone"],
          ["publisher", "Responsable de publication"],
          ["host", "Hébergement"],
        ].map(([key, label]) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd>{s[key] || "Non renseigné"}</dd>
          </div>
        ))}
      </dl>
      <h2>Photos et contenus</h2>
      <p>
        Les fiches signalées comme exemples présentent des personnages fictifs
        et des illustrations générées. Les autres photos et nouvelles sont
        publiées par l’équipe sous sa responsabilité et avec les autorisations
        nécessaires.
      </p>
      <Link className="text-link" href="/confidentialite">
        Protection de vos données
      </Link>
    </article>
  );
}
export async function PrivacyPage() {
  const s = await publicSettings();
  return (
    <article className="reading-page shell">
      <span className="eyebrow">VOS DONNÉES</span>
      <h1>Une demande en confiance.</h1>
      <h2>Qui traite vos données ?</h2>
      <p>
        {s.legalName ||
          "L’identité du responsable du traitement reste à renseigner par l’association."}{" "}
        {s.address}
      </p>
      <h2>Pourquoi ces informations ?</h2>
      <p>
        Votre prénom, votre e-mail et les réponses que vous choisissez de
        transmettre servent uniquement à examiner votre projet et à vous
        répondre. L’équipe peut ajouter des notes utiles et organiser une
        rencontre ou un suivi. Les champs obligatoires permettent de traiter la
        demande ; vous pouvez laisser les autres vides. L’enregistrement repose
        sur votre accord demandé dans le formulaire.
      </p>
      <h2>Qui peut les consulter ?</h2>
      <p>
        Les personnes autorisées de l’association, dans l’administration
        protégée, et les prestataires techniques nécessaires au fonctionnement
        du site. Les dossiers et les notes ne sont pas publics.
      </p>
      <h2>WhatsApp, seulement si vous le souhaitez</h2>
      <p>
        Si vous choisissez l’accusé de réception WhatsApp, votre numéro et la
        référence du dossier sont transmis à Meta via WhatsApp Business
        Platform. Le contenu de votre demande, votre nom et votre e-mail ne sont
        pas transmis. L’équipe peut également recevoir une alerte contenant
        uniquement la référence. L’utilisation de ce service peut impliquer des
        traitements hors de l’Union européenne selon les conditions de Meta ;
        ses garanties doivent être vérifiées lors de la mise en service. Vous
        pouvez retirer votre accord auprès de l’équipe ou répondre STOP.
      </p>
      <a
        href="https://www.whatsapp.com/legal/privacy-policy"
        className="text-link"
      >
        Politique de confidentialité WhatsApp
      </a>
      <h2>Combien de temps ?</h2>
      <p>
        {s.purgeEnabled
          ? `Les dossiers restent accessibles pendant leur traitement, puis sont supprimés automatiquement de la base active ${s.retentionDays} jours après clôture.`
          : "La politique de conservation est en cours de configuration. La suppression automatique n’est pas encore activée ; cette configuration doit être finalisée avant de recevoir de vraies demandes."}{" "}
        Les sauvegardes automatiques quotidiennes sont renouvelées sur 14
        exemplaires ; les archives manuelles doivent être gérées séparément. Une
        demande de suppression sera aussi prise en compte en cas de restauration
        d’une sauvegarde.
      </p>
      <h2>Vos droits et votre contact</h2>
      <p>
        Vous pouvez demander l’accès, la rectification, l’effacement de vos
        données, la limitation du traitement ou le retrait de votre accord.
        Indiquez la référence de votre demande pour faciliter sa recherche.
      </p>
      {s.email ? (
        <a className="text-link" href={`mailto:${s.email}`}>
          {s.email}
        </a>
      ) : (
        <Link
          className="text-link"
          href="/contact?subject=Une%20autre%20question"
        >
          Contacter l’équipe
        </Link>
      )}
      <p>
        Vous pouvez également adresser une réclamation à la{" "}
        <a href="https://www.cnil.fr/fr/plaintes" className="text-link">
          CNIL
        </a>
        .
      </p>
      <h2>Cookies</h2>
      <p>
        La connexion à l’espace interne de l’équipe utilise un cookie de
        session, valable au maximum huit heures. Le site public ne donne aucun
        accès à l’administration. Aucun outil de publicité ou de mesure
        d’audience n’est installé par le site.
      </p>
    </article>
  );
}
async function HelpPage({ foster }) {
  const subject = foster ? "Devenir famille d’accueil" : "Devenir bénévole";
  return (
    <>
      <div className="page-intro shell">
        <div>
          <span className="eyebrow">UNE PLACE DANS L’ÉQUIPE</span>
          <h1>
            {foster
              ? "Un foyer, le temps de se poser."
              : "Votre temps peut changer une vie."}
          </h1>
        </div>
        <p className="intro-copy">
          {foster
            ? "Accueillir temporairement un animal, c’est lui offrir des repères en attendant son adoption. Échangeons sur votre logement, votre disponibilité et l’accompagnement nécessaire."
            : "Transport, aide aux soins, événements, communication : dites-nous ce que vous aimez faire et le temps que vous pouvez offrir."}
        </p>
      </div>
      <section className="contact-layout shell">
        <div>
          <h2>Comment cela se passe ?</h2>
          <ol>
            <li>Présentez votre disponibilité et vos envies.</li>
            <li>
              L’équipe échange avec vous sur les missions ou l’accueil possible.
            </li>
            <li>
              Les modalités, l’accompagnement et les frais éventuels sont
              précisés avant votre engagement.
            </li>
          </ol>
          <p>Aucun engagement n’est pris en envoyant ce formulaire.</p>
        </div>
        <ContactForm
          initialSubject={subject}
          purpose={foster ? "foster" : "volunteer"}
          settings={await publicSettings()}
          whatsappEnabled={await whatsappAvailable()}
        />
      </section>
      <PracticalInfo />
    </>
  );
}
export const FosterPage = () => <HelpPage foster />;
export const VolunteerPage = () => <HelpPage />;
export async function StoriesPage() {
  const animals = (await listAnimals()).filter(
    (a) =>
      a.status === "adopted" && a.storyConsent && a.adoptionStory && !a.demo,
  );
  return (
    <section className="reading-page shell">
      <span className="eyebrow">LA SUITE DE LEUR HISTOIRE</span>
      <h1>Une nouvelle vie.</h1>
      <p>Des nouvelles partagées avec l’accord des familles.</p>
      {!animals.length && (
        <p className="notice">
          Les premières nouvelles seront publiées ici lorsque les familles
          souhaiteront les partager.
        </p>
      )}
      <div className="stories-grid">
        {animals.map((a) => (
          <article key={a.slug}>
            <img
              src={a.image}
              alt={a.alt}
              width={600}
              height={400}
              loading="lazy"
            />
            <h2>{a.name}</h2>
            <p className="preserve-lines">{a.adoptionStory}</p>
            <Link href={`/${a.slug}`} className="text-link">
              Lire son histoire
            </Link>
          </article>
        ))}
      </div>
      <Link href="/animaux" className="button">
        Rencontrer nos compagnons
      </Link>
    </section>
  );
}
