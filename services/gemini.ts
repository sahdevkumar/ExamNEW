import { GoogleGenAI } from "@google/genai";
import { PopulatedMark, Student } from "../types";

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key not found");
    return new GoogleGenAI({ apiKey });
};

export const analyzeStudentPerformance = async (
  student: Student,
  marks: PopulatedMark[]
): Promise<string> => {
  try {
    const ai = getClient();
    
    // Prepare context
    const performanceData = marks.map(m => 
      `- ${m.subjectName} (${m.examName}): ${m.total}/${m.max_subjective + m.max_objective} (${m.percentage.toFixed(1)}%)`
    ).join('\n');

    const prompt = `
      You are an expert educational consultant. Analyze the following exam results for a student named ${student.name}.
      
      Performance Data:
      ${performanceData}
      
      Please provide:
      1. A brief summary of their academic strengths.
      2. Areas that need improvement.
      3. A constructive, encouraging comment for the report card (approx 50 words).
      
      Format the output in clean Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Unable to generate AI analysis at this time. Please check your API key.";
  }
};