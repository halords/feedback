import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const AI_MODEL = "gemini-2.0-flash";

export interface AIAnalysisRequest {
  year: string;
  data: any[]; // Aggregated data from physical_report
  scope: "office" | "organization";
  officeName?: string;
}

export async function analyzeFeedbackData(request: AIAnalysisRequest) {
  const model = genAI.getGenerativeModel({ 
    model: AI_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const prompt = `
    You are a Senior Data Analyst for the Provincial Government of La Union (PGLU).
    Analyze the following feedback data for the year ${request.year}.
    
    SCOPE: ${request.scope === 'office' ? `Office: ${request.officeName}` : 'Organization-wide'}
    
    Analyze:
    1. Satisfaction Trends: The 'overrate' field represents general satisfaction. Calculate monthly trends.
    2. Collection Rate: Relation between Collected Forms and Visitors.
    3. Citizen's Charter Visibility: 'VISIBLE' vs other visibility metrics.
    4. Categorical Strengths/Weaknesses: Analyze 'sysRate' and 'staffRate'.
    
    DATA (JSON):
    ${JSON.stringify(request.data)}
    
    OUTPUT FORMAT (JSON):
    {
      "title": "String - Descriptive title for the report",
      "executiveSummary": "String - High level professional summary (Markdown allowed)",
      "metrics": {
        "avgSatisfaction": "Number - Average % satisfaction for the year",
        "avgCollection": "Number - Average % collection rate for the year",
        "ccVisibilityScore": "Number - % of clients who saw CC clearly"
      },
      "trends": {
        "months": ["String - Month names"],
        "satisfaction": [Number - % values],
        "collection": [Number - % values]
      },
      "departmentBreakdown": [
        {
          "name": "String - Dept Name",
          "performance": "String - Short analysis",
          "satisfaction": "Number",
          "strength": "String",
          "weakness": "String"
        }
      ],
      "keyInsights": ["String - Bullet points of findings"],
      "recommendations": ["String - Actionable steps for improvement"]
    }
    
    IMPORTANT:
    - Use data-driven insights.
    - Be professional and encouraging.
    - If data is missing for some months, mention it in the analysis.
    - Focus on the "trend" (is it improving or declining?).
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return JSON.parse(response.text());
}
