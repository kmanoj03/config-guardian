// The business logic part of utilizing Gemini's model.

import { GoogleGenerativeAI } from "@google/generative-ai";
import { REPAIR_JSON_PROMPT } from "../utils/prompts.js";

const key = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(key);

// Keep your chosen model (e.g., gemini-2.5-pro) via env:
const modelName = process.env.GEMINI_MODEL || "gemini-2.5-pro";

export async function geminiAnalyzeText(prompt: string) {
  const model = genAI.getGenerativeModel({ model: modelName });
  const res = await model.generateContent(prompt);
  return res.response.text();
}

export async function geminiVisionToText(
  instruction: string,
  imageBase64: string,
  mimeType = "image/png"
) {
  const model = genAI.getGenerativeModel({ model: modelName });
  const res = await model.generateContent([
    { text: instruction },
    { inlineData: { mimeType, data: imageBase64 } },
  ]);
  return res.response.text();
}

export async function geminiRepairJson(badOutput: string) {
  const model = genAI.getGenerativeModel({ model: modelName });
  const res = await model.generateContent(REPAIR_JSON_PROMPT(badOutput));
  return res.response.text();
}
