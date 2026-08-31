import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function registrationFailure(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("admin_settings")
    .select("setting_value").eq("setting_key", "registration_status").maybeSingle();
  if (error || !data) return { status: 503, message: "Status pendaftaran belum dapat diperiksa. Silakan coba lagi nanti." };
  if (data.setting_value?.is_open !== true) return {
    status: 403,
    message: typeof data.setting_value?.closed_message === "string" && data.setting_value.closed_message.trim()
      ? data.setting_value.closed_message : "Pendaftaran dan pengiriman berkas beasiswa telah ditutup.",
  };
  return null;
}
