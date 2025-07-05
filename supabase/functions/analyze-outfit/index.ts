import { corsHeaders } from "./_utils.ts";
import { getOutfitAnalysis } from "./_openai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { imageUrl, userQuery } = await req.json();
    if (!imageUrl) {
      throw new Error("imageUrl is required in the request body.");
    }

    const analysisResult = await getOutfitAnalysis(imageUrl, userQuery);

    return new Response(JSON.stringify(analysisResult), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    const status =
      err.message.includes("JWT") || err.message.includes("Authorization")
        ? 401
        : 500;
    return new Response(JSON.stringify({ error: err.message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
