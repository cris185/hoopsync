"use client";

import { useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

type MediaKind = "team-logo" | "coach-photo" | "player-photo";

export function PhotoUpload({
  kind,
  value,
  onChange,
  label,
  shape = "square",
}: {
  kind: MediaKind;
  value: string | null;
  onChange: (url: string | null) => void;
  label: string;
  shape?: "square" | "circle";
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const { url } = await apiFetch<{ url: string }>(`/media/${kind}`, { method: "POST", body: form });
      onChange(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-text-secondary">{label} (optional)</span>
      <div className="flex items-center gap-3">
        <label
          className={cn(
            "relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden border border-dashed border-surface-border bg-bg-sunken text-text-tertiary transition hover:border-accent-400",
            shape === "circle" ? "rounded-full" : "rounded-sm",
          )}
        >
          {value ? (
            <img src={value} alt={label} className="h-full w-full object-cover" />
          ) : isUploading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <ImagePlus size={18} />
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </label>
        {value && !isUploading && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex items-center gap-1 text-xs text-text-tertiary transition hover:text-status-live"
          >
            <X size={13} />
            Remove
          </button>
        )}
      </div>
      {error && <p className="text-xs text-status-live">{error}</p>}
    </div>
  );
}
