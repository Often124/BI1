"use client";

import { Settings } from "@/types";
import Clock from "./Clock";
import DateDisplay from "./DateDisplay";
import Weather from "./Weather";
import BirthdayDisplay from "./BirthdayDisplay";
import ScrollingText from "./ScrollingText";

interface InfoBannerProps {
  settings: Settings;
}

export default function InfoBanner({ settings }: InfoBannerProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-10">
      {/* Bandeau principal */}
      <div className="bg-black/80 backdrop-blur-md border-t border-white/10">
        {/* Ligne du texte défilant */}
        {settings.showScrollingText && settings.scrollingText && (
          <div className="border-b border-white/5 py-2 px-4">
            <ScrollingText text={settings.scrollingText} speed={settings.scrollSpeed} />
          </div>
        )}

        {/* Ligne d'infos: heure, date, météo, anniversaires */}
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-8">
            {settings.showClock && <Clock />}
            {settings.showDate && <DateDisplay />}
          </div>

          <div className="flex items-center gap-6">
            {settings.showBirthdays && <BirthdayDisplay />}
            {settings.showWeather && <Weather />}
          </div>
        </div>
      </div>
    </div>
  );
}
