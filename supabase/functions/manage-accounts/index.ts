import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateAccountRequest {
  action: "create" | "update-password" | "update-status" | "delete";
  email?: string;
  password?: string;
  full_name?: string;
  role?: "admin" | "staff";
  user_id?: string;
  is_active?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify the request is from an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Access denied. Admin only." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: CreateAccountRequest = await req.json();
    console.log("Request action:", body.action);

    switch (body.action) {
      case "create": {
        if (!body.email || !body.password) {
          return new Response(
            JSON.stringify({ error: "Email and password are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create user with admin API
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: body.email,
          password: body.password,
          email_confirm: true,
          user_metadata: { full_name: body.full_name || "" }
        });

        if (createError) {
          console.error("Create user error:", createError);
          return new Response(
            JSON.stringify({ error: createError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Add role to user_roles table
        const { error: roleInsertError } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: newUser.user.id, role: body.role || "staff" });

        if (roleInsertError) {
          console.error("Role insert error:", roleInsertError);
        }

        // Add to managed_accounts table
        const { error: managedError } = await supabaseAdmin
          .from("managed_accounts")
          .insert({
            user_id: newUser.user.id,
            email: body.email,
            full_name: body.full_name || "",
            role: body.role || "staff",
            created_by: user.id
          });

        if (managedError) {
          console.error("Managed accounts insert error:", managedError);
        }

        console.log("User created successfully:", newUser.user.id);

        return new Response(
          JSON.stringify({ success: true, user: { id: newUser.user.id, email: newUser.user.email } }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update-password": {
        if (!body.user_id || !body.password) {
          return new Response(
            JSON.stringify({ error: "User ID and password are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          body.user_id,
          { password: body.password }
        );

        if (updateError) {
          console.error("Update password error:", updateError);
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log("Password updated for user:", body.user_id);

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update-status": {
        if (!body.user_id || body.is_active === undefined) {
          return new Response(
            JSON.stringify({ error: "User ID and is_active are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update in managed_accounts
        const { error: updateError } = await supabaseAdmin
          .from("managed_accounts")
          .update({ is_active: body.is_active })
          .eq("user_id", body.user_id);

        if (updateError) {
          console.error("Update status error:", updateError);
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // If deactivating, also ban the user in auth
        if (!body.is_active) {
          await supabaseAdmin.auth.admin.updateUserById(body.user_id, { ban_duration: "876600h" }); // ~100 years
        } else {
          await supabaseAdmin.auth.admin.updateUserById(body.user_id, { ban_duration: "0h" });
        }

        console.log("Status updated for user:", body.user_id, "Active:", body.is_active);

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        if (!body.user_id) {
          return new Response(
            JSON.stringify({ error: "User ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Delete from auth
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(body.user_id);

        if (deleteError) {
          console.error("Delete user error:", deleteError);
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log("User deleted:", body.user_id);

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});