
export interface AIAnalysisRequest {
  year: string;
  data: any;
  scope: "office" | "organization";
  officeName?: string;
  timeScope?: "month" | "quarter" | "year";
  period?: string; // e.g., "January", "Q1", or "Full Year"
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const SITE_NAME = "PGLU Feedback Analytics";

// Comprehensive list of free models to ensure uptime on free tier
const MODELS = [
  "openrouter/free", // Automatically routes to the best available free model
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemini-2.0-flash-exp:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "mistralai/mistral-7b-instruct-v0.1:free",
  "microsoft/phi-3-mini-128k-instruct:free",
  "qwen/qwen-2-7b-instruct:free",
  "google/gemma-2-9b-it:free",
  "x-ai/grok-2-1212", // Fallback (requires credits)
];

async function callOpenRouter(prompt: string, modelIndex = 0): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  if (modelIndex >= MODELS.length) {
    throw new Error("All AI models failed or are unavailable.");
  }

  const model = MODELS[modelIndex];
  
  try {
    console.log(`🤖 AI Analysis (OpenRouter): Attempting with ${model}...`);
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.warn(`⚠️ OpenRouter error (${model}):`, errorData);
      return callOpenRouter(prompt, modelIndex + 1);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.warn(`⚠️ Model ${model} returned empty content. Trying next...`);
      return callOpenRouter(prompt, modelIndex + 1);
    }

    return content;
  } catch (error) {
    console.error(`❌ OpenRouter failed for ${model}:`, error);
    return callOpenRouter(prompt, modelIndex + 1);
  }
}

export async function analyzeFeedbackData(request: AIAnalysisRequest) {
  const prompt = `
    You are a Senior Data Analyst for the Provincial Government of La Union (PGLU).
    Analyze the following feedback data for the year ${request.year}.
    
    ANALYSIS SCOPE: ${request.scope === 'office' ? `Office: ${request.officeName}` : 'Organization-wide'}
    TIME PERIOD: ${request.period || 'Full Year'} (${request.timeScope || 'year'})
    
    REPORT TITLE GUIDELINES:
    - If Monthly: "Satisfaction Rate - ${request.period}"
    - If Quarterly: "${request.period} Satisfaction Rate"
    - If Yearly: "Annual Service Quality Analysis ${request.year}"

    Analyze and Provide:
    1. Executive Summary: Professional overview. 
       - For Quarterly/Yearly: Explain month-over-month trends.
       - For Monthly: Explain the specific performance of this month compared to organizational goals.
    2. Strategic Insights: Back every claim with numbers, offices, and months.
    3. Departmental Comparative Analysis (Fairness & Statistical Rigor): 
       - Criteria for "Core Strength":
         a) Statistical Significance: Must meet the minimum sample size for a 95% Confidence Level and 5% Margin of Error (determine this using 'collected' vs 'visitors').
         b) Absolute Volume: Minimum of 20 collected feedbacks.
         c) Quality: High satisfaction rating.
       - "High Performers": Offices that meet all 3 criteria above.
       - "Volume Leaders": Offices with significant absolute collection volume, even if their 'collectionRate' percentage is lower due to high foot traffic. Do NOT punish high-volume offices for low collection rates.
       - "Growth Areas": High satisfaction but low volume (failed to meet sample size or < 20 feedbacks). Wording should focus on increasing participation.
       - "At-Risk": Low satisfaction regardless of volume.
    4. Citizen's Charter (CC) Implementation: Evaluate compliance levels.
    5. Digital Transformation: Online vs Offline adoption.
    
    DATA (JSON):
    ${JSON.stringify(request.data)}
    
    IMPORTANT: 
    - Use the 'organizationSummary' in the data as the GROUND TRUTH for core metrics. 
    - You MUST use the 'monthlyTrends' data to populate the 'trends' object for charts.
    
    OUTPUT FORMAT (JSON):
    {
      "title": "String - Use the TITLE GUIDELINES above",
      "executiveSummary": "String - Professional summary (Markdown allowed)",
      "metrics": {
        "avgSatisfaction": "Number - MUST match 'organizationSummary.periodSatisfaction'.",
        "avgCollection": "Number - Average collection rate (Total Collected / Total Visitors) * 100.",
        "ccComplianceScore": "Number - Aggregate percentage (0-100).",
        "digitalAdoptionRate": "Number - MUST match 'organizationSummary.periodAdoption'."
      },
      "trends": {
        "months": ["String - Month names from 'organizationSummary.monthlyTrends'"],
        "satisfaction": ["Number - Satisfaction scores from 'organizationSummary.monthlyTrends'"],
        "collection": ["Number - Collection totals from 'organizationSummary.monthlyTrends'"]
      },
      "departmentBreakdown": [
        {
          "name": "String - Department Name",
          "performance": "String - qualitative analysis using the FAIRNESS CRITERIA (High Performer, Volume Leader, At-Risk, or Growth Area)",
          "satisfaction": "Number - Average satisfaction score for the period. If sample size is NOT met, label the rating as 'Low Confidence' in the analysis.",
          "strength": "String - Positive takeaway. If volume is low, focus on potential rather than rating.",
          "weakness": "String - Primary improvement area. If volume is low, prioritize 'Increasing Participation' as the main weakness."
        }
      ],
      "keyInsights": ["String - Strategic findings with evidence"],
      "recommendations": ["String - Detailed, actionable improvement steps."],
      "chartExplanations": {
        "metricsOverview": "String - Professional analysis of the 4 core metrics (Satisfaction, Collection, Adoption, Compliance).",
        "satisfactionTrend": "String - Analysis of the satisfaction trend over time (Quarterly/Annual) or its current state (Monthly).",
        "collectionTrend": "String - Analysis of the feedback volume patterns and citizen participation."
      }
    }
    
    CRITICAL INSTRUCTIONS:
    - RETURN ONLY VALID JSON. DO NOT INCLUDE ANY MARKDOWN BLOCKS OR EXPLANATIONS.
    - SORTING: Do NOT sort the department breakdown by satisfaction rating. Instead, arrange them by 'Operational Impact' (Volume + Confidence).
    - STATISTICAL RIGOR: As a Senior Analyst, you must prioritize 'Statistical Significance' (95% CL, 5% MoE) over raw 'Satisfaction %'. If an office has < 20 feedbacks or fails the sample size, explicitly treat their satisfaction score as 'Low Confidence' in your analysis—do NOT count it as a Core Strength.
    - DATA AGGREGATION: For Quarterly/Yearly reports, ensure the 'satisfaction' value for each office is the AVERAGE of its scores over the months provided.
    - DIGITAL ADOPTION DATA: If online and offline are BOTH 0, but 'collected' is > 0, set digitalAdoptionRate to 0 and mention that digital tracking was not active.
    - FAIRNESS RULE: Do NOT penalize offices with high absolute collection just because their visitors count is also high (low rate). Focus on the reliability of their data.
    - If a department or month has "N/A" in the input, exclude it from calculations.
    - Be professional, data-driven, and focused on the Provincial Government's service quality.
  `;

  const text = await callOpenRouter(prompt);
  try {
    const cleanedJson = text.replace(/```json\n?|```/g, "").trim();
    return JSON.parse(cleanedJson);
  } catch (e) {
    console.error("Failed to parse OpenRouter response as JSON:", text);
    throw new Error("AI returned invalid data format. Please try again.");
  }
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
    - RETURN ONLY VALID JSON. DO NOT INCLUDE ANY MARKDOWN CODE BLOCKS OR EXPLANATIONS.
  `;

  try {
    const text = await callOpenRouter(prompt);
    const cleanedJson = text.replace(/```json\n?|```/g, "").trim();
    return JSON.parse(cleanedJson);
  } catch (err) {
    console.error("OpenRouter Pattern Clustering Error:", err);
    return [];
  }
}
