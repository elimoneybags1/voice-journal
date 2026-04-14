"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { fetchProfile, updateProfile } from "@/lib/api";
import Nav from "@/components/Nav";

export default function SettingsPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [displayName, setDisplayName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchProfile()
      .then(({ profile }) => {
        const name = (profile.preferences?.display_name as string) || "";
        setDisplayName(name);
        setSavedName(name);
      })
      .catch(() => {});
  }, [user]);

  const saveName = useCallback(async () => {
    if (displayName.trim() === savedName) return;
    setSaving(true);
    try {
      await updateProfile({ preferences: { display_name: displayName.trim() } });
      setSavedName(displayName.trim());
    } catch {
      // silent fail
    } finally {
      setSaving(false);
    }
  }, [displayName, savedName]);

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <header className="px-5 pt-14 pb-4">
        <h1 className="text-[24px] font-semibold tracking-tight">Settings</h1>
      </header>

      <div className="px-5 space-y-6">
        {/* Appearance */}
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
            Appearance
          </h2>
          <div
            className="flex items-center justify-between p-4 rounded-2xl"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-3">
              <span className="text-[20px]">{theme === "dark" ? "\u{1F319}" : "\u{2600}\u{FE0F}"}</span>
              <div>
                <p className="text-[15px] font-medium">Theme</p>
                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                  {theme === "dark" ? "Dark mode" : "Light mode"}
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="btn-press relative w-12 h-7 rounded-full transition-colors"
              style={{ background: theme === "dark" ? "var(--accent)" : "var(--border-light)" }}
            >
              <span
                className="absolute top-0.5 w-6 h-6 rounded-full transition-transform"
                style={{
                  background: "white",
                  left: 2,
                  transform: theme === "dark" ? "translateX(20px)" : "translateX(0)",
                }}
              />
            </button>
          </div>
        </section>

        {/* Profile */}
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
            Profile
          </h2>
          <div
            className="p-4 rounded-2xl space-y-3"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <div>
              <label className="text-[12px] font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                Display Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How should we greet you?"
                  className="flex-1 px-3 py-2 rounded-xl text-[14px] outline-none"
                  style={{
                    background: "var(--bg-elevated)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border)",
                  }}
                  onBlur={saveName}
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                />
                {displayName.trim() !== savedName && (
                  <button
                    onClick={saveName}
                    disabled={saving}
                    className="btn-press px-3 py-2 rounded-xl text-[13px] font-medium"
                    style={{ background: "var(--accent)", color: "white" }}
                  >
                    {saving ? "..." : "Save"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Account */}
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
            Account
          </h2>
          <div
            className="p-4 rounded-2xl space-y-3"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <div>
              <label className="text-[12px] font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>
                Email
              </label>
              <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
                {user.email}
              </p>
            </div>
            <div className="pt-1">
              <button
                onClick={signOut}
                className="btn-press w-full py-2.5 rounded-xl text-[14px] font-medium"
                style={{ background: "var(--bg-elevated)", color: "var(--danger)" }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </section>

        {/* About */}
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
            About
          </h2>
          <div
            className="p-4 rounded-2xl"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <p className="text-[14px] font-medium">Voice Journal</p>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
              v1.1.0 — Record, transcribe, and organize your thoughts
            </p>
          </div>
        </section>
      </div>

      <Nav />
    </div>
  );
}
