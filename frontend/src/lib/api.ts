import { supabase } from "./supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return {
    Authorization: `Bearer ${session.access_token}`,
  };
}

async function apiGet<T = unknown>(path: string): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}${path}`, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json();
}

async function apiPost<T = unknown>(path: string, body?: unknown): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function apiPatch<T = unknown>(path: string, body: unknown): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function apiDelete(path: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}

async function apiUpload<T = unknown>(path: string, file: Blob, filename: string): Promise<T> {
  const headers = await getAuthHeaders();
  const formData = new FormData();
  formData.append("file", file, filename);
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload error ${res.status}: ${text}`);
  }
  return res.json();
}

// --- Typed API functions ---

export interface Entry {
  id: string;
  user_id: string;
  transcript: string;
  title: string;
  summary: string;
  tags: string[];
  mood: string;
  category: string;
  subcategory: string;
  people: string[];
  action_items: string[];
  audio_url: string | null;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklySummary {
  id: string;
  summary: string;
  themes: string[];
  mood_trend: string;
  highlights: string[];
  open_action_items: string[];
  week_start: string;
  week_end: string;
}

// Entries
export async function fetchEntries(opts?: { limit?: number; offset?: number; tag?: string; mood?: string }) {
  const params = new URLSearchParams();
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.offset) params.set("offset", String(opts.offset));
  if (opts?.tag) params.set("tag", opts.tag);
  if (opts?.mood) params.set("mood", opts.mood);
  const qs = params.toString();
  return apiGet<{ entries: Entry[]; count: number }>(`/entries/${qs ? `?${qs}` : ""}`);
}

export async function fetchEntry(id: string) {
  return apiGet<{ entry: Entry }>(`/entries/${id}`);
}

export async function updateEntry(id: string, data: Partial<Pick<Entry, "title" | "transcript" | "tags" | "mood" | "category" | "action_items">>) {
  return apiPatch<{ entry: Entry }>(`/entries/${id}`, data);
}

export async function deleteEntry(id: string) {
  return apiDelete(`/entries/${id}`);
}

// Upload recording
export async function uploadRecording(audioBlob: Blob, filename: string, durationSeconds?: number) {
  const headers = await getAuthHeaders();
  const formData = new FormData();
  formData.append("file", audioBlob, filename);
  if (durationSeconds !== undefined) {
    formData.append("duration_seconds", String(durationSeconds));
  }
  const res = await fetch(`${API_URL}/recordings/upload`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(data.detail || `Upload error: ${res.status}`);
  }
  return res.json() as Promise<{ entry: Entry }>;
}

// Search
export async function searchEntries(query: string, limit = 20) {
  return apiGet<{ entries: Entry[]; query: string }>(`/search/?q=${encodeURIComponent(query)}&limit=${limit}`);
}

// Insights
export async function fetchWeeklySummary(weekOf?: string) {
  const qs = weekOf ? `?week_of=${weekOf}` : "";
  return apiGet<{ summary: WeeklySummary | null; message?: string }>(`/insights/weekly${qs}`);
}

export async function askJournal(question: string) {
  return apiPost<{ answer: string; entries_used: number }>("/insights/ask", { question });
}
