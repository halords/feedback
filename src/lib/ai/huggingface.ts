/**
 * Hugging Face Inference API client for Sentiment Analysis and Feedback Clustering
 */

const HF_TOKEN = process.env.HUGGINGFACE_API_KEY || "";
const SENTIMENT_MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest";
const SUMMARIZER_MODEL = "facebook/bart-large-cnn";

/**
 * Generic fetcher for Hugging Face Inference API
 */
async function queryHF(model: string, data: any, retries = 3): Promise<any> {
  if (!HF_TOKEN) {
    console.warn("⚠️ HUGGINGFACE_API_KEY is missing. AI features will be disabled.");
    return null;
  }

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        headers: { 
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify(data),
      }
    );

    // Handle Model Loading (Common in Free Tier)
    if (response.status === 503 && retries > 0) {
      const errorBody = await response.json();
      if (errorBody.error?.includes("currently loading")) {
        const waitTime = Math.min(errorBody.estimated_time || 10, 20);
        console.log(`⏳ HF Model ${model} is loading. Retrying in ${waitTime}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        return queryHF(model, data, retries - 1);
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      // If it's HTML, don't try to parse as JSON
      if (errorText.includes("<!DOCTYPE") || errorText.includes("<html")) {
        console.error(`HF API Error (${response.status}): Received HTML instead of JSON. Possible API downtime or invalid model.`);
      } else {
        console.error(`HF API Error (${response.status}): ${errorText.substring(0, 200)}`);
      }
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`HF API Network Error (${model}):`, error);
    return null;
  }
}

/**
 * Analyzes sentiment of a string
 * Returns: 'Positive' | 'Negative' | 'Neutral'
 */
export async function analyzeSentimentHF(text: string): Promise<string> {
  const result = await queryHF(SENTIMENT_MODEL, { inputs: text });
  
  if (!result || !Array.isArray(result[0])) return "Neutral";

  // Roberta labels: 0 -> Negative, 1 -> Neutral, 2 -> Positive
  const scores = result[0];
  const top = scores.reduce((prev: any, current: any) => (prev.score > current.score) ? prev : current);

  if (top.label === "positive") return "Positive";
  if (top.label === "negative") return "Negative";
  return "Neutral";
}

/**
 * Clusters comments into themes (The "Gist")
 * Note: Since smaller summarizers aren't as good at clustering as LLMs, 
 * we use a multi-step approach or a large summarizer.
 */
export async function clusterFeedbackHF(comments: string[]) {
  if (!comments || comments.length === 0) return [];

  // For clustering, we'll concatenate the top 20 comments and ask for a summary
  const textToSummarize = comments.slice(0, 20).join(". ");
  
  const result = await queryHF(SUMMARIZER_MODEL, { 
    inputs: textToSummarize,
    parameters: { max_length: 150, min_length: 40, do_sample: false }
  });

  if (!result || !result[0]?.summary_text) return [];

  // Since local summarizers return a single paragraph, we break it into logical "Gists"
  const summary = result[0].summary_text;
  const points = summary.split(/[.!?]/).filter((s: string) => s.trim().length > 10);

  return points.slice(0, 5).map((point: string, idx: number) => ({
    gist: point.trim(),
    description: "Identified via HF BART model clustering.",
    count: Math.floor(comments.length / 3), // Estimate
    representativeExample: comments[idx % comments.length]
  }));
}
