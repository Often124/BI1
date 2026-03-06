"use client";

import { Slide, Settings } from "@/types";
import Slideshow from "@/components/Slideshow";
import GoogleSlidesEmbed from "@/components/GoogleSlidesEmbed";
import InfoBanner from "@/components/InfoBanner";

interface DisplayPreviewProps {
  slides: Slide[];
  settings: Settings;
}

export default function DisplayPreview({ slides, settings }: DisplayPreviewProps) {
  const useGoogleSlides = settings.googleSlidesEnabled && settings.googleSlidesUrl;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Prévisualisation
          {useGoogleSlides && (
            <span className="text-xs bg-blue-600/30 text-blue-300 px-2 py-1 rounded-lg">
              Google Slides
            </span>
          )}
        </h2>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-green-600/25"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Ouvrir l&#39;affichage
        </a>
      </div>

      {/* Cadre de prévisualisation 16:9 */}
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border-2 border-gray-700/50 shadow-2xl">
        {useGoogleSlides ? (
          <GoogleSlidesEmbed
            url={settings.googleSlidesUrl}
            delayMs={settings.googleSlidesDelayMs}
          />
        ) : (
          <Slideshow
            slides={slides.filter((s) => s.active)}
            transitionDuration={settings.transitionDuration}
          />
        )}
        <InfoBanner settings={settings} />
      </div>
    </div>
  );
}
