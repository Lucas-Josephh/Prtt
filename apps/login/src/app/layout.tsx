import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PRTT – Espace administration",
  description: "Connexion à l'espace administration du site du PRTT",
  // Page de connexion : inutile de la référencer dans les moteurs de recherche
  robots: { index: false, follow: false },
};

export const generateViewport = () => ({
  width: "device-width",
  initialScale: 1,
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
