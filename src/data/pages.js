export const pages = [
  {
    slug: "index",
    label: "Accueil",
    title: "Chaque âme mérite un foyer",
    description:
      "Âme Errante, une association de protection animale. Des rencontres, de la douceur et une seconde chance.",
  },
  {
    slug: "association",
    label: "Qui sommes-nous",
    title: "Notre association",
    description:
      "Protéger, accompagner et réunir : découvrez la mission et les valeurs d’Âme Errante.",
  },
  {
    slug: "animaux",
    label: "Nos animaux",
    title: "Nos compagnons",
    description:
      "Découvrez les portraits illustratifs du catalogue Âme Errante et préparez une rencontre.",
  },
  {
    slug: "adopter",
    label: "Adopter",
    title: "Le parcours d’adoption",
    description:
      "Un parcours simple pour réfléchir à votre projet et préparer l’arrivée de votre compagnon.",
  },
  {
    slug: "nous-aider",
    label: "Nous aider",
    title: "Faire une différence",
    description:
      "Un don, une famille d’accueil ou du bénévolat : trouvez votre façon d’aider les animaux.",
  },
  {
    slug: "blog",
    label: "Blog",
    title: "Le journal",
    description:
      "Des lectures pour réfléchir à une adoption et accueillir un compagnon en douceur.",
  },
  {
    slug: "contact",
    label: "Contact",
    title: "Parlons de votre projet",
    description:
      "Préparez un message pour un projet d’adoption, un accueil temporaire ou du bénévolat.",
  },
  {
    slug: "soleil",
    label: "Soleil",
    nav: "animaux",
    parent: ["animaux", "Nos animaux"],
    title: "Faire connaissance avec Soleil",
    description:
      "Découvrez l’univers illustratif de Soleil et préparez un projet de rencontre.",
  },
  {
    slug: "plume",
    label: "Plume",
    nav: "animaux",
    parent: ["animaux", "Nos animaux"],
    title: "Faire connaissance avec Plume",
    description:
      "Découvrez l’univers illustratif de Plume et préparez un projet de rencontre.",
  },
  {
    slug: "rencontre",
    label: "Préparer une rencontre",
    nav: "adopter",
    parent: ["animaux", "Nos animaux"],
    title: "Préparer une rencontre",
    description:
      "Un parcours en trois étapes pour préparer votre projet de rencontre avec un compagnon.",
  },
  {
    slug: "nouveau-foyer",
    label: "Un nouveau foyer, en douceur",
    nav: "blog",
    parent: ["blog", "Blog"],
    title: "Un nouveau foyer, en douceur",
    description:
      "Un nouvel environnement représente beaucoup de découvertes. Un accueil calme et des repères réguliers laissent à votre compagnon la liberté de trouver sa place.",
  },
  {
    slug: "avant-adoption",
    label: "Avant le coup de cœur",
    nav: "blog",
    parent: ["blog", "Blog"],
    title: "Avant le coup de cœur",
    description:
      "Une adoption engage toute la famille. Prenez un moment pour imaginer votre quotidien, avec ses joies, ses habitudes et ses contraintes.",
  },
];
export const getPage = (slug) => pages.find((page) => page.slug === slug);
