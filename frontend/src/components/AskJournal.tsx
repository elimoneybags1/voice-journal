"use client";

import { useRef, useState, useEffect } from "react";
import { askJournal } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AskJournal() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (question?: string) => {
    const q = (question || input).trim();
    if (!q || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setLoading(true);

    try {
      const data = await askJournal(q);
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't process that. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="mt-8 space-y-4">
            <p className="text-[14px] text-center" style={{ color: "var(--text-muted)" }}>
              Ask anything about your journal...
            </p>
            <div className="flex flex-col gap-2">
              {[
                "What have I been focused on this week?",
                "How's my sleep been?",
                "What's happening with my trading?",
                "Who have I spent time with?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-[13px] card-press"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[14px] leading-relaxed ${
              msg.role === "user" ? "ml-auto" : ""
            }`}
            style={{
              background: msg.role === "user" ? "var(--accent)" : "var(--bg-surface)",
              color: msg.role === "user" ? "white" : "var(--text-secondary)",
            }}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div
            className="max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[14px]"
            style={{ background: "var(--bg-surface)", color: "var(--text-muted)" }}
          >
            <span className="inline-flex gap-1">
              <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border)" }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your journal..."
            className="flex-1 px-3.5 py-2.5 rounded-xl text-[14px] outline-none"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-press px-4 py-2.5 rounded-xl text-[13px] font-medium text-white disabled:opacity-40"
            style={{ background: "var(--accent)" }}
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
