import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callAI, SONNET_MODEL } from "@/lib/anthropic";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/get-or-create-user";
import { assertAiQuota } from "@/lib/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BodySchema = z.object({
  applicationId: z.string(),
  fragment: z.string().min(3).max(3000),
  instruction: z.string().min(2).max(500),
  fullDraft: z.string().min(50).max(6000),
});

const SYSTEM = `You rewrite a SINGLE FRAGMENT of a cover letter based on an instruction. The rest of the letter stays untouched.

RULES:
- Return ONLY the rewritten fragment. No preamble, no quotes around it, no JSON.
- Preserve the candidate's voice from the surrounding letter.
- Follow the same fact discipline as the original: only use verifiable profile achievements.
- Do NOT introduce em dashes. Use periods.
- Never use these AI-tells: "I am excited", "I am passionate", "As a [role]", "In today's world", "cutting edge", "leverage", "synergize", "spearhead" (unless already in the profile).
- Match the length of the fragment approximately unless the instruction explicitly asks for shorter or longer.
- If the fragment is a full paragraph, return a paragraph. If a sentence, return a sentence.
- Every claim must be traceable to the profile or the full draft context.

INPUT (JSON in user message):
- fragment: the selected text to rewrite
- instruction: what to change (e.g. "shorter", "more numbers", "less generic")
- full_draft: the complete letter for context (do NOT rewrite anything but the fragment)
- profile: the candidate's resume

OUTPUT: plain text of the rewritten fragment only.`;

export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = BodySchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json(
        { error: body.error.errors[0].message },
        { status: 400 }
      );
    }

    const application = await db.application.findFirst({
      where: { id: body.data.applicationId, userId: user.id },
    });
    if (!application) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const baseline = await db.resumeBaseline.findUnique({
      where: { userId: user.id },
    });
    if (!baseline) {
      return NextResponse.json(
        { error: "Upload a resume first" },
        { status: 400 }
      );
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

    const { text, tokensIn, tokensOut } = await callAI({
      system: SYSTEM,
      user: JSON.stringify({
        fragment: body.data.fragment,
        instruction: body.data.instruction,
        full_draft: body.data.fullDraft,
        profile: baseline.rawText,
      }),
      maxTokens: 800,
      model: SONNET_MODEL,
    });

    const rewritten = text.trim().replace(/^["']|["']$/g, "");

    await db.usageEvent.create({
      data: {
        userId: user.id,
        eventType: "ai_call",
        moduleName: "cover_letter_refine_fragment",
        tokensUsed: tokensIn + tokensOut,
        costCents: Math.round(
          ((tokensIn * 3 + tokensOut * 15) / 1_000_000) * 100
        ),
      },
    });

    return NextResponse.json({ rewritten });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
