"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const oldSections = {
  mission: "/association",
  animaux: "/animaux",
  adopter: "/adopter",
  aider: "/nous-aider",
  journal: "/blog",
  contact: "/contact",
};

export function Hero({ children }) {
  const router = useRouter();
  useEffect(() => {
    const redirect = () => {
      const hash = location.hash.slice(1);
      if (Object.hasOwn(oldSections, hash)) router.replace(oldSections[hash]);
    };
    redirect();
    window.addEventListener("hashchange", redirect);
    return () => window.removeEventListener("hashchange", redirect);
  }, [router]);
  return (
    <section className="hero shell" aria-labelledby="hero-title">
      {children}
    </section>
  );
}
