import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { streamAI, HAIKU_MODEL } from "@/lib/anthropic";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/get-or-create-user";
import { COVER_LETTER_SYSTEM_PROMPT } from "@/lib/prompts/cover-letter";
import { assertAiQuota } from "@/lib/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BodySchema = z.object({
  applicationId: z.string(),
  tone: z
    .enum(["formal-institutional", "warm-professional", "bold-thesis-driven"])
    .default("warm-professional"),
  length: z.enum(["short", "standard", "long"]).default("standard"),
  refinementInstruction: z.string().max(500).optional(),
  previousDraft: z.string().max(6000).optional(),
  variant: z.enum(["a", "b"]).default("a"),
});

export async function POST(req: NextRequest) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = BodySchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.errors[0].message }, { status: 400 });
  }

  const application = await db.application.findUnique({
    where: { id: body.data.applicationId, userId: user.id },
  });
  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const baseline = await db.resumeBaseline.findUnique({
    where: { userId: user.id },
  });
  if (!baseline) {
    return NextResponse.json({ error: "Upload a resume first" }, { status: 400 });
  }

  const quota = await assertAiQuota(user.id, user.plan);
  if (!quota.ok) {
    return NextResponse.json(
      {
        error: `Monthly limit reached on the ${quota.plan} plan (${quota.used}/${quota.limit}). Upgrade to Pro for unlimited.`,
        code: "QUOTA_EXCEEDED",
      },
      { status: 402 }
    );
  }

  const isRefinement =
    !!body.data.refinementInstruction && !!body.data.previousDraft;

  const variantHint =
    body.data.variant === "b"
      ? "\n\nVARIANT NOTE: This is variant B of two. Take a distinctly different angle from a typical draft. If the natural hook would be the current role, open with a research or leadership anchor instead. Vary sentence rhythm."
      : "";

  const stream = await streamAI({
    system: COVER_LETTER_SYSTEM_PROMPT + variantHint,
    user: JSON.stringify({
      job_posting_text: application.jobPostingText,
      match_insights: application.matchInsights,
      profile: baseline.rawText,
      tone: body.data.tone,
      length: body.data.length,
      author_name: user.displayName || user.email,
      ...(isRefinement && {
        previous_draft: body.data.previousDraft,
        refinement_instruction: body.data.refinementInstruction,
      }),
    }),
    maxTokens: 3500,
    model: HAIKU_MODEL,
  });

  const encoder = new TextEncoder();

  const sse = new ReadableStream({
    async start(controller) {
      let fullText = "";
      let tokensIn = 0;
      let tokensOut = 0;

      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            const t = chunk.delta.text;
            fullText += t;
            controller.enqueue(
              encoder.encode(
                `event: token\ndata: ${JSON.stringify({ text: t })}\n\n`
              )
            );
          }
          if (chunk.type === "message_start") {
            tokensIn = chunk.message.usage.input_tokens;
          }
          if (chunk.type === "message_delta") {
            tokensOut = chunk.usage.output_tokens;
          }
        }

        let letter: any = null;
        try {
          const cleaned = fullText
            .replace(/```json\s*/g, "")
            .replace(/```\s*$/g, "")
            .trim();
          const start = cleaned.indexOf("{");
          const end = cleaned.lastIndexOf("}");
          const jsonStr =
            start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
          letter = JSON.parse(jsonStr);
        } catch {}

        if (letter?.letter_markdown && body.data.variant === "a") {
          const metadata = {
            tone: body.data.tone,
            length: body.data.length,
            word_count: letter.word_count,
            checks: letter.checks,
            alternate_opening: letter.alternate_opening,
            variant: body.data.variant,
          };
          const existing = await db.document.findFirst({
            where: {
              userId: user.id,
              applicationId: application.id,
              type: "cover_letter",
            },
          });
          const doc = existing
            ? await db.document.update({
                where: { id: existing.id },
                data: { content: letter.letter_markdown, metadata },
              })
            : await db.document.create({
                data: {
                  userId: user.id,
                  applicationId: application.id,
                  type: "cover_letter",
                  content: letter.letter_markdown,
                  metadata,
                },
              });

          controller.enqueue(
            encoder.encode(
              `event: done\ndata: ${JSON.stringify({
                documentId: doc.id,
                letter_markdown: letter.letter_markdown,
                word_count: letter.word_count,
                alternate_opening: letter.alternate_opening,
              })}\n\n`
            )
          );
        } else if (letter?.letter_markdown) {
          controller.enqueue(
            encoder.encode(
              `event: done\ndata: ${JSON.stringify({
                variant: "b",
                letter_markdown: letter.letter_markdown,
                word_count: letter.word_count,
                alternate_opening: letter.alternate_opening,
              })}\n\n`
            )
          );
        } else {
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({
                error: "AI returned invalid JSON",
                raw: fullText.slice(0, 500),
              })}\n\n`
            )
          );
        }

        await db.usageEvent.create({
          data: {
            userId: user.id,
            eventType: "ai_call",
            moduleName: "cover_letter",
            tokensUsed: tokensIn + tokensOut,
            costCents: Math.round(
              ((tokensIn * 3 + tokensOut * 15) / 1_000_000) * 100
            ),
          },
        });
      } catch (err: any) {
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({
              error: err?.message ?? String(err),
            })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(sse, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
