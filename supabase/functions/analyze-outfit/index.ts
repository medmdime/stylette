import { createClient } from "npm:@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { getOutfitAnalysis } from "./_openai.ts";
import type { AnalysisError, SuccessfulAnalysis } from "./_utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const JWKS = createRemoteJWKSet(new URL(Deno.env.get("CLERK_JWKS_URL")!));

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const token = authHeader.split(" ")[1];
    const { payload } = await jwtVerify(token, JWKS);
    const userId = payload.sub;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Invalid token: User ID not found" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("status")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (subError) {
      console.error(
        `Subscription check database error for user ${userId}:`,
        subError.message,
      );
      return new Response(
        JSON.stringify({ error: "Failed to verify subscription" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!subscription) {
      return new Response(
        JSON.stringify({
          error: true,
          message:
            "No active subscription found. Please subscribe to analyze your outfits.",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const {
      imageUrl,
      promptTitle,
      userQuery,
    }: { imageUrl: string; promptTitle: string; userQuery?: string } = await req
      .json();

    if (!imageUrl || !promptTitle) {
      return new Response(
        JSON.stringify({
          error: true,
          message: "`imageUrl` and `promptTitle` are required.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const analysisResult: SuccessfulAnalysis | AnalysisError =
      await getOutfitAnalysis(imageUrl, {
        title: promptTitle,
        userQuery,
      });

    return new Response(JSON.stringify(analysisResult), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err : any) {
    console.error("Error in analyze-outfit function:", err.message);
    return new Response(
      JSON.stringify({
        error: true,
        message: err.name === "JWTExpired"
          ? "Your session has expired. Please sign in again."
          : "An internal server error occurred.",
      }),
      {
        status: err.name === "JWTExpired" ? 401 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
