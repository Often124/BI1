import fs from "fs";
import path from "path";
import { supabase } from "@/lib/supabase";
import { Slide, Settings, Birthday, DEFAULT_SETTINGS, AdminLog, AdminUser, AdminPermission } from "@/types";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

// ===== Helpers : conversion snake_case <-> camelCase =====

function slideFromRow(row: Record<string, unknown>): Slide {
  return {
    id: row.id as string,
    filename: row.filename as string,
    originalName: row.original_name as string,
    duration: row.duration as number,
    order: row.order as number,
    active: row.active as boolean,
    createdAt: row.created_at as string,
  };
}

function settingsFromRow(row: Record<string, unknown>): Settings {
  return {
    scrollingText: row.scrolling_text as string,
    emergencyMode: (row.emergency_mode as boolean) || false,
    emergencyMessage: (row.emergency_message as string) || "",
    weatherCity: row.weather_city as string,
    weatherApiKey: row.weather_api_key as string,
    showClock: row.show_clock as boolean,
    showDate: row.show_date as boolean,
    showWeather: row.show_weather as boolean,
    showScrollingText: row.show_scrolling_text as boolean,
    showBirthdays: row.show_birthdays as boolean,
    transitionDuration: row.transition_duration as number,
    scrollSpeed: row.scroll_speed as number,
    googleSlidesUrl: row.google_slides_url as string,
    googleSlidesEnabled: row.google_slides_enabled as boolean,
    googleSlidesDelayMs: row.google_slides_delay_ms as number,
  };
}

function logFromRow(row: Record<string, unknown>): AdminLog {
  return {
    id: row.id as string,
    action: row.action as string,
    details: row.details as string,
    createdAt: row.created_at as string,
  };
}

function normalizePermissions(value: unknown): AdminPermission[] {
  if (!Array.isArray(value)) return [];
  return value.filter((p): p is AdminPermission => typeof p === "string") as AdminPermission[];
}

function adminUserFromRow(row: Record<string, unknown>): AdminUser {
  return {
    id: row.id as string,
    username: row.username as string,
    isActive: row.is_active as boolean,
    permissions: normalizePermissions(row.permissions),
    createdAt: row.created_at as string,
  };
}

// ===== SLIDES =====

export async function getSlides(): Promise<Slide[]> {
  const { data, error } = await supabase
    .from("slides")
    .select("*")
    .eq("active", true)
    .order("order", { ascending: true });

  if (error) {
    console.error("getSlides error:", error);
    return [];
  }
  return (data || []).map(slideFromRow);
}

export async function getAllSlides(): Promise<Slide[]> {
  const { data, error } = await supabase
    .from("slides")
    .select("*")
    .order("order", { ascending: true });

  if (error) {
    console.error("getAllSlides error:", error);
    return [];
  }
  return (data || []).map(slideFromRow);
}

export async function getSlideById(id: string): Promise<Slide | null> {
  const { data, error } = await supabase
    .from("slides")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return slideFromRow(data);
}

export async function addSlide(slide: Slide): Promise<Slide> {
  const { error } = await supabase.from("slides").insert({
    id: slide.id,
    filename: slide.filename,
    original_name: slide.originalName,
    duration: slide.duration,
    order: slide.order,
    active: slide.active,
    created_at: slide.createdAt,
  });

  if (error) {
    console.error("addSlide error:", error);
    throw new Error("Erreur ajout slide");
  }
  return slide;
}

export async function updateSlide(id: string, updates: Partial<Slide>): Promise<Slide | null> {
  // Convertir camelCase -> snake_case pour les colonnes concernées
  const row: Record<string, unknown> = {};
  if (updates.filename !== undefined) row.filename = updates.filename;
  if (updates.originalName !== undefined) row.original_name = updates.originalName;
  if (updates.duration !== undefined) row.duration = updates.duration;
  if (updates.order !== undefined) row.order = updates.order;
  if (updates.active !== undefined) row.active = updates.active;

  const { data, error } = await supabase
    .from("slides")
    .update(row)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    console.error("updateSlide error:", error);
    return null;
  }
  return slideFromRow(data);
}

export async function deleteSlide(id: string): Promise<boolean> {
  // Récupérer le slide pour supprimer le fichier
  const slide = await getSlideById(id);
  if (!slide) return false;

  const { error } = await supabase.from("slides").delete().eq("id", id);
  if (error) {
    console.error("deleteSlide error:", error);
    return false;
  }

  // Supprimer le fichier image local
  const filePath = path.join(UPLOADS_DIR, slide.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Réordonner les slides restants
  const remaining = await getAllSlides();
  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].order !== i) {
      await supabase.from("slides").update({ order: i }).eq("id", remaining[i].id);
    }
  }

  return true;
}

export async function reorderSlides(orderedIds: string[]): Promise<Slide[]> {
  for (let i = 0; i < orderedIds.length; i++) {
    await supabase.from("slides").update({ order: i }).eq("id", orderedIds[i]);
  }
  return getAllSlides();
}

// ===== SETTINGS =====

export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) {
    console.error("getSettings error:", error);
    return { ...DEFAULT_SETTINGS };
  }
  return settingsFromRow(data);
}

export async function updateSettings(updates: Partial<Settings>): Promise<Settings> {
  const triesToUpdateEmergency =
    updates.emergencyMode !== undefined || updates.emergencyMessage !== undefined;

  const row: Record<string, unknown> = {};
  if (updates.scrollingText !== undefined) row.scrolling_text = updates.scrollingText;
  if (updates.emergencyMode !== undefined) row.emergency_mode = updates.emergencyMode;
  if (updates.emergencyMessage !== undefined) row.emergency_message = updates.emergencyMessage;
  if (updates.weatherCity !== undefined) row.weather_city = updates.weatherCity;
  if (updates.weatherApiKey !== undefined) row.weather_api_key = updates.weatherApiKey;
  if (updates.showClock !== undefined) row.show_clock = updates.showClock;
  if (updates.showDate !== undefined) row.show_date = updates.showDate;
  if (updates.showWeather !== undefined) row.show_weather = updates.showWeather;
  if (updates.showScrollingText !== undefined) row.show_scrolling_text = updates.showScrollingText;
  if (updates.showBirthdays !== undefined) row.show_birthdays = updates.showBirthdays;
  if (updates.transitionDuration !== undefined) row.transition_duration = updates.transitionDuration;
  if (updates.scrollSpeed !== undefined) row.scroll_speed = updates.scrollSpeed;
  if (updates.googleSlidesUrl !== undefined) row.google_slides_url = updates.googleSlidesUrl;
  if (updates.googleSlidesEnabled !== undefined) row.google_slides_enabled = updates.googleSlidesEnabled;
  if (updates.googleSlidesDelayMs !== undefined) row.google_slides_delay_ms = updates.googleSlidesDelayMs;
  row.id = 1;

  let { data, error } = await supabase
    .from("settings")
    .upsert(row, { onConflict: "id" })
    .select()
    .single();

  // Compatibilité si la migration SQL n'a pas encore ajouté emergency_mode/emergency_message.
  if (error && /emergency_mode|emergency_message/i.test(error.message || "")) {
    if (triesToUpdateEmergency) {
      throw new Error("Mode urgence indisponible: exécute la migration SQL Supabase (colonnes emergency_mode/emergency_message manquantes)");
    }

    const fallbackRow = { ...row };
    delete fallbackRow.emergency_mode;
    delete fallbackRow.emergency_message;

    const retry = await supabase
      .from("settings")
      .upsert(fallbackRow, { onConflict: "id" })
      .select()
      .single();

    data = retry.data;
    error = retry.error;
  }

  if (error || !data) {
    console.error("updateSettings error:", error);
    throw new Error(`Impossible de sauvegarder les paramètres (${error?.message || "erreur inconnue"})`);
  }

  return settingsFromRow(data);
}

// ===== UPLOADS =====

export function getUploadsDir(): string {
  ensureUploadsDir();
  return UPLOADS_DIR;
}

// ===== BIRTHDAYS =====

export async function getBirthdays(): Promise<Birthday[]> {
  const { data, error } = await supabase
    .from("birthdays")
    .select("*");

  if (error) {
    console.error("getBirthdays error:", error);
    return [];
  }
  return (data || []) as Birthday[];
}

export async function addBirthday(birthday: Birthday): Promise<Birthday> {
  const { error } = await supabase.from("birthdays").insert(birthday);
  if (error) {
    console.error("addBirthday error:", error);
    throw new Error("Erreur ajout anniversaire");
  }
  return birthday;
}

export async function updateBirthday(id: string, updates: Partial<Birthday>): Promise<Birthday | null> {
  const { data, error } = await supabase
    .from("birthdays")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    console.error("updateBirthday error:", error);
    return null;
  }
  return data as Birthday;
}

export async function deleteBirthday(id: string): Promise<boolean> {
  const { error } = await supabase.from("birthdays").delete().eq("id", id);
  if (error) {
    console.error("deleteBirthday error:", error);
    return false;
  }
  return true;
}

// ===== ADMIN LOGS =====

export async function addAdminLog(action: string, details: string): Promise<void> {
  const { error } = await supabase.from("admin_logs").insert({
    action,
    details,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("addAdminLog error:", error);
  }
}

export async function getAdminLogs(limit = 100): Promise<AdminLog[]> {
  const { data, error } = await supabase
    .from("admin_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getAdminLogs error:", error);
    return [];
  }

  return (data || []).map(logFromRow);
}

// ===== ADMIN USERS =====

export async function getAdminUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, username, is_active, permissions, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getAdminUsers error:", error);
    return [];
  }

  return (data || []).map(adminUserFromRow);
}

export async function getAdminUserByUsername(
  username: string
): Promise<(AdminUser & { passwordHash: string }) | null> {
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, username, is_active, permissions, created_at, password_hash")
    .eq("username", username)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    ...adminUserFromRow(data),
    passwordHash: data.password_hash as string,
  };
}

export async function addAdminUser(params: {
  username: string;
  passwordHash: string;
  isActive: boolean;
  permissions: AdminPermission[];
}): Promise<AdminUser> {
  const { data, error } = await supabase
    .from("admin_users")
    .insert({
      username: params.username,
      password_hash: params.passwordHash,
      is_active: params.isActive,
      permissions: params.permissions,
    })
    .select("id, username, is_active, permissions, created_at")
    .single();

  if (error || !data) {
    console.error("addAdminUser error:", error);
    throw new Error(error?.message || "Impossible de créer l'utilisateur");
  }

  return adminUserFromRow(data);
}

export async function updateAdminUser(
  id: string,
  updates: Partial<{
    username: string;
    passwordHash: string;
    isActive: boolean;
    permissions: AdminPermission[];
  }>
): Promise<AdminUser | null> {
  const row: Record<string, unknown> = {};
  if (updates.username !== undefined) row.username = updates.username;
  if (updates.passwordHash !== undefined) row.password_hash = updates.passwordHash;
  if (updates.isActive !== undefined) row.is_active = updates.isActive;
  if (updates.permissions !== undefined) row.permissions = updates.permissions;

  const { data, error } = await supabase
    .from("admin_users")
    .update(row)
    .eq("id", id)
    .select("id, username, is_active, permissions, created_at")
    .single();

  if (error || !data) {
    console.error("updateAdminUser error:", error);
    return null;
  }

  return adminUserFromRow(data);
}

export async function deleteAdminUser(id: string): Promise<boolean> {
  const { error } = await supabase.from("admin_users").delete().eq("id", id);
  if (error) {
    console.error("deleteAdminUser error:", error);
    return false;
  }
  return true;
}
