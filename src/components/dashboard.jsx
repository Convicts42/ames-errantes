"use client";
import { categories } from "../shared/project";
import { Icon } from "./icons";
import { Status } from "./documents";
import { dateLabel } from "./api";

export function Dashboard({ user, documents, tasks, users, navigate }) {
  const open = tasks.filter((t) => !["done", "parked"].includes(t.status)),
    recent = [...documents]
      .filter((d) => d.category !== "archives")
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, 4);
  return (
    <>
      <div className="page-heading dashboard-heading">
        <div>
          <span className="eyebrow">NOTRE PROJET, PAS À PAS</span>
          <h1>Bonjour {user.name}.</h1>
          <p>Tout ce qu’il faut pour reprendre le fil, tranquillement.</p>
        </div>
        <span className="private-label">
          <Icon name="lock" size={14} />
          Espace privé
        </span>
      </div>
      <section className="welcome-banner">
        <div>
          <span className="eyebrow light">ÂMES ERRANTES</span>
          <h2>
            Un refuge à imaginer.
            <br />
            <em>Une histoire à écrire ensemble.</em>
          </h2>
          <p>Retrouvons nos idées, nos décisions et les points à éclaircir.</p>
          <button
            className="button cream"
            onClick={() => navigate("/dossiers/projet")}
          >
            Revoir notre projet
            <Icon name="arrow" size={17} />
          </button>
        </div>
        <div className="banner-art" aria-hidden="true">
          <div className="art-circle one" />
          <div className="art-circle two" />
          <Icon name="paw" size={85} />
          <span>
            Chaque âme
            <br />
            mérite un foyer.
          </span>
          <svg viewBox="0 0 260 230">
            <path d="M60 220C55 150 90 90 155 28M70 173C25 180 15 149 30 145C42 140 66 151 70 173M88 125C64 121 41 84 62 83C82 81 89 104 88 125M113 90C116 54 138 47 144 59C150 72 130 90 113 90M140 54C155 52 176 28 165 20C155 14 137 32 140 54" />
          </svg>
        </div>
      </section>
      <div className="metrics">
        <div>
          <span className="metric-icon">
            <Icon name="file" />
          </span>
          <span>
            <strong>
              {documents.filter((d) => d.category !== "archives").length}
            </strong>
            <small>documents de travail</small>
          </span>
        </div>
        <div>
          <span className="metric-icon sand">
            <Icon name="tasks" />
          </span>
          <span>
            <strong>{open.length}</strong>
            <small>points à examiner</small>
          </span>
        </div>
        <div>
          <span className="metric-icon purple">
            <Icon name="users" />
          </span>
          <span>
            <strong>{users.length}</strong>
            <small>
              {users.length > 1
                ? "membres dans l’espace"
                : "membre dans l’espace"}
            </small>
          </span>
        </div>
      </div>
      <div className="section-heading">
        <div>
          <h2>Nos dossiers</h2>
          <p>Un endroit pour chaque partie du projet.</p>
        </div>
        <button className="text-button" onClick={() => navigate("/dossiers")}>
          Tout voir
          <Icon name="arrow" size={16} />
        </button>
      </div>
      <div className="folder-grid">
        {categories
          .filter((c) => c.id !== "archives")
          .map((c) => (
            <button
              className="folder-card"
              key={c.id}
              onClick={() => navigate(`/dossiers?categorie=${c.id}`)}
            >
              <div className="folder-top">
                <span className={`file-icon ${c.color}`}>
                  <Icon name={c.icon} size={23} />
                </span>
                <Icon name="external" size={17} />
              </div>
              <h3>{c.label}</h3>
              <p>{c.description}</p>
              <span className="folder-count">
                {documents.filter((d) => d.category === c.id).length} documents
              </span>
            </button>
          ))}
      </div>
      <div className="dashboard-bottom">
        <section className="panel next-panel">
          <div className="panel-heading">
            <h2>À éclaircir ensemble</h2>
            <button className="text-button" onClick={() => navigate("/suivi")}>
              Voir tout
              <Icon name="arrow" size={15} />
            </button>
          </div>
          {open.slice(0, 3).map((t) => (
            <button
              key={t.id}
              className="next-row"
              onClick={() => navigate("/suivi")}
            >
              <span className="empty-check" />
              <span>
                {t.title}
                <small>{t.assignee_name || "À répartir ensemble"}</small>
              </span>
              <Icon name="chevron" size={16} />
            </button>
          ))}
          {!open.length && (
            <p>Aucun point en attente. Vous pouvez en ajouter dans le suivi.</p>
          )}
          <div className="pause-note">
            <Icon name="leaf" size={17} />
            <span>
              Le siège reste en suspens dans le dossier initial. Chaque décision
              peut attendre le bon moment.
            </span>
          </div>
        </section>
        <section className="panel recent-panel">
          <div className="panel-heading">
            <h2>Documents récents</h2>
            <Icon name="clock" size={18} />
          </div>
          {recent.map((d) => (
            <button
              className="recent-row"
              key={d.id}
              onClick={() => navigate(`/dossiers/${d.id}`)}
            >
              <Icon name="file" size={20} />
              <span>
                <strong>{d.title}</strong>
                <small>{dateLabel(d.updated_at)}</small>
              </span>
              <Icon name="chevron" size={15} />
            </button>
          ))}
        </section>
      </div>
      <button
        className="review-banner"
        onClick={() => navigate("/dossiers/verification")}
      >
        <span className="review-icon">
          <Icon name="shield" size={23} />
        </span>
        <span>
          <strong>
            Le dossier a été vérifié. Les réserves restent visibles.
          </strong>
          <small>
            Retrouver les corrections, les sources et les validations encore
            nécessaires.
          </small>
        </span>
        <Icon name="arrow" />
      </button>
    </>
  );
}
