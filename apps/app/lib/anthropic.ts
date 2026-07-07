import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

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
    messages: [
      { role: "user", content: user },
      { role: "assistant", content: "{" },
    ],
  });

  const raw =
    response.content[0].type === "text" ? response.content[0].text : "";
  const text = "{" + raw;

  return {
    text,
    tokensIn: response.usage.input_tokens,
    tokensOut: response.usage.output_tokens,
  };
}
