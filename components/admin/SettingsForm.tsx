"use client";
// =============================================================================
// components/admin/SettingsForm.tsx — Store name and WhatsApp number form
// =============================================================================

import { useActionState } from "react";
import { updateSettingsAction, type SettingsActionState } from "@/app/admin/actions/settings";
import type { StoreSettingsRow } from "@/lib/database.types";

import { useState } from "react";
import Image from "next/image";

const initialState: SettingsActionState = { error: null, success: false };

interface Props {
  settings: StoreSettingsRow | null;
}

export default function SettingsForm({ settings }: Props) {
  const [state, formAction, isPending] = useActionState(updateSettingsAction, initialState);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const currentLogo = settings?.logo_url || "/logo.png";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      setRemoveLogo(false);
    }
  }

  return (
    <form action={formAction} encType="multipart/form-data" className="admin-form">
      {state.error && (
        <div className="admin-error-banner" role="alert">{state.error}</div>
      )}
      {state.success && (
        <div className="admin-success-banner" role="status">
          Settings saved successfully.
        </div>
      )}

      <div className="admin-form-card">
        <p className="admin-form-section-title">Storefront Identity</p>

        <div className="admin-form" style={{ gap: 20 }}>
          {/* Logo Upload Section */}
          <div className="admin-field">
            <label className="admin-label">Store Logo Image</label>
            <div style={{ display: "flex", gap: 20, alignItems: "center", marginTop: 8 }}>
              <div style={{
                background: "#0a0f1e",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                padding: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 160,
                minHeight: 70
              }}>
                <Image
                  src={removeLogo ? "/logo.png" : (previewUrl || currentLogo)}
                  alt="Store Logo Preview"
                  width={180}
                  height={52}
                  style={{ objectFit: "contain", height: "52px", width: "auto" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  id="logo_file"
                  name="logo_file"
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  disabled={isPending}
                  onChange={handleFileChange}
                  className="admin-input"
                  style={{ padding: "8px 12px" }}
                />
                <input type="hidden" name="remove_logo" value={removeLogo ? "true" : "false"} />
                {settings?.logo_url && !removeLogo && (
                  <button
                    type="button"
                    onClick={() => { setRemoveLogo(true); setPreviewUrl(null); }}
                    className="admin-btn admin-btn-ghost admin-btn-sm"
                    style={{ alignSelf: "flex-start", color: "#ef4444" }}
                  >
                    Reset to Default Logo
                  </button>
                )}
                <p className="admin-field-hint">
                  Recommended PNG, WebP or SVG format (Max 5 MB).
                </p>
              </div>
            </div>
          </div>

          <div className="admin-field">
            <label htmlFor="store_name" className="admin-label">
              Store Name <span className="admin-label-hint">(max 80 chars)</span>
            </label>
            <input
              id="store_name"
              name="store_name"
              type="text"
              maxLength={80}
              required
              disabled={isPending}
              defaultValue={settings?.store_name ?? "VIEW STORE"}
              className="admin-input"
              placeholder="VIEW STORE"
            />
            <p className="admin-field-hint">
              Displayed in the navbar, footer, and page titles.
            </p>
          </div>

          <div className="admin-field">
            <label htmlFor="whatsapp_number" className="admin-label">
              WhatsApp Number{" "}
              <span className="admin-label-hint">
                (international format, e.g. 923001234567 — no + or spaces)
              </span>
            </label>
            <input
              id="whatsapp_number"
              name="whatsapp_number"
              type="tel"
              disabled={isPending}
              defaultValue={settings?.whatsapp_number ?? ""}
              className="admin-input"
              placeholder="923001234567"
            />
            <p className="admin-field-hint">
              Leave blank to disable the WhatsApp order button on the storefront.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="submit"
          disabled={isPending}
          className="admin-btn admin-btn-primary"
        >
          {isPending ? (
            <><span className="admin-spinner" aria-hidden="true" /> Saving…</>
          ) : (
            "Save Settings"
          )}
        </button>
      </div>
    </form>
  );
}
