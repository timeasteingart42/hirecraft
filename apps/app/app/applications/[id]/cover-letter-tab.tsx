"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tone = "formal-institutional" | "warm-professional" | "bold-thesis-driven";
type Length = "short" | "standard" | "long";

export function CoverLetterTab({
  applicationId,
  existing,
}: {
  applicationId: string;
  existing?: { content: string; metadata: any } | null;
}) {
  const [tone, setTone] = useState<Tone>("warm-professional");
  const [length, setLength] = useState<Length>("standard");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function generate() {
    setError(null);
    setGenerating(true);
    const res = await fetch("/api/ai/cover-letter", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ applicationId, tone, length }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to generate cover letter");
      setGenerating(false);
      return;
    }
    setGenerating(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="p-6 border border-neutral-200 rounded bg-neutral-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">
              Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as Tone)}
              className="w-full p-2 border border-neutral-200 rounded"
            >
              <option value="formal-institutional">Formal, institutional</option>
              <option value="warm-professional">Warm, professional</option>
              <option value="bold-thesis-driven">Bold, thesis-driven</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">
              Length
            </label>
            <select
              value={length}
              onChange={(e) => setLength(e.target.value as Length)}
              className="w-full p-2 border border-neutral-200 rounded"
            >
              <option value="short">Short (~250 words)</option>
              <option value="standard">Standard (~400 words)</option>
              <option value="long">Long (~550 words)</option>
            </select>
          </div>
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className="px-6 py-2 bg-brand text-paper rounded hover:bg-brand-dark disabled:opacity-40 transition-colors"
        >
          {generating ? "Generating..." : existing ? "Regenerate" : "Generate cover letter"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-status-skip/10 border border-status-skip/30 rounded text-sm">
          {error}
        </div>
      )}

      {existing && (
        <div className="p-8 border border-neutral-200 rounded bg-white">
          <div className="text-xs uppercase tracking-widest text-brand mb-4">
            Draft · {existing.metadata?.tone} · {existing.metadata?.word_count} words
          </div>
          <div className="prose max-w-none whitespace-pre-wrap font-serif text-base leading-relaxed">
            {existing.content}
          </div>
          {existing.metadata?.alternate_opening && (
            <div className="mt-8 pt-6 border-t border-neutral-200">
              <div className="text-xs uppercase tracking-widest text-neutral-500 mb-2">
                Alternate opening
              </div>
              <div className="text-sm text-neutral-700 italic">
                {existing.metadata.alternate_opening}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
