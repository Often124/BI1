import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

// GET /api/settings - Récupérer les paramètres
export async function GET(request: NextRequest) {
  const settings = getSettings();
  const isAdmin = isAuthenticated(request);

  if (isAdmin) {
    // L'admin reçoit tout, y compris la clé API
    return NextResponse.json(settings);
  }

  // Public : masquer la clé API météo
  const publicSettings = { ...settings, weatherApiKey: settings.weatherApiKey ? "***" : "" };
  return NextResponse.json(publicSettings);
}

// PUT /api/settings - Mettre à jour les paramètres (admin)
export async function PUT(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Si la clé API est masquée ("***"), ne pas l'écraser
    if (body.weatherApiKey === "***") {
      delete body.weatherApiKey;
    }

    const settings = updateSettings(body);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
