export async function copyMessage(field, setStatus) {
  try {
    await navigator.clipboard.writeText(field.value);
    setStatus("Message copié. Aucun envoi n’a été effectué.");
  } catch {
    field.focus();
    field.select();
    setStatus(
      "Le texte est sélectionné. Copiez-le avec le menu de votre appareil ou Ctrl+C.",
    );
  }
}
