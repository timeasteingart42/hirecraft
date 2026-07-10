"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Tone = "formal-institutional" | "warm-professional" | "bold-thesis-driven";
type Length = "short" | "standard" | "long";

const PRESET_CHIPS: { label: string; instruction: string }[] = [
  { label: "Shorter", instruction: "Make it about 30% shorter without losing the strongest concrete details." },
  { label: "More formal", instruction: "Make it more formal: remove contractions, use measured phrasing." },
  { label: "More numbers", instruction: "Surface more metrics and concrete quantities from the profile." },
  { label: "Different opener", instruction: "Rewrite only the first paragraph with a different angle. Keep the rest intact." },
  { label: "Less generic", instruction: "Cut generic phrasing. Every sentence must contain a specific detail or claim." },
];

export function CoverLetterTab({
  applicationId,
  existing,
}: {
  applicationId: string;
  existing?: { id: string; content: string; metadata: any } | null;
}) {
  const [tone, setTone] = useState<Tone>("warm-professional");
  const [length, setLength] = useState<Length>("standard");
  const [generating, setGenerating] = useState(false);
  const [refining, setRefining] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [freeInstruction, setFreeInstruction] = useState("");
  const [draft, setDraft] = useState(existing?.content ?? "");
  const [dirty, setDirty] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setDraft(existing?.content ?? "");
    setDirty(false);
  }, [existing?.content]);

  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;

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

  async function refine(instruction: string, label: string) {
    if (!draft) return;
    setError(null);
    setRefining(label);
    const res = await fetch("/api/ai/cover-letter", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        applicationId,
        tone,
        length,
        refinementInstruction: instruction,
        previousDraft: draft,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Refinement failed");
      setRefining(null);
      return;
    }
    setRefining(null);
    setFreeInstruction("");
    router.refresh();
  }

  async function saveManualEdit() {
    if (!existing || !dirty) return;
    setError(null);
    setSaving(true);
    const res = await fetch(`/api/documents/${existing.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: draft }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Save failed");
      setSaving(false);
      return;
    }
    setSaving(false);
    setDirty(false);
    router.refresh();
  }

  function revertToServer() {
    setDraft(existing?.content ?? "");
    setDirty(false);
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
          disabled={generating || !!refining}
          className="px-6 py-2 bg-brand text-paper rounded hover:bg-brand-dark disabled:opacity-40 transition-colors"
        >
          {generating ? "Generating..." : existing ? "Regenerate from scratch" : "Generate cover letter"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-status-skip/10 border border-status-skip/30 rounded text-sm">
          {error}
        </div>
      )}

      {existing && (
        <>
          <div className="border border-neutral-200 rounded bg-white">
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-neutral-100">
              <div className="text-xs uppercase tracking-widest text-brand">
                Draft · {existing.metadata?.tone_used ?? existing.metadata?.tone} · {wordCount} words
                {dirty && (
                  <span className="ml-2 text-status-reach normal-case tracking-normal">
                    · edited (not saved)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                {dirty ? (
                  <>
                    <button
                      onClick={revertToServer}
                      className="px-3 py-1 text-neutral-500 hover:text-brand"
                    >
                      Revert
                    </button>
                    <button
                      onClick={saveManualEdit}
                      disabled={saving}
                      className="px-3 py-1 bg-ink text-paper rounded hover:opacity-90 disabled:opacity-40"
                    >
                      {saving ? "Saving..." : "Save edits"}
                    </button>
                  </>
                ) : (
                  <>
                    <a
                      href={`/api/documents/${existing.id}/export/docx`}
                      className="px-3 py-1 border border-neutral-300 rounded hover:border-brand hover:text-brand"
                    >
                      Download .docx
                    </a>
                    <a
                      href={`/api/documents/${existing.id}/export/txt`}
                      className="px-3 py-1 border border-neutral-300 rounded hover:border-brand hover:text-brand"
                    >
                      Download .txt
                    </a>
                  </>
                )}
              </div>
            </div>
            <textarea
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setDirty(e.target.value !== existing.content);
              }}
              className="w-full min-h-[500px] p-6 font-serif text-base leading-relaxed bg-transparent focus:outline-none resize-y"
              spellCheck={true}
            />
            {existing.metadata?.alternate_opening && (
              <div className="px-6 pb-6 pt-4 border-t border-neutral-100">
                <div className="text-xs uppercase tracking-widest text-neutral-500 mb-2">
                  Alternate opening
                </div>
                <div className="text-sm text-neutral-700 italic">
                  {existing.metadata.alternate_opening}
                </div>
              </div>
            )}
          </div>

          <div className="p-5 border border-neutral-200 rounded bg-neutral-50">
            <div className="text-xs uppercase tracking-widest text-neutral-500 mb-3">
              Refine with AI
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {PRESET_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => refine(chip.instruction, chip.label)}
                  disabled={!!refining || generating || dirty}
                  className="px-3 py-1.5 text-sm border border-neutral-300 rounded-full bg-white hover:border-brand hover:text-brand disabled:opacity-40 transition-colors"
                >
                  {refining === chip.label ? `${chip.label}...` : chip.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={freeInstruction}
                onChange={(e) => setFreeInstruction(e.target.value)}
                placeholder="Or type your own instruction: 'lead with Berlin experience'"
                className="flex-1 p-2 text-sm border border-neutral-200 rounded focus:outline-none focus:border-brand"
                disabled={!!refining || generating || dirty}
              />
              <button
                onClick={() => {
                  if (freeInstruction.trim()) refine(freeInstruction.trim(), "custom");
                }}
                disabled={!freeInstruction.trim() || !!refining || generating || dirty}
                className="px-4 py-2 text-sm bg-brand text-paper rounded hover:bg-brand-dark disabled:opacity-40 transition-colors"
              >
                {refining === "custom" ? "Refining..." : "Apply"}
              </button>
            </div>
            {dirty && (
              <div className="mt-3 text-xs text-neutral-500">
                Save or revert your manual edits before applying an AI refinement.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
