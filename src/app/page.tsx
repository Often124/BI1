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

  const REFRESH_MS = 5000;

  const fetchData = useCallback(async () => {
    try {
      const [slidesRes, settingsRes] = await Promise.all([
        fetch("/api/slides", { cache: "no-store" }),
        fetch("/api/settings", { cache: "no-store" }),
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

    // Actualisation automatique sans refresh de page
    const interval = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchData, REFRESH_MS]);

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
