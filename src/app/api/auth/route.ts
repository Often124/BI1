import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, generateToken } from "@/lib/auth";
import { addAdminLog } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Nom d'utilisateur et mot de passe requis" },
        { status: 400 }
      );
    }

    const authUser = await authenticateUser(username, password);
    if (!authUser) {
      await addAdminLog("auth:failed", `Échec de connexion pour ${username || "inconnu"}`);
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    const token = generateToken(authUser.username, authUser.permissions);
    await addAdminLog("auth:login", `${authUser.username} s'est connecté`);
    return NextResponse.json({
      token,
      username: authUser.username,
      permissions: authUser.permissions,
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
