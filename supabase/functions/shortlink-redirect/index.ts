import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Parse User Agent to get device/browser/OS info
function parseUserAgent(ua: string) {
  const device = /Mobile|Android|iPhone|iPad|iPod/i.test(ua) ? "mobile" : "desktop";
  
  let browser = "Unknown";
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";

  let os = "Unknown";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  return { device, browser, os };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { slug } = await req.json();

    if (!slug) {
      return new Response(
        JSON.stringify({ error: "Slug is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Looking up shortlink: ${slug}`);

    // Find the shortlink
    const { data: shortlink, error: findError } = await supabase
      .from("shortlinks")
      .select("id, destination_url, is_active, click_count")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (findError) {
      console.error("Find error:", findError);
      throw findError;
    }

    if (!shortlink) {
      console.log(`Shortlink not found: ${slug}`);
      return new Response(
        JSON.stringify({ error: "Shortlink not found", destination: null }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get visitor info from headers
    const userAgent = req.headers.get("user-agent") || "";
    const referer = req.headers.get("referer") || "";
    const forwardedFor = req.headers.get("x-forwarded-for") || "";
    const realIp = req.headers.get("x-real-ip") || "";
    const ipAddress = forwardedFor.split(",")[0]?.trim() || realIp || "Unknown";

    const { device, browser, os } = parseUserAgent(userAgent);

    console.log(`Recording visit for shortlink ${shortlink.id}`);

    // Record the visit
    const { error: visitError } = await supabase
      .from("shortlink_visits")
      .insert({
        shortlink_id: shortlink.id,
        ip_address: ipAddress,
        user_agent: userAgent.substring(0, 500),
        device_type: device,
        browser: browser,
        os: os,
        referrer: referer.substring(0, 500),
      });

    if (visitError) {
      console.error("Visit insert error:", visitError);
    }

    // Update click count
    const { error: updateError } = await supabase
      .from("shortlinks")
      .update({ click_count: shortlink.click_count + 1 })
      .eq("id", shortlink.id);

    if (updateError) {
      console.error("Update click count error:", updateError);
    }

    console.log(`Redirecting to: ${shortlink.destination_url}`);

    return new Response(
      JSON.stringify({ destination: shortlink.destination_url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Shortlink redirect error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
