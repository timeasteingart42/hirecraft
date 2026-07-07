"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ResumePage() {
  const [rawText, setRawText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
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
            Paste your resume text below. HireCraft uses this baseline to tailor every application.
            You can update it any time.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
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
      </main>
    </div>
  );
}
