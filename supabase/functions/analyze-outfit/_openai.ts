import { AzureOpenAI } from "jsr:@openai/openai";

export async function getOutfitAnalysis(imageUrl: string) {
  const client = new AzureOpenAI({
    endpoint: Deno.env.get("AZURE_OPENAI_ENDPOINT"),
    apiKey: Deno.env.get("AZURE_OPENAI_API_KEY"),
    deployment: Deno.env.get("AZURE_DEPLOYMENT_NAME"),
    apiVersion: "2024-05-01-preview",
  });

  const analysisPrompt =
    `Analyze the clothing in the image and provide a style review. Return the analysis in a valid JSON format. The JSON object should strictly follow this structure:
  { "request_id": "STYLETTE-YYYYMMDD-######", "timestamp": "YYYY-MM-DDTHH:MM:SSZ", "outfit_analysis": { "overall_verdict": "string", "overall_score": float, "confidence_score": float, "occasion_match": { "requested_occasion": "string", "predicted_match": "string", "notes": "string" }, "grades": { "popularity": {"score": float, "grade_scale": "1-5", "comment": "string"}, "originality": {"score": float, "grade_scale": "1-5", "comment": "string"}, "fit_and_proportion": {"score": float, "grade_scale": "1-5", "comment": "string"}, "color_harmony": {"score": float, "grade_scale": "1-5", "comment": "string"}, "accessorization_effectiveness": {"score": float, "grade_scale": "1-5", "comment": "string"} }, "components_feedback": [ {"item_type": "string", "description": "string", "feedback": {"fit": "string", "color": "string", "notes": "string"}} ], "summary_notes": ["string"], "actionable_suggestions": ["string"] } }`;

  const response = await client.chat.completions.create({
    model: Deno.env.get("AZURE_DEPLOYMENT_NAME")!,
    messages: [{
      role: "user",
      content: [{ type: "text", text: analysisPrompt }, {
        type: "image_url",
        image_url: { url: imageUrl },
      }],
    }],
    max_tokens: 1500,
    response_format: { type: "json_object" },
  });

  const analysis = response.choices[0].message?.content;
  if (!analysis) {
    throw new Error("Failed to get a valid analysis from OpenAI.");
  }

  const jsonResponse = JSON.parse(analysis);
  jsonResponse.request_id = `STYLETTE-${
    new Date().toISOString().slice(0, 10).replace(/-/g, "")
  }-${Math.floor(Math.random() * 1000000)}`;
  jsonResponse.timestamp = new Date().toISOString();

  return jsonResponse;
}
