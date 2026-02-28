import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAYAR_API_URL = "https://api.mayar.id/software/v1/license/verify";
const MAYAR_PRODUCT_ID = "2ea686ca-2b53-4cd3-aea7-219af02ea19d";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { licenseCode, category, checkOnly } = await req.json();

    if (!licenseCode) {
      return new Response(
        JSON.stringify({ error: "License code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For checkOnly mode (status check), we don't need a category
    const useCategory = category || "umum";

    // Get Supabase client to read API key from admin_settings
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try to get Mayar API key from admin_settings first
    const { data: mayarSetting } = await supabase
      .from("admin_settings")
      .select("setting_value")
      .eq("setting_key", "mayar_api_key")
      .maybeSingle();

    const MAYAR_API_KEY = (mayarSetting?.setting_value as any)?.value || Deno.env.get("MAYAR_API_KEY");
    
    if (!MAYAR_API_KEY) {
      console.error("MAYAR_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error: API Key belum dikonfigurasi" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Verifying license code: ${licenseCode} for category: ${useCategory} (checkOnly: ${checkOnly})`);

    // Call Mayar API to verify license
    const mayarResponse = await fetch(MAYAR_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MAYAR_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        licenseCode: licenseCode.trim().toUpperCase(),
        productId: MAYAR_PRODUCT_ID,
      }),
    });

    const mayarData = await mayarResponse.json();
    console.log("Mayar API response:", JSON.stringify(mayarData));

    if (mayarData.statusCode === 400 || !mayarData.licenseCode) {
      console.log("License not found or invalid");
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: "Kode token tidak ditemukan, silakan klaim token terlebih dahulu" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const licenseData = mayarData.licenseCode;

    // Check license status
    if (licenseData.status === "INACTIVE") {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: "Kode token sudah mencapai batas aktivasi" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (licenseData.status === "DISABLED") {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: "Kode token telah dinonaktifkan" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (licenseData.status === "EXPIRED") {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: "Kode token telah kedaluwarsa" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (licenseData.status !== "ACTIVE") {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: "Kode token tidak valid" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // License is valid, now sync to database
    // (Supabase client already created above)

    // Check if token exists in our database, if not create it
    const { data: existingToken, error: fetchError } = await supabase
      .from("scholarship_tokens")
      .select("*")
      .eq("token_code", licenseCode.trim().toUpperCase())
      .maybeSingle();

    let tokenId: string;

    if (existingToken) {
      tokenId = existingToken.id;
      
      // If already used, reject
      if (existingToken.status === "digunakan") {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            message: "Kode token sudah digunakan sebelumnya" 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // For checkOnly mode, just return valid without creating a token
      if (checkOnly) {
        console.log(`License verified (checkOnly mode). No token created.`);
        return new Response(
          JSON.stringify({ 
            valid: true, 
            tokenId: null,
            customerName: licenseData.customerName,
            customerEmail: licenseData.customerEmail,
            message: "Kode token valid" 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create new token record
      const { data: newToken, error: insertError } = await supabase
        .from("scholarship_tokens")
        .insert({
          token_code: licenseCode.trim().toUpperCase(),
          category: useCategory,
          status: "valid",
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating token record:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to process token" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      tokenId = newToken.id;
    }

    console.log(`License verified successfully. Token ID: ${tokenId}`);

    return new Response(
      JSON.stringify({ 
        valid: true, 
        tokenId: tokenId,
        customerName: licenseData.customerName,
        customerEmail: licenseData.customerEmail,
        message: "Kode token valid" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error verifying license:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
