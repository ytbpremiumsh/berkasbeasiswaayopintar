import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory cache to reduce Mayar rate-limit hits (best-effort; resets on cold start)
const CACHE_TTL_MS = 55_000;
const cache = new Map<string, { ts: number; data: unknown }>();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client to fetch API key from database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch MAYAR_API_KEY from admin_settings
    const { data: settingData, error: settingError } = await supabase
      .from("admin_settings")
      .select("setting_value")
      .eq("setting_key", "mayar_api_key")
      .maybeSingle();

    if (settingError) {
      console.error("Error fetching Mayar API key from settings:", settingError);
      return new Response(JSON.stringify({ error: "Failed to fetch API key from settings" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mayarApiKey = (settingData?.setting_value as any)?.value;

    if (!mayarApiKey) {
      console.error("MAYAR_API_KEY not configured in settings");
      return new Response(
        JSON.stringify({
          error: "Mayar API key not configured",
          message: "Silakan masukkan API Key Mayar di menu Pengaturan",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { endpoint, params } = await req.json();
    console.log("Mayar API request:", { endpoint, params });

    const cacheKey = `${endpoint}:${JSON.stringify(params ?? {})}`;
    const cached = cache.get(cacheKey);
    const cachedFresh = cached && Date.now() - cached.ts < CACHE_TTL_MS;

    // Serve fresh cache to avoid hitting Mayar rate limit
    if (cachedFresh) {
      return new Response(JSON.stringify({ ...(cached.data as any), _cache: { hit: true, fresh: true } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let url = `https://api.mayar.id/hl/v1/${endpoint}`;

    // Add query params if provided
    if (params && Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      url = `${url}?${queryString}`;
    }

    console.log("Calling Mayar API:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${mayarApiKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log("Mayar API response status:", response.status);

    // If rate-limited but we have cached data, serve stale cache instead of error
    if (response.status === 429 && cached) {
      console.warn("Mayar rate-limited (429). Serving cached response instead.");
      return new Response(
        JSON.stringify({ ...(cached.data as any), _cache: { hit: true, fresh: false, reason: "rate_limited" } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!response.ok) {
      console.error("Mayar API error:", data);
      return new Response(JSON.stringify({ error: data.message || "Mayar API error", details: data }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store successful response
    cache.set(cacheKey, { ts: Date.now(), data });

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in mayar-api function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
