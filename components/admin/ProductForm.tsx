"use client";
// =============================================================================
// components/admin/ProductForm.tsx — Create / Edit product form
// =============================================================================

import { useActionState, useCallback } from "react";
import { createProductAction, updateProductAction, type ProductActionState } from "@/app/admin/actions/products";
import type { CategoryRow, ProductRow } from "@/lib/database.types";

const initialState: ProductActionState = { error: null, success: false };

type Props =
  | { mode: "create"; categories: CategoryRow[] }
  | { mode: "edit"; product: ProductRow; categories: CategoryRow[] };

export default function ProductForm(props: Props) {
  const isEdit = props.mode === "edit";
  const product = isEdit ? props.product : null;
  const categories = props.categories || [];

  // Bind productId for the update action
  const boundUpdateAction = useCallback(
    (prevState: ProductActionState, formData: FormData) =>
      isEdit
        ? updateProductAction(product!.id, prevState, formData)
        : createProductAction(prevState, formData),
    [isEdit, product]
  );

  const [state, formAction, isPending] = useActionState(
    boundUpdateAction,
    initialState
  );

  const fe = state.fieldErrors ?? {};

  // Convert stored paisa back to Rs for display
  const displayPrice = product
    ? (product.price_paisa / 100).toFixed(2)
    : "";
  const displayCompatibility = product
    ? product.compatibility.join("\n")
    : "";

  return (
    <form action={formAction} className="admin-form">
      {state.error && !Object.keys(fe).length && (
        <div className="admin-error-banner" role="alert">{state.error}</div>
      )}
      {state.success && (
        <div className="admin-success-banner" role="status">
          Changes saved successfully.
        </div>
      )}

      {/* ── Core Details ─────────────────────────────────────── */}
      <div className="admin-form-card">
        <p className="admin-form-section-title">Product Details</p>

        <div className="admin-form" style={{ gap: 16 }}>
          <div className="admin-field">
            <label htmlFor="name" className="admin-label">
              Product Name <span className="admin-label-hint">(max 120 chars)</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              maxLength={120}
              required
              disabled={isPending}
              defaultValue={product?.name ?? ""}
              className={`admin-input${fe.name ? " error" : ""}`}
              placeholder="e.g. MagGrip Pro Case"
            />
            {fe.name && <p className="admin-field-error">{fe.name}</p>}
          </div>

          <div className="admin-field">
            <label htmlFor="tagline" className="admin-label">
              Tagline <span className="admin-label-hint">(max 200 chars)</span>
            </label>
            <input
              id="tagline"
              name="tagline"
              type="text"
              maxLength={200}
              required
              disabled={isPending}
              defaultValue={product?.tagline ?? ""}
              className={`admin-input${fe.tagline ? " error" : ""}`}
              placeholder="e.g. Drop protection meets magnetic style"
            />
            {fe.tagline && <p className="admin-field-error">{fe.tagline}</p>}
          </div>

          <div className="admin-field">
            <label htmlFor="description" className="admin-label">
              Description <span className="admin-label-hint">(max 4000 chars)</span>
            </label>
            <textarea
              id="description"
              name="description"
              maxLength={4000}
              required
              disabled={isPending}
              defaultValue={product?.description ?? ""}
              className={`admin-textarea${fe.description ? " error" : ""}`}
              rows={5}
              placeholder="Detailed product description…"
            />
            {fe.description && <p className="admin-field-error">{fe.description}</p>}
          </div>

          <div className="admin-row">
            <div className="admin-field">
              <label htmlFor="price" className="admin-label">
                Price (Rs.) <span className="admin-label-hint">e.g. 2499</span>
              </label>
              <input
                id="price"
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                required
                disabled={isPending}
                defaultValue={displayPrice}
                className={`admin-input${fe.price ? " error" : ""}`}
                placeholder="2499.00"
              />
              {fe.price && <p className="admin-field-error">{fe.price}</p>}
            </div>

            <div className="admin-field">
              <label htmlFor="category_id" className="admin-label">Category</label>
              <select
                id="category_id"
                name="category_id"
                required
                disabled={isPending}
                defaultValue={product?.category_id ?? ""}
                className={`admin-select${fe.category_id ? " error" : ""}`}
              >
                <option value="" disabled>Select category…</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {!cat.is_active ? "(Inactive)" : ""}
                  </option>
                ))}
              </select>
              {fe.category_id && <p className="admin-field-error">{fe.category_id}</p>}
            </div>
          </div>

          <div className="admin-row">
            <div className="admin-field">
              <label htmlFor="badge" className="admin-label">
                Badge <span className="admin-label-hint">(optional, max 40 chars)</span>
              </label>
              <input
                id="badge"
                name="badge"
                type="text"
                maxLength={40}
                disabled={isPending}
                defaultValue={product?.badge ?? ""}
                className={`admin-input${fe.badge ? " error" : ""}`}
                placeholder="e.g. New, Best Seller"
              />
              {fe.badge && <p className="admin-field-error">{fe.badge}</p>}
            </div>

            <div className="admin-field">
              <label htmlFor="compatibility" className="admin-label">
                Compatible Models <span className="admin-label-hint">(one per line)</span>
              </label>
              <textarea
                id="compatibility"
                name="compatibility"
                disabled={isPending}
                defaultValue={displayCompatibility}
                className="admin-textarea"
                rows={3}
                placeholder={"iPhone 15 Pro\niPhone 15\nSamsung S24"}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Publish Status ───────────────────────────────────── */}
      <div className="admin-form-card">
        <p className="admin-form-section-title">Visibility</p>
        <div className="admin-toggle-row">
          <div className="admin-toggle-info">
            <p className="admin-toggle-label">Published</p>
            <p className="admin-toggle-desc">
              Published products are visible to customers on the storefront.
              Drafts are hidden.
            </p>
          </div>
          <label className="admin-toggle">
            <input
              type="checkbox"
              name="published"
              value="true"
              defaultChecked={product?.published ?? false}
              disabled={isPending}
            />
            <span className="admin-toggle-slider" />
          </label>
        </div>
      </div>

      {/* ── Actions ──────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <a href="/admin" className="admin-btn admin-btn-ghost">
          Cancel
        </a>
        <button
          type="submit"
          disabled={isPending}
          className="admin-btn admin-btn-primary"
        >
          {isPending ? (
            <><span className="admin-spinner" aria-hidden="true" /> Saving…</>
          ) : isEdit ? (
            "Save Changes"
          ) : (
            "Create Product"
          )}
        </button>
      </div>
    </form>
  );
}
