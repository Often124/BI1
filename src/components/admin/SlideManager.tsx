"use client";

import { useState, useRef } from "react";
import { Slide } from "@/types";

interface SlideManagerProps {
  slides: Slide[];
  token: string;
  onUpdate: () => void;
}

export default function SlideManager({ slides, token, onUpdate }: SlideManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const jsonHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // Upload d'image
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        // 1. Upload du fichier
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          alert(`Erreur upload: ${err.error}`);
          continue;
        }

        const uploadData = await uploadRes.json();

        // 2. Créer le slide
        const createRes = await fetch("/api/slides", {
          method: "POST",
          headers: jsonHeaders,
          body: JSON.stringify({
            filename: uploadData.filename,
            originalName: uploadData.originalName,
            duration: 5,
          }),
        });

        if (!createRes.ok) {
          const err = await createRes.json().catch(() => ({ error: "Erreur création slide" }));
          alert(`Erreur création slide: ${err.error || "inconnue"}`);
        }
      }
      onUpdate();
    } catch (error) {
      alert("Erreur lors de l'upload");
      console.error(error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Supprimer un slide
  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette image ?")) return;

    try {
      const res = await fetch(`/api/slides?id=${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Suppression impossible" }));
        alert(err.error || "Suppression impossible");
        return;
      }
      onUpdate();
    } catch (error) {
      alert("Erreur lors de la suppression");
    }
  };

  // Modifier la durée
  const handleDurationChange = async (id: string, duration: number) => {
    try {
      const res = await fetch("/api/slides", {
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify({ id, duration }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Mise à jour impossible" }));
        alert(err.error || "Mise à jour impossible");
        return;
      }
      onUpdate();
    } catch (error) {
      console.error("Erreur maj durée:", error);
    }
  };

  // Activer/désactiver un slide
  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const res = await fetch("/api/slides", {
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify({ id, active }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Mise à jour impossible" }));
        alert(err.error || "Mise à jour impossible");
        return;
      }
      onUpdate();
    } catch (error) {
      console.error("Erreur toggle:", error);
    }
  };

  // Drag & drop pour réordonner
  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;

    const orderedIds = slides.map((s) => s.id);
    const fromIndex = orderedIds.indexOf(draggedId);
    const toIndex = orderedIds.indexOf(targetId);

    orderedIds.splice(fromIndex, 1);
    orderedIds.splice(toIndex, 0, draggedId);

    try {
      const res = await fetch("/api/slides", {
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Réordonnement impossible" }));
        alert(err.error || "Réordonnement impossible");
        return;
      }
      onUpdate();
    } catch (error) {
      console.error("Erreur réordonnement:", error);
    }

    setDraggedId(null);
  };

  // Déplacer vers le haut/bas
  const handleMove = async (id: string, direction: "up" | "down") => {
    const orderedIds = slides.map((s) => s.id);
    const index = orderedIds.indexOf(id);

    if (direction === "up" && index > 0) {
      [orderedIds[index - 1], orderedIds[index]] = [orderedIds[index], orderedIds[index - 1]];
    } else if (direction === "down" && index < orderedIds.length - 1) {
      [orderedIds[index + 1], orderedIds[index]] = [orderedIds[index], orderedIds[index + 1]];
    } else {
      return;
    }

    try {
      const res = await fetch("/api/slides", {
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Déplacement impossible" }));
        alert(err.error || "Déplacement impossible");
        return;
      }
      onUpdate();
    } catch (error) {
      console.error("Erreur déplacement:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec bouton d'upload */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Gestion des images
          <span className="text-sm font-normal text-gray-400">
            ({slides.length} image{slides.length !== 1 ? "s" : ""})
          </span>
        </h2>

        <label className="relative cursor-pointer">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
          <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/25">
            {uploading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Upload en cours...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter des images
              </>
            )}
          </span>
        </label>
      </div>

      {/* Liste des slides */}
      {slides.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/30 rounded-xl border-2 border-dashed border-gray-700">
          <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-4 text-gray-400">Aucune image</p>
          <p className="text-sm text-gray-500 mt-1">Cliquez sur &quot;Ajouter des images&quot; pour commencer</p>
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              draggable
              onDragStart={() => handleDragStart(slide.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(slide.id)}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
                draggedId === slide.id
                  ? "border-blue-500/50 bg-blue-500/10 opacity-50"
                  : slide.active
                  ? "border-gray-700/50 bg-gray-800/40 hover:bg-gray-800/60"
                  : "border-gray-700/30 bg-gray-800/20 opacity-60"
              }`}
            >
              {/* Handle de drag */}
              <div className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                </svg>
              </div>

              {/* Numéro d'ordre */}
              <span className="text-sm font-mono text-gray-500 w-6 text-center">
                {index + 1}
              </span>

              {/* Miniature */}
              <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                <img
                  src={`/uploads/${slide.filename}`}
                  alt={slide.originalName}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {slide.originalName}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Ajouté le {new Date(slide.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>

              {/* Durée */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">Durée:</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={slide.duration}
                  onChange={(e) => handleDurationChange(slide.id, parseInt(e.target.value) || 5)}
                  className="w-16 px-2 py-1.5 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <span className="text-xs text-gray-400">sec</span>
              </div>

              {/* Boutons d'action */}
              <div className="flex items-center gap-1">
                {/* Monter */}
                <button
                  onClick={() => handleMove(slide.id, "up")}
                  disabled={index === 0}
                  className="p-1.5 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-gray-700/50"
                  title="Monter"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>

                {/* Descendre */}
                <button
                  onClick={() => handleMove(slide.id, "down")}
                  disabled={index === slides.length - 1}
                  className="p-1.5 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-gray-700/50"
                  title="Descendre"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Toggle actif */}
                <button
                  onClick={() => handleToggleActive(slide.id, !slide.active)}
                  className={`p-1.5 transition-colors rounded-lg hover:bg-gray-700/50 ${
                    slide.active ? "text-green-400 hover:text-green-300" : "text-gray-500 hover:text-gray-300"
                  }`}
                  title={slide.active ? "Désactiver" : "Activer"}
                >
                  {slide.active ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>

                {/* Supprimer */}
                <button
                  onClick={() => handleDelete(slide.id)}
                  className="p-1.5 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-gray-700/50"
                  title="Supprimer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
