import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callAI } from "@/lib/anthropic";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/get-or-create-user";
import { INTERVIEW_PREP_SYSTEM_PROMPT } from "@/lib/prompts/interview-prep";
import { assertAiQuota } from "@/lib/plan";

export const maxDuration = 60;

const BodySchema = z.object({
  applicationId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
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

    const baseline = await db.resumeBaseline.findUnique({ where: { userId: user.id } });
    if (!baseline) {
      return NextResponse.json({ error: "Upload a resume first" }, { status: 400 });
    }

    const quota = await assertAiQuota(user.id, user.plan);
    if (!quota.ok) {
      return NextResponse.json(
        {
          error: `Monthly limit reached on the ${quota.plan} plan (${quota.used}/${quota.limit}). Upgrade to Pro for unlimited.`,
          code: "QUOTA_EXCEEDED",
          used: quota.used,
          limit: quota.limit,
        },
        { status: 402 }
      );
    }

    const { text, tokensIn, tokensOut } = await callAI({
      system: INTERVIEW_PREP_SYSTEM_PROMPT,
      user: JSON.stringify({
        job_posting_text: application.jobPostingText,
        match_insights: application.matchInsights,
        profile: baseline.content,
      }),
      maxTokens: 4000,
    });

    let prep: any;
    try {
      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*$/g, "").trim();
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      const jsonStr = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
      prep = JSON.parse(jsonStr);
    } catch (e) {
      return NextResponse.json(
        { error: "AI returned invalid JSON", raw: text.slice(0, 500) },
        { status: 502 }
      );
    }

    const existing = await db.document.findFirst({
      where: {
        userId: user.id,
        applicationId: application.id,
        type: "interview_prep",
      },
    });

    const metadata = {
      question_count: prep.questions?.length ?? 0,
    };

    const doc = existing
      ? await db.document.update({
          where: { id: existing.id },
          data: { content: JSON.stringify(prep), metadata },
        })
      : await db.document.create({
          data: {
            userId: user.id,
            applicationId: application.id,
            type: "interview_prep",
            content: JSON.stringify(prep),
            metadata,
          },
        });

    await db.usageEvent.create({
      data: {
        userId: user.id,
        eventType: "ai_call",
        moduleName: "interview_prep",
        tokensUsed: tokensIn + tokensOut,
        costCents: Math.round(((tokensIn * 3 + tokensOut * 15) / 1_000_000) * 100),
      },
    });

    return NextResponse.json({ document: doc, prep });
  } catch (err: any) {
    console.error("interview-prep error:", err);
    return NextResponse.json(
      {
        error: "Server error",
        message: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
