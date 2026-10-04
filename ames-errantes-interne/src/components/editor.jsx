"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import { useState } from "react";
import { Icon } from "./icons";

export function DocumentEditor({ html, onChange }) {
  const [, redraw] = useState(0);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: { openOnClick: false, autolink: true },
      }),
      TableKit.configure({ table: { resizable: false } }),
    ],
    content: html,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onTransaction: () => redraw((n) => n + 1),
    editorProps: {
      attributes: {
        class: "document-content editing",
        role: "textbox",
        "aria-label": "Contenu du dossier",
        "aria-multiline": "true",
        spellcheck: "true",
      },
    },
  });
  if (!editor)
    return <div className="loading-inline">Préparation de l’éditeur…</div>;
  function setLink() {
    const previous = editor.getAttributes("link").href || "";
    const url = window.prompt(
      "Adresse du lien (https://…) — vide pour retirer le lien",
      previous,
    );
    if (url === null) return;
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!/^(https?:\/\/|mailto:|\/(?!\/))/i.test(url)) {
      window.alert("Utilisez une adresse https://, http:// ou mailto:.");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }
  const buttons = [
    [
      "bold",
      "Gras",
      () => editor.chain().focus().toggleBold().run(),
      editor.isActive("bold"),
    ],
    [
      "italic",
      "Italique",
      () => editor.chain().focus().toggleItalic().run(),
      editor.isActive("italic"),
    ],
    [
      "list",
      "Liste à puces",
      () => editor.chain().focus().toggleBulletList().run(),
      editor.isActive("bulletList"),
    ],
    [
      "ordered",
      "Liste numérotée",
      () => editor.chain().focus().toggleOrderedList().run(),
      editor.isActive("orderedList"),
    ],
    ["url", "Ajouter un lien", setLink, editor.isActive("link")],
    [
      "table",
      "Insérer un tableau",
      () =>
        editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
      false,
    ],
    [
      "undo",
      "Annuler la dernière modification",
      () => editor.chain().focus().undo().run(),
      false,
    ],
    ["redo", "Rétablir", () => editor.chain().focus().redo().run(), false],
  ];
  return (
    <div className="editor">
      <div className="editor-toolbar" role="toolbar" aria-label="Mise en forme">
        <select
          aria-label="Style du paragraphe"
          value={
            editor.isActive("heading", { level: 2 })
              ? "2"
              : editor.isActive("heading", { level: 3 })
                ? "3"
                : "0"
          }
          onChange={(e) =>
            e.target.value === "0"
              ? editor.chain().focus().setParagraph().run()
              : editor
                  .chain()
                  .focus()
                  .toggleHeading({ level: Number(e.target.value) })
                  .run()
          }
        >
          <option value="0">Texte normal</option>
          <option value="2">Titre de section</option>
          <option value="3">Sous-titre</option>
        </select>
        <span className="toolbar-divider" />
        {buttons.map(([icon, label, click, active]) => (
          <button
            key={icon}
            type="button"
            className={`icon-button ${active ? "active" : ""}`}
            aria-label={label}
            title={label}
            aria-pressed={active}
            onMouseDown={(e) => e.preventDefault()}
            onClick={click}
          >
            <Icon name={icon} size={18} />
          </button>
        ))}
      </div>
      {editor.isActive("table") && (
        <div className="table-tools">
          <span>Tableau</span>
          <button onClick={() => editor.chain().focus().addRowAfter().run()}>
            + Ligne
          </button>
          <button onClick={() => editor.chain().focus().addColumnAfter().run()}>
            + Colonne
          </button>
          <button onClick={() => editor.chain().focus().deleteRow().run()}>
            Retirer la ligne
          </button>
          <button onClick={() => editor.chain().focus().deleteColumn().run()}>
            Retirer la colonne
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
