import { clusterFeedbackPatterns } from "./gemini";
import { clusterFeedbackHF } from "./huggingface";

/**
 * Unified UI helper to get clusters from available AI providers
 * Priority: Gemini (Highest quality) -> Hugging Face (Reliability) -> Empty
 */
export async function getSmartClusters(comments: string[]) {
  if (!comments || comments.length === 0) return [];

  // Try Gemini 
  if (process.env.GEMINI_API_KEY) {
    try {
      const result = await clusterFeedbackPatterns(comments);
      if (result && result.length > 0) return result;
    } catch (e) {
      console.warn("Gemini clustering failed, falling back to Hugging Face...");
    }
  }

  // Try Hugging Face
  if (process.env.HUGGINGFACE_API_KEY) {
    try {
      const result = await clusterFeedbackHF(comments);
      if (result && result.length > 0) return result;
    } catch (e) {
      console.error("Hugging Face clustering failed:", e);
    }
  }

  return [];
}
