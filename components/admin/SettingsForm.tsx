"use client";
// =============================================================================
// components/admin/SettingsForm.tsx — Store name and WhatsApp number form
// =============================================================================

import { useActionState } from "react";
import { updateSettingsAction, type SettingsActionState } from "@/app/admin/actions/settings";
import type { StoreSettingsRow } from "@/lib/database.types";

const initialState: SettingsActionState = { error: null, success: false };

interface Props {
  settings: StoreSettingsRow | null;
}

export default function SettingsForm({ settings }: Props) {
  const [state, formAction, isPending] = useActionState(updateSettingsAction, initialState);

  return (
    <form action={formAction} className="admin-form">
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

        <div className="admin-form" style={{ gap: 16 }}>
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
              defaultValue={settings?.store_name ?? "MobiGear"}
              className="admin-input"
              placeholder="MobiGear"
            />
            <p className="admin-field-hint">
              Displayed in the navbar and page title.
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
