import "../styles/globals.css";
export const metadata = {
  title: {
    default: "Âmes errantes · Notre projet",
    template: "%s · Âmes errantes"
  },
  description: "Espace privé de préparation du refuge Âmes errantes.",
  robots: {
    index: false,
    follow: false
  }
};
export const viewport = {
  themeColor: "#284b3e"
};
export default function RootLayout({
  children
}) {
  return <html lang="fr">
      <body>{children}</body>
    </html>;
}
