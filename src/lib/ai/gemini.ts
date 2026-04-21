import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const AI_MODEL = "gemini-2.5-flash";

export interface AIAnalysisRequest {
  year: string;
  data: any[]; // Aggregated data from physical_report
  scope: "office" | "organization";
  officeName?: string;
}

export async function analyzeFeedbackData(request: AIAnalysisRequest) {
  const prompt = `
    You are a Senior Data Analyst for the Provincial Government of La Union (PGLU).
    Analyze the following feedback data for the year ${request.year}.
    
    SCOPE: ${request.scope === 'office' ? `Office: ${request.officeName}` : 'Organization-wide'}
    
    Analyze:
    1. Satisfaction Trends: The 'satisfaction' field in the data represents general satisfaction as a percentage string (e.g., "85.00%") or "N/A" if no data. When calculating averages/trends, IGNORE "N/A" values.
    2. Collection Rate: Use the 'collectionRate' field.
    3. Citizen's Charter (CC) Implementation: Analyze CC Familiarity (cc1), Visibility (cc2), and Helpfulness (cc3). Identify compliance levels and areas where citizens feel the charter is not helpful or visible.
    4. Categorical Strengths/Weaknesses: Analyze 'sysRate' and 'staffRate'.
    5. Digital Transformation Gap: Compare 'online' vs 'offline' feedback volume to identify adoption rates and gaps in digital transition across departments.
    
    DATA (JSON):
    ${JSON.stringify(request.data)}
    
    OUTPUT FORMAT (JSON):
    {
      "title": "String - Descriptive title for the report",
      "executiveSummary": "String - High level professional summary (Markdown allowed)",
      "metrics": {
        "avgSatisfaction": "Number - Average percentage (0-100). Use 0 if absolutely no data.",
        "avgCollection": "Number - Average percentage (0-100). Use 0 if absolutely no data.",
        "ccComplianceScore": "Number - Aggregate percentage (0-100) reflecting Familiarity, Visibility, and Helpfulness.",
        "digitalAdoptionRate": "Number - Percentage (0-100) of total feedback that was submitted online."
      },
      "trends": {
        "months": ["String - Month names (e.g., 'January')"],
        "satisfaction": [Number - Percentage values for each month. Use 0 for months with no data.],
        "collection": [Number - Percentage values for each month. Use 0 for months with no data.]
      },
      "departmentBreakdown": [
        {
          "name": "String - Department Name",
          "performance": "String - Short qualitative analysis",
          "satisfaction": "Number - Percentage satisfaction score",
          "strength": "String - Main positive takeaway",
          "weakness": "String - Primary area for improvement"
        }
      ],
      "keyInsights": ["String - Strategic findings"],
      "recommendations": ["String - Actionable improvement steps"]
    }
    
    CRITICAL INSTRUCTIONS:
    - METRIC VALUES MUST BE NUMBERS. DO NOT USE "N/A" OR STRINGS IN THE METRICS OR TRENDS ARRAYS.
    - If a department or month has "N/A" in the input, exclude it from your internal average calculations so you don't skew the results toward zero, but return 0 in the final JSON if NO data is available at all.
    - Be professional, data-driven, and focused on the Provincial Government's service quality.
  `;

  // List of models to try in order of preference
  const modelsToTry = [
    AI_MODEL,
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-flash-lite"
  ];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`🤖 AI Analysis: Attempting with ${modelName}...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Attempt to parse JSON. Sometimes models might wrap in ```json ... ```
      const cleanedJson = text.replace(/```json\n?|```/g, "").trim();
      return JSON.parse(cleanedJson);
    } catch (err: any) {
      lastError = err;
      const status = err.status || (err.message?.includes("503") ? 503 : null);

      if (status === 503 || status === 429) {
        console.warn(`⚠️ Model ${modelName} is busy or throttled. Trying fallback...`);
        continue;
      }

      // If it's a different error (e.g. invalid key), throw immediately
      throw err;
    }
  }

  throw lastError || new Error("All AI models are currently unavailable.");
}
export async function clusterFeedbackPatterns(comments: string[]) {
  if (!comments || comments.length === 0) return [];

  const prompt = `
    You are an AI Support Analyst. Analyze the following list of raw feedback comments from citizens.
    Your goal is to identify the TOP 5 RECURRING THEMES (the "gist" of the complaints).
    
    RAW COMMENTS:
    ${comments.slice(0, 100).join("\n- ")}
    
    OUTPUT FORMAT (JSON):
    [
      {
        "gist": "String - A short, 3-5 word summary of the recurring issue (e.g., 'Slow Processing Time', 'Unprofessional Staff Behavior')",
        "description": "String - A brief explanation of why this is a pattern",
        "count": "Number - Approximate number of comments that fit this theme",
        "representativeExample": "String - One actual quote from the list that best represents this theme"
      }
    ]
    
    INSTRUCTIONS:
    - Group similar meanings together even if phrasing is different.
    - Be concise and professional.
    - Focus on the most frequent and actionable issues.
  `;

  try {
    const model = genAI.getGenerativeModel({
      model: AI_MODEL,
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text.replace(/```json\n?|```/g, "").trim());
  } catch (err) {
    console.error("AI Pattern Clustering Error:", err);
    return []; // Fallback to empty if AI fails
  }
}
