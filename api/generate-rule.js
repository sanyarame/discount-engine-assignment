
import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Please provide a discount request." });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const instruction = `Convert this discount request into a structured discount rule.

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
- Return JSON only, no markdown or code fences.`;

    let response;

    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: instruction,
      });
    } catch (primaryError) {
      console.warn("Primary model failed. Trying fallback model.");

      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: instruction,
      });
    }

    return res.status(200).json({ result: response.text });
  } catch (error) {
    console.error("Gemini error:", error);
    return res.status(500).json({ error: "Failed to generate discount rule." });
  }
}
