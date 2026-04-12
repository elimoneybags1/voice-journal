"use client";

import { useEffect, useState } from "react";
import { fetchWeeklySummary, type WeeklySummary } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import AskJournal from "@/components/AskJournal";
import Nav from "@/components/Nav";

export default function InsightsPage() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"weekly" | "ask">("weekly");
  const [weekly, setWeekly] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      fetchWeeklySummary()
        .then((data) => setWeekly(data.summary))
        .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <header className="px-5 pt-14 pb-2">
        <h1 className="text-[22px] font-semibold tracking-tight">Insights</h1>
        <div className="flex gap-1.5 mt-3">
          {(["weekly", "ask"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="btn-press px-3.5 py-1.5 text-[13px] font-medium rounded-lg"
              style={{
                background: tab === t ? "var(--bg-elevated)" : "transparent",
                color: tab === t ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              {t === "weekly" ? "This Week" : "Ask Journal"}
            </button>
          ))}
        </div>
      </header>

      {tab === "weekly" ? (
        <div className="flex-1 px-5 py-4 space-y-5 overflow-y-auto">
          {loading && (
            <div className="flex justify-center mt-8">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
            </div>
          )}

          {error && (
            <p className="text-[14px] text-center mt-8" style={{ color: "var(--danger)" }}>{error}</p>
          )}

          {!loading && !weekly && !error && (
            <div className="text-center mt-8">
              <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
                No entries this week yet. Record some notes and come back!
              </p>
            </div>
          )}

          {weekly && (
            <>
              {/* Summary */}
              <div>
                <p className="text-[15px] leading-[1.65] whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                  {weekly.summary}
                </p>
              </div>

              {/* Themes */}
              {weekly.themes.length > 0 && (
                <div>
                  <h2
                    className="text-[11px] font-semibold uppercase tracking-wider mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Themes
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {weekly.themes.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 text-[12px] rounded-lg"
                        style={{ background: "var(--bg-surface)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mood trend */}
              {weekly.mood_trend && (
                <div>
                  <h2
                    className="text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Mood Trend
                  </h2>
                  <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {weekly.mood_trend}
                  </p>
                </div>
              )}

              {/* Highlights */}
              {weekly.highlights.length > 0 && (
                <div>
                  <h2
                    className="text-[11px] font-semibold uppercase tracking-wider mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Highlights
                  </h2>
                  <div className="space-y-2">
                    {weekly.highlights.map((h, i) => (
                      <div key={i} className="flex gap-2.5 items-start">
                        <div
                          className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                          style={{ background: "var(--accent)" }}
                        />
                        <span className="text-[14px] leading-snug" style={{ color: "var(--text-primary)" }}>
                          {h}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <AskJournal />
      )}

      <Nav />
    </div>
  );
}
