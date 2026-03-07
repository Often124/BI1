export interface Slide {
  id: string;
  filename: string;
  originalName: string;
  duration: number; // secondes
  order: number;
  active: boolean;
  createdAt: string;
}

export interface Birthday {
  id: string;
  name: string;
  day: number;   // 1-31
  month: number; // 1-12
}

export interface Settings {
  scrollingText: string;
  emergencyMode: boolean;
  emergencyMessage: string;
  weatherCity: string;
  weatherApiKey: string;
  showClock: boolean;
  showDate: boolean;
  showWeather: boolean;
  showScrollingText: boolean;
  showBirthdays: boolean;
  transitionDuration: number; // millisecondes
  scrollSpeed: number; // secondes pour un cycle complet
  googleSlidesUrl: string;
  googleSlidesEnabled: boolean;
  googleSlidesDelayMs: number; // délai entre les slides Google en ms
}

export interface Database {
  slides: Slide[];
  settings: Settings;
  birthdays: Birthday[];
}

export interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  city: string;
  forecast?: {
    day: string;
    tempMin: number;
    tempMax: number;
    icon: string;
  }[];
}

export interface AdminLog {
  id: string;
  action: string;
  details: string;
  createdAt: string;
}

export type AdminPermission =
  | "manageSlides"
  | "manageSettings"
  | "manageBirthdays"
  | "manageUsers"
  | "viewLogs";

export interface AdminUser {
  id: string;
  username: string;
  isActive: boolean;
  permissions: AdminPermission[];
  createdAt: string;
}

export interface AuthPayload {
  username: string;
  permissions: AdminPermission[];
  iat: number;
  exp: number;
}

export const DEFAULT_SETTINGS: Settings = {
  scrollingText: "Bienvenue ! Ceci est un texte défilant personnalisable depuis le panneau d'administration.",
  emergencyMode: false,
  emergencyMessage: "",
  weatherCity: "Paris",
  weatherApiKey: "",
  showClock: true,
  showDate: true,
  showWeather: true,
  showScrollingText: true,
  showBirthdays: true,
  transitionDuration: 1000,
  scrollSpeed: 20,
  googleSlidesUrl: "",
  googleSlidesEnabled: false,
  googleSlidesDelayMs: 5000,
};

export const DEFAULT_DB: Database = {
  slides: [],
  settings: { ...DEFAULT_SETTINGS },
  birthdays: [],
};
