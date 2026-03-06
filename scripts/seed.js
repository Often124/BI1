/**
 * Script d'initialisation de la base de données
 * Usage: node scripts/seed.js
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const UPLOADS_DIR = path.join(__dirname, "..", "public", "uploads");

const defaultDB = {
  slides: [],
  settings: {
    scrollingText:
      "Bienvenue ! Ceci est un texte défilant personnalisable depuis le panneau d'administration.",
    weatherCity: "Paris",
    weatherApiKey: "",
    showClock: true,
    showDate: true,
    showWeather: true,
    showScrollingText: true,
    transitionDuration: 1000,
    scrollSpeed: 20,
  },
};

// Créer les répertoires
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log("✅ Répertoire data/ créé");
}

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log("✅ Répertoire public/uploads/ créé");
}

// Créer la base de données
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2), "utf-8");
  console.log("✅ Base de données initialisée");
} else {
  console.log("ℹ️  Base de données existante conservée");
}

console.log("\n🚀 Initialisation terminée !");
console.log("   Lancez l'application avec : npm run dev");
console.log("   Dashboard admin : http://localhost:3000/admin");
console.log("   Écran d'affichage : http://localhost:3000");
console.log("\n   Identifiants par défaut :");
console.log("   Utilisateur : admin");
console.log("   Mot de passe : admin123");
