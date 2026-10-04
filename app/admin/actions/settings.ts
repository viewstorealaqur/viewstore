"use server";
// =============================================================================
// app/admin/actions/settings.ts — Store Settings Server Action
// =============================================================================

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type SettingsActionState = {
  error: string | null;
  success: boolean;
};

export async function updateSettingsAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  await requireOwner();

  const storeName = String(formData.get("store_name") ?? "").trim();
  const whatsappRaw = String(formData.get("whatsapp_number") ?? "").trim();
  const whatsappNumber = whatsappRaw.replace(/\D/g, "") || null;

  if (!storeName || storeName.length > 80)
    return { error: "Store name is required (max 80 characters).", success: false };
  if (whatsappNumber && !/^[0-9]{7,15}$/.test(whatsappNumber))
    return { error: "WhatsApp number must be 7–15 digits in international format (e.g. 923001234567).", success: false };

  const supabase = await createServerSupabaseClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("store_settings")
    .update({ store_name: storeName, whatsapp_number: whatsappNumber })
    .eq("id", "singleton") as { error: Error | null };

  if (error) {
    console.error("[updateSettings]", error);
    return { error: "Failed to save settings. Please try again.", success: false };
  }

  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { error: null, success: true };
}
