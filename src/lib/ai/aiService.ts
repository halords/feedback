import { clusterFeedbackPatterns } from "./openrouter";
import { clusterFeedbackPatterns as clusterGemini } from "./gemini";
import { clusterFeedbackHF } from "./huggingface";

/**
 * Unified UI helper to get clusters from available AI providers
 * Priority: OpenRouter (Primary/Free) -> Gemini (Secondary) -> Hugging Face (Reliability) -> Empty
 */
export async function getSmartClusters(comments: string[]) {
  if (!comments || comments.length === 0) return [];

  // 1. Try OpenRouter (New Primary)
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const result = await clusterFeedbackPatterns(comments);
      if (result && result.length > 0) return result;
    } catch (e) {
      console.warn("OpenRouter clustering failed, falling back to Gemini...");
    }
  }

  // 2. Try Gemini (Legacy Fallback)
  if (process.env.GEMINI_API_KEY) {
    try {
      const result = await clusterGemini(comments);
      if (result && result.length > 0) return result;
    } catch (e) {
      console.warn("Gemini clustering failed, falling back to Hugging Face...");
    }
  }

  // 3. Try Hugging Face (Final Fallback)
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
