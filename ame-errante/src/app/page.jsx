import "../styles/home.css";
import { getPage } from "@ames/core/data/pages.js";
import { PageFrame } from "../components/page-frame";
import Home from "../components/pages/index";
const page = getPage("index");
export const metadata = {
  title: `${page.title} — Âmes errantes`,
  description: page.description,
};
export default function HomePage() {
  return (
    <PageFrame page={page}>
      <Home />
    </PageFrame>
  );
}

export const dynamic = "force-dynamic";
