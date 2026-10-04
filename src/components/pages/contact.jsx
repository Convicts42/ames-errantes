import Link from "next/link";
import { ContactForm } from "../contact-form";
import { PracticalInfo } from "../practical-info";
import { publicSettings } from "../../server/settings.mjs";
import { whatsappAvailable } from "../../server/notifications.mjs";
export default async function PageContent() {
  return (
    <>
      <div className="page-intro shell">
        <div>
          <span className="eyebrow">{"LE DÉBUT D’UNE BELLE RENCONTRE"}</span>
          <h1>
            {"Et si on écrivait"}
            <br />
            <em>{"la suite ensemble ?"}</em>
          </h1>
        </div>
        <p className="intro-copy">
          {
            "Un projet d’adoption, une envie d’aider ou une question ? Quelques mots peuvent être le début d’une belle histoire."
          }
        </p>
      </div>
      <section className="contact-layout shell">
        <div className="contact-aside" data-reveal="">
          <div className="contact-photo">
            <img
              src="/assets/cat-portrait.webp"
              alt="Portrait illustratif d’un chat tigré et blanc près d’une fenêtre"
              width="1536"
              height="1024"
            />
          </div>
          <div className="contact-promise">
            <svg className="" aria-hidden="true">
              <use href="#heart" />
            </svg>
            <div>
              <h2>{"À votre rythme."}</h2>
              <p>
                {
                  "Parlez de ce qui compte pour vous. Il n’y a pas besoin d’avoir toutes les réponses pour commencer."
                }
              </p>
            </div>
          </div>
        </div>
        <ContactForm
          settings={await publicSettings()}
          whatsappEnabled={await whatsappAvailable()}
        />
      </section>
      <PracticalInfo />
    </>
  );
}
