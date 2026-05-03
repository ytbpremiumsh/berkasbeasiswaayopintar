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
      const useKey = String(body.apiKey || apiKey || "");
      const useSender = String(body.sender || sender || "");
      if (!useKey || !useSender) {
        return new Response(
          JSON.stringify({ success: false, message: "API Key dan Sender wajib diisi" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
        );
      }
      const qrUrl = "https://app.ayopintar.com/generate-qr";
      const payload = { api_key: useKey, device: useSender, force: true };
      console.log("[mpwa-qr] requesting", { sender: useSender });

      let raw = "";
      let parsed: any = null;
      const isValid = (p: any) => p && !p.exception && !(typeof p.message === "string" && /method is not supported/i.test(p.message));

      // 1) GET (required by MPWA)
      try {
        const u = new URL(qrUrl);
        u.searchParams.set("api_key", useKey);
        u.searchParams.set("device", useSender);
        u.searchParams.set("force", "true");
        const r = await fetch(u.toString(), { method: "GET", headers: { "Accept": "application/json" } });
        raw = await r.text();
        try { parsed = JSON.parse(raw); } catch { parsed = null; }
        if (!isValid(parsed)) parsed = null;
      } catch (e) {
        console.error("[mpwa-qr] GET failed", e);
      }

      // 2) Fallback: POST JSON
      if (!parsed) {
        try {
          const r = await fetch(qrUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify(payload),
          });
          raw = await r.text();
          try { parsed = JSON.parse(raw); } catch { parsed = null; }
          if (!isValid(parsed)) parsed = null;
        } catch (e) {
          console.error("[mpwa-qr] POST JSON failed", e);
        }
      }

      console.log("[mpwa-qr] response", { hasParsed: !!parsed, rawPreview: raw.slice(0, 200) });

      if (!parsed) {
        return new Response(
          JSON.stringify({ success: false, message: "Respon tidak valid dari MPWA", raw: raw.slice(0, 500) }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 502 },
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: parsed }),
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
