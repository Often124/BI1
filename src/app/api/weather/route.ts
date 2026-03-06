import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function shortDayLabel(timestamp: number): string {
  return new Date(timestamp * 1000)
    .toLocaleDateString("fr-FR", { weekday: "short" })
    .replace(".", "")
    .toUpperCase();
}

export async function GET(request: NextRequest) {
  try {
    const settings = await getSettings();
    const settingsKey = settings.weatherApiKey && settings.weatherApiKey !== "***" ? settings.weatherApiKey : "";
    const envKey =
      process.env.OPENWEATHER_API_KEY ||
      process.env.WEATHER_API_KEY ||
      process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY ||
      "";
    const apiKey = settingsKey || envKey;
    const city = settings.weatherCity || "Paris";

    if (!apiKey) {
      return NextResponse.json(
        {
          temp: "--",
          description: "Clé API non configurée",
          icon: "01d",
          city,
          forecast: [],
        }
      );
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&lang=fr&appid=${apiKey}`;
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const message = errorData?.message || `Weather API error: ${response.status}`;
      return NextResponse.json(
        {
          temp: "--",
          description: `Météo indisponible (${message})`,
          icon: "01d",
          city,
          forecast: [],
        }
      );
    }

    const data = await response.json();

    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&lang=fr&appid=${apiKey}`;
    const forecastResponse = await fetch(forecastUrl, { cache: "no-store" });

    let forecast: { day: string; tempMin: number; tempMax: number; icon: string }[] = [];

    if (forecastResponse.ok) {
      const forecastData = await forecastResponse.json();
      const today = new Date().toISOString().slice(0, 10);
      const grouped = new Map<string, { tempsMin: number[]; tempsMax: number[]; icon: string; timestamp: number }>();

      for (const entry of forecastData.list || []) {
        const dateKey = (entry.dt_txt as string)?.slice(0, 10);
        if (!dateKey || dateKey === today) continue;
        if (!grouped.has(dateKey)) {
          grouped.set(dateKey, {
            tempsMin: [Number(entry.main.temp_min)],
            tempsMax: [Number(entry.main.temp_max)],
            icon: String(entry.weather?.[0]?.icon || "01d"),
            timestamp: Number(entry.dt),
          });
          continue;
        }

        const current = grouped.get(dateKey)!;
        current.tempsMin.push(Number(entry.main.temp_min));
        current.tempsMax.push(Number(entry.main.temp_max));
      }

      forecast = Array.from(grouped.values())
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, 3)
        .map((dayData) => ({
          day: shortDayLabel(dayData.timestamp),
          tempMin: Math.round(Math.min(...dayData.tempsMin)),
          tempMax: Math.round(Math.max(...dayData.tempsMax)),
          icon: dayData.icon,
        }));
    }

    return NextResponse.json({
      temp: Math.round(data.main.temp),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      city: data.name,
      forecast,
    });
  } catch (error) {
    console.error("Weather error:", error);
    return NextResponse.json(
      {
        temp: "--",
        description: "Indisponible",
        icon: "01d",
        city: "N/A",
        forecast: [],
      }
    );
  }
}
