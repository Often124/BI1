import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { AuthPayload, AdminPermission } from "@/types";
import { getAdminUserByUsername } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "bi1gestion-default-secret";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

const ALL_PERMISSIONS: AdminPermission[] = [
  "manageSlides",
  "manageSettings",
  "manageBirthdays",
  "manageUsers",
  "viewLogs",
];

export function getAllPermissions(): AdminPermission[] {
  return [...ALL_PERMISSIONS];
}

export function hasPermissionFromPayload(
  payload: Pick<AuthPayload, "permissions"> | null,
  permission: AdminPermission
): boolean {
  if (!payload) return false;
  const anyPayload = payload as unknown as { username?: string; permissions?: unknown };
  const permissions = Array.isArray(anyPayload.permissions) ? anyPayload.permissions : [];

  // Compatibilite: anciens tokens sans champ permissions pour le compte admin principal.
  if (permissions.length === 0 && anyPayload.username === ADMIN_USERNAME) {
    return true;
  }

  return permissions.includes(permission);
}

export async function authenticateUser(
  username: string,
  password: string
): Promise<{ username: string; permissions: AdminPermission[] } | null> {
  // Fallback historique via .env
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return { username, permissions: getAllPermissions() };
  }

  const dbUser = await getAdminUserByUsername(username);
  if (!dbUser || !dbUser.isActive) return null;

  const valid = await bcrypt.compare(password, dbUser.passwordHash);
  if (!valid) return null;

  return {
    username: dbUser.username,
    permissions: dbUser.permissions,
  };
}

export function generateToken(username: string, permissions: AdminPermission[]): string {
  return jwt.sign({ username, permissions }, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

export function isAuthenticated(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const token = extractToken(authHeader);
  if (!token) return false;
  const payload = verifyToken(token);
  return payload !== null;
}

export function hasPermission(request: Request, permission: AdminPermission): boolean {
  const authHeader = request.headers.get("authorization");
  const token = extractToken(authHeader);
  if (!token) return false;
  const payload = verifyToken(token);
  return hasPermissionFromPayload(payload, permission);
}

export function getAuthenticatedUsername(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  const token = extractToken(authHeader);
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.username || null;
}
