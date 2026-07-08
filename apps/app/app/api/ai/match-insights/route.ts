import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callAI } from "@/lib/anthropic";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/get-or-create-user";
import { MATCH_INSIGHTS_SYSTEM_PROMPT } from "@/lib/prompts/match-insights";
import { assertAiQuota } from "@/lib/plan";

export const maxDuration = 60;

const BodySchema = z.object({
  jobPostingText: z.string().min(50, "Job posting is too short"),
  applicationId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = BodySchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: body.error.errors[0].message }, { status: 400 });
    }

    const baseline = await db.resumeBaseline.findUnique({ where: { userId: user.id } });
    if (!baseline) {
      return NextResponse.json(
        { error: "Upload a resume first at /resume" },
        { status: 400 }
      );
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

    const aiResult = await callAI({
      system: MATCH_INSIGHTS_SYSTEM_PROMPT,
      user: JSON.stringify({
        job_posting_text: body.data.jobPostingText,
        profile: baseline.content,
      }),
      maxTokens: 4000,
    });
    const { text, tokensIn, tokensOut } = aiResult;

    let insights: any;
    try {
      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*$/g, "").trim();
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      const jsonStr = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
      insights = JSON.parse(jsonStr);
    } catch (e) {
      return NextResponse.json(
        {
          error: "AI returned invalid JSON",
          raw: text.slice(0, 500),
          modelUsed: (aiResult as any).modelUsed,
          stopReason: (aiResult as any).stopReason,
          contentTypes: (aiResult as any).contentTypes,
          tokensOut,
        },
        { status: 502 }
      );
    }

    if (body.data.applicationId) {
      await db.application.update({
        where: { id: body.data.applicationId, userId: user.id },
        data: {
          matchTier: insights.tier,
          matchScore: insights.score,
          matchInsights: insights,
          roleTitle: insights.role_title || undefined,
          organization: insights.organization || undefined,
        },
      });
    }

    await db.usageEvent.create({
      data: {
        userId: user.id,
        eventType: "ai_call",
        moduleName: "match_insights",
        tokensUsed: tokensIn + tokensOut,
        costCents: Math.round(((tokensIn * 3 + tokensOut * 15) / 1_000_000) * 100),
      },
    });

    return NextResponse.json({ insights });
  } catch (err: any) {
    console.error("match-insights error:", err);
    return NextResponse.json(
      {
        error: "Server error",
        message: err?.message ?? String(err),
        name: err?.name ?? "unknown",
        stack: err?.stack?.split("\n").slice(0, 5) ?? [],
      },
      { status: 500 }
    );
  }
}
