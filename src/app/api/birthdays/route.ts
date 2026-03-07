import { NextRequest, NextResponse } from "next/server";
import { getBirthdays, addBirthday, updateBirthday, deleteBirthday, addAdminLog } from "@/lib/db";
import { getAuthenticatedUsername, isAuthenticated } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/birthdays — liste publique
export async function GET() {
  const birthdays = await getBirthdays();
  return NextResponse.json(birthdays);
}

// POST /api/birthdays — ajouter (admin)
export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, day, month } = body;

    if (!name || !day || !month) {
      return NextResponse.json({ error: "Nom, jour et mois requis" }, { status: 400 });
    }

    if (day < 1 || day > 31 || month < 1 || month > 12) {
      return NextResponse.json({ error: "Date invalide" }, { status: 400 });
    }

    const birthday = await addBirthday({
      id: uuidv4(),
      name: name.trim(),
      day: Number(day),
      month: Number(month),
    });

    const username = getAuthenticatedUsername(request) || "admin";
    await addAdminLog("birthdays:create", `${username} a ajouté l'anniversaire de ${birthday.name}`);

    return NextResponse.json(birthday, { status: 201 });
  } catch (error) {
    console.error("Create birthday error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/birthdays — modifier (admin)
export async function PUT(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    if (updates.name) updates.name = updates.name.trim();
    if (updates.day) updates.day = Number(updates.day);
    if (updates.month) updates.month = Number(updates.month);

    const birthday = await updateBirthday(id, updates);
    if (!birthday) {
      return NextResponse.json({ error: "Anniversaire non trouvé" }, { status: 404 });
    }

    const username = getAuthenticatedUsername(request) || "admin";
    await addAdminLog("birthdays:update", `${username} a modifié un anniversaire (${id})`);

    return NextResponse.json(birthday);
  } catch (error) {
    console.error("Update birthday error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/birthdays — supprimer (admin)
export async function DELETE(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const deleted = await deleteBirthday(id);
    if (!deleted) {
      return NextResponse.json({ error: "Anniversaire non trouvé" }, { status: 404 });
    }

    const username = getAuthenticatedUsername(request) || "admin";
    await addAdminLog("birthdays:delete", `${username} a supprimé un anniversaire (${id})`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete birthday error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
