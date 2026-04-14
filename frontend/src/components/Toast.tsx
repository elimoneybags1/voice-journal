"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onDismiss: () => void;
}

export default function Toast({ message, type, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slide in
    requestAnimationFrame(() => setVisible(true));

    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300); // Wait for slide-out animation
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-14 pointer-events-none"
      style={{
        transition: "transform 0.3s ease, opacity 0.3s ease",
        transform: visible ? "translateY(0)" : "translateY(-100%)",
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        className="pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl max-w-lg w-full shadow-lg"
        style={{
          background: "var(--bg-elevated)",
          border: `1px solid ${type === "success" ? "var(--success)" : "var(--danger)"}`,
        }}
      >
        {/* Icon */}
        <span
          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: type === "success" ? "var(--success)" : "var(--danger)" }}
        >
          {type === "success" ? (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </span>

        {/* Message */}
        <span className="text-[14px] font-medium flex-1" style={{ color: "var(--text-primary)" }}>
          {message}
        </span>

        {/* Dismiss button */}
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="btn-press flex-shrink-0 p-1"
          style={{ color: "var(--text-muted)" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
