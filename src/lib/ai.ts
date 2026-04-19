/**
 * AI utilities for Knect
 * Uses OpenAI for sentiment analysis and topic extraction
 */

export interface SentimentResult {
  sentiment: "positive" | "neutral" | "negative";
  score: number; // -1 to 1
  topics: string[];
}

/**
 * Analyze the sentiment of a text and extract topics.
 * Returns sentiment classification, a numeric score, and relevant topics.
 */
export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Fallback if no API key
    return { sentiment: "neutral", score: 0, topics: [] };
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a sentiment analysis tool for a civic engagement platform in Compton, CA.
Analyze the given text and return a JSON object with:
- "sentiment": one of "positive", "neutral", or "negative"
- "score": a number from -1 (most negative) to 1 (most positive), with 0 being neutral
- "topics": an array of 1-5 relevant topic tags (lowercase, e.g., "infrastructure", "safety", "education", "housing", "community", "parks", "business", "youth", "health", "transportation")

Return ONLY valid JSON, no markdown or explanation.`,
        },
        {
          role: "user",
          content: text.slice(0, 1000), // Limit input length
        },
      ],
      max_tokens: 150,
      temperature: 0,
    }),
  });

  if (!res.ok) {
    console.error("Sentiment analysis API error:", await res.text());
    return { sentiment: "neutral", score: 0, topics: [] };
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";

  try {
    // Parse the JSON response, stripping markdown code fences if present
    const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    // Validate and normalize
    const sentiment = ["positive", "neutral", "negative"].includes(parsed.sentiment)
      ? parsed.sentiment
      : "neutral";

    const score = typeof parsed.score === "number"
      ? Math.max(-1, Math.min(1, parsed.score))
      : 0;

    const topics = Array.isArray(parsed.topics)
      ? parsed.topics.filter((t: unknown): t is string => typeof t === "string").slice(0, 5)
      : [];

    return { sentiment, score, topics };
  } catch {
    console.error("Failed to parse sentiment response:", content);
    return { sentiment: "neutral", score: 0, topics: [] };
  }
}
