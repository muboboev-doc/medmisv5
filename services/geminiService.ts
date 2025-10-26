
import { GoogleGenAI } from "@google/genai";

// Ensure the API key is available in the environment variables
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey });

export const summarizeText = async (textToSummarize: string): Promise<string> => {
  if (!textToSummarize) {
    return "No text provided for summarization.";
  }
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Summarize these patient complaints in 1-2 simple, non-medical sentences for a receptionist. Focus on the main issue. Complaints: "${textToSummarize}"`,
      config: {
        temperature: 0.2,
        maxOutputTokens: 100,
        // Added thinkingConfig as per @google/genai guidelines when maxOutputTokens is set for gemini-2.5-flash
        thinkingConfig: { thinkingBudget: 50 }, 
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Could not generate summary.";
  }
};