// =============================================================================
// app/admin/settings/page.tsx — Store settings page
// =============================================================================

import { requireOwner } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import SettingsForm from "@/components/admin/SettingsForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Store Settings — VIEW STORE Admin" };

export default async function SettingsPage() {
  await requireOwner();

  const supabase = await createServerSupabaseClient();
  const { data: settings } = await supabase
    .from("store_settings")
    .select("*")
    .eq("id", "singleton")
    .single();

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Store Settings</h1>
          <p className="admin-page-subtitle">
            Store name and WhatsApp number shown on the storefront
          </p>
        </div>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
