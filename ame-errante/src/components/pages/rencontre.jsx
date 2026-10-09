import Link from "next/link";
import { MeetingForm } from "../meeting-form";
import { listAnimals } from "@ames/core/site/repository.mjs";
import { publicSettings } from "@ames/core/site/settings.mjs";
import { whatsappAvailable } from "@ames/core/site/notifications.mjs";
export default async function PageContent() {
  return (
    <>
      <div className="page-intro shell">
        <div>
          <span className="eyebrow">{"UN PREMIER PAS, À VOTRE RYTHME"}</span>
          <h1>
            {"Faisons une place"}
            <br />
            <em>{"à cette rencontre."}</em>
          </h1>
        </div>
        <p className="intro-copy">
          {
            "Quelques questions simples pour imaginer votre quotidien ensemble. Prenez le temps ; il ne s’agit pas d’une réservation."
          }
        </p>
      </div>

      <MeetingForm
        animals={await listAnimals({
          available: true,
        })}
        settings={await publicSettings()}
        whatsappEnabled={await whatsappAvailable()}
      />
    </>
  );
}
