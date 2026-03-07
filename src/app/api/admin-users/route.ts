import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  addAdminLog,
  addAdminUser,
  deleteAdminUser,
  getAdminUsers,
  updateAdminUser,
} from "@/lib/db";
import {
  getAuthenticatedUsername,
  getAllPermissions,
  hasPermission,
  isAuthenticated,
} from "@/lib/auth";
import { AdminPermission } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizePermissions(value: unknown): AdminPermission[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(getAllPermissions());
  return value.filter((p): p is AdminPermission => typeof p === "string" && allowed.has(p as AdminPermission));
}

export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!hasPermission(request, "manageUsers")) {
    return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
  }

  const users = await getAdminUsers();
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!hasPermission(request, "manageUsers")) {
    return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    const permissions = normalizePermissions(body.permissions);

    if (!username || !password) {
      return NextResponse.json({ error: "Nom d'utilisateur et mot de passe requis" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Mot de passe trop court (min 6 caractères)" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await addAdminUser({
      username,
      passwordHash,
      isActive: true,
      permissions,
    });

    if (!created) {
      return NextResponse.json({ error: "Impossible de créer l'utilisateur" }, { status: 500 });
    }

    const actor = getAuthenticatedUsername(request) || "admin";
    await addAdminLog("users:create", `${actor} a créé l'utilisateur ${username}`);

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("admin-users POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!hasPermission(request, "manageUsers")) {
    return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const id = String(body.id || "").trim();
    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const updates: {
      username?: string;
      passwordHash?: string;
      isActive?: boolean;
      permissions?: AdminPermission[];
    } = {};

    if (body.username !== undefined) updates.username = String(body.username).trim();
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);
    if (body.permissions !== undefined) updates.permissions = normalizePermissions(body.permissions);
    if (body.password !== undefined && String(body.password).length > 0) {
      const pwd = String(body.password);
      if (pwd.length < 6) {
        return NextResponse.json({ error: "Mot de passe trop court (min 6 caractères)" }, { status: 400 });
      }
      updates.passwordHash = await bcrypt.hash(pwd, 10);
    }

    const updated = await updateAdminUser(id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Utilisateur introuvable ou mise à jour impossible" }, { status: 404 });
    }

    const actor = getAuthenticatedUsername(request) || "admin";
    await addAdminLog("users:update", `${actor} a modifié l'utilisateur ${updated.username}`);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("admin-users PUT error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!hasPermission(request, "manageUsers")) {
    return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const username = searchParams.get("username") || "";

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const actor = getAuthenticatedUsername(request) || "admin";
    if (username && actor === username) {
      return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte" }, { status: 400 });
    }

    const ok = await deleteAdminUser(id);
    if (!ok) {
      return NextResponse.json({ error: "Suppression impossible" }, { status: 404 });
    }

    await addAdminLog("users:delete", `${actor} a supprimé l'utilisateur ${username || id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("admin-users DELETE error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
