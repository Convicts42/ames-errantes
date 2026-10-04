import Link from "next/link";

import { MeetingForm } from "../meeting-form";
import { listAnimals } from "../../server/repository.mjs";

export default function PageContent() {
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

      <MeetingForm animals={listAnimals({ available: true })} />
    </>
  );
}
