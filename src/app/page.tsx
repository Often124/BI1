"use client";

import { useState, useEffect, useCallback } from "react";
import { Slide, Settings, DEFAULT_SETTINGS } from "@/types";
import Slideshow from "@/components/Slideshow";
import GoogleSlidesEmbed from "@/components/GoogleSlidesEmbed";
import InfoBanner from "@/components/InfoBanner";

declare global {
  interface Document {
    webkitFullscreenElement?: Element;
    webkitExitFullscreen?: () => Promise<void>;
  }

  interface HTMLElement {
    webkitRequestFullscreen?: () => Promise<void>;
  }
}

export default function DisplayPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const DISPLAY_CACHE_KEY = "display-cache-v1";

  const fetchData = useCallback(async () => {
    try {
      const [slidesRes, settingsRes] = await Promise.all([
        fetch("/api/slides", { cache: "no-store" }),
        fetch("/api/settings", { cache: "no-store" }),
      ]);

      if (slidesRes.ok) {
        const slidesData = await slidesRes.json();
        setSlides(slidesData);

        try {
          const cachedRaw = localStorage.getItem(DISPLAY_CACHE_KEY);
          const cached = cachedRaw ? JSON.parse(cachedRaw) : {};
          localStorage.setItem(DISPLAY_CACHE_KEY, JSON.stringify({ ...cached, slides: slidesData }));
        } catch {
          // ignore cache write errors
        }
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);

        try {
          const cachedRaw = localStorage.getItem(DISPLAY_CACHE_KEY);
          const cached = cachedRaw ? JSON.parse(cachedRaw) : {};
          localStorage.setItem(DISPLAY_CACHE_KEY, JSON.stringify({ ...cached, settings: settingsData }));
        } catch {
          // ignore cache write errors
        }
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);

      // Fallback hors-ligne: restaurer la dernière configuration connue
      try {
        const cachedRaw = localStorage.getItem(DISPLAY_CACHE_KEY);
        if (!cachedRaw) return;
        const cached = JSON.parse(cachedRaw) as { slides?: Slide[]; settings?: Settings };
        if (cached.slides) setSlides(cached.slides);
        if (cached.settings) setSettings(cached.settings);
      } catch {
        // ignore cache read errors
      }
    }
  }, [DISPLAY_CACHE_KEY]);

  useEffect(() => {
    fetchData();

    // Mode Google Slides: fallback polling, car on n'a pas d'événement de fin de cycle fiable.
    const interval = setInterval(() => {
      if (settings.googleSlidesEnabled && settings.googleSlidesUrl) {
        fetchData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData, settings.googleSlidesEnabled, settings.googleSlidesUrl]);

  useEffect(() => {
    const requestFullscreen = async () => {
      const doc = document as Document;
      const el = document.documentElement as HTMLElement;
      const isFullscreen = !!(document.fullscreenElement || doc.webkitFullscreenElement);
      if (isFullscreen) return;

      try {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
          return;
        }
        if (el.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen();
        }
      } catch {
        // Le navigateur peut exiger une interaction utilisateur
      }
    };

    requestFullscreen();

    const onUserGesture = () => {
      requestFullscreen();
      window.removeEventListener("pointerdown", onUserGesture);
      window.removeEventListener("keydown", onUserGesture);
      window.removeEventListener("touchstart", onUserGesture);
    };

    window.addEventListener("pointerdown", onUserGesture, { passive: true });
    window.addEventListener("keydown", onUserGesture);
    window.addEventListener("touchstart", onUserGesture, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", onUserGesture);
      window.removeEventListener("keydown", onUserGesture);
      window.removeEventListener("touchstart", onUserGesture);
    };
  }, []);

  const useGoogleSlides = settings.googleSlidesEnabled && settings.googleSlidesUrl;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black cursor-none-all">
      {useGoogleSlides ? (
        <GoogleSlidesEmbed
          url={settings.googleSlidesUrl}
          delayMs={settings.googleSlidesDelayMs}
        />
      ) : (
        <Slideshow
          slides={slides}
          transitionDuration={settings.transitionDuration}
          onCycleComplete={fetchData}
        />
      )}
      <InfoBanner settings={settings} fixed />
    </div>
  );
}
