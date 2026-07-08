import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/get-or-create-user";

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const applications = await db.application.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ applications });
}

const CreateSchema = z.object({
  jobPostingText: z.string().min(50),
  jobPostingUrl: z.string().url().optional().or(z.literal("")),
  roleTitle: z.string().optional(),
  organization: z.string().optional(),
  matchTier: z.string().optional(),
  matchScore: z.number().int().optional(),
  matchInsights: z.any().optional(),
});

export async function POST(req: NextRequest) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = CreateSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.errors[0].message }, { status: 400 });
  }

  const application = await db.application.create({
    data: {
      userId: user.id,
      jobPostingText: body.data.jobPostingText,
      jobPostingUrl: body.data.jobPostingUrl || null,
      roleTitle: body.data.roleTitle || "Untitled role",
      organization: body.data.organization || "Unknown organization",
      matchTier: body.data.matchTier ?? null,
      matchScore: body.data.matchScore ?? null,
      matchInsights: body.data.matchInsights ?? undefined,
      status: "draft",
      statusHistory: [
        {
          date: new Date().toISOString(),
          status: "draft",
          note: "Application created",
        },
      ],
    },
  });

  return NextResponse.json({ application });
}
