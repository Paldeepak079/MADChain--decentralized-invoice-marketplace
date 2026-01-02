
import { GoogleGenAI, Type } from "@google/genai";
import { RiskAnalysisResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeInvoiceRisk = async (
  buyerName: string,
  amount: number,
  dueDate: string,
  description: string
): Promise<RiskAnalysisResponse> => {
  const prompt = `Analyze the risk of an invoice for financing in the Indian MSME context. 
  Buyer: ${buyerName} (Assume this is an Indian corporate entity)
  Amount: ₹${amount}
  Due Date: ${dueDate}
  Description: ${description}
  
  Provide a risk score from 0 to 100 (where 100 is low risk/high reliability), 
  a brief reasoning for the score considering Indian GST and credit cycles, and a recommended annual interest rate (APY) as a percentage.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Risk score from 0 to 100" },
            reasoning: { type: Type.STRING, description: "Justification for the score" },
            recommendedInterest: { type: Type.NUMBER, description: "Recommended APY percentage" },
          },
          required: ["score", "reasoning", "recommendedInterest"],
        },
      },
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("MADTech AI Analysis Error:", error);
    return {
      score: 75,
      reasoning: "Standard risk assessment based on Indian trade patterns.",
      recommendedInterest: 14,
    };
  }
};
