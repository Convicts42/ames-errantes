"use client";

import { useEffect, useRef } from "react";
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
  const hero = useRef(null);
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

  useEffect(() => {
    const element = hero.current;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const controller = new AbortController();
    let loading = false;
    let dispose;
    async function loadScene() {
      if (controller.signal.aborted) return;
      if (reduced.matches) {
        element.dataset.effectState = "reduced";
        return;
      }
      if (loading) return;
      loading = true;
      try {
        const { createHeroScene } = await import("./hero-scene");
        if (controller.signal.aborted) return;
        dispose = await createHeroScene(element, controller.signal);
        if (controller.signal.aborted) dispose?.();
      } catch {
        if (controller.signal.aborted) return;
        element.dataset.effectState = "fallback";
        element.querySelector("canvas").hidden = true;
      }
    }
    loadScene();
    reduced.addEventListener("change", loadScene);
    return () => {
      controller.abort();
      reduced.removeEventListener("change", loadScene);
      dispose?.();
    };
  }, []);
  return (
    <section ref={hero} className="hero" aria-labelledby="hero-title">
      {children}
    </section>
  );
}
