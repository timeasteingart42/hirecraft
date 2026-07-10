import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/get-or-create-user";

const PatchSchema = z.object({
  content: z.string().min(1).max(20000),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = PatchSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.errors[0].message }, { status: 400 });
  }

  const doc = await db.document.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.document.update({
    where: { id: doc.id },
    data: {
      content: body.data.content,
      metadata: {
        ...((doc.metadata as any) ?? {}),
        word_count: body.data.content.split(/\s+/).filter(Boolean).length,
        manually_edited_at: new Date().toISOString(),
      },
    },
  });

  return NextResponse.json({ document: updated });
}
