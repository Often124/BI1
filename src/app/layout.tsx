import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bi1Gestion - Affichage Dynamique",
  description: "Système d'affichage dynamique avec diaporama et informations en temps réel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
