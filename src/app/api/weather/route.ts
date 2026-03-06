import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
        }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      temp: Math.round(data.main.temp),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      city: data.name,
    });
  } catch (error) {
    console.error("Weather error:", error);
    return NextResponse.json(
      {
        temp: "--",
        description: "Indisponible",
        icon: "01d",
        city: "N/A",
      }
    );
  }
}
