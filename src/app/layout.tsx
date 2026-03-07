import type { Metadata } from "next";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bi1Gestion - Affichage Dynamique",
  description: "Système d'affichage dynamique avec diaporama et informations en temps réel",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "https://zupimages.net/up/25/31/7xsd.png",
    shortcut: "https://zupimages.net/up/25/31/7xsd.png",
    apple: "https://zupimages.net/up/25/31/7xsd.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
