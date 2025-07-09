import { AzureOpenAI } from "jsr:@openai/openai";

function getPromptForRequest(promptTitle: string, userQuery?: string): string {
  switch (promptTitle) {
    case "Rate my outfit":
      return "Give me an honest rating of this outfit. What works, what doesn't, and what's the overall score? Be detailed and constructive.";
    case "Change the vibe":
      return `How can I change this outfit to fit a '${
        userQuery || "different"
      }' vibe? Give me specific suggestions for swaps or additions.`;
    case "Suit my occasion":
      return `I'm thinking of wearing this to a '${
        userQuery || "special occasion"
      }'. Is it appropriate? What changes, if any, should I make to nail the look?`;
    case "Complete this look":
      return "This outfit feels like it's missing something. What items (like accessories, shoes, or a jacket) can I add to complete the look and make it feel more intentional?";
    case "Does this match?":
      return "I'm not sure if the items in this outfit go well together. Please analyze the color harmony, style coherence, and overall balance. What's your verdict?";
    case "Is this dress code appropriate?":
      return `Is this outfit appropriate for a '${
        userQuery || "specific"
      }' dress code? Please explain why or why not, and suggest adjustments if needed.`;
    case "Suggest improvements":
      return "Analyze this outfit and give me your top 3 actionable suggestions for how to improve it. Be specific!";
    case "Make it more flattering":
      return "How can I adjust this outfit to be more flattering? Focus on improving the fit, proportions, and silhouette with specific, practical advice.";
    case "Is this spicy? 🌶️":
      return "Give me your honest opinion: on a scale from 1 to 10, how 'spicy' is this outfit and why? What could I do to turn up the heat in a classy way?";
    default:
      return "Please analyze the outfit in this image, providing a balanced and honest style review.";
  }
}

export async function getOutfitAnalysis(
  imageUrl: string,
  prompt: { title: string; userQuery?: string },
) {
  const client = new AzureOpenAI({
    endpoint: Deno.env.get("AZURE_OPENAI_ENDPOINT"),
    apiKey: Deno.env.get("AZURE_OPENAI_API_KEY"),
    deployment: Deno.env.get("AZURE_DEPLOYMENT_NAME"),
    apiVersion: "2024-12-01-preview",
  });

  const systemPrompt = `
You are 'Stylette,' a sophisticated, witty, honest, and constructive AI style assistant. Your goal is to provide an insightful, balanced, and professional style review in Markdown format.

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

**Analysis & Formatting Guidelines:**
- **Honesty is Key:** Do not just give positive feedback. If an element is not working, point it out constructively. A mix of praise and clear advice for improvements is essential.
- **Tone:** Be witty, engaging, and fashion-forward, like a trusted friend who is also a style expert. Use emojis to add personality where appropriate.
- **Markdown Formatting:** Your entire detailed response must be a single Markdown string. Use headings (#, ##), bold (**text**), italics (*text*), and lists (-) to structure your review and make it easy to read.
- **Summary:** Provide a short, catchy, one-sentence summary (max 15 words) of the outfit's vibe for display on preview cards.

**JSON Output Structure (for valid outfits only):**
You MUST return a JSON object with the following structure. Do not add any text outside of this JSON object.
\`\`\`json
{
  "summary": "A short, one-sentence summary of the outfit.",
  "markdownResponse": "Your full, detailed style analysis formatted as a single Markdown string."
}
\`\`\`
`;

  const userInstruction = getPromptForRequest(prompt.title, prompt.userQuery);
  console.log("prompted worked:");

  const response = await client.chat.completions.create({
    model: Deno.env.get("AZURE_DEPLOYMENT_NAME")!,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: [
          { type: "text", text: userInstruction },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
    response_format: { type: "json_object" },
  });
  console.log("open ai successfully called");

  const analysis = response.choices[0].message?.content;
  if (!analysis) {
    throw new Error("Failed to get a valid analysis from OpenAI.");
  }

  const jsonResponse = JSON.parse(analysis);

  // If the response is not an error, inject the original prompt into the response
  // before returning it. This is more reliable than asking the AI to echo it back.
  if ("summary" in jsonResponse) {
    jsonResponse.prompt = {
      title: prompt.title,
      userQuery: prompt.userQuery,
    };
  }

  return jsonResponse;
}
