import OpenAI from "openai";

const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "https://api.openai.com/v1";
const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "sk-test-placeholder";

if (!baseUrl) {
  console.warn("AI_INTEGRATIONS_OPENAI_BASE_URL not set. Using default.");
}

if (!apiKey || apiKey === "sk-test-placeholder") {
  console.warn("AI_INTEGRATIONS_OPENAI_API_KEY not set. Using placeholder key. AI features will not work.");
}

export const openai = new OpenAI({
  apiKey,
  baseURL: baseUrl,
});
