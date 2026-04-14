"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { fetchEntries, fetchFolders, fetchProfile, type Entry, type Folder as ApiFolder, type CommandResult } from "@/lib/api";
import AudioRecorder from "@/components/AudioRecorder";
import EntryCard from "@/components/EntryCard";
import FolderIcon from "@/components/FolderIcon";
import Nav from "@/components/Nav";
import Toast from "@/components/Toast";

type View =
  | { mode: "home" }
  | { mode: "folders" }
  | { mode: "category"; category: string; subcategory?: string };

interface Folder {
  name: string;
  icon: string;
  count: number;
  subcategories: { name: string; count: number }[];
}

const categoryIcons: Record<string, string> = {
  Trading: "chart-bar",
  Projects: "rocket",
  Health: "heart",
  People: "users",
  Ideas: "lightbulb",
  "Daily Life": "sun",
};

function groupByDate(entries: Entry[]): { label: string; entries: Entry[] }[] {
  const groups: Record<string, Entry[]> = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const e of entries) {
    const d = new Date(e.created_at);
    d.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
    let label: string;
    if (diff === 0) label = "Today";
    else if (diff === 1) label = "Yesterday";
    else label = d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    if (!groups[label]) groups[label] = [];
    groups[label].push(e);
  }

  return Object.entries(groups).map(([label, entries]) => ({ label, entries }));
}

function buildFolders(entries: Entry[]): Folder[] {
  const map: Record<string, Record<string, number>> = {};
  for (const e of entries) {
    const cat = e.category || "Other";
    if (!map[cat]) map[cat] = {};
    const sub = e.subcategory || "General";
    map[cat][sub] = (map[cat][sub] || 0) + 1;
  }
  return Object.entries(map).map(([name, subs]) => ({
    name,
    icon: categoryIcons[name] || "folder",
    count: Object.values(subs).reduce((a, b) => a + b, 0),
    subcategories: Object.entries(subs).map(([name, count]) => ({ name, count })),
  })).sort((a, b) => b.count - a.count);
}

const moodLabels: Record<string, string> = {
  positive: "Positive",
  negative: "Down",
  neutral: "Neutral",
  mixed: "Mixed",
  reflective: "Reflective",
  anxious: "Anxious",
  excited: "Excited",
  tired: "Tired",
};

export default function JournalPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [view, setView] = useState<View>({ mode: "home" });
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [userFolders, setUserFolders] = useState<ApiFolder[]>([]);

  const loadEntries = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchEntries({ limit: 50 });
      setEntries(data.entries);
    } catch (err) {
      console.error("Failed to load entries:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      loadEntries();
      fetchFolders().then(({ folders }) => setUserFolders(folders)).catch(() => {});
      fetchProfile().then(({ profile }) => {
        const name = (profile.preferences?.display_name as string) || "";
        setDisplayName(name);
      }).catch(() => {});
    }
  }, [authLoading, user, loadEntries]);

  const handleCommandResult = useCallback((result: CommandResult) => {
    setToast({
      message: result.message,
      type: result.success ? "success" : "error",
    });
    // Refresh folders if a folder was created
    if (result.action === "create_folder" && result.success) {
      fetchFolders().then(({ folders }) => setUserFolders(folders)).catch(() => {});
    }
  }, []);

  const aiFolders = buildFolders(entries);
  // Merge user-created folders (from API) with AI-generated category folders
  const folders = (() => {
    const merged = [...aiFolders];
    for (const uf of userFolders) {
      if (!merged.find((f) => f.name === uf.name)) {
        const entriesInFolder = entries.filter((e) => e.folder_id === uf.id);
        merged.push({
          name: uf.name,
          icon: uf.icon || "folder",
          count: entriesInFolder.length,
          subcategories: [],
        });
      }
    }
    return merged;
  })();

  // Stats
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const thisWeekEntries = entries.filter((e) => new Date(e.created_at) >= weekAgo).length;
  const topMood = (() => {
    const counts: Record<string, number> = {};
    entries.forEach((e) => { counts[e.mood] = (counts[e.mood] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || "neutral";
  })();
  const actionItemCount = entries.reduce((sum, e) => sum + e.action_items.length, 0);

  // Filter entries for category view
  let displayEntries = entries;
  if (view.mode === "category") {
    displayEntries = entries.filter((e) => {
      if (e.category !== view.category) return false;
      if (view.subcategory && e.subcategory !== view.subcategory) return false;
      return true;
    });
  }

  const dateGroups = groupByDate(displayEntries);

  // Greeting
  const hour = new Date().getHours();
  const greetBase = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const greeting = displayName ? `${greetBase}, ${displayName}` : greetBase;
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Header */}
      <header className="px-5 pt-14 pb-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              {dateStr}
            </p>
            <h1 className="text-[24px] font-semibold tracking-tight mt-0.5">
              {greeting}
            </h1>
          </div>
          <button
            onClick={signOut}
            className="btn-press text-[11px] font-medium px-2 py-1 rounded-full"
            style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Home view */}
      {view.mode === "home" && (
        <>
          {/* Recorder */}
          <AudioRecorder onUploadComplete={loadEntries} onCommandResult={handleCommandResult} />

          {/* Quick Stats */}
          {entries.length > 0 && (
            <div className="px-5 mb-5">
              <div
                className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden"
                style={{ background: "var(--border)" }}
              >
                {[
                  { label: "This week", value: String(thisWeekEntries), sub: "entries" },
                  { label: "Top mood", value: moodLabels[topMood] || topMood, sub: "overall" },
                  { label: "Open tasks", value: String(actionItemCount), sub: "action items" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col items-center py-3.5 px-2"
                    style={{ background: "var(--bg-surface)" }}
                  >
                    <span className="text-[17px] font-semibold" style={{ color: "var(--text-primary)" }}>
                      {stat.value}
                    </span>
                    <span className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* View toggle */}
          <div className="px-5 flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              {loading ? "Loading..." : `${entries.length} Entries`}
            </h2>
            {entries.length > 0 && (
              <button
                onClick={() => setView({ mode: "folders" })}
                className="btn-press flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-medium"
                style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
                Folders
              </button>
            )}
          </div>

          {/* Empty state */}
          {!loading && entries.length === 0 && (
            <div className="px-5 text-center mt-8">
              <p className="text-[15px]" style={{ color: "var(--text-muted)" }}>
                No entries yet. Record your first note!
              </p>
            </div>
          )}

          {/* Entries grouped by date */}
          <div className="px-5 space-y-5">
            {dateGroups.map((group) => (
              <div key={group.label}>
                <h3
                  className="text-[11px] font-semibold uppercase tracking-wider mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  {group.label}
                </h3>
                <div className="space-y-2.5">
                  {group.entries.map((entry) => (
                    <EntryCard key={entry.id} entry={entry} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Folder view */}
      {view.mode === "folders" && (
        <div className="px-5 pt-4">
          <div className="flex items-center gap-2.5 mb-4">
            <button
              onClick={() => setView({ mode: "home" })}
              className="btn-press p-1 -ml-1"
              style={{ color: "var(--text-muted)" }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <h2 className="text-[17px] font-semibold">Folders</h2>
          </div>

          <div className="space-y-2">
            {folders.map((folder) => (
              <button
                key={folder.name}
                onClick={() => setView({ mode: "category", category: folder.name })}
                className="card-press w-full flex items-center gap-3.5 p-3.5 rounded-2xl text-left"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
                >
                  <FolderIcon name={folder.icon} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-medium">{folder.name}</h3>
                  <p className="text-[12px] truncate" style={{ color: "var(--text-muted)" }}>
                    {folder.subcategories.map((s) => s.name).join(" \u00b7 ")}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-medium tabular-nums" style={{ color: "var(--text-muted)" }}>
                    {folder.count}
                  </span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} style={{ color: "var(--text-muted)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category drilldown */}
      {view.mode === "category" && (
        <div className="px-5 pt-4">
          <div className="flex items-center gap-2.5 mb-3">
            <button
              onClick={() => setView({ mode: "folders" })}
              className="btn-press p-1 -ml-1"
              style={{ color: "var(--text-muted)" }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <h2 className="text-[17px] font-semibold">{view.category}</h2>
          </div>

          <div className="flex gap-1.5 mb-4 flex-wrap">
            <button
              onClick={() => setView({ mode: "category", category: view.category })}
              className="btn-press px-3 py-1.5 text-[12px] font-medium rounded-full"
              style={{
                background: !view.subcategory ? "var(--accent)" : "var(--bg-elevated)",
                color: !view.subcategory ? "white" : "var(--text-secondary)",
              }}
            >
              All
            </button>
            {folders
              .find((f) => f.name === view.category)
              ?.subcategories.map((sub) => (
                <button
                  key={sub.name}
                  onClick={() =>
                    setView({ mode: "category", category: view.category, subcategory: sub.name })
                  }
                  className="btn-press px-3 py-1.5 text-[12px] font-medium rounded-full"
                  style={{
                    background: view.subcategory === sub.name ? "var(--accent)" : "var(--bg-elevated)",
                    color: view.subcategory === sub.name ? "white" : "var(--text-secondary)",
                  }}
                >
                  {sub.name}
                </button>
              ))}
          </div>

          <div className="space-y-2.5">
            {displayEntries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      )}

      <Nav />
    </div>
  );
}
