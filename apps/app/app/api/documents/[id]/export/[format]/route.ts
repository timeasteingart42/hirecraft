import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/get-or-create-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; format: string } }
) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doc = await db.document.findFirst({
    where: { id: params.id, userId: user.id },
    include: { application: true },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const filenameBase = [doc.application?.roleTitle, doc.application?.organization, "cover-letter"]
    .filter(Boolean)
    .join(" - ")
    .replace(/[^A-Za-z0-9\- ]+/g, "")
    .slice(0, 80) || "cover-letter";

  if (params.format === "txt") {
    return new NextResponse(doc.content, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "content-disposition": `attachment; filename="${filenameBase}.txt"`,
      },
    });
  }

  if (params.format === "docx") {
    const { Document, Packer, Paragraph, TextRun } = await import("docx");

    const paragraphs = doc.content
      .split(/\n\n+/)
      .map(
        (para) =>
          new Paragraph({
            children: [new TextRun({ text: para.replace(/\n/g, " ").trim() })],
            spacing: { after: 200 },
          })
      );

    const docx = new Document({
      styles: {
        default: {
          document: {
            run: { font: "Times New Roman", size: 24 },
          },
        },
      },
      sections: [{ children: paragraphs }],
    });

    const buffer = await Packer.toBuffer(docx);
    return new NextResponse(buffer, {
      headers: {
        "content-type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "content-disposition": `attachment; filename="${filenameBase}.docx"`,
      },
    });
  }

  return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
}
