import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/get-or-create-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const JsonBodySchema = z.object({
  rawText: z.string().min(100, "Resume text is too short"),
  fileName: z.string().optional(),
});

const MAX_FILE_BYTES = 5 * 1024 * 1024;

async function extractDocx(buf: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer: buf });
  return result.value;
}

async function extractPdf(buf: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const result = await pdfParse(buf);
  return result.text;
}

export async function POST(req: NextRequest) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = req.headers.get("content-type") || "";
  let rawText = "";
  let fileName: string | undefined;

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof Blob)) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: `File too large. Max ${MAX_FILE_BYTES / 1024 / 1024} MB.` },
          { status: 413 }
        );
      }
      fileName = (file as File).name || "resume";
      const buf = Buffer.from(await file.arrayBuffer());
      const lowerName = fileName.toLowerCase();
      if (lowerName.endsWith(".docx")) {
        rawText = await extractDocx(buf);
      } else if (lowerName.endsWith(".pdf")) {
        rawText = await extractPdf(buf);
      } else if (lowerName.endsWith(".txt")) {
        rawText = buf.toString("utf-8");
      } else {
        return NextResponse.json(
          { error: "Unsupported file type. Use .pdf, .docx, or .txt." },
          { status: 415 }
        );
      }
    } else {
      const body = JsonBodySchema.safeParse(await req.json());
      if (!body.success) {
        return NextResponse.json({ error: body.error.errors[0].message }, { status: 400 });
      }
      rawText = body.data.rawText;
      fileName = body.data.fileName;
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: `Could not read file: ${err?.message ?? String(err)}` },
      { status: 400 }
    );
  }

  rawText = rawText.replace(/\r\n/g, "\n").trim();
  if (rawText.length < 100) {
    return NextResponse.json(
      { error: "Resume text is too short after extraction. Try pasting the text directly." },
      { status: 400 }
    );
  }

  const content = {
    raw_summary: rawText.slice(0, 500),
    full_length: rawText.length,
  };

  const baseline = await db.resumeBaseline.upsert({
    where: { userId: user.id },
    update: {
      rawText,
      fileName,
      content,
      updatedAt: new Date(),
    },
    create: {
      userId: user.id,
      rawText,
      fileName,
      content,
    },
  });

  return NextResponse.json({
    baseline,
    extracted: {
      chars: rawText.length,
      preview: rawText.slice(0, 400),
    },
  });
}
