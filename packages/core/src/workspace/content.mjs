import sanitize from "sanitize-html";
import { marked } from "marked";
import { AppError } from "./errors.mjs";

export function cleanHtml(value) {
  if (typeof value !== "string" || value.length > 300000)
    throw new AppError(400, "Le document est trop volumineux.");
  return sanitize(value, {
    allowedTags: [
      "p",
      "br",
      "h1",
      "h2",
      "h3",
      "h4",
      "strong",
      "em",
      "u",
      "s",
      "ul",
      "ol",
      "li",
      "blockquote",
      "hr",
      "a",
      "code",
      "pre",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      ol: ["start"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
    },
    allowedSchemes: ["https", "http", "mailto"],
    allowProtocolRelative: false,
    transformTags: {
      a: (_tag, attrs) => ({
        tagName: "a",
        attribs: {
          ...attrs,
          rel: "noopener noreferrer",
          ...(attrs.href?.startsWith("http") ? { target: "_blank" } : {}),
        },
      }),
    },
  });
}
export function plainText(html) {
  return sanitize(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
export function importMarkdown(markdown, mapping) {
  const local = markdown.replace(
    /https:\/\/chatgpt\.com\/space\/(page_[a-z0-9]+)/g,
    (url, id) => (mapping.get(id) ? `/dossiers/${mapping.get(id)}` : url),
  );
  return cleanHtml(marked.parse(local, { gfm: true, breaks: false }));
}
