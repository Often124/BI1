"use client";

import { useState, useEffect } from "react";
import { WeatherData } from "@/types";

export default function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch("/api/weather", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setWeather(data);
        }
      } catch (error) {
        console.error("Erreur météo:", error);
      }
    };

    fetchWeather();
    // Actualiser toutes les 60 secondes pour refléter rapidement les changements de clé/ville
    const interval = setInterval(fetchWeather, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!weather) {
    return (
      <div className="flex items-center gap-2 text-white/50">
        <span className="text-sm">Chargement météo...</span>
      </div>
    );
  }

  const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {weather.icon && String(weather.temp) !== "--" ? (
          <img
            src={iconUrl}
            alt={weather.description}
            className="w-10 h-10 -my-2"
          />
        ) : (
          <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
        )}
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-white leading-tight">
            {String(weather.temp) !== "--" ? `${weather.temp}°C` : weather.temp}
          </span>
          <span className="text-xs text-white/70 capitalize leading-tight">
            {weather.city} — {weather.description}
          </span>
        </div>
      </div>

      {weather.forecast && weather.forecast.length > 0 && (
        <div className="flex items-center gap-2">
          {weather.forecast.map((forecastDay) => (
            <div key={forecastDay.day} className="flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-1">
              <span className="text-[10px] font-semibold text-white/80">{forecastDay.day}</span>
              <img
                src={`https://openweathermap.org/img/wn/${forecastDay.icon}.png`}
                alt={forecastDay.day}
                className="w-5 h-5"
              />
              <span className="text-[10px] text-white/85">
                {forecastDay.tempMin}°/{forecastDay.tempMax}°
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
