"use client";

import { useState } from "react";
import { Birthday } from "@/types";

const MONTH_NAMES = [
  "", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

interface BirthdayManagerProps {
  birthdays: Birthday[];
  token: string;
  onUpdate: () => void;
}

function getDaysUntil(b: Birthday): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisYear = today.getFullYear();
  let nextDate = new Date(thisYear, b.month - 1, b.day);
  nextDate.setHours(0, 0, 0, 0);
  if (nextDate.getTime() < today.getTime()) {
    nextDate = new Date(thisYear + 1, b.month - 1, b.day);
  }
  return Math.round((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getDaysLabel(days: number): string {
  if (days === 0) return "Aujourd'hui !";
  if (days === 1) return "Demain !";
  return `dans ${days} jour${days > 1 ? "s" : ""}`;
}

export default function BirthdayManager({ birthdays, token, onUpdate }: BirthdayManagerProps) {
  const [name, setName] = useState("");
  const [day, setDay] = useState(1);
  const [month, setMonth] = useState(1);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDay, setEditDay] = useState(1);
  const [editMonth, setEditMonth] = useState(1);

  const jsonHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // Ajouter un anniversaire
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setAdding(true);
    try {
      const res = await fetch("/api/birthdays", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ name: name.trim(), day, month }),
      });

      if (res.ok) {
        setName("");
        setDay(1);
        setMonth(1);
        onUpdate();
      } else {
        const err = await res.json();
        alert(err.error || "Erreur");
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setAdding(false);
    }
  };

  // Supprimer
  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet anniversaire ?")) return;
    try {
      await fetch(`/api/birthdays?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      onUpdate();
    } catch {
      alert("Erreur");
    }
  };

  // Commencer l'édition
  const startEdit = (b: Birthday) => {
    setEditId(b.id);
    setEditName(b.name);
    setEditDay(b.day);
    setEditMonth(b.month);
  };

  // Sauvegarder l'édition
  const handleSaveEdit = async () => {
    if (!editId || !editName.trim()) return;
    try {
      await fetch("/api/birthdays", {
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify({ id: editId, name: editName.trim(), day: editDay, month: editMonth }),
      });
      setEditId(null);
      onUpdate();
    } catch {
      alert("Erreur");
    }
  };

  // Trier : prochain anniversaire en premier (calcul exact basé sur les dates)
  const sorted = [...birthdays].sort((a, b) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisYear = today.getFullYear();

    let nextA = new Date(thisYear, a.month - 1, a.day);
    nextA.setHours(0, 0, 0, 0);
    if (nextA.getTime() < today.getTime()) {
      nextA = new Date(thisYear + 1, a.month - 1, a.day);
    }

    let nextB = new Date(thisYear, b.month - 1, b.day);
    nextB.setHours(0, 0, 0, 0);
    if (nextB.getTime() < today.getTime()) {
      nextB = new Date(thisYear + 1, b.month - 1, b.day);
    }

    return nextA.getTime() - nextB.getTime();
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
        <span className="text-2xl">🎂</span>
        Anniversaires
        <span className="text-sm font-normal text-gray-400">
          ({birthdays.length} enregistré{birthdays.length !== 1 ? "s" : ""})
        </span>
      </h2>

      {/* Formulaire d'ajout */}
      <form onSubmit={handleAdd} className="bg-gray-800/40 rounded-xl p-5 border border-gray-700/50">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Ajouter un anniversaire</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-400 mb-1">Nom / Prénom</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all text-sm"
              placeholder="Jean Dupont"
              required
            />
          </div>
          <div className="w-20">
            <label className="block text-xs text-gray-400 mb-1">Jour</label>
            <input
              type="number"
              min="1"
              max="31"
              value={day}
              onChange={(e) => setDay(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
            />
          </div>
          <div className="w-40">
            <label className="block text-xs text-gray-400 mb-1">Mois</label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
            >
              {MONTH_NAMES.slice(1).map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={adding}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium rounded-xl transition-all duration-200 text-sm shadow-lg shadow-blue-600/25"
          >
            {adding ? "Ajout..." : "Ajouter"}
          </button>
        </div>
      </form>

      {/* Liste */}
      {sorted.length === 0 ? (
        <div className="text-center py-10 bg-gray-800/30 rounded-xl border-2 border-dashed border-gray-700">
          <span className="text-4xl">🎂</span>
          <p className="mt-3 text-gray-400">Aucun anniversaire enregistré</p>
          <p className="text-sm text-gray-500 mt-1">Ajoutez des anniversaires pour les afficher dans le bandeau</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((b) => {
            const isEditing = editId === b.id;

            return (
              <div
                key={b.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-700/50 bg-gray-800/40 hover:bg-gray-800/60 transition-all"
              >
                <span className="text-xl">🎂</span>

                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={editDay}
                      onChange={(e) => setEditDay(parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1.5 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <select
                      value={editMonth}
                      onChange={(e) => setEditMonth(parseInt(e.target.value))}
                      className="w-32 px-2 py-1.5 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      {MONTH_NAMES.slice(1).map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleSaveEdit}
                      className="p-1.5 text-green-400 hover:text-green-300 transition-colors rounded-lg hover:bg-gray-700/50"
                      title="Valider"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700/50"
                      title="Annuler"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{b.name}</p>
                    </div>
                    <span className="text-sm text-gray-400 whitespace-nowrap">
                      {b.day} {MONTH_NAMES[b.month]}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                      getDaysUntil(b) === 0
                        ? "bg-yellow-500/20 text-yellow-300"
                        : getDaysUntil(b) <= 7
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-gray-700/50 text-gray-400"
                    }`}>
                      {getDaysLabel(getDaysUntil(b))}
                    </span>
                    <button
                      onClick={() => startEdit(b)}
                      className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-700/50"
                      title="Modifier"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1.5 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-gray-700/50"
                      title="Supprimer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
