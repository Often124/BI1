"use client";

import { AdminLog } from "@/types";

interface AdminLogsProps {
  logs: AdminLog[];
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AdminLogs({ logs }: AdminLogsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
        <span className="text-2xl">📜</span>
        Logs d'administration
        <span className="text-sm font-normal text-gray-400">({logs.length})</span>
      </h2>

      {logs.length === 0 ? (
        <div className="text-center py-10 bg-gray-800/30 rounded-xl border-2 border-dashed border-gray-700">
          <p className="text-gray-400">Aucun log pour le moment</p>
        </div>
      ) : (
        <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden">
          <div className="max-h-[60vh] overflow-auto admin-scroll">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-900/90 backdrop-blur border-b border-gray-700/60">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-300 font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-gray-300 font-medium">Action</th>
                  <th className="text-left px-4 py-3 text-gray-300 font-medium">Détails</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-700/30 hover:bg-gray-700/20">
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-lg bg-blue-500/15 px-2 py-1 text-xs text-blue-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-200">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
