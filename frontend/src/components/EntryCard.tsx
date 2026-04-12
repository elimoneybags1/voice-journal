"use client";

import type { Entry } from "@/lib/api";

const moodColors: Record<string, string> = {
  positive: "#4ADE80",
  negative: "#F87171",
  neutral: "#9CA3AF",
  mixed: "#FBBF24",
  reflective: "#A78BFA",
  anxious: "#FB923C",
  excited: "#34D399",
  tired: "#6B7280",
};

export default function EntryCard({ entry }: { entry: Entry }) {
  const date = new Date(entry.created_at);
  const h = date.getHours();
  const timeStr = `${h % 12 || 12}:${date.getMinutes().toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;

  return (
    <a
      href={`/journal/${entry.id}`}
      className="block p-4 rounded-2xl card-press"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
          style={{ background: moodColors[entry.mood] || "#9CA3AF" }}
          title={entry.mood}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[15px] leading-snug" style={{ color: "var(--text-primary)" }}>
            {entry.title}
          </h3>
          <p className="text-[13px] leading-relaxed mt-1 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
            {entry.summary}
          </p>
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
              {timeStr}
            </span>
            <span style={{ color: "var(--border-light)" }}>&middot;</span>
            <span className="text-[11px]" style={{ color: "var(--accent-muted)" }}>
              {entry.subcategory}
            </span>
            {entry.tags.length > 0 && (
              <>
                <span style={{ color: "var(--border-light)" }}>&middot;</span>
                {entry.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    #{tag}
                  </span>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}
