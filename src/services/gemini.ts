import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface GeneratedQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
  encouragement: string;
}

export async function generateQuestion(subject: string, topic: string, difficulty: string): Promise<GeneratedQuestion> {
  const prompt = `You are a friendly, encouraging, and enthusiastic teacher for a 5-year-old child.
Generate a fun, interactive question about ${subject} specifically focusing on ${topic}.
The difficulty level is: ${difficulty}. 
- If Easy: Very basic, highly visual, simple concepts (e.g., counting to 5, primary colors, basic shapes).
- If Medium: Standard kindergarten level (e.g., counting to 10, simple addition +1, sight words).
- If Hard: A bit more challenging, introducing advanced kindergarten concepts (e.g., counting to 20, addition up to 10, reading short sentences, complex patterns).
- If Extreme: Advanced concepts pushing beyond typical kindergarten, like basic word problems with numbers up to 50, simple subtraction up to 20, or reading full sentences with comprehension.
The question should be engaging and easy to understand.
Do NOT use emojis or excessive symbols in the question text or options. Keep the text clean, clear, and easy to read.
Provide 2 to 4 multiple choice options.
Make sure the correct answer is exactly one of the options.
Keep the text short.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questionText: { type: Type.STRING, description: "The question text, simple and easy for a 5-year-old to understand. No emojis." },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "2 to 4 possible answer options. No emojis."
          },
          correctAnswer: { type: Type.STRING, description: "The exact string from the options array that is the correct answer." },
          encouragement: { type: Type.STRING, description: "A short, fun encouraging message for when they get it right." }
        },
        required: ["questionText", "options", "correctAnswer", "encouragement"]
      },
      temperature: 0.7,
    }
  });

  if (!response.text) {
    throw new Error("Failed to generate question");
  }

  return JSON.parse(response.text) as GeneratedQuestion;
}
