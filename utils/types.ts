// A successful analysis from the AI
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

// A structured error response.
export interface AnalysisError {
  error: true;
  message: string;
}

/**
 * The result from the AI, which is stored in the `result` JSONB column.
 * It's either a successful analysis or a structured error.
 */
export type OutfitAnalysisResult = SuccessfulAnalysis | AnalysisError;

/**
 * Represents a row in the `scanned_items` table.
 */
export interface ScannedItem {
  id: string;
  user_id: string;
  image_url?: string;
  result: OutfitAnalysisResult;
  created_at: string;
}

/**
 * An item prepared for display in the UI, with a temporary URL for the image.
 */
export interface DisplayScannedItem extends ScannedItem {
  display_url?: string;
}
