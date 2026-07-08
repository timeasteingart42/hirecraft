import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const MODEL = "claude-haiku-4-5-20251001";

export async function callAI({
  system,
  user,
  maxTokens = 4000,
}: {
  system: string;
  user: string;
  maxTokens?: number;
}) {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });

  const text = response.content
    .map((c) => (c.type === "text" ? c.text : ""))
    .join("");

  return {
    text,
    tokensIn: response.usage.input_tokens,
    tokensOut: response.usage.output_tokens,
    modelUsed: response.model,
    stopReason: response.stop_reason,
    contentTypes: response.content.map((c) => c.type),
  };
}
