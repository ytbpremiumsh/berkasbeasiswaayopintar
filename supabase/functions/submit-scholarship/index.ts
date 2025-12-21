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

    // Verify token is valid
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

    // Send WhatsApp notification
    try {
      const { data: settings } = await supabase.from("admin_settings").select("*");
      
      const apiUrl = settings?.find(s => s.setting_key === "onesender_api_url")?.setting_value;
      const apiKey = settings?.find(s => s.setting_key === "onesender_api_key")?.setting_value;
      const phoneNumber = settings?.find(s => s.setting_key === "onesender_phone")?.setting_value;
      const template = settings?.find(s => s.setting_key === "whatsapp_template")?.setting_value;

      if (apiUrl?.value && apiKey?.value && phoneNumber?.value && template?.value && phone) {
        const categoryLabels: Record<string, string> = {
          prestasi: "Prestasi",
          yatim: "Yatim",
          ekonomi: "Ekonomi",
          umum: "Umum",
        };

        const message = template.value
          .replace(/\{\{nama\}\}/g, fullName)
          .replace(/\{\{kategori_beasiswa\}\}/g, categoryLabels[category] || category)
          .replace(/\{\{status_pendaftar\}\}/g, applicantStatus.replace("_", " "))
          .replace(/\{\{tanggal_submit\}\}/g, new Date().toLocaleDateString("id-ID"));

        await fetch(apiUrl.value, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey.value}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: phone.startsWith("0") ? "62" + phone.slice(1) : phone,
            message,
            sender: phoneNumber.value,
          }),
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
