import { supabase } from "@/integrations/supabase/client";

export const REGISTRATION_KEY = "registration_status";
export const DEFAULT_CLOSED_MESSAGE = "Pendaftaran dan pengiriman berkas beasiswa telah ditutup. Terima kasih atas partisipasi Anda.";
export interface RegistrationStatus { is_open: boolean; closed_message: string }

export async function getRegistrationStatus(): Promise<RegistrationStatus> {
  const { data, error } = await supabase.from("admin_settings")
    .select("setting_value").eq("setting_key", REGISTRATION_KEY).maybeSingle();
  if (error || !data) throw new Error("Status pendaftaran belum dapat diperiksa. Silakan coba lagi nanti.");
  const value = data.setting_value as Record<string, unknown>;
  return {
    is_open: value?.is_open === true,
    closed_message: typeof value?.closed_message === "string" && value.closed_message.trim()
      ? value.closed_message : DEFAULT_CLOSED_MESSAGE,
  };
}

export async function assertRegistrationOpen() {
  const status = await getRegistrationStatus();
  if (!status.is_open) throw new Error(status.closed_message);
}
