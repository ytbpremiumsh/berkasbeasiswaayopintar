import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function onlyDigits(input: string) {
  return (input || "").replace(/\D/g, "");
}

function normalizeIndoPhone(input: string) {
  const digits = onlyDigits(input);
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

function getSettingValue(settings: any[], key: string): string {
  const found = settings?.find((s) => s.setting_key === key)?.setting_value;
  // setting_value stored as { value: ... }
  if (!found) return "";
  if (typeof found === "string") return found;
  return String(found.value ?? "");
}

function getSettingBool(settings: any[], key: string): boolean {
  const found = settings?.find((s) => s.setting_key === key)?.setting_value;
  const v = typeof found === "object" ? found?.value : found;
  return v === true || v === "true";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const rawPhone = String(body.phone || "");
    const message = String(body.message || "");
    const recipientName = body.recipientName ? String(body.recipientName) : null;
    const submissionId = body.submissionId ? String(body.submissionId) : null;

    if (!rawPhone || !message) {
      return new Response(
        JSON.stringify({ success: false, message: "phone dan message wajib diisi" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const { data: settings, error: settingsError } = await supabase
      .from("admin_settings")
      .select("setting_key, setting_value")
      .in("setting_key", [
        "onesender_api_url",
        "onesender_api_key",
        "onesender_phone",
        "whatsapp_enabled",
      ]);

    if (settingsError) throw settingsError;

    const isEnabled = getSettingBool(settings || [], "whatsapp_enabled");
    if (!isEnabled) {
      return new Response(
        JSON.stringify({ success: false, message: "WhatsApp sedang nonaktif" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const apiUrl = getSettingValue(settings || [], "onesender_api_url");
    const apiKey = getSettingValue(settings || [], "onesender_api_key");
    const senderRaw = getSettingValue(settings || [], "onesender_phone");

    const sender = normalizeIndoPhone(senderRaw);
    const phone = normalizeIndoPhone(rawPhone);

    if (!apiUrl || !apiKey || !sender) {
      return new Response(
        JSON.stringify({ success: false, message: "Konfigurasi OneSender belum lengkap" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    if (!phone) {
      return new Response(
        JSON.stringify({ success: false, message: "Nomor tujuan tidak valid" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    console.log("[send-whatsapp] sending", { to: phone, sender });

    const waResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone,
        message,
        sender,
      }),
    });

    let waResult: any = null;
    try {
      waResult = await waResponse.json();
    } catch (_) {
      waResult = { raw: await waResponse.text().catch(() => "") };
    }

    await supabase.from("whatsapp_logs").insert({
      recipient_phone: phone,
      recipient_name: recipientName,
      message,
      status: waResponse.ok ? "success" : "failed",
      error_message: waResponse.ok ? null : JSON.stringify(waResult),
      submission_id: submissionId,
    });

    if (!waResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, message: "Gagal mengirim WhatsApp", provider: waResult }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 502 },
      );
    }

    return new Response(
      JSON.stringify({ success: true, provider: waResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("[send-whatsapp] error:", error);
    return new Response(
      JSON.stringify({ success: false, message: error?.message || "Terjadi kesalahan" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
