import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getPage } from "../../data/pages";
import { getAnimal } from "../../server/repository.mjs";
import { AnimalProfile } from "../../components/animal-profile";
import { PageFrame } from "../../components/page-frame";
import Association from "../../components/pages/association";
import Animaux from "../../components/pages/animaux";
import Adopter from "../../components/pages/adopter";
import NousAider from "../../components/pages/nous-aider";
import Blog from "../../components/pages/blog";
import Contact from "../../components/pages/contact";
import Rencontre from "../../components/pages/rencontre";
import NouveauFoyer from "../../components/pages/nouveau-foyer";
import AvantAdoption from "../../components/pages/avant-adoption";
import {
  LegalPage,
  PrivacyPage,
  FosterPage,
  VolunteerPage,
  StoriesPage,
} from "../../components/pages/information";
const contents = {
  "mentions-legales": LegalPage,
  confidentialite: PrivacyPage,
  "famille-accueil": FosterPage,
  benevolat: VolunteerPage,
  "belles-histoires": StoriesPage,
  association: Association,
  animaux: Animaux,
  adopter: Adopter,
  "nous-aider": NousAider,
  blog: Blog,
  contact: Contact,
  rencontre: Rencontre,
  "nouveau-foyer": NouveauFoyer,
  "avant-adoption": AvantAdoption,
};
function profilePage(animal) {
  return {
    slug: animal.slug,
    label: animal.name,
    nav: "animaux",
    parent: ["animaux", "Nos animaux"],
    title: `Faire connaissance avec ${animal.name}`,
    description: animal.description,
  };
}
export async function generateMetadata({ params }) {
  await connection();
  const { slug } = await params;
  const animal = Object.hasOwn(contents, slug) ? null : await getAnimal(slug);
  const page = Object.hasOwn(contents, slug)
    ? getPage(slug)
    : animal && profilePage(animal);
  if (!page) notFound();
  return {
    title: page.title,
    description: page.description,
  };
}
export default async function ContentPage({ params }) {
  await connection();
  const { slug } = await params;
  if (!Object.hasOwn(contents, slug)) {
    const animal = await getAnimal(slug);
    if (!animal) notFound();
    return (
      <PageFrame key={slug} page={profilePage(animal)}>
        <AnimalProfile animal={animal} />
      </PageFrame>
    );
  }
  const Content = contents[slug];
  return (
    <PageFrame key={slug} page={getPage(slug)}>
      <Content />
    </PageFrame>
  );
}

export const dynamic = "force-dynamic";
