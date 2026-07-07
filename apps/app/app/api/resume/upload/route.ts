import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/get-or-create-user";

const BodySchema = z.object({
  rawText: z.string().min(100, "Resume text is too short"),
  fileName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = BodySchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.errors[0].message }, { status: 400 });
  }

  const content = {
    raw_summary: body.data.rawText.slice(0, 500),
    full_length: body.data.rawText.length,
  };

  const baseline = await db.resumeBaseline.upsert({
    where: { userId: user.id },
    update: {
      rawText: body.data.rawText,
      fileName: body.data.fileName,
      content,
      updatedAt: new Date(),
    },
    create: {
      userId: user.id,
      rawText: body.data.rawText,
      fileName: body.data.fileName,
      content,
    },
  });

  return NextResponse.json({ baseline });
}
