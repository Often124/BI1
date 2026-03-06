import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const settings = await getSettings();
    const apiKey = settings.weatherApiKey || process.env.OPENWEATHER_API_KEY;
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
    const response = await fetch(url, { next: { revalidate: 600 } }); // Cache 10 min

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
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
