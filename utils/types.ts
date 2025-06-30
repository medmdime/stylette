export interface OutfitAnalysisResult {
    request_id: string;
    timestamp: string;
    outfit_analysis: {
        overall_verdict: string;
        overall_score: number;
        confidence_score: number;
        occasion_match: {
            requested_occasion: string;
            predicted_match: string;
            notes: string;
        };
        grades: {
            popularity: {
                score: number;
                grade_scale: string;
                comment: string;
            };
            originality: {
                score: number;
                grade_scale: string;
                comment: string;
            };
            fit_and_proportion: {
                score: number;
                grade_scale: string;
                comment: string;
            };
            color_harmony: {
                score: number;
                grade_scale: string;
                comment: string;
            };
            accessorization_effectiveness: {
                score: number;
                grade_scale: string;
                comment: string;
            };
        };
        components_feedback: Array<{
            item_type: string;
            description: string;
            // This is the updated part. It now allows for any string-based feedback keys.
            feedback: {
                [key: string]: string;
            };
        }>;
        summary_notes: string[];
        actionable_suggestions: string[];
    };
}

export interface ScannedItem {
    id: string;
    user_id: string;
    image_url?: string;
    result: OutfitAnalysisResult;
    created_at: string;
}
