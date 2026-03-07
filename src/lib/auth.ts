import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { AuthPayload } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "bi1gestion-default-secret";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Hash du mot de passe admin (généré au premier appel)
let adminPasswordHash: string | null = null;

async function getAdminHash(): Promise<string> {
  if (!adminPasswordHash) {
    adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  }
  return adminPasswordHash;
}

export async function verifyCredentials(
  username: string,
  password: string
): Promise<boolean> {
  if (username !== ADMIN_USERNAME) return false;
  // Comparaison directe pour simplifier (le hash est généré à partir du .env)
  return password === ADMIN_PASSWORD;
}

export function generateToken(username: string): string {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: "24h" });
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

export function getAuthenticatedUsername(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  const token = extractToken(authHeader);
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.username || null;
}
