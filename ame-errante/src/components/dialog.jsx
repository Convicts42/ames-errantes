"use client";

import { useRef } from "react";

export function Dialog({ id, className, labelledBy, children }) {
  const dialog = useRef(null);
  function closeOnBackdrop(event) {
    if (event.target !== dialog.current) return;
    const rect = dialog.current.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      dialog.current.close();
  }
  return (
    <dialog
      id={id}
      ref={dialog}
      className={className}
      aria-labelledby={labelledBy}
      onClick={closeOnBackdrop}
    >
      <button
        type="button"
        className="dialog-close"
        aria-label="Fermer"
        onClick={() => dialog.current.close()}
      >
        ×
      </button>
      {children}
    </dialog>
  );
}

export function DialogButton({ dialogId, className, label, children }) {
  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      onClick={() => document.getElementById(dialogId)?.showModal()}
    >
      {children}
    </button>
  );
}

export function PortraitLink({ href, className, label, children }) {
  return (
    <a
      href={href}
      className={className}
      aria-label={label}
      onClick={(event) => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
          return;
        event.preventDefault();
        document.getElementById("portrait-dialog")?.showModal();
      }}
    >
      {children}
    </a>
  );
}
