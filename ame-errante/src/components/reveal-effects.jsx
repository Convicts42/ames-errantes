"use client";

import { useEffect } from "react";

export function RevealEffects({ slug }) {
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    if (
      reduced.matches ||
      !("IntersectionObserver" in window) ||
      !("animate" in Element.prototype)
    )
      return;
    const elements = [...document.querySelectorAll("[data-reveal]")];
    const animations = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const { target, isIntersecting } of entries) {
          if (!isIntersecting) continue;
          observer.unobserve(target);
          if (reduced.matches || target.contains(document.activeElement))
            continue;
          // Suspense may still be hydrating this markup. Animate without changing
          // the server-rendered attributes that React needs to reconcile.
          const animation = target.animate(
            [
              { opacity: 0, transform: "translateY(16px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            { duration: 600, easing: "ease-out" },
          );
          animations.set(target, animation);
          animation.onfinish = () => animations.delete(target);
        }
      },
      { threshold: 0.05 },
    );
    const reveal = (event) => {
      const element = event.currentTarget;
      observer.unobserve(element);
      animations.get(element)?.cancel();
      animations.delete(element);
    };
    const clear = () => {
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
      animations.clear();
    };
    const onReduced = () => {
      if (reduced.matches) clear();
    };
    elements.forEach((element) => {
      observer.observe(element);
      element.addEventListener("focusin", reveal);
    });
    reduced.addEventListener("change", onReduced);
    return () => {
      clear();
      reduced.removeEventListener("change", onReduced);
      elements.forEach((element) =>
        element.removeEventListener("focusin", reveal),
      );
    };
  }, [slug]);
  return null;
}
