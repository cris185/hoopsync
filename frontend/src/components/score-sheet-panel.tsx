"use client";

import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { OCRFieldResult, Player, ScoreSheet, ScoreSheetStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const STATUS_STYLES: Record<ScoreSheetStatus, { bg: string; text: string; label: string }> = {
  PENDING: { bg: "bg-status-scheduled-bg", text: "text-status-scheduled", label: "Pending" },
  PROCESSING: { bg: "bg-status-scheduled-bg", text: "text-status-scheduled", label: "Processing" },
  PROCESSED: { bg: "bg-status-paused-bg", text: "text-status-paused", label: "Needs Review" },
  VALIDATED: { bg: "bg-status-finished-bg", text: "text-status-finished", label: "Validated" },
  REJECTED: { bg: "bg-status-cancelled-bg", text: "text-status-cancelled", label: "Rejected" },
};

const RESOLUTION_STYLES: Record<OCRFieldResult["resolutionMethod"], { text: string; label: string }> = {
  EXACT_ROSTER_MATCH: { text: "text-status-finished", label: "Exact match" },
  FUZZY_ROSTER_MATCH: { text: "text-status-paused", label: "Fuzzy match" },
  MARK_DETECTED: { text: "text-text-secondary", label: "Mark detected" },
  NEEDS_REVIEW: { text: "text-status-live", label: "Needs review" },
};

function ScoreSheetStatusTag({ status }: { status: ScoreSheetStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span className={cn("corner-cut-sm inline-flex w-fit items-center py-1 px-3", style.bg)}>
      <span className={cn("font-display text-[11px] font-bold tracking-wide uppercase", style.text)}>
        {style.label}
      </span>
    </span>
  );
}

export function ScoreSheetPanel({
  matchId,
  roster,
}: {
  matchId: string;
  roster: Player[];
}) {
  const [scoreSheet, setScoreSheet] = useState<ScoreSheet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [isDeciding, setIsDeciding] = useState(false);
  const [fieldEdits, setFieldEdits] = useState<Record<string, { rawText: string; matchedPlayerId: string }>>({});
  const [savingFieldId, setSavingFieldId] = useState<string | null>(null);

  async function loadScoreSheet() {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await apiFetch<ScoreSheet>(`/matches/${matchId}/score-sheet`);
      setScoreSheet(data);
      const edits: Record<string, { rawText: string; matchedPlayerId: string }> = {};
      for (const field of data.processingResult?.fields ?? []) {
        edits[field.id] = { rawText: field.rawText ?? "", matchedPlayerId: field.matchedPlayerId ?? "" };
      }
      setFieldEdits(edits);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setScoreSheet(null);
      } else {
        setLoadError(err instanceof ApiError ? err.message : "Could not load the score sheet");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadScoreSheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  async function handleUpload(file: File) {
    setUploadError(null);
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const result = await apiFetch<{ success?: boolean; reason?: string }>(`/matches/${matchId}/score-sheet`, {
        method: "POST",
        body: form,
      });
      if (result && result.success === false) {
        setUploadError(result.reason ?? "The image failed the quality check — try a clearer, well-lit photo.");
      }
      await loadScoreSheet();
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleReprocess() {
    if (!scoreSheet) return;
    setUploadError(null);
    setIsReprocessing(true);
    try {
      const result = await apiFetch<{ success?: boolean; reason?: string }>(
        `/score-sheets/${scoreSheet.id}/reprocess`,
        { method: "POST" },
      );
      if (result && result.success === false) {
        setUploadError(result.reason ?? "Reprocessing failed the quality check.");
      }
      await loadScoreSheet();
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : "Could not reprocess this image");
    } finally {
      setIsReprocessing(false);
    }
  }

  async function handleSaveField(field: OCRFieldResult) {
    const edit = fieldEdits[field.id];
    if (!edit) return;
    setSavingFieldId(field.id);
    try {
      await apiFetch(`/score-sheets/fields/${field.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          rawText: edit.rawText || undefined,
          matchedPlayerId: edit.matchedPlayerId || undefined,
        }),
      });
      await loadScoreSheet();
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : "Could not save that correction");
    } finally {
      setSavingFieldId(null);
    }
  }

  async function handleDecide(action: "validate" | "reject") {
    if (!scoreSheet) return;
    setIsDeciding(true);
    setUploadError(null);
    try {
      await apiFetch(`/score-sheets/${scoreSheet.id}/${action}`, { method: "POST" });
      await loadScoreSheet();
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsDeciding(false);
    }
  }

  if (isLoading) return <p className="text-sm text-text-tertiary">Loading score sheet…</p>;

  const rosterFields = (scoreSheet?.processingResult?.fields ?? []).filter((f) => f.fieldName.startsWith("roster_row_"));
  const otherFields = (scoreSheet?.processingResult?.fields ?? []).filter((f) => !f.fieldName.startsWith("roster_row_"));
  const isLocked = scoreSheet?.status === "VALIDATED" || scoreSheet?.status === "REJECTED";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold">Score Sheet</h2>
        {scoreSheet && <ScoreSheetStatusTag status={scoreSheet.status} />}
      </div>

      {loadError && <p className="text-sm text-status-live">{loadError}</p>}

      {!scoreSheet ? (
        <label className="flex cursor-pointer flex-col items-center gap-2.5 rounded-md border border-dashed border-surface-border p-8 text-center transition hover:border-accent-400">
          <Upload size={22} className="text-accent-400" />
          <span className="text-sm font-semibold">Upload a photo or PDF of the physical score sheet</span>
          <span className="text-xs text-text-tertiary">
            JPG, PNG, WebP or PDF — the OCR service will read it automatically
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            disabled={isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
          {isUploading && <span className="text-xs text-accent-400">Processing…</span>}
        </label>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            <a href={scoreSheet.imageUrl} target="_blank" rel="noreferrer" className="shrink-0">
              <img
                src={scoreSheet.imageUrl}
                alt="Uploaded score sheet"
                className="h-48 w-36 rounded-md border border-surface-border object-cover transition hover:border-accent-400"
              />
            </a>
            <div className="flex flex-1 flex-col gap-2 text-sm text-text-secondary">
              <span>Uploaded {new Date(scoreSheet.uploadedAt).toLocaleString()}</span>
              {scoreSheet.processingResult && (
                <span>
                  Overall OCR confidence: {Math.round(scoreSheet.processingResult.overallConfidence * 100)}%
                </span>
              )}
              <div className="flex flex-wrap gap-2">
                {!isLocked && (
                  <label className="corner-cut inline-flex h-9 cursor-pointer items-center bg-surface-tint-strong px-3 font-display text-xs font-extrabold tracking-wide text-text-primary uppercase transition hover:bg-white/10">
                    {isUploading ? "Uploading…" : "Replace Photo"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                      disabled={isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
                {!isLocked && scoreSheet.processingResult && (
                  <Button
                    variant="secondary"
                    disabled={isReprocessing}
                    onClick={handleReprocess}
                    className="h-9 px-3 text-xs"
                  >
                    {isReprocessing ? "Reprocessing…" : "Reprocess"}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {uploadError && (
            <p className="rounded-md border border-status-live/30 bg-status-live-bg px-4 py-3 text-sm text-status-live">
              {uploadError}
            </p>
          )}

          {scoreSheet.processingResult && (
            <>
              {rosterFields.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold tracking-wide text-text-tertiary uppercase">
                    Roster Matches
                  </span>
                  <div className="flex flex-col gap-2">
                    {rosterFields.map((field) => {
                      const resolution = RESOLUTION_STYLES[field.resolutionMethod];
                      const edit = fieldEdits[field.id] ?? { rawText: "", matchedPlayerId: "" };
                      return (
                        <div
                          key={field.id}
                          className="flex flex-wrap items-center gap-2 rounded-sm border border-surface-border p-2.5"
                        >
                          <input
                            value={edit.rawText}
                            disabled={isLocked}
                            onChange={(e) =>
                              setFieldEdits((prev) => ({
                                ...prev,
                                [field.id]: { ...edit, rawText: e.target.value },
                              }))
                            }
                            placeholder="Raw OCR text"
                            className="h-9 w-40 rounded-sm border border-surface-border bg-bg-sunken px-2.5 text-xs"
                          />
                          <Select
                            value={edit.matchedPlayerId}
                            disabled={isLocked}
                            onChange={(e) =>
                              setFieldEdits((prev) => ({
                                ...prev,
                                [field.id]: { ...edit, matchedPlayerId: e.target.value },
                              }))
                            }
                            className="h-9 min-w-40 flex-1 text-xs"
                          >
                            <option value="">Unmatched — needs review</option>
                            {roster.map((p) => (
                              <option key={p.id} value={p.id}>
                                #{p.jerseyNumber} {p.name}
                              </option>
                            ))}
                          </Select>
                          <span className="text-xs tabular-nums text-text-tertiary">
                            {Math.round(field.confidence * 100)}%
                          </span>
                          <span className={cn("text-xs font-semibold", resolution.text)}>{resolution.label}</span>
                          {field.wasManuallyCorrected && (
                            <span className="text-xs text-accent-400">Corrected</span>
                          )}
                          {!isLocked && (
                            <Button
                              variant="ghost"
                              disabled={savingFieldId === field.id}
                              onClick={() => handleSaveField(field)}
                              className="h-9 px-2.5 text-xs"
                            >
                              {savingFieldId === field.id ? "Saving…" : "Save"}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {otherFields.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold tracking-wide text-text-tertiary uppercase">
                    Extracted Fields
                  </span>
                  <div className="flex flex-col gap-2">
                    {otherFields.map((field) => {
                      const edit = fieldEdits[field.id] ?? { rawText: "", matchedPlayerId: "" };
                      return (
                        <div
                          key={field.id}
                          className="flex flex-wrap items-center gap-2 rounded-sm border border-surface-border p-2.5"
                        >
                          <span className="w-40 shrink-0 truncate text-xs text-text-tertiary">{field.fieldName}</span>
                          <input
                            value={edit.rawText}
                            disabled={isLocked}
                            onChange={(e) =>
                              setFieldEdits((prev) => ({
                                ...prev,
                                [field.id]: { ...edit, rawText: e.target.value },
                              }))
                            }
                            className="h-9 min-w-24 flex-1 rounded-sm border border-surface-border bg-bg-sunken px-2.5 text-xs"
                          />
                          <span className="text-xs tabular-nums text-text-tertiary">
                            {Math.round(field.confidence * 100)}%
                          </span>
                          {field.wasManuallyCorrected && (
                            <span className="text-xs text-accent-400">Corrected</span>
                          )}
                          {!isLocked && (
                            <Button
                              variant="ghost"
                              disabled={savingFieldId === field.id}
                              onClick={() => handleSaveField(field)}
                              className="h-9 px-2.5 text-xs"
                            >
                              {savingFieldId === field.id ? "Saving…" : "Save"}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {rosterFields.length === 0 && otherFields.length === 0 && (
                <p className="text-sm text-text-tertiary">No fields were extracted from this image.</p>
              )}
            </>
          )}

          {!isLocked && scoreSheet.processingResult && (
            <div className="flex gap-2">
              <Button disabled={isDeciding} onClick={() => handleDecide("validate")} className="h-10 px-4 text-xs">
                Validate
              </Button>
              <Button
                variant="danger"
                disabled={isDeciding}
                onClick={() => handleDecide("reject")}
                className="h-10 px-4 text-xs"
              >
                Reject
              </Button>
            </div>
          )}
          {isLocked && (
            <p className="text-sm text-text-tertiary">
              This score sheet has been {scoreSheet.status === "VALIDATED" ? "validated" : "rejected"} and is now
              locked.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
