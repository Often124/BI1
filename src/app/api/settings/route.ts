import { NextRequest, NextResponse } from "next/server";
import { addAdminLog, getSettings, updateSettings } from "@/lib/db";
import { getAuthenticatedUsername, hasPermission, isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/settings - Récupérer les paramètres
export async function GET(request: NextRequest) {
  const settings = await getSettings();
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
  if (!hasPermission(request, "manageSettings")) {
    return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
  }

  try {
    const body = await request.json();

    // Si la clé API est masquée ("***"), ne pas l'écraser
    if (body.weatherApiKey === "***") {
      delete body.weatherApiKey;
    }

    const settings = await updateSettings(body);
    const username = getAuthenticatedUsername(request) || "admin";
    await addAdminLog("settings:update", `${username} a modifié les paramètres du bandeau`);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Update settings error:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
