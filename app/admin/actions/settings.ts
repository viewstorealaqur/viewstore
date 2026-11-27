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
  const removeLogo = formData.get("remove_logo") === "true";
  const logoFile = formData.get("logo_file") as File | null;

  if (!storeName || storeName.length > 80)
    return { error: "Store name is required (max 80 characters).", success: false };
  if (whatsappNumber && !/^[0-9]{7,15}$/.test(whatsappNumber))
    return { error: "WhatsApp number must be 7–15 digits in international format (e.g. 923001234567).", success: false };

  const supabase = await createServerSupabaseClient();
  let logoUrl: string | null | undefined = undefined;

  if (removeLogo) {
    logoUrl = null;
  } else if (logoFile && logoFile.size > 0) {
    if (logoFile.size > 5 * 1024 * 1024) {
      return { error: "Logo image file must be smaller than 5 MB.", success: false };
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(logoFile.type)) {
      return { error: "Logo image must be JPG, PNG, WebP, or SVG format.", success: false };
    }

    const ext = logoFile.name.split(".").pop() || "png";
    const storagePath = `store/logo-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(storagePath, logoFile, { contentType: logoFile.type, upsert: true });

    if (uploadError) {
      console.error("[updateSettings logo upload]", uploadError);
      return { error: "Failed to upload logo image. Please try again.", success: false };
    }

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(storagePath);

    logoUrl = urlData.publicUrl;
  }

  const updateData: Record<string, any> = {
    store_name: storeName,
    whatsapp_number: whatsappNumber,
  };

  if (logoUrl !== undefined) {
    updateData.logo_url = logoUrl;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let { error } = await (supabase as any)
    .from("store_settings")
    .update(updateData)
    .eq("id", "singleton") as { error: Error | null };

  // If column logo_url doesn't exist yet on unmigrated DB, fallback to updating without logo_url
  if (error && logoUrl !== undefined && error.message?.includes("logo_url")) {
    delete updateData.logo_url;
    const retry = await (supabase as any)
      .from("store_settings")
      .update(updateData)
      .eq("id", "singleton");
    error = retry.error;
  }

  if (error) {
    console.error("[updateSettings]", error);
    return { error: "Failed to save settings. Please try again.", success: false };
  }

  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { error: null, success: true };
}
