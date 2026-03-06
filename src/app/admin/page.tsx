"use client";

import { useState, useEffect, useCallback } from "react";
import { Slide, Settings, DEFAULT_SETTINGS, Birthday } from "@/types";
import LoginForm from "@/components/admin/LoginForm";
import SlideManager from "@/components/admin/SlideManager";
import BannerSettings from "@/components/admin/BannerSettings";
import BirthdayManager from "@/components/admin/BirthdayManager";
import DisplayPreview from "@/components/admin/DisplayPreview";

type Tab = "slides" | "settings" | "birthdays" | "preview";

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("slides");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);

  // Vérifier le token au chargement
  useEffect(() => {
    const savedToken = localStorage.getItem("admin_token");
    if (savedToken) {
      setToken(savedToken);
    }
    setLoading(false);
  }, []);

  // Charger les données
  const fetchData = useCallback(async () => {
    if (!token) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [slidesRes, settingsRes, birthdaysRes] = await Promise.all([
        fetch("/api/slides", { headers }),
        fetch("/api/settings", { headers }),
        fetch("/api/birthdays", { headers }),
      ]);

      if (slidesRes.status === 401) {
        handleLogout();
        return;
      }

      if (slidesRes.ok) {
        setSlides(await slidesRes.json());
      }

      if (settingsRes.ok) {
        setSettings(await settingsRes.json());
      }

      if (birthdaysRes.ok) {
        setBirthdays(await birthdaysRes.json());
      }
    } catch (error) {
      console.error("Erreur chargement:", error);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogin = (newToken: string) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900">
        <div className="flex items-center gap-3 text-white">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Chargement...
        </div>
      </div>
    );
  }

  if (!token) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "slides", label: "Images", icon: "🖼️" },
    { id: "birthdays", label: "Anniversaires", icon: "🎂" },
    { id: "settings", label: "Paramètres", icon: "⚙️" },
    { id: "preview", label: "Prévisualisation", icon: "📺" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900">
      {/* Barre de navigation */}
      <nav className="bg-gray-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Bi1Gestion</h1>
                <p className="text-xs text-gray-400 -mt-0.5">Administration</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-gray-800/50 rounded-xl p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                      : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800/50"
                title="Voir l'affichage"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-gray-800/50"
                title="Déconnexion"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 admin-scroll" style={{ height: "calc(100vh - 4rem)", overflowY: "auto" }}>
        {activeTab === "slides" && (
          <SlideManager slides={slides} token={token} onUpdate={fetchData} />
        )}

        {activeTab === "settings" && (
          <BannerSettings settings={settings} token={token} onUpdate={fetchData} />
        )}

        {activeTab === "birthdays" && (
          <BirthdayManager birthdays={birthdays} token={token} onUpdate={fetchData} />
        )}

        {activeTab === "preview" && (
          <DisplayPreview slides={slides} settings={settings} />
        )}
      </main>
    </div>
  );
}
