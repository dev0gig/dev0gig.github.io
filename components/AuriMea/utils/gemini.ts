import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function categorizeTransaction(description: string, categories: string[]): Promise<string> {
  if (!process.env.API_KEY) {
    console.warn("API_KEY is not set. Skipping Gemini categorization.");
    return 'Sonstiges';
  }

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Categorize the following expense description: "${description}". Choose the best fit from this list of categories: ${categories.join(', ')}. Respond with only the category name. If no category fits well, respond with "Sonstiges".`,
        config: {
            temperature: 0,
            thinkingConfig: { thinkingBudget: 0 }
        }
    });

    const category = response.text.trim();
    
    // Validate that the response is one of the provided categories
    if (categories.map(c => c.toLowerCase()).includes(category.toLowerCase())) {
        // Find the original casing
        const originalCasingCategory = categories.find(c => c.toLowerCase() === category.toLowerCase());
        return originalCasingCategory || 'Sonstiges';
    }
    
    return 'Sonstiges';

  } catch (error) {
    console.error("Error categorizing transaction with Gemini:", error);
    return 'Sonstiges'; // Fallback category
  }
}
