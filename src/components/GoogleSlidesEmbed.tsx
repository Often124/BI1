"use client";

interface GoogleSlidesEmbedProps {
  url: string;
  delayMs: number;
}

/**
 * Convertit un lien Google Slides (édition, partage ou embed) en URL d'embed valide.
 *
 * Formats acceptés :
 *  - https://docs.google.com/presentation/d/ID/edit...
 *  - https://docs.google.com/presentation/d/ID/pub...
 *  - https://docs.google.com/presentation/d/e/ID/pub...
 *  - Lien embed déjà formaté
 */
function toEmbedUrl(url: string, delayMs: number): string {
  if (!url) return "";

  // Extraire l'ID de la présentation
  let presentationId = "";

  // Format: /presentation/d/e/XXXXX/pub
  const publishedMatch = url.match(/\/presentation\/d\/e\/([\w-]+)/);
  // Format: /presentation/d/XXXXX/
  const standardMatch = url.match(/\/presentation\/d\/([\w-]+)/);

  if (publishedMatch) {
    // Lien publié — utiliser directement le format /pub
    const base = url.split("?")[0].replace(/\/+$/, "");
    return `${base}?start=true&loop=true&delayms=${delayMs}&rm=minimal`;
  } else if (standardMatch) {
    presentationId = standardMatch[1];
  } else {
    // Dernier recours : utiliser tel quel
    return url;
  }

  return `https://docs.google.com/presentation/d/${presentationId}/embed?start=true&loop=true&delayms=${delayMs}&rm=minimal`;
}

export default function GoogleSlidesEmbed({ url, delayMs }: GoogleSlidesEmbedProps) {
  const embedUrl = toEmbedUrl(url, delayMs);

  if (!embedUrl) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-6">📊</div>
          <p className="text-lg text-white/40">URL Google Slides non configurée</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black">
      <iframe
        src={embedUrl}
        className="w-full h-full border-0"
        allowFullScreen
        allow="autoplay"
        title="Google Slides"
        style={{
          /* Agrandir légèrement pour masquer le cadre/contrôles Google */
          position: "absolute",
          top: "-2px",
          left: "-2px",
          width: "calc(100% + 4px)",
          height: "calc(100% + 4px)",
        }}
      />
    </div>
  );
}
