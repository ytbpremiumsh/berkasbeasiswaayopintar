import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function onlyDigits(input: string) {
  return (input || "").replace(/\D/g, "");
}
function normalizeIndoPhone(input: string) {
  const d = onlyDigits(input);
  if (!d) return "";
  if (d.startsWith("62")) return d;
  if (d.startsWith("0")) return `62${d.slice(1)}`;
  return d;
}
function getVal(settings: any[], key: string) {
  const f = settings?.find((s) => s.setting_key === key)?.setting_value;
  if (!f) return "";
  if (typeof f === "string") return f;
  return String(f.value ?? "");
}
function getBool(settings: any[], key: string) {
  const f = settings?.find((s) => s.setting_key === key)?.setting_value;
  const v = typeof f === "object" ? f?.value : f;
  return v === true || v === "true";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "send");

    const { data: settings } = await supabase
      .from("admin_settings")
      .select("setting_key, setting_value")
      .in("setting_key", [
        "mpwa_api_url",
        "mpwa_api_key",
        "mpwa_sender",
        "mpwa_footer",
        "mpwa_enabled",
      ]);

    const apiUrl = getVal(settings || [], "mpwa_api_url") || "https://app.ayopintar.com/send-message";
    const apiKey = getVal(settings || [], "mpwa_api_key");
    const sender = getVal(settings || [], "mpwa_sender");
    const footer = getVal(settings || [], "mpwa_footer");
    const isEnabled = getBool(settings || [], "mpwa_enabled");

    if (action === "generate-qr") {
      if (!apiKey || !sender) {
        return new Response(
          JSON.stringify({ success: false, message: "API Key dan Sender wajib diisi" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
        );
      }
      const qrUrl = "https://app.ayopintar.com/generate-qr";
      const r = await fetch(qrUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey, device: sender, force: true }),
      });
      const result = await r.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ success: true, data: result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // send action
    const rawPhone = String(body.phone || "");
    const message = String(body.message || "");
    const recipientName = body.recipientName ? String(body.recipientName) : "Unknown";
    const submissionId = body.submissionId ? String(body.submissionId) : null;
    const skipEnabledCheck = body.skipEnabledCheck === true;

    if (!rawPhone || !message) {
      return new Response(
        JSON.stringify({ success: false, message: "phone dan message wajib diisi" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }
    if (!skipEnabledCheck && !isEnabled) {
      return new Response(
        JSON.stringify({ success: false, message: "MPWA sedang nonaktif" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }
    if (!apiKey || !sender) {
      return new Response(
        JSON.stringify({ success: false, message: "Konfigurasi MPWA belum lengkap" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const number = normalizeIndoPhone(rawPhone);
    if (!number) {
      return new Response(
        JSON.stringify({ success: false, message: "Nomor tujuan tidak valid" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const payload: any = {
      api_key: apiKey,
      sender,
      number,
      message,
    };
    if (footer) payload.footer = footer;

    console.log("[mpwa-send] sending", { to: number, sender });

    const r = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let result: any = null;
    try { result = await r.json(); }
    catch { result = { raw: await r.text().catch(() => "") }; }

    const ok = r.ok && (result?.status === true || result?.status === "true");

    await supabase.from("whatsapp_logs").insert({
      recipient_phone: number,
      recipient_name: recipientName,
      message,
      status: ok ? "success" : "failed",
      error_message: ok ? null : JSON.stringify(result),
      provider: "mpwa",
      submission_id: submissionId,
    } as any);

    return new Response(
      JSON.stringify({ success: ok, provider: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: ok ? 200 : 502 },
    );
  } catch (e: any) {
    console.error("[mpwa-send] error", e);
    return new Response(
      JSON.stringify({ success: false, message: e?.message || "Terjadi kesalahan" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
