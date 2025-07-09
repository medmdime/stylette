import { getOutfitAnalysis } from "./_openai.ts";
import type { AnalysisError, SuccessfulAnalysis } from "./_utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!req.body) {
      return new Response(
        JSON.stringify({ error: true, message: "Request body is missing." }),
        {
          status: 400,
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

    if (!imageUrl) {
      console.log("Request imageUrl is missing." + JSON.stringify(req.body));

      return new Response(
        JSON.stringify({ error: true, message: "`imageUrl` is required." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (!promptTitle) {
      console.log("Request promptTitle is missing.");
      console.log(JSON.stringify(req.body));
      return new Response(
        JSON.stringify({ error: true, message: "`promptTitle` is required." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const analysisResult: SuccessfulAnalysis | AnalysisError =
      await getOutfitAnalysis(
        imageUrl,
        { title: promptTitle, userQuery },
      );

    return new Response(JSON.stringify(analysisResult), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in analyze-outfit function:", err);

    return new Response(
      JSON.stringify({
        error: true,
        message: "An internal server error occurred.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
