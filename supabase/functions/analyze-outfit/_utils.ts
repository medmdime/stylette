export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export interface AnalysisError {
  error: true;
  message: string;
}

export interface SuccessfulAnalysis {
  // The main response from the AI in Markdown format.
  markdownResponse: string;
  // The prompt that generated this analysis.
  prompt: {
    title: string; // e.g., "Rate my outfit"
    userQuery?: string; // e.g., "A wedding in the summer"
  };
  // A short, one-sentence summary for display on cards.
  summary: string;
}
