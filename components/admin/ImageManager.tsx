"use client";
// =============================================================================
// components/admin/ImageManager.tsx — Drag-drop image upload and management
//
// Client-side validation (mirroring server-side rules in actions/images.ts):
//   • Max 8 images per product
//   • Accepted types: JPEG, PNG, WebP
//   • Max size: 5 MB
// =============================================================================

import { useRef, useState, useTransition } from "react";
import { uploadImageAction, deleteImageAction, type ImageActionState } from "@/app/admin/actions/images";
import type { ProductImageRow } from "@/lib/database.types";
import Image from "next/image";

const MAX_IMAGES = 8;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

interface ImageWithUrl extends ProductImageRow {
  public_url: string;
}

interface Props {
  productId: string;
  images: ImageWithUrl[];
}

// ── Slot component (existing image or empty) ──────────────────────────────────
function ImageSlot({
  image,
  slot,
  productId,
}: {
  image: ImageWithUrl | null;
  slot: number;
  productId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [delState, setDelState] = useState<ImageActionState | null>(null);

  function handleDelete() {
    if (!image) return;
    if (!confirm(`Remove image from slot ${slot}?`)) return;
    startTransition(async () => {
      const result = await deleteImageAction(image.id, productId);
      setDelState(result);
    });
  }

  return (
    <div className="image-slot" style={{ opacity: isPending ? 0.5 : 1 }}>
      <span className="image-slot-label">
        {slot === 0 ? "Cover" : `#${slot}`}
      </span>

      {image ? (
        <>
          <Image
            src={image.public_url}
            alt={image.alt_text || `Product image ${slot}`}
            width={200}
            height={200}
            className="image-slot-thumb"
            style={{ objectFit: "cover" }}
            unoptimized
          />
          <div className="image-slot-actions">
            {delState?.error && (
              <p style={{ color: "var(--adm-red)", fontSize: 11 }}>{delState.error}</p>
            )}
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="admin-btn admin-btn-danger admin-btn-sm"
              type="button"
              style={{ width: "100%", justifyContent: "center" }}
            >
              {isPending ? "Removing…" : "Remove"}
            </button>
          </div>
        </>
      ) : (
        <div className="image-slot-empty">＋</div>
      )}
    </div>
  );
}

// ── Upload form ───────────────────────────────────────────────────────────────
function UploadForm({
  productId,
  nextSlot,
  disabled,
}: {
  productId: string;
  nextSlot: number;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverState, setServerState] = useState<ImageActionState | null>(null);

  function validate(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number]))
      return "Only JPEG, PNG, and WebP files are accepted.";
    if (file.size > MAX_SIZE_BYTES)
      return `File is ${(file.size / 1024 / 1024).toFixed(1)} MB — max allowed is 5 MB.`;
    return null;
  }

  function handleFile(file: File) {
    const err = validate(file);
    if (err) { setClientError(err); setPreview(null); return; }
    setClientError(null);
    setServerState(null);
    setPreview(URL.createObjectURL(file));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
      if (inputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(file);
        inputRef.current.files = dt.files;
      }
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) { setClientError("Please select an image."); return; }
    const err = validate(file);
    if (err) { setClientError(err); return; }

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await uploadImageAction(productId, nextSlot, null as unknown as ImageActionState, formData);
      setServerState(result);
      if (result.success) {
        setPreview(null);
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  if (disabled) {
    return (
      <div className="image-upload-form">
        <p className="image-upload-title">Upload Image</p>
        <p style={{ color: "var(--adm-text-muted)", fontSize: 14 }}>
          This product already has {MAX_IMAGES} images. Remove one to upload another.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="image-upload-form">
      <p className="image-upload-title">
        Upload Image — Slot {nextSlot === 0 ? "0 (Cover)" : nextSlot}
      </p>

      {(clientError || serverState?.error) && (
        <div className="admin-error-banner" role="alert" style={{ marginBottom: 12 }}>
          {clientError ?? serverState?.error}
        </div>
      )}
      {serverState?.success && (
        <div className="admin-success-banner" role="status" style={{ marginBottom: 12 }}>
          Image uploaded successfully.
        </div>
      )}

      {/* Hidden slot input */}
      <input type="hidden" name="slot" value={nextSlot} />

      <div
        className={`image-dropzone${isDragOver ? " drag-over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        aria-label="Click or drag an image to upload"
      >
        <input
          ref={inputRef}
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          disabled={isPending}
          aria-label="Product image file"
        />
        <span className="image-dropzone-icon">🖼️</span>
        <p className="image-dropzone-text">Click to browse or drag & drop</p>
        <p className="image-dropzone-hint">JPEG · PNG · WebP · max 5 MB</p>
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" className="image-preview-thumb" />
        )}
      </div>

      <div className="admin-field" style={{ marginTop: 12 }}>
        <label htmlFor="alt_text" className="admin-label">
          Alt text <span className="admin-label-hint">(optional but recommended)</span>
        </label>
        <input
          id="alt_text"
          name="alt_text"
          type="text"
          maxLength={300}
          className="admin-input"
          placeholder="Describe the image for accessibility"
          disabled={isPending}
        />
      </div>

      <button
        type="submit"
        disabled={isPending || !preview}
        className="admin-btn admin-btn-primary"
        style={{ marginTop: 12 }}
      >
        {isPending ? (
          <><span className="admin-spinner" aria-hidden="true" /> Uploading…</>
        ) : (
          "Upload Image"
        )}
      </button>
    </form>
  );
}

// ── Main ImageManager ─────────────────────────────────────────────────────────
export default function ImageManager({ productId, images }: Props) {
  const slots = Array.from({ length: MAX_IMAGES }, (_, i) => i);
  const imageByOrder = Object.fromEntries(images.map((img) => [img.image_order, img]));
  const nextSlot = slots.find((s) => !imageByOrder[s]) ?? MAX_IMAGES;
  const atLimit = images.length >= MAX_IMAGES;

  return (
    <div className="image-manager">
      <div className="image-grid">
        {slots.map((slot) => (
          <ImageSlot
            key={slot}
            slot={slot}
            image={imageByOrder[slot] ?? null}
            productId={productId}
          />
        ))}
      </div>

      <UploadForm
        productId={productId}
        nextSlot={nextSlot}
        disabled={atLimit}
      />
    </div>
  );
}
