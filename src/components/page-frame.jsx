import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { publicSettings } from "../server/settings.mjs";
import { Header } from "./header";
import { Footer } from "./site-parts";
import { DonationDialog } from "./donation-dialog";
import { RevealEffects } from "./reveal-effects";

export async function PageFrame({ page, children }) {
  await connection();
  const settings = publicSettings();
  return (
    <div
      className={`${page.slug === "index" ? "home-page" : "interior-page"} page-${page.slug}`}
    >
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <Header active={page.nav || page.slug} slug={page.slug} />
      <main id="contenu">
        {page.slug !== "index" && (
          <nav className="breadcrumb shell" aria-label="Fil d’Ariane">
            <Link href="/">Accueil</Link>
            <span aria-hidden="true">/</span>
            {page.parent && (
              <>
                <Link href={`/${page.parent[0]}`}>{page.parent[1]}</Link>
                <span aria-hidden="true">/</span>
              </>
            )}
            <span aria-current="page">{page.label}</span>
          </nav>
        )}
        <Suspense>{children}</Suspense>
      </main>
      <Footer settings={settings} />
      <DonationDialog donationUrl={settings.donationUrl} />
      <RevealEffects slug={page.slug} />
    </div>
  );
}
