import { GoogleGenAI } from "@google/genai";
import { BOOK_CHUNKS } from "../data/bookContent";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export type AgentPersona = 'analyst' | 'strategy' | 'marketing' | 'general' | 'reviewer';

export interface ChatResponse {
  text: string;
  chartData?: any[];
  chartType?: 'bar' | 'line' | 'pie';
  isFromBook: boolean;
}

export async function getChatResponse(
  userMessage: string, 
  chatHistory: { role: string; parts: { text: string }[] }[],
  persona: AgentPersona = 'general'
): Promise<ChatResponse> {
  
  // Simple retrieval: find chunks that match keywords in the message
  const relevantChunks = BOOK_CHUNKS.filter(chunk => 
    chunk.keywords.some(kw => userMessage.toLowerCase().includes(kw.toLowerCase())) ||
    chunk.topic.toLowerCase().includes(userMessage.toLowerCase())
  );

  const context = relevantChunks.length > 0 
    ? relevantChunks.map(c => `[Topic: ${c.topic}] ${c.content}`).join("\n\n")
    : BOOK_CHUNKS.map(c => c.content).join("\n\n"); // Fallback to all if small enough

  const personaInstructions = {
    analyst: "You are a Business Analyst. Focus on data, capital requirements, and market trends mentioned in the book.",
    strategy: "You are a Business Strategist. Focus on long-term growth, location selection, and competitive advantage.",
    marketing: "You are a Marketing Expert. Focus on branding, customer acquisition, and sales tactics.",
    reviewer: "You are a Document Reviewer. Your task is to critique business documents (plans, proposals, etc.) based on the principles in the Kibenje Guide. Be constructive, identify gaps in capital planning or location strategy, and suggest improvements.",
    general: "You are a helpful business assistant."
  };

  const systemInstruction = `
${personaInstructions[persona]}
You are based on the book "Fursa za Kibiashara na Machimbo" by Kelvin Kibenje.

STRICT GUIDELINES:
1. Answer PRIMARILY using the provided book context.
2. If the information is in the book, start your response with "Based on the guide..." or similar.
3. If the information is NOT in the book, you MUST say: "I couldn't find this specific information in the book, but here is a general suggestion based on business principles:" and then provide a helpful answer.
4. **TABLES**: When presenting data like budgets, schedules, SWOT analysis, or comparisons, ALWAYS use well-organized Markdown tables. 
   - **STRICT FORMATTING**: Ensure each row is on a NEW LINE. The separator row (e.g., |---|---|) is MANDATORY. 
   - **DO NOT** put the entire table on a single line. 
   - Use clear headers and proper alignment. Ensure the tables are comprehensive and easy to read.
5. **CHARTS**: If the user asks for a chart or data visualization, or if you are generating a report/plan, include a JSON block at the end of your response. 
   - Use "bar" for comparisons, "line" for trends over time, and "pie" for parts of a whole (like budget allocation).
   - **BILINGUAL SUPPORT**: Use standard English terms for chart item names (e.g., "Revenue", "Costs", "Profit", "Capital", "Rent", "Marketing") so the system can automatically translate them to Swahili in the tooltips.
   - Format: JSON_CHART: {"type": "bar", "data": [{"name": "Revenue", "value": 1000}]}
6. If the user asks for a business proposal or plan, use a structured professional format with headers.
7. Respond in the language the user uses (Swahili or English).

CONTEXT FROM BOOK:
${context}
`;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...chatHistory,
        { role: "user", parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    const fullText = result.text || "";
    
    // Extract chart data if present
    let text = fullText;
    let chartData: any[] | undefined;
    let chartType: 'bar' | 'line' | 'pie' | undefined;
    
    const chartMatch = fullText.match(/JSON_CHART:\s*(\{.*\})/);
    if (chartMatch) {
      try {
        const parsed = JSON.parse(chartMatch[1]);
        chartData = parsed.data;
        chartType = parsed.type;
        text = fullText.replace(/JSON_CHART:\s*\{.*\}/, '').trim();
      } catch (e) {
        console.error("Failed to parse chart JSON", e);
      }
    }

    return {
      text,
      chartData,
      chartType,
      isFromBook: fullText.includes("Based on the guide")
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return {
      text: "Samahani, kuna tatizo limetokea. Tafadhali jaribu tena. (An error occurred while processing your request.)",
      isFromBook: false
    };
  }
}
