"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Slide } from "@/types";

interface SlideshowProps {
  slides: Slide[];
  transitionDuration: number;
}

export default function Slideshow({ slides, transitionDuration }: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentIndexRef = useRef(currentIndex);

  const activeSlides = slides.filter((s) => s.active);
  const activeSlidesRef = useRef(activeSlides);

  // Garder les refs à jour
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    activeSlidesRef.current = activeSlides;
  }, [activeSlides]);

  const goToNext = useCallback(() => {
    const total = activeSlidesRef.current.length;
    if (total === 0) return;

    // Même avec 1 seul slide, on force un "cycle" pour replanifier
    const next = (currentIndexRef.current + 1) % total;
    
    if (total <= 1) {
      // 1 seul slide : pas de transition, juste replanifier
      setCurrentIndex(0);
      return;
    }

    setNextIndex(next);
    setIsTransitioning(true);

    setTimeout(() => {
      setCurrentIndex(next);
      setNextIndex(null);
      setIsTransitioning(false);
    }, transitionDuration);
  }, [transitionDuration]);

  // Planification de la boucle
  useEffect(() => {
    if (activeSlides.length === 0) return;

    // Réinitialiser l'index si nécessaire
    if (currentIndex >= activeSlides.length) {
      setCurrentIndex(0);
      return;
    }

    const currentSlide = activeSlides[currentIndex];
    const duration = (currentSlide?.duration || 5) * 1000;

    timerRef.current = setTimeout(goToNext, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentIndex, activeSlides, goToNext]);

  if (activeSlides.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-6 animate-pulse-slow">🖥️</div>
          <h1 className="text-4xl font-light text-white/80 tracking-wider">
            Bi1Gestion
          </h1>
          <p className="text-lg text-white/40 mt-4 tracking-wide">
            Affichage dynamique
          </p>
          <p className="text-sm text-white/25 mt-2">
            Aucune image configurée
          </p>
        </div>
      </div>
    );
  }

  const currentSlide = activeSlides[currentIndex];
  const nextSlide = nextIndex !== null ? activeSlides[nextIndex] : null;

  return (
    <div className="absolute inset-0 bg-black overflow-hidden">
      {/* Image courante */}
      <div
        className="absolute inset-0 transition-opacity bg-center bg-cover bg-no-repeat"
        style={{
          backgroundImage: `url(/uploads/${currentSlide.filename})`,
          transitionDuration: `${transitionDuration}ms`,
          opacity: isTransitioning ? 0 : 1,
        }}
      />

      {/* Image suivante (pendant transition) */}
      {nextSlide && (
        <div
          className="absolute inset-0 transition-opacity bg-center bg-cover bg-no-repeat"
          style={{
            backgroundImage: `url(/uploads/${nextSlide.filename})`,
            transitionDuration: `${transitionDuration}ms`,
            opacity: isTransitioning ? 1 : 0,
          }}
        />
      )}

      {/* Gradient overlay en bas pour le bandeau */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
    </div>
  );
}
