import fs from "fs";
import path from "path";
import { Database, DEFAULT_DB, Slide, Settings, Birthday } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// Assurer que les répertoires existent
function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

// Lire la base de données
function readDB(): Database {
  ensureDirs();
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), "utf-8");
    return { ...DEFAULT_DB };
  }
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const data = JSON.parse(raw) as Database;
    // Merge avec les valeurs par défaut pour les nouveaux champs
    return {
      slides: data.slides || [],
      settings: { ...DEFAULT_DB.settings, ...data.settings },
      birthdays: data.birthdays || [],
    };
  } catch {
    return { ...DEFAULT_DB };
  }
}

// Écrire dans la base de données
function writeDB(db: Database): void {
  ensureDirs();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

// ===== SLIDES =====

export function getSlides(): Slide[] {
  const db = readDB();
  return db.slides
    .filter((s) => s.active)
    .sort((a, b) => a.order - b.order);
}

export function getAllSlides(): Slide[] {
  const db = readDB();
  return db.slides.sort((a, b) => a.order - b.order);
}

export function getSlideById(id: string): Slide | undefined {
  const db = readDB();
  return db.slides.find((s) => s.id === id);
}

export function addSlide(slide: Slide): Slide {
  const db = readDB();
  db.slides.push(slide);
  writeDB(db);
  return slide;
}

export function updateSlide(id: string, updates: Partial<Slide>): Slide | null {
  const db = readDB();
  const index = db.slides.findIndex((s) => s.id === id);
  if (index === -1) return null;
  db.slides[index] = { ...db.slides[index], ...updates };
  writeDB(db);
  return db.slides[index];
}

export function deleteSlide(id: string): boolean {
  const db = readDB();
  const index = db.slides.findIndex((s) => s.id === id);
  if (index === -1) return false;

  const slide = db.slides[index];
  // Supprimer le fichier image
  const filePath = path.join(UPLOADS_DIR, slide.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  db.slides.splice(index, 1);
  // Réordonner
  db.slides.sort((a, b) => a.order - b.order).forEach((s, i) => {
    s.order = i;
  });
  writeDB(db);
  return true;
}

export function reorderSlides(orderedIds: string[]): Slide[] {
  const db = readDB();
  orderedIds.forEach((id, index) => {
    const slide = db.slides.find((s) => s.id === id);
    if (slide) {
      slide.order = index;
    }
  });
  writeDB(db);
  return db.slides.sort((a, b) => a.order - b.order);
}

// ===== SETTINGS =====

export function getSettings(): Settings {
  const db = readDB();
  return db.settings;
}

export function updateSettings(updates: Partial<Settings>): Settings {
  const db = readDB();
  db.settings = { ...db.settings, ...updates };
  writeDB(db);
  return db.settings;
}

// ===== UPLOADS =====

export function getUploadsDir(): string {
  ensureDirs();
  return UPLOADS_DIR;
}

// ===== BIRTHDAYS =====

export function getBirthdays(): Birthday[] {
  const db = readDB();
  return db.birthdays || [];
}

export function addBirthday(birthday: Birthday): Birthday {
  const db = readDB();
  if (!db.birthdays) db.birthdays = [];
  db.birthdays.push(birthday);
  writeDB(db);
  return birthday;
}

export function updateBirthday(id: string, updates: Partial<Birthday>): Birthday | null {
  const db = readDB();
  if (!db.birthdays) return null;
  const index = db.birthdays.findIndex((b) => b.id === id);
  if (index === -1) return null;
  db.birthdays[index] = { ...db.birthdays[index], ...updates };
  writeDB(db);
  return db.birthdays[index];
}

export function deleteBirthday(id: string): boolean {
  const db = readDB();
  if (!db.birthdays) return false;
  const index = db.birthdays.findIndex((b) => b.id === id);
  if (index === -1) return false;
  db.birthdays.splice(index, 1);
  writeDB(db);
  return true;
}
