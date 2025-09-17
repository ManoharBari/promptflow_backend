import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_KEY) {
  throw new Error("GEMINI_API_KEY not set in env");
}

const genAI = new GoogleGenerativeAI(GEMINI_KEY);

// Model options: "gemini-1.5-flash" (fast/cheap) or "gemini-1.5-pro" (better reasoning)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function generateJsonFromPrompt(plainTextPrompt: string) {
  const systemInstruction = `
  You are an expert prompt engineer. Your task is to transform a user's plain English request into a high-performance JSON prompt specification.

Rules:
1. Always output only valid JSON.
2. Follow this exact schema:
{
  "goal": string,
  "context": string,
  "instructions": string[],
  "inputs": object[],
  "constraints": string[],
  "expected_output": string
}

Dynamic behavior:
- Extract "goal" directly from the main intent in the user’s request.
- Summarize any supporting details as "context".
- Break the task into precise "instructions".
- Identify key variables/placeholders and list them in "inputs" with proper types.
- If no constraints are given, add defaults (e.g., "Be concise", "Return valid JSON").
- Always define "expected_output" clearly in one sentence.

Output ONLY the JSON. Do not include explanations, notes, or text outside JSON.`;

  const result = await model.generateContent([
    systemInstruction,
    plainTextPrompt,
  ]);

  const text = result.response.text();
  if (!text) throw { status: 500, message: "Gemini returned empty response" };

  // Try parsing as JSON
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    // Try to extract JSON if wrapped in text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      json = JSON.parse(match[0]);
    } else {
      throw { status: 500, message: "Gemini output not valid JSON" };
    }
  }

  return json;
}
