import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const {
      sessionId,
      tokenId,
      category,
      applicantStatus,
      fullName,
      email,
      phone,
      institutionName,
      kartuPelajarUrl,
      ktmUrl,
      cvUrl,
      sertifikatPrestasiUrl,
      transkripNilaiUrl,
      khsUrl,
      essay,
      buktiPenghasilanUrl,
      buktiListrikUrl,
      suratKeteranganYatimUrl,
      sktmUrl,
      videoTiktokUrl,
      berkasPendukungUrl,
      buktiStrukUrl,
    } = body;

    // Validate required fields
    if (!tokenId || !category || !applicantStatus || !fullName || !email) {
      return new Response(
        JSON.stringify({ success: false, message: "Data tidak lengkap" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Verify token is valid and get token code
    const { data: token, error: tokenError } = await supabase
      .from("scholarship_tokens")
      .select("*")
      .eq("id", tokenId)
      .single();

    if (tokenError || !token) {
      return new Response(
        JSON.stringify({ success: false, message: "Token tidak ditemukan" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (token.status !== "valid") {
      return new Response(
        JSON.stringify({ success: false, message: "Token sudah digunakan atau tidak valid" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const tokenCode = token.token_code;

    // Update token status
    await supabase
      .from("scholarship_tokens")
      .update({ status: "digunakan", used_at: new Date().toISOString() })
      .eq("id", tokenId);

    // Insert submission with sessionId as user_id (for public submissions)
    const { error: insertError } = await supabase.from("scholarship_submissions").insert({
      user_id: sessionId,
      token_id: tokenId,
      category,
      applicant_status: applicantStatus,
      full_name: fullName,
      email,
      phone,
      institution_name: institutionName,
      kartu_pelajar_url: kartuPelajarUrl,
      ktm_url: ktmUrl,
      cv_url: cvUrl,
      sertifikat_prestasi_url: sertifikatPrestasiUrl,
      transkrip_nilai_url: transkripNilaiUrl,
      khs_url: khsUrl,
      essay,
      bukti_penghasilan_url: buktiPenghasilanUrl,
      bukti_listrik_url: buktiListrikUrl,
      surat_keterangan_yatim_url: suratKeteranganYatimUrl,
      sktm_url: sktmUrl,
      video_tiktok_url: videoTiktokUrl,
      berkas_pendukung_url: berkasPendukungUrl,
      bukti_struk_url: buktiStrukUrl,
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    // Send WhatsApp notification via send-whatsapp edge function
    try {
      const { data: settings } = await supabase.from("admin_settings").select("setting_key, setting_value");

      const getVal = (key: string): string => {
        const found = settings?.find((s: any) => s.setting_key === key)?.setting_value;
        if (!found) return "";
        if (typeof found === "string") return found;
        return String(found.value ?? "");
      };
      const getBool = (key: string): boolean => {
        const found = settings?.find((s: any) => s.setting_key === key)?.setting_value;
        const v = typeof found === "object" ? found?.value : found;
        return v === true || v === "true";
      };

      const isEnabled = getBool("whatsapp_enabled");
      const template = getVal("whatsapp_template");
      const apiUrl = getVal("onesender_api_url");
      const apiKey = getVal("onesender_api_key");

      const onlyDigits = (v: string) => (v || "").replace(/\D/g, "");
      const normalizeIndoPhone = (v: string) => {
        const d = onlyDigits(v);
        if (!d) return "";
        if (d.startsWith("62")) return d;
        if (d.startsWith("0")) return `62${d.slice(1)}`;
        return d;
      };

      const recipient = normalizeIndoPhone(String(phone || ""));

      if (isEnabled && apiUrl && apiKey && template && recipient) {
        const categoryLabels: Record<string, string> = {
          prestasi: "Prestasi",
          yatim: "Yatim",
          ekonomi: "Ekonomi",
          umum: "Umum",
        };

        const message = template
          .replace(/\{\{nama\}\}/g, fullName)
          .replace(/\{\{kategori_beasiswa\}\}/g, categoryLabels[category] || category)
          .replace(/\{\{status_pendaftar\}\}/g, applicantStatus.replace("_", " "))
          .replace(/\{\{tanggal_submit\}\}/g, new Date().toLocaleDateString("id-ID"))
          .replace(/\{\{token\}\}/g, tokenCode);

        console.log("Sending WhatsApp to:", recipient);

        // Use OneSender API format per documentation
        const waResponse = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipient_type: "individual",
            to: recipient,
            type: "text",
            text: {
              body: message,
            },
          }),
        });

        let waResult: any = null;
        try {
          waResult = await waResponse.json();
        } catch (_) {
          waResult = { raw: await waResponse.text().catch(() => "") };
        }

        console.log("WhatsApp response:", waResult);

        // Log the message
        await supabase.from("whatsapp_logs").insert({
          recipient_phone: recipient,
          recipient_name: fullName,
          message,
          status: waResponse.ok ? "success" : "failed",
          error_message: waResponse.ok ? null : JSON.stringify(waResult),
        });
      } else if (!isEnabled) {
        console.log("WhatsApp notifications are disabled");
      } else {
        console.log("WhatsApp not sent: missing config/phone", {
          hasApiUrl: !!apiUrl,
          hasApiKey: !!apiKey,
          hasTemplate: !!template,
          hasRecipient: !!recipient,
        });
      }
    } catch (waError) {
      console.error("WhatsApp notification error:", waError);
      // Don't fail the submission if WhatsApp fails
    }


    return new Response(
      JSON.stringify({ success: true, message: "Berkas berhasil dikirim" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, message: error?.message || "Terjadi kesalahan" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
