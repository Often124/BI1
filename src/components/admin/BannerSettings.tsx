"use client";

import { useState, useEffect } from "react";
import { Settings } from "@/types";

interface BannerSettingsProps {
  settings: Settings;
  token: string;
  onUpdate: () => void;
}

export default function BannerSettings({ settings, token, onUpdate }: BannerSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(localSettings),
      });

      if (res.ok) {
        setSaved(true);
        onUpdate();
        setTimeout(() => setSaved(false), 2000);
      } else {
        const err = await res.json().catch(() => ({ error: "Erreur de sauvegarde" }));
        const message = err.error || "Erreur de sauvegarde";
        setErrorMessage(message);
        alert(message);
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      setErrorMessage("Erreur réseau lors de la sauvegarde");
      alert("Erreur réseau lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Paramètres du bandeau
        </h2>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`inline-flex items-center gap-2 px-4 py-2.5 font-medium rounded-xl transition-all duration-200 shadow-lg ${
            saved
              ? "bg-green-600 text-white shadow-green-600/25"
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25"
          }`}
        >
          {saving ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sauvegarde...
            </>
          ) : saved ? (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Sauvegardé !
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Sauvegarder
            </>
          )}
        </button>
      </div>

      {errorMessage && (
        <div className="px-4 py-3 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 text-sm">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mode urgence */}
        <div className="lg:col-span-2 bg-red-900/20 rounded-xl p-5 border border-red-500/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-red-300 flex items-center gap-2">
              <span className="text-xl">🚨</span>
              Mode urgence / message prioritaire
            </h3>
            <button
              onClick={() => setLocalSettings({ ...localSettings, emergencyMode: !localSettings.emergencyMode })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localSettings.emergencyMode ? "bg-red-600" : "bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localSettings.emergencyMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <textarea
            value={localSettings.emergencyMessage}
            onChange={(e) => setLocalSettings({ ...localSettings, emergencyMessage: e.target.value })}
            rows={2}
            className="w-full px-4 py-3 bg-red-950/30 border border-red-500/30 rounded-xl text-red-100 placeholder-red-200/50 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-transparent transition-all resize-none"
            placeholder="Message prioritaire (ex: Alerte incendie, évacuez le bâtiment immédiatement)"
          />
          <p className="text-xs text-red-200/80 mt-2">
            Quand activé, ce message est affiché en priorité dans le bandeau.
          </p>
        </div>

        {/* Texte défilant */}
        <div className="lg:col-span-2 bg-gray-800/40 rounded-xl p-5 border border-gray-700/50">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Texte défilant
          </label>
          <textarea
            value={localSettings.scrollingText}
            onChange={(e) => setLocalSettings({ ...localSettings, scrollingText: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all resize-none"
            placeholder="Entrez le texte qui défilera en bas de l'écran..."
          />
        </div>

        {/* Ville météo */}
        <div className="bg-gray-800/40 rounded-xl p-5 border border-gray-700/50">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Ville pour la météo
          </label>
          <input
            type="text"
            value={localSettings.weatherCity}
            onChange={(e) => setLocalSettings({ ...localSettings, weatherCity: e.target.value })}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
            placeholder="Paris"
          />
        </div>

        {/* Clé API météo */}
        <div className="bg-gray-800/40 rounded-xl p-5 border border-gray-700/50">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Clé API OpenWeatherMap
          </label>
          <input
            type="text"
            value={localSettings.weatherApiKey}
            onChange={(e) => setLocalSettings({ ...localSettings, weatherApiKey: e.target.value })}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
            placeholder="Votre clé API..."
          />
          <p className="text-xs text-gray-500 mt-2">
            Obtenez une clé gratuite sur{" "}
            <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              openweathermap.org
            </a>
          </p>
        </div>

        {/* Durée de transition */}
        <div className="bg-gray-800/40 rounded-xl p-5 border border-gray-700/50">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Durée de transition (ms)
          </label>
          <input
            type="number"
            min="200"
            max="5000"
            step="100"
            value={localSettings.transitionDuration}
            onChange={(e) => setLocalSettings({ ...localSettings, transitionDuration: parseInt(e.target.value) || 1000 })}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
          />
        </div>

        {/* Vitesse de défilement du texte */}
        <div className="bg-gray-800/40 rounded-xl p-5 border border-gray-700/50">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Vitesse du texte défilant (secondes)
          </label>
          <input
            type="number"
            min="5"
            max="120"
            value={localSettings.scrollSpeed}
            onChange={(e) => setLocalSettings({ ...localSettings, scrollSpeed: parseInt(e.target.value) || 20 })}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
          />
        </div>

        {/* Toggles des widgets */}
        <div className="lg:col-span-2 bg-gray-800/40 rounded-xl p-5 border border-gray-700/50">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Widgets du bandeau</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: "showClock" as const, label: "Horloge", icon: "🕐" },
              { key: "showDate" as const, label: "Date", icon: "📅" },
              { key: "showWeather" as const, label: "Météo", icon: "🌤️" },
              { key: "showScrollingText" as const, label: "Texte défilant", icon: "📝" },
              { key: "showBirthdays" as const, label: "Anniversaires", icon: "🎂" },
            ].map((widget) => (
              <button
                key={widget.key}
                onClick={() => setLocalSettings({ ...localSettings, [widget.key]: !localSettings[widget.key] })}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
                  localSettings[widget.key]
                    ? "bg-blue-600/20 border-blue-500/50 text-white"
                    : "bg-gray-700/20 border-gray-600/30 text-gray-400"
                }`}
              >
                <span className="text-xl">{widget.icon}</span>
                <div className="text-left">
                  <p className="text-sm font-medium">{widget.label}</p>
                  <p className="text-xs opacity-60">
                    {localSettings[widget.key] ? "Activé" : "Désactivé"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Google Slides */}
        <div className="lg:col-span-2 bg-gray-800/40 rounded-xl p-5 border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <span className="text-xl">📊</span>
              Google Slides
            </h3>
            <button
              onClick={() => setLocalSettings({ ...localSettings, googleSlidesEnabled: !localSettings.googleSlidesEnabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localSettings.googleSlidesEnabled ? "bg-blue-600" : "bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localSettings.googleSlidesEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {localSettings.googleSlidesEnabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Lien Google Slides
                </label>
                <input
                  type="url"
                  value={localSettings.googleSlidesUrl}
                  onChange={(e) => setLocalSettings({ ...localSettings, googleSlidesUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                  placeholder="https://docs.google.com/presentation/d/..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  Collez le lien de votre présentation Google Slides. Les formats acceptés : lien d&#39;édition, de partage ou de publication.
                  La présentation défilera automatiquement en boucle.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Délai entre chaque slide (ms)
                </label>
                <input
                  type="number"
                  min="1000"
                  max="60000"
                  step="500"
                  value={localSettings.googleSlidesDelayMs}
                  onChange={(e) => setLocalSettings({ ...localSettings, googleSlidesDelayMs: parseInt(e.target.value) || 5000 })}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                />
                <p className="text-xs text-gray-500 mt-2">
                  5000 ms = 5 secondes par slide. Minimum 1000 ms.
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-xs text-yellow-400">
                  💡 Quand Google Slides est activé, il remplace le diaporama d&#39;images local. Le bandeau d&#39;informations reste visible.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
