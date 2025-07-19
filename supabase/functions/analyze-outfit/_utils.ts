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
  markdownResponse: string;
  prompt: {
    title: string;
    userQuery?: string;
  };
  summary: string;
}
