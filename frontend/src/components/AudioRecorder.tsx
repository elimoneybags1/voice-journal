"use client";

import { useCallback, useRef, useState } from "react";
import { uploadRecording, type UploadResult, type CommandResult } from "@/lib/api";

const MIN_DURATION = 2; // minimum 2 seconds

interface Props {
  onUploadComplete?: () => void;
  onCommandResult?: (result: CommandResult) => void;
}

export default function AudioRecorder({ onUploadComplete, onCommandResult }: Props) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationRef = useRef(0);

  const startRecording = useCallback(async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Pick a supported mimeType — Safari doesn't support webm
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"]
        .find((t) => MediaRecorder.isTypeSupported(t));

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start(1000); // collect chunks every second
      setRecording(true);
      setDuration(0);
      durationRef.current = 0;
      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration((d) => d + 1);
      }, 1000);
    } catch {
      setError("Microphone access denied");
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) return;

    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Wait for final data
    await new Promise<void>((resolve) => {
      mediaRecorder.onstop = () => resolve();
      mediaRecorder.stop();
    });

    // Stop all tracks
    mediaRecorder.stream.getTracks().forEach((t) => t.stop());

    const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
    const recordedDuration = durationRef.current;

    if (blob.size === 0) {
      setError("No audio recorded — your browser may not support recording");
      setDuration(0);
      return;
    }

    if (recordedDuration < MIN_DURATION && blob.size < 5000) {
      setError("Recording too short (min 2 seconds)");
      setDuration(0);
      return;
    }

    // Upload with duration
    setUploading(true);
    setError("");
    try {
      const ext = blob.type.includes("mp4") ? "mp4" : blob.type.includes("aac") ? "aac" : "webm";
      const result: UploadResult = await uploadRecording(blob, `recording.${ext}`, recordedDuration);
      if (result.type === "command") {
        onCommandResult?.(result.command_result);
        // Still refresh entries in case the command modified them (delete, move)
        if (result.command_result.action === "delete_entry" || result.command_result.action === "move_entry") {
          onUploadComplete?.();
        }
      } else {
        onUploadComplete?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setDuration(0);
    }
  }, [onUploadComplete, onCommandResult]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center py-6 px-4">
      {/* Waveform when recording */}
      {recording && (
        <div className="flex items-center gap-[3px] h-8 mb-4">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full wave-bar"
              style={{
                background: "var(--recording)",
                animationDelay: `${i * 0.08}s`,
                opacity: 0.4 + Math.sin(i * 0.5) * 0.4,
              }}
            />
          ))}
        </div>
      )}

      {/* Uploading indicator */}
      {uploading && (
        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
          <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
            Processing...
          </span>
        </div>
      )}

      {/* Record button */}
      <button
        onClick={recording ? stopRecording : startRecording}
        disabled={uploading}
        className="btn-press relative flex items-center justify-center disabled:opacity-50"
      >
        {recording && (
          <span
            className="absolute inset-0 rounded-full recording-pulse"
            style={{ background: "var(--recording)", width: 76, height: 76 }}
          />
        )}
        {/* Outer ring */}
        <span
          className="relative z-10 flex items-center justify-center rounded-full"
          style={{
            width: 76,
            height: 76,
            background: recording ? "rgba(232,132,92,0.15)" : "rgba(91,158,244,0.12)",
            border: recording ? "2px solid var(--recording)" : "2px solid rgba(91,158,244,0.3)",
          }}
        >
          {/* Inner filled circle */}
          <span
            className="flex items-center justify-center rounded-full"
            style={{
              width: 56,
              height: 56,
              background: recording ? "var(--recording)" : "var(--accent)",
            }}
          >
            {recording ? (
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="3" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            )}
          </span>
        </span>
      </button>

      {/* Label */}
      <div className="mt-3 text-center">
        {recording ? (
          <p className="text-[14px] font-mono font-medium" style={{ color: "var(--recording)" }}>
            {formatTime(duration)}
          </p>
        ) : uploading ? null : (
          <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
            Tap to record a note
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="mt-2 text-[12px]" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
