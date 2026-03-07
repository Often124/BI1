import { NextRequest, NextResponse } from "next/server";
import { hasPermission, isAuthenticated } from "@/lib/auth";
import { getAdminLogs } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!hasPermission(request, "viewLogs")) {
    return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const requestedLimit = Number(searchParams.get("limit") || "100");
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 500) : 100;

  const logs = await getAdminLogs(limit);
  return NextResponse.json(logs);
}
