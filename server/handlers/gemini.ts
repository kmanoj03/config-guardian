// The business logic part of utilizing Gemini's model.

import { GoogleGenerativeAI } from "@google/generative-ai";

const key = process.env.GEMINI_API_KEY;
if (!key) throw new Error("GEMINI_API_KEY missing");
const genAI = new GoogleGenerativeAI(key);

export async function geminiAnalyzeText(prompt: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
  const res = await model.generateContent(prompt);
  return res.response.text();
}

export async function geminiVisionToText(
  instruction: string,
  imageBase64: string,
  mimeType = "image/png"
) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
  const res = await model.generateContent([
    { text: instruction },
    { inlineData: { mimeType, data: imageBase64 } },
  ]);
  return res.response.text();
}
