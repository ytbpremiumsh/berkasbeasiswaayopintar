import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAYAR_API_URL = "https://api.mayar.id/software/v1/license/verify";
const DEFAULT_PRODUCT_ID = "8fedc066-ad35-460f-92b4-9193bab866b6";

/**
 * One-off maintenance function: backfills `mayar_transaction_id` and `price`
 * for scholarship_tokens synced from Mayar.
 *
 * POST { limit?: number }  -> processes up to `limit` tokens per call
 * (default 8, to stay under Mayar's ~20 req/min rate limit).
 * Returns remaining count so the caller can loop until done.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { limit = 8 } = await req.json().catch(() => ({}));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Read Mayar API key + product id from admin_settings
    const { data: mayarSetting } = await supabase
      .from("admin_settings")
      .select("setting_value")
      .eq("setting_key", "mayar_api_key")
      .maybeSingle();
    const MAYAR_API_KEY = (mayarSetting?.setting_value as any)?.value || Deno.env.get("MAYAR_API_KEY");

    const { data: productIdSetting } = await supabase
      .from("admin_settings")
      .select("setting_value")
      .eq("setting_key", "mayar_product_id")
      .maybeSingle();
    const MAYAR_PRODUCT_ID = (productIdSetting?.setting_value as any)?.value || DEFAULT_PRODUCT_ID;

    if (!MAYAR_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Mayar API key not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Tokens that still lack pricing info
    const { data: tokens, error } = await supabase
      .from("scholarship_tokens")
      .select("id, token_code")
      .is("price", null)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw error;

    const { count: remaining } = await supabase
      .from("scholarship_tokens")
      .select("id", { count: "exact", head: true })
      .is("price", null);

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, remaining: remaining ?? 0, done: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let processed = 0;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    for (const token of tokens) {
      const code = token.token_code.trim().toUpperCase();

      // 1) Verify license with Mayar to get the related transactionId
      let transactionId: string | null = null;
      try {
        const verifyRes = await fetch(MAYAR_API_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${MAYAR_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ licenseCode: code, productId: MAYAR_PRODUCT_ID }),
        });
        const verifyData = await verifyRes.json();
        if (verifyRes.status === 429) {
          await sleep(20_000);
          const retry = await fetch(MAYAR_API_URL, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${MAYAR_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ licenseCode: code, productId: MAYAR_PRODUCT_ID }),
          });
          const retryData = await retry.json();
          transactionId = retryData?.licenseCode?.transactionId || null;
        } else {
          transactionId = verifyData?.licenseCode?.transactionId || null;
        }
      } catch (e) {
        console.error(`Verify failed for ${code}:`, e);
      }

      // 2) Resolve paid amount from the Mayar transaction detail
      let price: number | null = null;
      if (transactionId) {
        try {
          const txRes = await fetch(`https://api.mayar.id/hl/v2/transactions/${transactionId}`, {
            headers: { "Authorization": `Bearer ${MAYAR_API_KEY}` },
          });
          if (txRes.ok) {
            const txData = await txRes.json();
            const amount = txData?.data?.amount;
            if (typeof amount === "number") price = amount;
          } else if (txRes.status === 429) {
            await sleep(20_000);
            const retry = await fetch(`https://api.mayar.id/hl/v2/transactions/${transactionId}`, {
              headers: { "Authorization": `Bearer ${MAYAR_API_KEY}` },
            });
            if (retry.ok) {
              const retryData = await retry.json();
              const amount = retryData?.data?.amount;
              if (typeof amount === "number") price = amount;
            }
          }
        } catch (e) {
          console.error(`Transaction fetch failed for ${code}:`, e);
        }
      }

      // No Mayar transaction (or license unknown) -> treat as free (0)
      const finalPrice = price === null ? (transactionId ? null : 0) : price;

      // If rate-limited twice and price unresolved, leave price NULL to retry later
      if (finalPrice === null) continue;

      const { error: updateError } = await supabase
        .from("scholarship_tokens")
        .update({
          mayar_transaction_id: transactionId,
          price: finalPrice,
        })
        .eq("id", token.id);

      if (updateError) {
        console.error(`Update failed for ${code}:`, updateError);
      } else {
        processed++;
      }

      // Small delay to be gentle with the Mayar rate limit
      await sleep(1500);
    }

    const { count: remainingAfter } = await supabase
      .from("scholarship_tokens")
      .select("id", { count: "exact", head: true })
      .is("price", null);

    return new Response(
      JSON.stringify({
        processed,
        remaining: remainingAfter ?? 0,
        done: (remainingAfter ?? 0) === 0,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in sync-token-prices:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
