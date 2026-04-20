"use client";

/**
 * Multi-image uploader with drag-and-drop, reordering, deletion, and per-file
 * upload progress. Uploads go through a configurable POST endpoint that must
 * accept multipart/form-data with one or more `files` fields and respond with
 * `{ urls: string[] }`. The component is fully controlled — `urls` and
 * `onChange` come from the parent, so you can wire it into any form.
 *
 * Used by: dashboard menu/product editor, dashboard business profile editor.
 */

import { useCallback, useRef, useState } from "react";
import Image from "next/image";

export interface ImageGalleryProps {
  /** Current ordered list of public image URLs. */
  urls: string[];
  /** Called whenever the list changes (upload, delete, reorder). */
  onChange: (urls: string[]) => void;
  /** Endpoint that accepts FormData with `files` and returns `{ urls: string[] }`. */
  uploadEndpoint: string;
  /** Hard cap on number of images. Defaults to 10. */
  maxImages?: number;
  /** Per-file size cap in bytes. Defaults to 5 MB. */
  maxSizeBytes?: number;
  /** Accepted MIME types. Defaults to common web image formats. */
  acceptedTypes?: string[];
  /** Optional label rendered above the dropzone. */
  label?: string;
  /** Helper text rendered below the label. */
  helperText?: string;
}

const DEFAULT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;

interface UploadingFile {
  id: string;
  name: string;
  progress: number; // 0..1
  error?: string;
}

export default function ImageGallery({
  urls,
  onChange,
  uploadEndpoint,
  maxImages = 10,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  acceptedTypes = DEFAULT_TYPES,
  label = "Images",
  helperText,
}: ImageGalleryProps) {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const slotsLeft = Math.max(0, maxImages - urls.length);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!acceptedTypes.includes(file.type)) {
        return `${file.name} is not a supported image type`;
      }
      if (file.size > maxSizeBytes) {
        const mb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
        return `${file.name} is over the ${mb} MB limit`;
      }
      return null;
    },
    [acceptedTypes, maxSizeBytes]
  );

  const uploadOne = useCallback(
    async (file: File, id: string): Promise<string | null> => {
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", uploadEndpoint);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setUploading((prev) =>
              prev.map((u) =>
                u.id === id ? { ...u, progress: ev.loaded / ev.total } : u
              )
            );
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              const url = data.urls?.[0] ?? data.url ?? null;
              resolve(url);
            } catch {
              resolve(null);
            }
          } else {
            try {
              const data = JSON.parse(xhr.responseText);
              setUploading((prev) =>
                prev.map((u) =>
                  u.id === id
                    ? { ...u, error: data?.error || `Upload failed (${xhr.status})` }
                    : u
                )
              );
            } catch {
              setUploading((prev) =>
                prev.map((u) =>
                  u.id === id ? { ...u, error: `Upload failed (${xhr.status})` } : u
                )
              );
            }
            resolve(null);
          }
        };
        xhr.onerror = () => {
          setUploading((prev) =>
            prev.map((u) => (u.id === id ? { ...u, error: "Network error" } : u))
          );
          resolve(null);
        };

        const form = new FormData();
        form.append("files", file);
        xhr.send(form);
      });
    },
    [uploadEndpoint]
  );

  const ingestFiles = useCallback(
    async (incoming: FileList | File[]) => {
      setError(null);
      const list = Array.from(incoming);
      if (!list.length) return;

      // Cap to remaining slots
      const cappedList = list.slice(0, slotsLeft);
      if (cappedList.length < list.length) {
        setError(`Only ${slotsLeft} more image${slotsLeft === 1 ? "" : "s"} allowed`);
      }

      // Validate up front
      const validFiles: { id: string; file: File }[] = [];
      for (const file of cappedList) {
        const err = validateFile(file);
        if (err) {
          setError(err);
          continue;
        }
        validFiles.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file,
        });
      }
      if (!validFiles.length) return;

      // Mark all as uploading
      setUploading((prev) => [
        ...prev,
        ...validFiles.map(({ id, file }) => ({
          id,
          name: file.name,
          progress: 0,
        })),
      ]);

      // Upload sequentially to keep API load predictable; parents that need
      // parallelism can run multiple instances.
      const newUrls: string[] = [];
      for (const { id, file } of validFiles) {
        const url = await uploadOne(file, id);
        if (url) newUrls.push(url);
        // Drop completed/failed entry shortly after so the UI clears.
        setTimeout(() => {
          setUploading((prev) => prev.filter((u) => u.id !== id));
        }, 600);
      }

      if (newUrls.length) {
        onChange([...urls, ...newUrls]);
      }
    },
    [slotsLeft, validateFile, uploadOne, onChange, urls]
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      void ingestFiles(e.target.files);
      // Reset so the same file can be picked again later
      e.target.value = "";
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void ingestFiles(e.dataTransfer.files);
    }
  }

  function reorder(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= urls.length || to >= urls.length) return;
    const next = [...urls];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  function removeAt(idx: number) {
    onChange(urls.filter((_, i) => i !== idx));
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-txt-secondary mb-1.5">
          {label}
          <span className="ml-2 text-[10px] text-txt-secondary/70">
            {urls.length} / {maxImages}
          </span>
        </label>
      )}
      {helperText && (
        <p className="text-[11px] text-txt-secondary/70 mb-2">{helperText}</p>
      )}

      {/* Image grid (existing + uploading placeholders) */}
      {(urls.length > 0 || uploading.length > 0) && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {urls.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              draggable
              onDragStart={() => setDragIndex(idx)}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null) {
                  reorder(dragIndex, idx);
                  setDragIndex(null);
                }
              }}
              onDragEnd={() => setDragIndex(null)}
              className={`relative aspect-square rounded-xl overflow-hidden bg-card border border-border-subtle group ${
                dragIndex === idx ? "opacity-50" : ""
              }`}
            >
              <Image
                src={url}
                alt={`Image ${idx + 1}`}
                fill
                sizes="(max-width: 640px) 33vw, 200px"
                className="object-cover"
              />
              {idx === 0 && (
                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-gold/90 text-midnight text-[9px] font-bold uppercase tracking-wider">
                  Cover
                </span>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-between px-1.5 opacity-0 group-hover:opacity-100">
                {/* Reorder buttons */}
                <button
                  type="button"
                  onClick={() => reorder(idx, idx - 1)}
                  disabled={idx === 0}
                  aria-label="Move left"
                  className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center disabled:opacity-30"
                >
                  <svg width="10" height="10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <path d="M7 1L1 5l6 4" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => reorder(idx, idx + 1)}
                  disabled={idx === urls.length - 1}
                  aria-label="Move right"
                  className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center disabled:opacity-30"
                >
                  <svg width="10" height="10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <path d="M1 1l6 4-6 4" />
                  </svg>
                </button>
              </div>
              {/* Always-visible delete button */}
              <button
                type="button"
                onClick={() => removeAt(idx)}
                aria-label="Delete image"
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center hover:bg-coral/80 transition-colors"
              >
                <svg width="9" height="9" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M2 2l5 5M7 2l-5 5" />
                </svg>
              </button>
            </div>
          ))}

          {/* Uploading placeholders */}
          {uploading.map((u) => (
            <div
              key={u.id}
              className="relative aspect-square rounded-xl overflow-hidden bg-card border border-border-subtle flex items-center justify-center"
            >
              {u.error ? (
                <div className="text-center px-2">
                  <p className="text-[10px] text-coral font-medium leading-tight">
                    {u.error}
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                    <div
                      className="h-full bg-gold transition-all duration-200"
                      style={{ width: `${Math.round(u.progress * 100)}%` }}
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      {slotsLeft > 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`w-full rounded-xl border-2 border-dashed py-5 px-3 flex flex-col items-center justify-center gap-1.5 transition-colors ${
            dragOver
              ? "border-gold bg-gold/5"
              : "border-border-subtle hover:border-gold/40"
          }`}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-txt-secondary">
            <path d="M12 16V8m0 0l-3 3m3-3l3 3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xs text-txt-secondary">
            Drop images here or click to upload
          </span>
          <span className="text-[10px] text-txt-secondary/60">
            {acceptedTypes.map((t) => t.split("/")[1]).join(", ").toUpperCase()} ·
            up to {Math.round(maxSizeBytes / (1024 * 1024))} MB each ·
            {" "}{slotsLeft} slot{slotsLeft === 1 ? "" : "s"} left
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        multiple
        onChange={handleInputChange}
        className="hidden"
      />

      {error && (
        <p className="mt-2 text-xs text-coral">{error}</p>
      )}
    </div>
  );
}
