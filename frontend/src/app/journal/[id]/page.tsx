"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchEntry, updateEntry, deleteEntry, type Entry } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Nav from "@/components/Nav";

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

export default function EntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTags, setEditTags] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchEntry(id)
        .then((data) => {
          setEntry(data.entry);
          setEditTags(data.entry.tags.join(", "));
        })
        .catch(() => setEntry(null))
        .finally(() => setLoading(false));
    }
  }, [id, user, authLoading]);

  const handleSaveTags = async () => {
    if (!entry) return;
    const tags = editTags.split(",").map((t) => t.trim()).filter(Boolean);
    try {
      const data = await updateEntry(entry.id, { tags });
      setEntry(data.entry);
      setEditing(false);
    } catch (err) {
      console.error("Failed to update tags:", err);
    }
  };

  const handleDelete = async () => {
    if (!entry || !confirm("Delete this entry?")) return;
    setDeleting(true);
    try {
      await deleteEntry(entry.id);
      router.push("/journal");
    } catch (err) {
      console.error("Failed to delete:", err);
      setDeleting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p style={{ color: "var(--text-muted)" }}>Entry not found</p>
      </div>
    );
  }

  const date = new Date(entry.created_at);
  const h = date.getHours();
  const dateStr = `${date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at ${h % 12 || 12}:${date.getMinutes().toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Header */}
      <header className="px-5 pt-14 pb-3 flex items-center gap-3">
        <button
          onClick={() => router.push("/journal")}
          className="btn-press p-1 -ml-1"
          style={{ color: "var(--text-muted)" }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="flex-1" />
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="btn-press text-[13px] font-medium disabled:opacity-50"
          style={{ color: "var(--danger)" }}
        >
          {deleting ? "..." : "Delete"}
        </button>
      </header>

      <div className="flex-1 px-5 space-y-5 overflow-y-auto">
        {/* Title + Meta */}
        <div>
          <h1 className="text-[20px] font-semibold leading-tight tracking-tight">
            {entry.title}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: moodColors[entry.mood] || "#9CA3AF" }}
            />
            <span className="text-[13px] capitalize" style={{ color: "var(--text-secondary)" }}>
              {entry.mood}
            </span>
            <span style={{ color: "var(--border-light)" }}>&middot;</span>
            <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              {dateStr}
            </span>
          </div>
          {(entry.category || entry.subcategory) && (
            <div className="mt-1.5">
              <span className="text-[12px] font-medium" style={{ color: "var(--accent-muted)" }}>
                {entry.category}{entry.subcategory ? ` / ${entry.subcategory}` : ""}
              </span>
            </div>
          )}
        </div>

        {/* Audio player */}
        {entry.audio_url && (
          <div
            className="p-3.5 rounded-xl"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <audio
              controls
              src={entry.audio_url}
              className="w-full"
              style={{ height: 40, borderRadius: 8 }}
            />
            {entry.duration_seconds && (
              <p className="text-[11px] mt-1.5 font-mono" style={{ color: "var(--text-muted)" }}>
                {Math.floor(entry.duration_seconds / 60)}:{(entry.duration_seconds % 60).toString().padStart(2, "0")}
              </p>
            )}
          </div>
        )}

        {/* Summary */}
        {entry.summary && (
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
              Summary
            </h2>
            <p className="text-[15px] leading-relaxed" style={{ color: "var(--text-primary)" }}>
              {entry.summary}
            </p>
          </div>
        )}

        {/* Transcript */}
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
            Transcript
          </h2>
          <p className="text-[15px] leading-[1.65] whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
            {entry.transcript}
          </p>
        </div>

        {/* Tags */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Tags
            </h2>
            <button
              onClick={() => setEditing(!editing)}
              className="btn-press text-[11px] font-medium"
              style={{ color: "var(--accent)" }}
            >
              {editing ? "Cancel" : "Edit"}
            </button>
          </div>
          {editing ? (
            <div className="flex gap-2">
              <input
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg text-[14px] outline-none"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-light)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                onClick={handleSaveTags}
                className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-white"
                style={{ background: "var(--accent)" }}
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 text-[12px] rounded-lg"
                  style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
                >
                  #{tag}
                </span>
              ))}
              {entry.tags.length === 0 && (
                <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>No tags</span>
              )}
            </div>
          )}
        </div>

        {/* People */}
        {entry.people.length > 0 && (
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              People
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {entry.people.map((p) => (
                <span
                  key={p}
                  className="px-2.5 py-1 text-[12px] font-medium rounded-lg"
                  style={{ background: "rgba(167, 139, 250, 0.15)", color: "#A78BFA" }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Items */}
        {entry.action_items.length > 0 && (
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              Action Items
            </h2>
            <div className="space-y-2">
              {entry.action_items.map((item, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <div
                    className="w-[18px] h-[18px] mt-0.5 shrink-0 rounded flex items-center justify-center"
                    style={{ border: "1.5px solid var(--border-light)" }}
                  />
                  <span className="text-[14px] leading-snug" style={{ color: "var(--text-primary)" }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Nav />
    </div>
  );
}
