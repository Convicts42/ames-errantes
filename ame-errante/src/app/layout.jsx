import "../styles/globals.css";
import "../styles/profiles.css";
import { IconDefinitions } from "../components/site-parts";
export const metadata = {
  title: {
    default: "Âme Errante",
    template: "%s — Âme Errante",
  },
  description: "Chaque âme mérite un foyer. Association de protection animale.",
};
export const viewport = {
  themeColor: "#223e30",
};
export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <IconDefinitions />
        {children}
      </body>
    </html>
  );
}
