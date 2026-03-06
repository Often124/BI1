"use client";

import { useState, useEffect, useCallback } from "react";
import { Slide, Settings, DEFAULT_SETTINGS } from "@/types";
import Slideshow from "@/components/Slideshow";
import GoogleSlidesEmbed from "@/components/GoogleSlidesEmbed";
import InfoBanner from "@/components/InfoBanner";

export default function DisplayPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const fetchData = useCallback(async () => {
    try {
      const [slidesRes, settingsRes] = await Promise.all([
        fetch("/api/slides"),
        fetch("/api/settings"),
      ]);

      if (slidesRes.ok) {
        const slidesData = await slidesRes.json();
        setSlides(slidesData);
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Actualisation automatique toutes les 30 secondes
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const useGoogleSlides = settings.googleSlidesEnabled && settings.googleSlidesUrl;

  return (
    <div className="w-screen h-screen overflow-hidden bg-black cursor-none-all">
      {useGoogleSlides ? (
        <GoogleSlidesEmbed
          url={settings.googleSlidesUrl}
          delayMs={settings.googleSlidesDelayMs}
        />
      ) : (
        <Slideshow
          slides={slides}
          transitionDuration={settings.transitionDuration}
        />
      )}
      <InfoBanner settings={settings} />
    </div>
  );
}
