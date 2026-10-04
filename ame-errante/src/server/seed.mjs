import { companions } from "../data/companions.js";

const details = {
  soleil: {
    traits: ["Curieux", "Joueur", "Sociable"],
    lede: "Le bonheur des balades, une balle à retrouver et une place tout près de vous.",
    story:
      "Dans cette histoire imaginée, Soleil est le compagnon des petits départs : une promenade qui devient une aventure, un jeu dans le jardin, puis un moment tranquille à vos côtés. On imagine un chien qui aime partager, autant les activités que les pauses.",
    needs: [
      "Des sorties et des jeux chaque jour.",
      "Des repères réguliers et du temps partagé.",
      "Une organisation pour les moments de solitude.",
    ],
    home: "Un foyer qui aime sortir, jouer et garder du temps pour les moments calmes. Le rythme de toute la famille doit pouvoir lui faire une place.",
    questions: [
      "Quel est son rythme de promenade habituel ?",
      "Comment vit-il les absences ?",
      "Quelles rencontres prévoir avec les animaux du foyer ?",
    ],
  },
  plume: {
    traits: ["Paisible", "Observateur", "Tout en douceur"],
    lede: "Un rayon de soleil, un coin de fenêtre et le plaisir de venir vers vous, à son rythme.",
    story:
      "Dans cette histoire imaginée, Plume préfère les liens qui se construisent doucement. Un regard depuis sa fenêtre, un jeu qui éveille sa curiosité, une présence qui devient familière. On imagine un chat observateur, à qui l’on laisse le choix du contact.",
    needs: [
      "Un espace calme où se retirer.",
      "Des jeux et des endroits à explorer.",
      "Du temps pour laisser la confiance s’installer.",
    ],
    home: "Un foyer qui respecte ses temps de repos et lui laisse découvrir les lieux sans le presser. Des cachettes, des jeux et une présence attentive à imaginer ensemble.",
    questions: [
      "Quels jeux et cachettes lui sont familiers ?",
      "Quel environnement connaît-il aujourd’hui ?",
      "Comment préparer son arrivée avec les animaux du foyer ?",
    ],
  },
};

export const seedAnimals = Object.entries(companions).map(([slug, animal]) => ({
  ...animal,
  ...details[slug],
  slug,
  image: `/assets/${animal.image}-portrait.webp`,
  age: "À renseigner",
  compatibility: "À confirmer",
  children: "À échanger",
  demo: true,
  published: true,
  status: "available",
}));
