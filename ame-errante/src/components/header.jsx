"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Brand } from "./site-parts";
import { DialogButton } from "./dialog";

const menu = [
  ["index", "Accueil"],
  ["association", "Qui sommes-nous"],
  ["animaux", "Nos animaux"],
  ["adopter", "Adopter"],
  ["nous-aider", "Nous aider"],
  ["blog", "Blog"],
  ["contact", "Contact"],
];

export function Header({ active, slug }) {
  const [open, setOpen] = useState(false);
  const header = useRef(null);
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onClick = (event) => {
      if (!header.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);
  return (
    <header className="site-header" ref={header}>
      <div className="header-inner">
        <Brand />
        <button
          type="button"
          className="menu-toggle"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-controls="navigation"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav
          id="navigation"
          aria-label="Navigation principale"
          className={open ? "open" : undefined}
        >
          {menu.map(([route, label]) => (
            <Link
              key={route}
              href={route === "index" ? "/" : `/${route}`}
              className={active === route ? "active" : undefined}
              aria-current={
                active === route
                  ? slug === route
                    ? "page"
                    : "location"
                  : undefined
              }
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
        <DialogButton
          className="button header-donate"
          dialogId="don"
          label="Faire un don"
        >
          <svg aria-hidden="true">
            <use href="#heart" />
          </svg>
          <span>Faire un don</span>
        </DialogButton>
      </div>
    </header>
  );
}
