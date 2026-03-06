import fs from "fs";
import path from "path";
import { supabase } from "@/lib/supabase";
import { Slide, Settings, Birthday, DEFAULT_SETTINGS } from "@/types";

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
  const row: Record<string, unknown> = {};
  if (updates.scrollingText !== undefined) row.scrolling_text = updates.scrollingText;
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

  const { data, error } = await supabase
    .from("settings")
    .upsert(row, { onConflict: "id" })
    .select()
    .single();

  if (error || !data) {
    console.error("updateSettings error:", error);
    throw new Error("Impossible de sauvegarder les paramètres");
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
