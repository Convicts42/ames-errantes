"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import { Icon } from "./icons";

const actionLabels = {
  create: "Document créé",
  update: "Document modifié",
  restore: "Version restaurée",
  task: "Point à suivre enregistré",
};
const storageKey = "ames-assistant";

function load() {
  try {
    return JSON.parse(sessionStorage.getItem(storageKey)) || {};
  } catch {
    return {};
  }
}

// Bulle Claude en bas à droite, présente sur toutes les pages de l'intranet.
// Elle transmet la page et le document ouverts, puis ouvre le document que
// Claude vient de modifier s'il n'est pas déjà affiché.
export function Assistant({ navigate, onChanged, context, isDirty }) {
  const [status, setStatus] = useState(null),
    [open, setOpen] = useState(false),
    [conversation, setConversation] = useState(null),
    [items, setItems] = useState([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    end = useRef(null),
    input = useRef(null);
  useEffect(() => {
    api("/api/assistant")
      .then(setStatus)
      .catch(() => setStatus({ available: false, reason: "offline" }));
    const saved = load();
    setOpen(Boolean(saved.open));
    setConversation(saved.conversation || null);
    setItems(Array.isArray(saved.items) ? saved.items : []);
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({ open, conversation, items: items.slice(-40) }),
      );
    } catch {}
  }, [open, conversation, items]);
  useEffect(() => {
    if (open) end.current?.scrollIntoView({ block: "nearest" });
  }, [open, items, busy]);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  if (!status || status.reason === "owner") return null;
  async function send(event) {
    event.preventDefault();
    const text = message.trim();
    if (!text || busy) return;
    if (isDirty()) {
      setError(
        "Enregistrez d’abord vos modifications en cours : Claude travaille sur la version enregistrée.",
      );
      return;
    }
    setBusy(true);
    setError("");
    setItems((list) => [...list, { role: "user", text }]);
    setMessage("");
    try {
      const d = await api("/api/assistant", {
        method: "POST",
        body: { conversation, message: text, context },
      });
      setConversation(d.conversation);
      setItems((list) => [
        ...list,
        { role: "assistant", text: d.reply, actions: d.actions },
      ]);
      if (d.actions.length) {
        onChanged();
        const last = d.actions.at(-1);
        if (last.kind === "task") {
          if (context.path !== "/suivi") navigate("/suivi");
        } else if (last.id && last.id !== context.document?.id)
          navigate(`/dossiers/${last.id}`);
      }
    } catch (e) {
      if (e.status === 410) setConversation(null);
      setError(e.message);
      setMessage(text);
      setItems((list) => list.slice(0, -1));
    } finally {
      setBusy(false);
    }
  }
  function restart() {
    setConversation(null);
    setItems([]);
    setError("");
  }
  if (!open)
    return (
      <button
        className="assistant-launcher"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir l’assistant Claude"
      >
        <Icon name="sparkles" size={22} />
        {busy && <span className="assistant-dot" />}
      </button>
    );
  return (
    <section className="assistant-popup" aria-label="Assistant Claude">
      <header>
        <strong>
          <Icon name="sparkles" size={16} /> Claude
        </strong>
        {items.length > 0 && (
          <button className="text-button" onClick={restart} disabled={busy}>
            Nouvelle conversation
          </button>
        )}
        <button
          className="icon-button"
          onClick={() => setOpen(false)}
          aria-label="Réduire l’assistant"
        >
          <Icon name="close" size={16} />
        </button>
      </header>
      <div className="assistant-messages" aria-live="polite">
        {status.reason === "offline" && (
          <p className="quiet-note">
            Le pont vers Claude Code ne répond pas sur la Raspberry. Vérifier
            que Claude Code est connecté et que le service ames-claude-bridge
            tourne.
          </p>
        )}
        {status.available && items.length === 0 && (
          <p className="quiet-note">
            {context.document
              ? `Claude sait que vous êtes sur « ${context.document.title} ». Demandez par exemple : « Ajoute une section sur les questions encore ouvertes. »`
              : "Demandez par exemple : « Relis notre dossier d’accueil et ajoute les questions manquantes aux points à suivre. »"}
          </p>
        )}
        {items.map((item, index) => (
          <div className={`assistant-message ${item.role}`} key={index}>
            <p>{item.text}</p>
            {item.actions?.map((action, i) => (
              <button
                key={i}
                className="text-button"
                onClick={() =>
                  navigate(
                    action.kind === "task"
                      ? "/suivi"
                      : `/dossiers/${action.id}`,
                  )
                }
                disabled={action.kind !== "task" && !action.id}
              >
                {actionLabels[action.kind]}
                {action.title ? ` · ${action.title}` : ""}
              </button>
            ))}
          </div>
        ))}
        {busy && (
          <div className="assistant-message assistant">
            <p className="quiet-note">Claude travaille…</p>
          </div>
        )}
        <div ref={end} />
      </div>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      <form className="assistant-form" onSubmit={send}>
        <textarea
          ref={input}
          aria-label="Message pour Claude"
          placeholder={
            context.document
              ? `Modifier « ${context.document.title} »…`
              : "Écrire à Claude…"
          }
          rows={2}
          maxLength={8000}
          value={message}
          disabled={!status.available}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) send(e);
          }}
        />
        <button
          className="button primary"
          disabled={busy || !message.trim() || !status.available}
          aria-label="Envoyer"
        >
          <Icon name="arrow" size={16} />
        </button>
      </form>
    </section>
  );
}
