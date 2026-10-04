"use client";
// =============================================================================
// components/admin/CategoryManager.tsx — Category Management Component
// =============================================================================

import { useState, useTransition } from "react";
import {
  createCategoryAction,
  updateCategoryAction,
  toggleCategoryActiveAction,
  deleteCategoryAction,
  type CategoryActionState,
} from "@/app/admin/actions/categories";
import { slugify } from "@/lib/slug";
import type { CategoryRow } from "@/lib/database.types";

export interface CategoryWithProductCount extends CategoryRow {
  product_count: number;
}

interface Props {
  initialCategories: CategoryWithProductCount[];
}

export default function CategoryManager({ initialCategories }: Props) {
  const [categories] = useState<CategoryWithProductCount[]>(initialCategories);
  const [isPending, startTransition] = useTransition();

  // State for Create Modal / Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState("");
  const [addSlug, setAddSlug] = useState("");
  const [addOrder, setAddOrder] = useState(0);
  const [addIsActive, setAddIsActive] = useState(true);
  const [addState, setAddState] = useState<CategoryActionState>({ error: null, success: false });

  // State for Edit Modal
  const [editingCategory, setEditingCategory] = useState<CategoryWithProductCount | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editOrder, setEditOrder] = useState(0);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editState, setEditState] = useState<CategoryActionState>({ error: null, success: false });

  // General Action State / Messages
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Auto-generate slug when name changes in Add form
  function handleAddNameChange(val: string) {
    setAddName(val);
    setAddSlug(slugify(val));
  }

  // Handle Add Submit
  function handleAddSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    const formData = new FormData();
    formData.append("name", addName);
    formData.append("slug", addSlug);
    formData.append("display_order", addOrder.toString());
    formData.append("is_active", addIsActive ? "true" : "false");

    startTransition(async () => {
      const res = await createCategoryAction({ error: null, success: false }, formData);
      setAddState(res);
      if (res.success) {
        setShowAddModal(false);
        setAddName("");
        setAddSlug("");
        setAddOrder(0);
        setAddIsActive(true);
        setActionSuccess("Category created successfully.");
      }
    });
  }

  // Start Editing
  function handleStartEdit(cat: CategoryWithProductCount) {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditSlug(cat.slug);
    setEditOrder(cat.display_order);
    setEditIsActive(cat.is_active);
    setEditState({ error: null, success: false });
  }

  // Handle Edit Submit
  function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingCategory) return;
    setActionError(null);
    setActionSuccess(null);

    const formData = new FormData();
    formData.append("name", editName);
    formData.append("slug", editSlug);
    formData.append("display_order", editOrder.toString());
    formData.append("is_active", editIsActive ? "true" : "false");

    startTransition(async () => {
      const res = await updateCategoryAction(editingCategory.id, { error: null, success: false }, formData);
      setEditState(res);
      if (res.success) {
        setEditingCategory(null);
        setActionSuccess("Category updated successfully.");
      }
    });
  }

  // Handle Toggle Active
  function handleToggleActive(cat: CategoryWithProductCount) {
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await toggleCategoryActiveAction(cat.id, cat.is_active);
      if (!res.success && res.error) {
        setActionError(res.error);
      } else {
        setActionSuccess(`Category "${cat.name}" status updated.`);
      }
    });
  }

  // Handle Delete Category
  function handleDelete(cat: CategoryWithProductCount) {
    setActionError(null);
    setActionSuccess(null);

    if (cat.product_count > 0) {
      setActionError(
        `Cannot delete "${cat.name}": ${cat.product_count} product(s) are currently assigned to this category. Please reassign those products to another category first.`
      );
      return;
    }

    if (!confirm(`Are you sure you want to delete category "${cat.name}"? This action cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteCategoryAction(cat.id);
      if (!res.success && res.error) {
        setActionError(res.error);
      } else {
        setActionSuccess(`Category "${cat.name}" deleted successfully.`);
      }
    });
  }

  return (
    <div className="category-manager" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {actionError && (
        <div className="admin-error-banner" role="alert">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="admin-success-banner" role="status">
          {actionSuccess}
        </div>
      )}

      {/* ── Page Header Controls ────────────────────────────── */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Product Categories</h1>
          <p className="admin-page-subtitle">
            Manage storefront categories, display order, and active visibility
          </p>
        </div>
        <button
          onClick={() => {
            setShowAddModal(true);
            setAddState({ error: null, success: false });
            setAddOrder(categories.length);
          }}
          className="admin-btn admin-btn-primary"
          type="button"
        >
          + Add Category
        </button>
      </div>

      {/* ── Category List Table ────────────────────────────── */}
      {categories.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>Order</th>
                <th>Category Name</th>
                <th>URL Slug</th>
                <th>Products</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} style={{ opacity: isPending ? 0.6 : 1 }}>
                  <td>
                    <span
                      style={{
                        fontFamily: "monospace",
                        background: "var(--adm-surface-2)",
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 12,
                      }}
                    >
                      #{cat.display_order}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: "var(--adm-text)" }}>
                      {cat.name}
                    </span>
                  </td>
                  <td>
                    <code
                      style={{
                        color: "var(--adm-blue)",
                        fontSize: 12,
                        background: "rgba(79,142,247,0.1)",
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      {cat.slug}
                    </code>
                  </td>
                  <td>
                    <span className="admin-badge admin-badge-gray">
                      {cat.product_count} product{cat.product_count !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td>
                    {cat.is_active ? (
                      <span className="admin-badge admin-badge-green">● Active</span>
                    ) : (
                      <span className="admin-badge admin-badge-amber">○ Inactive</span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className="admin-table-actions" style={{ justifyContent: "flex-end" }}>
                      <button
                        onClick={() => handleStartEdit(cat)}
                        disabled={isPending}
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(cat)}
                        disabled={isPending}
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                        type="button"
                      >
                        {cat.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        disabled={isPending}
                        className="admin-btn admin-btn-danger admin-btn-sm"
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-empty">
          <p className="admin-empty-icon">🏷️</p>
          <p className="admin-empty-text">No categories found.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="admin-btn admin-btn-primary"
            type="button"
          >
            Create your first category
          </button>
        </div>
      )}

      {/* ── Add Category Modal / Inline Form ──────────────────── */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 16,
          }}
        >
          <div className="admin-form-card" style={{ width: "100%", maxWidth: 500 }}>
            <p className="admin-form-section-title">Add New Category</p>
            {addState.error && (
              <div className="admin-error-banner" style={{ marginBottom: 16 }}>
                {addState.error}
              </div>
            )}
            <form onSubmit={handleAddSubmit} className="admin-form">
              <div className="admin-field">
                <label className="admin-label" htmlFor="add-name">
                  Category Name
                </label>
                <input
                  id="add-name"
                  type="text"
                  required
                  maxLength={80}
                  value={addName}
                  onChange={(e) => handleAddNameChange(e.target.value)}
                  className={`admin-input${addState.fieldErrors?.name ? " error" : ""}`}
                  placeholder="e.g. Hot offers, Camping"
                />
                {addState.fieldErrors?.name && (
                  <p className="admin-field-error">{addState.fieldErrors.name}</p>
                )}
              </div>

              <div className="admin-field">
                <label className="admin-label" htmlFor="add-slug">
                  URL Slug <span className="admin-label-hint">(URL safe identifier)</span>
                </label>
                <input
                  id="add-slug"
                  type="text"
                  required
                  maxLength={80}
                  value={addSlug}
                  onChange={(e) => setAddSlug(slugify(e.target.value))}
                  className={`admin-input${addState.fieldErrors?.slug ? " error" : ""}`}
                  placeholder="e.g. hot-offers"
                />
                {addState.fieldErrors?.slug && (
                  <p className="admin-field-error">{addState.fieldErrors.slug}</p>
                )}
              </div>

              <div className="admin-row">
                <div className="admin-field">
                  <label className="admin-label" htmlFor="add-order">
                    Display Order
                  </label>
                  <input
                    id="add-order"
                    type="number"
                    required
                    value={addOrder}
                    onChange={(e) => setAddOrder(parseInt(e.target.value, 10) || 0)}
                    className="admin-input"
                  />
                </div>

                <div className="admin-field" style={{ justifyContent: "center" }}>
                  <label className="admin-toggle-row" style={{ border: "none" }}>
                    <span className="admin-toggle-label">Active</span>
                    <label className="admin-toggle">
                      <input
                        type="checkbox"
                        checked={addIsActive}
                        onChange={(e) => setAddIsActive(e.target.checked)}
                      />
                      <span className="admin-toggle-slider" />
                    </label>
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 12 }}>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="admin-btn admin-btn-ghost"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="admin-btn admin-btn-primary"
                >
                  {isPending ? "Creating…" : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Category Modal ────────────────────────────── */}
      {editingCategory && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 16,
          }}
        >
          <div className="admin-form-card" style={{ width: "100%", maxWidth: 500 }}>
            <p className="admin-form-section-title">Edit Category: {editingCategory.name}</p>
            {editState.error && (
              <div className="admin-error-banner" style={{ marginBottom: 16 }}>
                {editState.error}
              </div>
            )}
            <form onSubmit={handleEditSubmit} className="admin-form">
              <div className="admin-field">
                <label className="admin-label" htmlFor="edit-name">
                  Category Name
                </label>
                <input
                  id="edit-name"
                  type="text"
                  required
                  maxLength={80}
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                  }}
                  className={`admin-input${editState.fieldErrors?.name ? " error" : ""}`}
                />
                {editState.fieldErrors?.name && (
                  <p className="admin-field-error">{editState.fieldErrors.name}</p>
                )}
              </div>

              <div className="admin-field">
                <label className="admin-label" htmlFor="edit-slug">
                  URL Slug
                </label>
                <input
                  id="edit-slug"
                  type="text"
                  required
                  maxLength={80}
                  value={editSlug}
                  onChange={(e) => setEditSlug(slugify(e.target.value))}
                  className={`admin-input${editState.fieldErrors?.slug ? " error" : ""}`}
                />
                {editState.fieldErrors?.slug && (
                  <p className="admin-field-error">{editState.fieldErrors.slug}</p>
                )}
              </div>

              <div className="admin-row">
                <div className="admin-field">
                  <label className="admin-label" htmlFor="edit-order">
                    Display Order
                  </label>
                  <input
                    id="edit-order"
                    type="number"
                    required
                    value={editOrder}
                    onChange={(e) => setEditOrder(parseInt(e.target.value, 10) || 0)}
                    className="admin-input"
                  />
                </div>

                <div className="admin-field" style={{ justifyContent: "center" }}>
                  <label className="admin-toggle-row" style={{ border: "none" }}>
                    <span className="admin-toggle-label">Active</span>
                    <label className="admin-toggle">
                      <input
                        type="checkbox"
                        checked={editIsActive}
                        onChange={(e) => setEditIsActive(e.target.checked)}
                      />
                      <span className="admin-toggle-slider" />
                    </label>
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 12 }}>
                <button
                  onClick={() => setEditingCategory(null)}
                  className="admin-btn admin-btn-ghost"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="admin-btn admin-btn-primary"
                >
                  {isPending ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
