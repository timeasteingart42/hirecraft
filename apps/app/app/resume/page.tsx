"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Mode = "upload" | "paste";

export default function ResumePage() {
  const [mode, setMode] = useState<Mode>("upload");
  const [rawText, setRawText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function submitFile(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/resume/upload", { method: "POST", body: form });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Upload failed");
      setUploading(false);
      return;
    }
    const data = await res.json();
    setPreview(data?.extracted?.preview ?? null);
    setUploading(false);
  }

  async function submitPaste(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setUploading(true);
    const res = await fetch("/api/resume/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rawText, fileName: "resume.txt" }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Upload failed");
      setUploading(false);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-200 bg-paper">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-brand">
            ← Back to dashboard
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-widest text-brand mb-2">Resume</div>
          <h1 className="font-serif text-4xl tracking-tight mb-3">Your baseline resume</h1>
          <p className="text-neutral-500">
            Upload a PDF or DOCX, or paste the text. HireCraft uses this baseline to tailor every application.
          </p>
        </div>

        <div className="flex gap-2 mb-6 border-b border-neutral-200">
          <button
            onClick={() => setMode("upload")}
            className={`pb-3 -mb-px px-4 text-sm border-b-2 ${
              mode === "upload" ? "border-brand text-ink font-medium" : "border-transparent text-neutral-500"
            }`}
          >
            Upload file
          </button>
          <button
            onClick={() => setMode("paste")}
            className={`pb-3 -mb-px px-4 text-sm border-b-2 ${
              mode === "paste" ? "border-brand text-ink font-medium" : "border-transparent text-neutral-500"
            }`}
          >
            Paste text
          </button>
        </div>

        {mode === "upload" ? (
          <form onSubmit={submitFile} className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const f = e.dataTransfer.files?.[0];
                if (f) {
                  setFile(f);
                  setPreview(null);
                }
              }}
              className="p-12 border-2 border-dashed border-neutral-300 rounded text-center cursor-pointer hover:border-brand transition-colors"
            >
              {file ? (
                <>
                  <div className="font-medium">{file.name}</div>
                  <div className="text-sm text-neutral-500 mt-1">
                    {(file.size / 1024).toFixed(0)} KB · click to change
                  </div>
                </>
              ) : (
                <>
                  <div className="font-medium mb-1">Drop your resume here or click to browse</div>
                  <div className="text-sm text-neutral-500">
                    PDF, DOCX, or TXT · max 5 MB
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setFile(f);
                    setPreview(null);
                  }
                }}
                className="hidden"
              />
            </div>

            {error && (
              <div className="p-4 bg-status-skip/10 border border-status-skip/30 rounded text-sm">
                {error}
              </div>
            )}

            {preview ? (
              <div>
                <div className="p-5 border border-status-fit/40 bg-status-fit/5 rounded mb-3">
                  <div className="text-xs uppercase tracking-widest text-brand mb-2">
                    Extracted preview
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-xs text-neutral-700 max-h-48 overflow-y-auto">
                    {preview}
                    {preview.length >= 400 ? "..." : ""}
                  </pre>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="px-6 py-3 bg-brand text-paper rounded hover:bg-brand-dark transition-colors"
                  >
                    Looks good, go to dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                    }}
                    className="px-6 py-3 border border-neutral-200 rounded hover:border-brand hover:text-brand transition-colors"
                  >
                    Upload a different file
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="submit"
                disabled={!file || uploading}
                className="px-6 py-3 bg-brand text-paper rounded hover:bg-brand-dark disabled:opacity-40 transition-colors"
              >
                {uploading ? "Extracting..." : "Extract text"}
              </button>
            )}
          </form>
        ) : (
          <form onSubmit={submitPaste} className="space-y-4">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste your resume here..."
              className="w-full h-96 p-4 border border-neutral-200 rounded font-mono text-sm focus:outline-none focus:border-brand"
              required
            />
            {error && (
              <div className="p-4 bg-status-skip/10 border border-status-skip/30 rounded text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={uploading || rawText.length < 100}
              className="px-6 py-3 bg-brand text-paper rounded hover:bg-brand-dark disabled:opacity-40 transition-colors"
            >
              {uploading ? "Saving..." : "Save baseline"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
