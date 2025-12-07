import { GoogleGenAI, Type } from "@google/genai";
import { MealAnalysis } from "../types";

// Initialize the Gemini AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const estimateMealCalories = async (input: string): Promise<Omit<MealAnalysis, 'id' | 'timestamp' | 'originalInput'>> => {
  const modelId = "gemini-2.5-flash"; // Excellent for fast, structured data tasks

  const response = await ai.models.generateContent({
    model: modelId,
    contents: `Analyze the following meal description and estimate the nutritional content. 
    Make reasonable assumptions for portion sizes if not specified. 
    Input: "${input}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          totalCalories: {
            type: Type.INTEGER,
            description: "Total estimated calories for the entire meal",
          },
          proteinGrams: {
            type: Type.INTEGER,
            description: "Total protein in grams",
          },
          carbsGrams: {
            type: Type.INTEGER,
            description: "Total carbohydrates in grams",
          },
          fatGrams: {
            type: Type.INTEGER,
            description: "Total fat in grams",
          },
          foodItems: {
            type: Type.ARRAY,
            description: "Breakdown of individual food items identified",
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                calories: { type: Type.INTEGER },
                quantity: { type: Type.STRING, description: "e.g., '2 patties', '100g', '1 slice'" },
              },
              required: ["name", "calories", "quantity"],
            },
          },
          healthTip: {
            type: Type.STRING,
            description: "A short, actionable health tip related to this meal (max 20 words).",
          },
        },
        required: ["totalCalories", "proteinGrams", "carbsGrams", "fatGrams", "foodItems", "healthTip"],
      },
      systemInstruction: "You are an expert nutritionist. Your goal is to provide accurate calorie and macronutrient estimates based on vague or detailed user descriptions. If the input is nonsense or not food, return 0 for all values and a polite message in the healthTip.",
    },
  });

  if (!response.text) {
    throw new Error("No response received from AI");
  }

  try {
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Failed to parse JSON response:", response.text);
    throw new Error("Failed to process nutrition data.");
  }
};
