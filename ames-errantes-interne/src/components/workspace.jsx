"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { categories } from "@ames/core/shared/project.js";
import { api } from "./api";
import { Login, Brand } from "./login";
import { Icon } from "./icons";
import { Dashboard } from "./dashboard";
import {
  DocumentList,
  DocumentView,
  CreateDocument,
  Status,
} from "./documents";
import { Tasks } from "./tasks";
import { Account } from "./account";
import { Dialog } from "./dialog";
import { Management, Activity } from "./management";
import { Assistant } from "./assistant";

export function Workspace() {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [setup, setSetup] = useState(false),
    [error, setError] = useState(""),
    [data, setData] = useState(null),
    [mobile, setMobile] = useState(false),
    [creating, setCreating] = useState(null),
    [search, setSearch] = useState(false),
    [query, setQuery] = useState(""),
    [results, setResults] = useState([]),
    [searching, setSearching] = useState(false);
  const dirty = useRef(false),
    router = useRouter(),
    pathname = usePathname(),
    params = useSearchParams(),
    category = params.get("categorie"),
    id = pathname.startsWith("/dossiers/")
      ? decodeURIComponent(pathname.split("/")[2])
      : null;
  const setDirty = useCallback((value) => {
    dirty.current = value;
  }, []);
  function navigate(url) {
    if (
      dirty.current &&
      !window.confirm(
        "Vous avez des modifications non enregistrées. Quitter ce document ? Un brouillon restera sur cet appareil.",
      )
    )
      return;
    dirty.current = false;
    setMobile(false);
    setSearch(false);
    router.push(url);
    window.scrollTo({ top: 0 });
  }
  const refresh = useCallback(async () => {
    try {
      setData(await api("overview"));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    api("session")
      .then((d) => {
        setUser(d.user);
        setSetup(d.setupRequired);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);
  useEffect(() => {
    if (!user) return;
    const timer = setInterval(() => {
      if (!document.hidden && !dirty.current) refresh();
    }, 15000);
    const focus = () => {
      if (!dirty.current) refresh();
    };
    window.addEventListener("focus", focus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [user, refresh]);
  useEffect(() => {
    function key(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k" && user) {
        e.preventDefault();
        setSearch(true);
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [user]);
  useEffect(() => {
    if (!search) return;
    let alive = true;
    setSearching(true);
    const timer = setTimeout(
      () =>
        api(`documents?q=${encodeURIComponent(query)}`)
          .then((d) => {
            if (alive) setResults(d.documents);
          })
          .catch((e) => {
            if (alive) setError(e.message);
          })
          .finally(() => {
            if (alive) setSearching(false);
          }),
      180,
    );
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query, search]);
  function loggedOut(message = "") {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key?.startsWith("ames-draft:")) sessionStorage.removeItem(key);
    }
    dirty.current = false;
    setData(null);
    setUser(null);
    setSetup(false);
    setError(message);
    router.push("/");
  }
  async function logout() {
    if (
      dirty.current &&
      !window.confirm(
        "Vous avez un brouillon non enregistré. Enregistrez-le avant de vous déconnecter, ou confirmez pour l’abandonner.",
      )
    )
      return;
    try {
      await api("logout", { method: "POST", body: {} });
      loggedOut();
    } catch (e) {
      setError(e.message);
    }
  }
  if (loading)
    return (
      <div className="app-loading">
        <Brand />
        <p>Ouverture de votre espace…</p>
      </div>
    );
  if (!user)
    return (
      <>
        {error && (
          <div className="floating-notice" role="status">
            {error}
          </div>
        )}
        <Login
          setupRequired={setup}
          onLogin={(u) => {
            setUser(u);
            setError("");
            setSetup(false);
          }}
        />
      </>
    );
  const activeCategory = id
    ? data?.documents.find((d) => d.id === id)?.category
    : category;
  const pageLabel =
    pathname === "/"
      ? "Vue d’ensemble"
      : pathname === "/suivi"
        ? "Points à suivre"
        : pathname === "/compte"
          ? "Mon compte"
          : pathname === "/gestion"
            ? "Animaux & demandes"
            : pathname === "/activite"
              ? "Activité & Claude"
              : categories.find((c) => c.id === activeCategory)?.label ||
                "Dossiers";
  const openDocument = id && data?.documents.find((d) => d.id === id);
  const publicAddress = new URL(data?.siteUrl || "http://localhost:4173");
  if (
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(publicAddress.hostname)
  )
    publicAddress.hostname = window.location.hostname;
  const siteUrl = publicAddress.origin;
  return (
    <div className="workspace">
      <a className="skip-link" href="#main-content">
        Aller au contenu
      </a>
      {mobile && (
        <button
          className="mobile-shade"
          aria-label="Fermer le menu"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
        <button
          className="brand-button"
          onClick={() => navigate("/")}
          aria-label="Âmes errantes, tableau de bord"
        >
          <Brand />
        </button>
        <div className="workspace-label">
          <span className="dot" />
          Le projet du refuge<span className="label-mini">PRIVÉ</span>
        </div>
        <nav aria-label="Navigation principale">
          <button
            className={`nav-item ${pathname === "/" ? "active" : ""}`}
            onClick={() => navigate("/")}
          >
            <Icon name="dashboard" />
            Vue d’ensemble
          </button>
          <button
            className={`nav-item ${pathname === "/suivi" ? "active" : ""}`}
            onClick={() => navigate("/suivi")}
          >
            <Icon name="tasks" />
            Points à suivre
            {data && (
              <span className="nav-count">
                {
                  data.tasks.filter(
                    (t) => !["done", "parked"].includes(t.status),
                  ).length
                }
              </span>
            )}
          </button>
          <span className="nav-label">NOS DOSSIERS</span>
          {categories
            .filter((c) => c.id !== "archives")
            .map((c) => (
              <button
                key={c.id}
                className={`nav-item ${activeCategory === c.id ? "active" : ""}`}
                onClick={() => navigate(`/dossiers?categorie=${c.id}`)}
              >
                <Icon name={c.icon} />
                {c.label}
              </button>
            ))}
          <button
            className={`nav-item archive-nav ${activeCategory === "archives" ? "active" : ""}`}
            onClick={() => navigate("/dossiers?categorie=archives")}
          >
            <Icon name="archive" />
            Archives
          </button>
        </nav>
        <nav aria-label="Site et équipe">
          <span className="nav-label">LE SITE & L’ÉQUIPE</span>
          <button
            className={`nav-item ${pathname === "/gestion" ? "active" : ""}`}
            onClick={() => navigate("/gestion")}
          >
            <Icon name="paw" />
            Animaux & demandes
          </button>
          <button
            className={`nav-item ${pathname === "/activite" ? "active" : ""}`}
            onClick={() => navigate("/activite")}
          >
            <Icon name="history" />
            Activité & Claude
          </button>
          <a
            className="nav-item"
            href={siteUrl}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="external" />
            Voir le site public
          </a>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-message">
            <Icon name="leaf" size={21} />
            <p>
              Construire un refuge,
              <br />
              <strong>un pas après l’autre.</strong>
            </p>
          </div>
          <button
            className="profile-button"
            onClick={() => navigate("/compte")}
          >
            <span className="avatar">{user.name[0].toUpperCase()}</span>
            <span>
              <strong>{user.name}</strong>
              <small>Mon compte & l’équipe</small>
            </span>
            <Icon name="settings" size={18} />
          </button>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Ouvrir le menu"
            aria-expanded={mobile}
            onClick={() => setMobile(!mobile)}
          >
            <Icon name="menu" />
          </button>
          <div className="breadcrumb">
            <Icon name="home" size={16} />
            <span>Notre espace</span>
            <Icon name="chevron" size={13} />
            <strong>{pageLabel}</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="search-button"
              aria-label="Rechercher un document"
              onClick={() => setSearch(true)}
            >
              <Icon name="search" size={17} />
              <span>Rechercher un document</span>
              <kbd>Ctrl K</kbd>
            </button>
            <button
              className="icon-button"
              onClick={logout}
              aria-label="Se déconnecter"
              title="Se déconnecter"
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        </header>
        <main
          id="main-content"
          className={`main-content ${id ? "reading-width" : ""}`}
          tabIndex={-1}
        >
          {error && (
            <div className="notice error-message" role="alert">
              <span>{error}</span>
              <button className="text-button" onClick={refresh}>
                Réessayer
              </button>
              <button
                className="text-button"
                onClick={() => {
                  if (
                    !dirty.current ||
                    window.confirm(
                      "Quitter la session ? Le brouillon est conservé sur cet appareil.",
                    )
                  ) {
                    setUser(null);
                    setData(null);
                  }
                }}
              >
                Se reconnecter
              </button>
            </div>
          )}
          {!data ? (
            <div className="loading-inline">Chargement des dossiers…</div>
          ) : id ? (
            <DocumentView
              key={id}
              id={id}
              user={user}
              onChanged={refresh}
              onDirty={setDirty}
              latestVersion={data.documents.find((d) => d.id === id)?.version}
              navigate={navigate}
            />
          ) : pathname === "/dossiers" ? (
            <DocumentList
              documents={data.documents}
              category={category}
              navigate={navigate}
              onCreate={(c) => setCreating(c || "projet")}
            />
          ) : pathname === "/suivi" ? (
            <Tasks {...data} onChanged={refresh} navigate={navigate} />
          ) : pathname === "/gestion" ? (
            <Management user={user} siteUrl={siteUrl} />
          ) : pathname === "/activite" ? (
            <Activity />
          ) : pathname === "/compte" ? (
            <Account
              user={user}
              users={data.users}
              backupDay={data.backupDay}
              onChanged={refresh}
              onLogout={loggedOut}
            />
          ) : pathname === "/" ? (
            <Dashboard user={user} {...data} navigate={navigate} />
          ) : (
            <div className="empty-state">
              <h1>Cette page n’existe pas.</h1>
              <button className="button" onClick={() => navigate("/")}>
                Revenir à l’accueil
              </button>
            </div>
          )}
          <footer className="workspace-footer">
            <span>
              <Icon name="paw" size={14} />
              Âmes errantes
            </span>
            <span>Un espace pour avancer ensemble.</span>
          </footer>
        </main>
      </div>
      <Assistant
        navigate={navigate}
        onChanged={refresh}
        isDirty={() => dirty.current}
        context={{
          path: pathname,
          page: pageLabel,
          document: openDocument
            ? {
                id: openDocument.id,
                title: openDocument.title,
                category: openDocument.category,
              }
            : null,
        }}
      />
      {creating && (
        <CreateDocument
          category={creating}
          onClose={() => setCreating(null)}
          onCreated={(d) => {
            setCreating(null);
            refresh();
            navigate(`/dossiers/${d.id}`);
          }}
        />
      )}
      {search && (
        <Dialog title="Retrouver un document" onClose={() => setSearch(false)}>
          <div className="dialog-body search-dialog">
            <label className="search-field">
              <Icon name="search" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Un titre, un mot, une question…"
                aria-label="Rechercher dans les dossiers"
              />
            </label>
            <span className="search-count" role="status">
              {searching
                ? "Recherche…"
                : `${results.length} document${results.length > 1 ? "s" : ""}`}
            </span>
            <div className="search-results">
              {results.map((d) => (
                <button
                  key={d.id}
                  onClick={() => navigate(`/dossiers/${d.id}`)}
                >
                  <Icon name="file" />
                  <span>
                    <strong>{d.title}</strong>
                    <small>
                      {categories.find((c) => c.id === d.category)?.label}
                    </small>
                  </span>
                  <Status value={d.status} />
                </button>
              ))}
              {!searching && !results.length && (
                <p>Aucun document trouvé. Essayez un autre mot.</p>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
