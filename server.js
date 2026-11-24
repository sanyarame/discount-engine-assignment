import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.post("/api/generate-rule", async (req, res) => {
  try {
    const { prompt } = req.body;

          let response;

      try {
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash-lite",
          contents: `Convert this discount request into a structured discount rule.

Request: "${prompt}"

Return ONLY valid JSON.

For brand or platform discounts, use:
{
  "scope": "brand" or "platform",
  "appliesTo": "string",
  "type": "percentage" or "flat",
  "value": number,
  "stackable": boolean
}

For cart-level discounts, use:
{
  "scope": "cart",
  "appliesTo": "cart",
  "type": "percentage" or "flat",
  "value": number,
  "min_cart_value": number,
  "stackable": boolean
}

Rules:
- Identify whether the discount applies to a brand, platform, or entire cart.
- For cart discounts, extract the minimum cart value threshold.
- Do not invent missing values.
- If the request is ambiguous or missing required information, return JSON with an "error" field explaining what is unclear.
- Return JSON only, no markdown or code fences.`,
        });
      } catch (primaryError) {
        console.warn("Primary model failed. Trying fallback model.", primaryError);

        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Convert this discount request into a structured discount rule.

Request: "${prompt}"

Return ONLY valid JSON.

For brand or platform discounts, use:
{
  "scope": "brand" or "platform",
  "appliesTo": "string",
  "type": "percentage" or "flat",
  "value": number,
  "stackable": boolean
}

For cart-level discounts, use:
{
  "scope": "cart",
  "appliesTo": "cart",
  "type": "percentage" or "flat",
  "value": number,
  "min_cart_value": number,
  "stackable": boolean
}

Rules:
- Identify whether the discount applies to a brand, platform, or entire cart.
- For cart discounts, extract the minimum cart value threshold.
- Do not invent missing values.
- If the request is ambiguous or missing required information, return JSON with an "error" field explaining what is unclear.
- Return JSON only, no markdown or code fences.`,
        });
      }

      res.json({ result: response.text });
  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).json({ error: "Failed to generate discount rule." });
  }
});

app.listen(3001, () => {
  console.log("AI backend running on http://localhost:3001");
});