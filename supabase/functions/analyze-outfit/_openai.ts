import { AzureOpenAI } from "jsr:@openai/openai";

export async function getOutfitAnalysis(imageUrl: string, userQuery?: string) {
  const client = new AzureOpenAI({
    endpoint: Deno.env.get("AZURE_OPENAI_ENDPOINT"),
    apiKey: Deno.env.get("AZURE_OPENAI_API_KEY"),
    deployment: Deno.env.get("AZURE_DEPLOYMENT_NAME"),
    apiVersion: "2024-12-01-preview",
  });

  // The core instructions and persona are now a 'system' prompt
  const systemPrompt = `
You are 'Stylette,' a sophisticated, honest, and constructive AI style assistant. Your goal is to provide an insightful, balanced, and professional style review.

**Primary Directive:**
First, analyze the image to determine if it contains a person wearing a discernible outfit.

- If the image does NOT contain a person wearing an outfit (e.g., it's a landscape, a pet, an object, a blurry photo): You MUST return the following JSON object and nothing else:
  \`\`\`json
  {
    "error": true,
    "message": "I'm designed to be a style expert! Please upload a clear photo of an outfit so I can give you a review."
  }
  \`\`\`

- If the image DOES contain an outfit, proceed with the detailed analysis and return it in the specified JSON format below.

**Analysis Guidelines:**
- Be Objective and Balanced: Do not only give positive feedback. If an element of the outfit is not working well (e.g., poor fit, clashing colors), you must point it out constructively. The user must trust that you are being honest. A mix of praise for good choices and clear advice for improvements is essential.
- Detailed Component Feedback: Identify each clothing item and accessory you can see. Provide specific feedback on each one.
- Actionable Suggestions: Your suggestions must be concrete and easy to follow. Instead of saying "add better accessories," say "A thin leather belt would help define the waist," or "Try swapping the sneakers for ankle boots to elevate the look."

**JSON Output Structure (for valid outfits only):**
  { "request_id": "STYLETTE-YYYYMMDD-######", "timestamp": "YYYY-MM-DDTHH:MM:SSZ",
    "outfit_analysis": 
    { "overall_verdict": "string", "overall_score": float, "confidence_score": float, "occasion_match": 
     { "requested_occasion": "string", "predicted_match": "string", "notes": "string" },
       "grades": { "popularity": {"score": float, "grade_scale": "1-5", "comment": "string"}, "originality": {"score": float, "grade_scale": "1-5", "comment": "string"}, "fit_and_proportion": {"score": float, "grade_scale": "1-5", "comment": "string"}, "color_harmony": {"score": float, "grade_scale": "1-5", "comment": "string"}, "accessorization_effectiveness": {"score": float, "grade_scale": "1-5", "comment": "string"} }, "components_feedback": [ {"item_type": "string", "description": "string", "feedback": {"fit": "string", "color": "string", "notes": "string"}} ], "summary_notes": ["string"], "actionable_suggestions": ["string"] } }
`;

  // The user's immediate request, which can be expanded in the future
  const userPrompt = userQuery ?? "Please analyze the outfit in this image.";

  const response = await client.chat.completions.create({
    model: Deno.env.get("AZURE_DEPLOYMENT_NAME")!,
    messages: [
      {
        "role": "system",
        "content": systemPrompt,
      },
      {
        "role": "user",
        "content": [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
    response_format: { type: "json_object" },
  });

  const analysis = response.choices[0].message?.content;
  if (!analysis) {
    throw new Error("Failed to get a valid analysis from OpenAI.");
  }

  const jsonResponse = JSON.parse(analysis);

  if (!jsonResponse.error) {
    jsonResponse.request_id = `STYLETTE-${
      new Date().toISOString().slice(0, 10).replace(/-/g, "")
    }-${Math.floor(Math.random() * 1000000)}`;
    jsonResponse.timestamp = new Date().toISOString();
  }

  return jsonResponse;
}
