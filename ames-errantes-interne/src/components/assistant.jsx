"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "./api";

const actionLabels = {
  create: "Document créé",
  update: "Document modifié",
  restore: "Version restaurée",
  task: "Point à suivre enregistré",
};

export function Assistant({ navigate, onChanged }) {
  const [enabled, setEnabled] = useState(null),
    [conversation, setConversation] = useState(null),
    [items, setItems] = useState([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    end = useRef(null);
  useEffect(() => {
    api("/api/assistant")
      .then((d) => setEnabled(d.enabled))
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [items, busy]);
  async function send(event) {
    event.preventDefault();
    const text = message.trim();
    if (!text || busy) return;
    setBusy(true);
    setError("");
    setItems((list) => [...list, { role: "user", text }]);
    setMessage("");
    try {
      const d = await api("/api/assistant", {
        method: "POST",
        body: { conversation, message: text },
      });
      setConversation(d.conversation);
      setItems((list) => [
        ...list,
        { role: "assistant", text: d.reply, actions: d.actions },
      ]);
      if (d.actions.length) onChanged?.();
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
  if (enabled === false)
    return (
      <section className="panel assistant">
        <h2>Assistant Claude</h2>
        <p className="connection-help">
          L’assistant n’est pas encore activé sur ce serveur. Le responsable
          technique doit ajouter une clé ANTHROPIC_API_KEY dans la configuration
          de la Raspberry.
        </p>
      </section>
    );
  return (
    <section className="panel assistant">
      <div className="panel-heading">
        <h2>Assistant Claude</h2>
        {items.length > 0 && (
          <button className="text-button" onClick={restart} disabled={busy}>
            Nouvelle conversation
          </button>
        )}
      </div>
      {items.length === 0 && (
        <p className="quiet-note">
          Demandez par exemple : « Relis notre dossier d’accueil, puis ajoute
          les questions manquantes aux points à suivre. » Claude lit les
          documents à jour, garde chaque ancienne version et ne publie rien.
        </p>
      )}
      <div className="assistant-messages" aria-live="polite">
        {items.map((item, index) => (
          <div className={`assistant-message ${item.role}`} key={index}>
            <p>{item.text}</p>
            {item.actions?.map((action, i) => (
              <button
                key={i}
                className="text-button"
                disabled={!action.id}
                onClick={() => action.id && navigate(`/dossiers/${action.id}`)}
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
          aria-label="Message pour Claude"
          placeholder="Écrire à Claude…"
          rows={3}
          maxLength={8000}
          value={message}
          disabled={enabled === null}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(e);
          }}
        />
        <button
          className="button primary"
          disabled={busy || !message.trim() || enabled === null}
        >
          Envoyer
        </button>
      </form>
    </section>
  );
}
