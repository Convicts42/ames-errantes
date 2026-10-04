import Link from "next/link";
import { Dialog } from "./dialog";
export function DonationDialog() {
  return (
    <Dialog id="don" labelledBy="don-title">
      <div className="dialog-emblem">
        <svg className="" aria-hidden="true">
          <use href="#heart" />
        </svg>
      </div>
      <span className="eyebrow">{"UN GESTE QUI COMPTE"}</span>
      <h2 id="don-title">
        {"Une petite aide."}
        <br />
        {"Une grande différence."}
      </h2>
      <p>
        {
          "Votre soutien peut contribuer à l’accueil, à l’alimentation et aux soins des animaux."
        }
      </p>
      <div className="notice">
        {
          "La collecte n’est pas encore ouverte. Le lien de paiement de l’association doit être ajouté avant de pouvoir recevoir un don."
        }
      </div>
      <Link className="button" href="/nous-aider">
        {"Les autres façons d’aider"}
      </Link>
    </Dialog>
  );
}
