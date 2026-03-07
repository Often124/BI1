"use client";

import { useMemo, useState } from "react";
import { AdminPermission, AdminUser } from "@/types";

interface UserManagerProps {
  token: string;
  users: AdminUser[];
  currentUsername: string;
  onUpdate: () => void;
}

const PERMISSIONS: { key: AdminPermission; label: string }[] = [
  { key: "manageSlides", label: "Gerer les slides" },
  { key: "manageSettings", label: "Modifier les parametres" },
  { key: "manageBirthdays", label: "Gerer les anniversaires" },
  { key: "viewLogs", label: "Voir les logs" },
  { key: "manageUsers", label: "Gerer les utilisateurs" },
];

export default function UserManager({ token, users, currentUsername, onUpdate }: UserManagerProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newPermissions, setNewPermissions] = useState<AdminPermission[]>(["manageSlides", "manageSettings"]);
  const [creating, setCreating] = useState(false);

  const jsonHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token]
  );

  const togglePerm = (list: AdminPermission[], perm: AdminPermission): AdminPermission[] =>
    list.includes(perm) ? list.filter((p) => p !== perm) : [...list, perm];

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setCreating(true);
    try {
      const res = await fetch("/api/admin-users", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          username: username.trim(),
          password,
          permissions: newPermissions,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Creation impossible" }));
        alert(err.error || "Creation impossible");
        return;
      }

      setUsername("");
      setPassword("");
      setNewPermissions(["manageSlides", "manageSettings"]);
      onUpdate();
    } catch {
      alert("Erreur reseau");
    } finally {
      setCreating(false);
    }
  };

  const saveUser = async (user: AdminUser, updates: Partial<{ isActive: boolean; permissions: AdminPermission[] }>) => {
    const res = await fetch("/api/admin-users", {
      method: "PUT",
      headers: jsonHeaders,
      body: JSON.stringify({ id: user.id, ...updates }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Mise a jour impossible" }));
      alert(err.error || "Mise a jour impossible");
      return;
    }

    onUpdate();
  };

  const deleteUser = async (user: AdminUser) => {
    if (!confirm(`Supprimer ${user.username} ?`)) return;

    const res = await fetch(`/api/admin-users?id=${encodeURIComponent(user.id)}&username=${encodeURIComponent(user.username)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Suppression impossible" }));
      alert(err.error || "Suppression impossible");
      return;
    }

    onUpdate();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
        <span className="text-2xl">👥</span>
        Utilisateurs admin
      </h2>

      <form onSubmit={createUser} className="bg-gray-800/40 rounded-xl p-5 border border-gray-700/50 space-y-4">
        <h3 className="text-sm font-medium text-gray-300">Ajouter un utilisateur</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="px-4 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white"
            placeholder="Nom d'utilisateur"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-4 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white"
            placeholder="Mot de passe"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {PERMISSIONS.map((perm) => (
            <button
              key={perm.key}
              type="button"
              onClick={() => setNewPermissions((prev) => togglePerm(prev, perm.key))}
              className={`text-left px-3 py-2 rounded-lg border text-sm ${
                newPermissions.includes(perm.key)
                  ? "bg-blue-600/20 border-blue-500/50 text-white"
                  : "bg-gray-700/20 border-gray-600/30 text-gray-400"
              }`}
            >
              {perm.label}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={creating}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/40 text-white font-medium rounded-xl"
        >
          {creating ? "Creation..." : "Ajouter"}
        </button>
      </form>

      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-white font-medium">{user.username}</p>
                <p className="text-xs text-gray-400">Cree le {new Date(user.createdAt).toLocaleDateString("fr-FR")}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => saveUser(user, { isActive: !user.isActive })}
                  className={`px-3 py-1.5 rounded-lg text-xs ${user.isActive ? "bg-green-600/20 text-green-300" : "bg-gray-600/30 text-gray-300"}`}
                >
                  {user.isActive ? "Actif" : "Inactif"}
                </button>

                <button
                  onClick={() => deleteUser(user)}
                  disabled={user.username === currentUsername}
                  className="px-3 py-1.5 rounded-lg text-xs bg-red-600/20 text-red-300 disabled:opacity-40"
                >
                  Supprimer
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {PERMISSIONS.map((perm) => (
                <button
                  key={`${user.id}-${perm.key}`}
                  type="button"
                  onClick={() =>
                    saveUser(user, {
                      permissions: togglePerm(user.permissions, perm.key),
                    })
                  }
                  className={`text-left px-3 py-2 rounded-lg border text-sm ${
                    user.permissions.includes(perm.key)
                      ? "bg-blue-600/20 border-blue-500/50 text-white"
                      : "bg-gray-700/20 border-gray-600/30 text-gray-400"
                  }`}
                >
                  {perm.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
