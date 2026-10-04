"use client";
// =============================================================================
// components/admin/ProductListTable.tsx — Tabular product list with actions
// =============================================================================

import Link from "next/link";
import { useTransition } from "react";
import { togglePublishAction, deleteProductAction } from "@/app/admin/actions/products";

interface ProductRow {
  id: string;
  name: string;
  price_paisa: number;
  published: boolean;
  created_at: string;
  categories?: { name: string; slug: string } | null;
}

interface Props {
  products: ProductRow[];
}

function formatPrice(paisa: number) {
  return `Rs. ${(paisa / 100).toLocaleString("en-PK")}`;
}

function ProductTableRow({ product }: { product: ProductRow }) {
  const [isPending, startTransition] = useTransition();

  function handleTogglePublish() {
    startTransition(async () => {
      await togglePublishAction(product.id, product.published);
    });
  }

  function handleDelete() {
    if (
      !confirm(
        `Delete "${product.name}"? This will also remove all its images and cannot be undone.`
      )
    )
      return;
    startTransition(async () => {
      await deleteProductAction(product.id);
    });
  }

  return (
    <tr style={{ opacity: isPending ? 0.5 : 1 }}>
      <td>
        <Link
          href={`/admin/products/${product.id}`}
          className="admin-table-name"
        >
          {product.name}
        </Link>
      </td>
      <td style={{ color: "var(--adm-text-muted)" }}>
        {product.categories?.name ?? "Unassigned"}
      </td>
      <td>{formatPrice(product.price_paisa)}</td>
      <td>
        {product.published ? (
          <span className="admin-badge admin-badge-green">● Live</span>
        ) : (
          <span className="admin-badge admin-badge-amber">○ Draft</span>
        )}
      </td>
      <td>
        <div className="admin-table-actions">
          <Link
            href={`/admin/products/${product.id}`}
            className="admin-btn admin-btn-secondary admin-btn-sm"
          >
            Edit
          </Link>
          <Link
            href={`/admin/products/${product.id}/images`}
            className="admin-btn admin-btn-ghost admin-btn-sm"
          >
            Images
          </Link>
          <button
            onClick={handleTogglePublish}
            disabled={isPending}
            className="admin-btn admin-btn-ghost admin-btn-sm"
            type="button"
          >
            {product.published ? "Unpublish" : "Publish"}
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="admin-btn admin-btn-danger admin-btn-sm"
            type="button"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ProductListTable({ products }: Props) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <ProductTableRow key={p.id} product={p} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
