"use client";

import { useRef, useState } from "react";
import { searchEntries, type Entry } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import EntryCard from "@/components/EntryCard";
import Nav from "@/components/Nav";

export default function SearchPage() {
  const { loading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Entry[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setSearching(true);
    try {
      const data = await searchEntries(q.trim());
      setResults(data.entries);
      setSearched(true);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(q), 300);
  };

  const handleQuickFilter = (q: string) => {
    setQuery(q);
    doSearch(q);
  };

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
        <h1 className="text-[22px] font-semibold tracking-tight">Search</h1>
      </header>

      {/* Search input */}
      <div className="px-5 py-3">
        <div
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <svg
            className="w-4.5 h-4.5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            style={{ color: "var(--text-muted)" }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search entries, tags, people..."
            className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-[var(--text-muted)]"
            style={{ color: "var(--text-primary)" }}
          />
          {query && (
            <button
              onClick={() => handleSearch("")}
              className="btn-press p-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Quick filters */}
      {!searched && (
        <div className="px-5 flex flex-wrap gap-1.5">
          {["trading", "health", "sleep", "exercise", "project", "idea"].map((t) => (
            <button
              key={t}
              onClick={() => handleQuickFilter(t)}
              className="btn-press px-3 py-1.5 text-[12px] font-medium rounded-full"
              style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="flex-1 px-5 mt-3">
        {searching && (
          <div className="flex justify-center mt-8">
            <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
          </div>
        )}
        {searched && !searching && (
          <p className="text-[12px] font-medium mb-3" style={{ color: "var(--text-muted)" }}>
            {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
        )}
        <div className="space-y-2.5">
          {results.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
        {searched && !searching && results.length === 0 && (
          <div className="text-center mt-12">
            <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
              No entries match &ldquo;{query}&rdquo;
            </p>
          </div>
        )}
      </div>

      <Nav />
    </div>
  );
}
