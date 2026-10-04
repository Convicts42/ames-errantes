import Link from "next/link";
import { Catalog } from "../catalog";
import { listAnimals } from "../../server/repository.mjs";
export default async function PageContent() {
  return (
    <>
      <div className="page-intro shell">
        <div>
          <span className="eyebrow">
            {"UN COMPAGNON, UNE NOUVELLE HISTOIRE"}
          </span>
          <h1>
            {"Et si votre histoire"}
            <br />
            <em>{"commençait ici ?"}</em>
          </h1>
        </div>
        <p className="intro-copy">
          {
            "Derrière chaque regard, il y a une personnalité à découvrir. Prenez le temps de faire connaissance."
          }
        </p>
      </div>
      <Catalog animals={await listAnimals()} />
      <aside className="closing-cta shell" data-reveal="">
        <div>
          <h2>{"Le coup de cœur, et après ?"}</h2>
          <p>
            {
              "Découvrez les étapes pour préparer une rencontre et accueillir un compagnon."
            }
          </p>
        </div>
        <Link className="button" href="/adopter">
          {"Comprendre l’adoption"}
        </Link>
      </aside>
    </>
  );
}
