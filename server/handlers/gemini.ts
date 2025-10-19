// The business logic part of utilizing Gemini's model.

import { GoogleGenerativeAI } from "@google/generative-ai";
import { REPAIR_JSON_PROMPT } from "../utils/prompts.js";

const key = process.env.GEMINI_API_KEY;
if (!key) throw new Error("GEMINI_API_KEY missing");

const MODEL_ANALYZE = process.env.GEMINI_MODEL_ANALYZE || "gemini-2.5-pro";
const MODEL_OCR = process.env.GEMINI_MODEL_OCR || "gemini-2.5-flash";
const TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 60000);

const genAI = new GoogleGenerativeAI(key);

function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("gemini_timeout")), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

export async function geminiAnalyzeText(prompt: string) {
  const model = genAI.getGenerativeModel({
    model: MODEL_ANALYZE,
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  });
  const res = await withTimeout(model.generateContent(prompt));
  return res.response.text();
}

export async function geminiVisionToText(
  instruction: string,
  imageBase64: string,
  mimeType = "image/png"
) {
  const model = genAI.getGenerativeModel({
    model: MODEL_OCR,
    generationConfig: { temperature: 0.1 },
  });
  const res = await withTimeout(
    model.generateContent([
      { text: instruction },
      { inlineData: { mimeType, data: imageBase64 } },
    ])
  );
  return res.response.text();
}

export async function geminiRepairJson(badOutput: string) {
  const model = genAI.getGenerativeModel({
    model: MODEL_ANALYZE,
    generationConfig: {
      temperature: 0.0,
      responseMimeType: "application/json",
    },
  });
  const res = await withTimeout(
    model.generateContent(REPAIR_JSON_PROMPT(badOutput))
  );
  return res.response.text();
}

export async function geminiGeneratePlain(prompt: string) {
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL_ANALYZE || "gemini-2.5-pro",
    generationConfig: { temperature: 0.1, responseMimeType: "text/plain" },
  });
  const res = await withTimeout(model.generateContent(prompt));
  return res.response.text();
}
