"use client";

import { useState, useMemo } from "react";

interface FeedbackRow {
  id: number;
  name: string | null;
  email: string | null;
  message: string;
  createdAt: number;
  userNickname: string | null;
  userEmail: string | null;
}

interface Props {
  rows: FeedbackRow[];
}

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function exportCSV(rows: FeedbackRow[]) {
  const headers = ["Date", "Name", "Email", "Message"];
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const lines = [
    headers.map(escape).join(","),
    ...rows.map((r) =>
      [
        formatDate(r.createdAt),
        r.name ?? r.userNickname ?? "",
        r.email ?? r.userEmail ?? "",
        r.message,
      ]
        .map(escape)
        .join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "feedback.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminFeedbackBrowser({ rows }: Props) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<FeedbackRow | null>(null);

  const filtered = useMemo(() => {
    const lower = q.toLowerCase();
    if (!lower) return rows;
    return rows.filter(
      (r) =>
        r.message.toLowerCase().includes(lower) ||
        (r.name ?? "").toLowerCase().includes(lower) ||
        (r.email ?? "").toLowerCase().includes(lower) ||
        (r.userNickname ?? "").toLowerCase().includes(lower),
    );
  }, [q, rows]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-800 flex-shrink-0">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search feedback…"
          className="flex-1 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <span className="text-xs text-gray-600">{filtered.length} message{filtered.length !== 1 ? "s" : ""}</span>
        <button
          onClick={() => exportCSV(filtered)}
          className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs text-gray-300 transition"
        >
          Export CSV
        </button>
      </div>

      <div className={`flex flex-1 overflow-hidden ${selected ? "divide-x divide-gray-800" : ""}`}>
        {/* List */}
        <div className={`overflow-y-auto flex-shrink-0 ${selected ? "w-1/2" : "w-full"}`}>
          {filtered.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-12">No feedback yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">Date</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">From</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Message</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const isSelected = selected?.id === r.id;
                  const fromName = r.name ?? r.userNickname ?? "Anonymous";
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelected(isSelected ? null : r)}
                      className={`border-b border-gray-800/50 cursor-pointer transition ${
                        isSelected
                          ? "bg-indigo-900/25 border-l-2 border-l-indigo-500"
                          : "hover:bg-gray-800/30"
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(r.createdAt).split(",")[0]}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs max-w-[8rem] truncate">
                        {fromName}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-xs">
                        {r.message}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-white">
                  {selected.name ?? selected.userNickname ?? "Anonymous"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selected.email ?? selected.userEmail ?? "No email"} · {formatDate(selected.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-600 hover:text-gray-400 text-lg leading-none"
              >
                ×
              </button>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{selected.message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
