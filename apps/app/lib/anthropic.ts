import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const HAIKU_MODEL = "claude-haiku-4-5-20251001";
export const SONNET_MODEL = "claude-sonnet-5";

function cachedSystem(system: string) {
  return [
    {
      type: "text" as const,
      text: system,
      cache_control: { type: "ephemeral" as const },
    },
  ];
}

export async function callAI({
  system,
  user,
  maxTokens = 4000,
  model = HAIKU_MODEL,
}: {
  system: string;
  user: string;
  maxTokens?: number;
  model?: string;
}) {
  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system: cachedSystem(system),
    messages: [{ role: "user", content: user }],
  });

  const text = response.content
    .map((c) => (c.type === "text" ? c.text : ""))
    .join("");

  return {
    text,
    tokensIn: response.usage.input_tokens,
    tokensOut: response.usage.output_tokens,
    cacheCreationTokens: (response.usage as any).cache_creation_input_tokens ?? 0,
    cacheReadTokens: (response.usage as any).cache_read_input_tokens ?? 0,
    modelUsed: response.model,
    stopReason: response.stop_reason,
    contentTypes: response.content.map((c) => c.type),
  };
}

export async function streamAI({
  system,
  user,
  maxTokens = 4000,
  model = HAIKU_MODEL,
}: {
  system: string;
  user: string;
  maxTokens?: number;
  model?: string;
}) {
  return anthropic.messages.stream({
    model,
    max_tokens: maxTokens,
    system: cachedSystem(system),
    messages: [{ role: "user", content: user }],
  });
}
