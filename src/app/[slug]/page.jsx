import { notFound } from "next/navigation";
import { pages, getPage } from "../../data/pages";
import { PageFrame } from "../../components/page-frame";
import Association from "../../components/pages/association";
import Animaux from "../../components/pages/animaux";
import Adopter from "../../components/pages/adopter";
import NousAider from "../../components/pages/nous-aider";
import Blog from "../../components/pages/blog";
import Contact from "../../components/pages/contact";
import Soleil from "../../components/pages/soleil";
import Plume from "../../components/pages/plume";
import Rencontre from "../../components/pages/rencontre";
import NouveauFoyer from "../../components/pages/nouveau-foyer";
import AvantAdoption from "../../components/pages/avant-adoption";

const contents = {
  association: Association,
  animaux: Animaux,
  adopter: Adopter,
  "nous-aider": NousAider,
  blog: Blog,
  contact: Contact,
  soleil: Soleil,
  plume: Plume,
  rencontre: Rencontre,
  "nouveau-foyer": NouveauFoyer,
  "avant-adoption": AvantAdoption,
};

export function generateStaticParams() {
  return pages
    .filter((page) => page.slug !== "index")
    .map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page || !Object.hasOwn(contents, slug)) notFound();
  return { title: page.title, description: page.description };
}

export default async function ContentPage({ params }) {
  const { slug } = await params;
  if (!Object.hasOwn(contents, slug)) notFound();
  const Content = contents[slug];
  return (
    <PageFrame key={slug} page={getPage(slug)}>
      <Content />
    </PageFrame>
  );
}
