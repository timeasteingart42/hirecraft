"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

type Draft = { text: string; wordCount?: number; alternateOpening?: string };

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
  const [drafts, setDrafts] = useState<{ a: Draft | null; b: Draft | null }>({
    a: existing
      ? {
          text: existing.content,
          wordCount: existing.metadata?.word_count,
          alternateOpening: existing.metadata?.alternate_opening,
        }
      : null,
    b: null,
  });
  const [activeDraft, setActiveDraft] = useState<"a" | "b">("a");
  const [dirty, setDirty] = useState(false);
  const draftRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  useEffect(() => {
    setDrafts({
      a: existing
        ? {
            text: existing.content,
            wordCount: existing.metadata?.word_count,
            alternateOpening: existing.metadata?.alternate_opening,
          }
        : null,
      b: null,
    });
    setActiveDraft("a");
    setDirty(false);
  }, [existing?.content]);

  const current = drafts[activeDraft];
  const wordCount = current?.text.trim()
    ? current.text.trim().split(/\s+/).length
    : 0;

  const streamGeneration = useCallback(
    async (params: {
      variant: "a" | "b";
      refinementInstruction?: string;
      previousDraft?: string;
      onStart: () => void;
      onEnd: () => void;
    }) => {
      params.onStart();
      setError(null);

      setDrafts((d) => ({
        ...d,
        [params.variant]: { text: "" },
      }));
      setActiveDraft(params.variant);
      setDirty(false);

      let liveText = "";

      try {
        const res = await fetch("/api/ai/cover-letter/stream", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            applicationId,
            tone,
            length,
            variant: params.variant,
            ...(params.refinementInstruction && {
              refinementInstruction: params.refinementInstruction,
              previousDraft: params.previousDraft,
            }),
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Generation failed");
          params.onEnd();
          return;
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let idx: number;
          while ((idx = buffer.indexOf("\n\n")) !== -1) {
            const event = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);

            const eventName = event.match(/^event: (.+)$/m)?.[1];
            const dataMatch = event.match(/^data: (.+)$/m);
            if (!dataMatch) continue;

            const payload = JSON.parse(dataMatch[1]);

            if (eventName === "token") {
              liveText += payload.text;
              const visibleText = extractStreamingBody(liveText);
              setDrafts((d) => ({
                ...d,
                [params.variant]: { text: visibleText || d[params.variant]?.text || "" },
              }));
            } else if (eventName === "done") {
              setDrafts((d) => ({
                ...d,
                [params.variant]: {
                  text: payload.letter_markdown,
                  wordCount: payload.word_count,
                  alternateOpening: payload.alternate_opening,
                },
              }));
              if (params.variant === "a") {
                router.refresh();
              }
            } else if (eventName === "error") {
              setError(payload.error || "Generation failed");
            }
          }
        }
      } catch (err: any) {
        setError(err?.message ?? "Streaming failed");
      } finally {
        params.onEnd();
      }
    },
    [applicationId, tone, length, router]
  );

  async function generate() {
    await streamGeneration({
      variant: "a",
      onStart: () => setGenerating(true),
      onEnd: () => setGenerating(false),
    });
  }

  async function generateAlternate() {
    if (!drafts.a) return;
    await streamGeneration({
      variant: "b",
      onStart: () => setGenerating(true),
      onEnd: () => setGenerating(false),
    });
  }

  async function refine(instruction: string, label: string) {
    const currentText = drafts[activeDraft]?.text;
    if (!currentText) return;
    await streamGeneration({
      variant: activeDraft,
      refinementInstruction: instruction,
      previousDraft: currentText,
      onStart: () => setRefining(label),
      onEnd: () => {
        setRefining(null);
        setFreeInstruction("");
      },
    });
  }

  async function saveManualEdit() {
    if (!existing || !dirty || activeDraft !== "a") return;
    setError(null);
    setSaving(true);
    const res = await fetch(`/api/documents/${existing.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: drafts.a?.text ?? "" }),
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
    setDrafts((d) => ({
      ...d,
      a: existing
        ? {
            text: existing.content,
            wordCount: existing.metadata?.word_count,
            alternateOpening: existing.metadata?.alternate_opening,
          }
        : null,
    }));
    setDirty(false);
  }

  function keepVariantB() {
    if (!drafts.b) return;
    setDrafts({
      a: drafts.b,
      b: null,
    });
    setActiveDraft("a");
    setDirty(true);
  }

  const busy = generating || !!refining;

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="card-inset p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="eyebrow block mb-2">Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as Tone)}
              className="field"
              disabled={busy}
            >
              <option value="formal-institutional">Formal, institutional</option>
              <option value="warm-professional">Warm, professional</option>
              <option value="bold-thesis-driven">Bold, thesis-driven</option>
            </select>
          </div>
          <div>
            <label className="eyebrow block mb-2">Length</label>
            <select
              value={length}
              onChange={(e) => setLength(e.target.value as Length)}
              className="field"
              disabled={busy}
            >
              <option value="short">Short · ~250 words</option>
              <option value="standard">Standard · ~400 words</option>
              <option value="long">Long · ~550 words</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={generate} disabled={busy} className="btn-primary">
            {generating && activeDraft === "a" && !refining
              ? "Writing…"
              : drafts.a
              ? "Regenerate from scratch"
              : "Generate cover letter"}
          </button>
          {drafts.a && (
            <button
              onClick={generateAlternate}
              disabled={busy}
              className="btn-secondary"
            >
              {generating && activeDraft === "b"
                ? "Writing alternate…"
                : drafts.b
                ? "Redraft alternate"
                : "Show alternate draft"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="card px-5 py-4 border-l-2 border-l-status-skip text-sm text-neutral-700 animate-fade-in">
          {error}
        </div>
      )}

      {/* Drafts */}
      {(drafts.a || drafts.b) && (
        <div className="space-y-4">
          {drafts.b && (
            <DraftSwitcher
              activeDraft={activeDraft}
              onChange={setActiveDraft}
              hasB={!!drafts.b}
            />
          )}

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-150 bg-neutral-50">
              <div className="flex items-center gap-4 text-sm">
                <span className="eyebrow">
                  Draft {activeDraft.toUpperCase()}
                </span>
                <span className="text-neutral-400">·</span>
                <span className="text-neutral-500 tabular-nums">
                  {wordCount} words
                </span>
                {dirty && activeDraft === "a" && (
                  <span className="text-status-reach text-xs">
                    · unsaved edits
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                {dirty && activeDraft === "a" ? (
                  <>
                    <button
                      onClick={revertToServer}
                      className="btn-ghost"
                      disabled={saving}
                    >
                      Revert
                    </button>
                    <button
                      onClick={saveManualEdit}
                      disabled={saving}
                      className="px-3 py-1.5 bg-ink text-paper rounded text-xs hover:bg-neutral-800 disabled:opacity-40 transition-colors"
                    >
                      {saving ? "Saving…" : "Save edits"}
                    </button>
                  </>
                ) : activeDraft === "b" && drafts.b ? (
                  <button
                    onClick={keepVariantB}
                    className="px-3 py-1.5 bg-ink text-paper rounded text-xs hover:bg-neutral-800 transition-colors"
                    disabled={busy}
                  >
                    Keep this draft
                  </button>
                ) : existing && activeDraft === "a" ? (
                  <>
                    <a
                      href={`/api/documents/${existing.id}/export/docx`}
                      className="btn-ghost"
                    >
                      .docx
                    </a>
                    <a
                      href={`/api/documents/${existing.id}/export/txt`}
                      className="btn-ghost"
                    >
                      .txt
                    </a>
                    <CopyButton text={drafts.a?.text ?? ""} />
                  </>
                ) : null}
              </div>
            </div>

            <textarea
              ref={draftRef}
              value={current?.text ?? ""}
              onChange={(e) => {
                if (activeDraft !== "a") return;
                setDrafts((d) => ({
                  ...d,
                  a: { ...(d.a ?? { text: "" }), text: e.target.value },
                }));
                setDirty(e.target.value !== existing?.content);
              }}
              readOnly={activeDraft === "b" || busy}
              className={`w-full min-h-[520px] px-8 py-8 font-serif text-[15.5px] leading-[1.75] bg-panel focus:outline-none resize-y ${
                busy && current?.text?.length ? "stream-caret" : ""
              }`}
              spellCheck
              placeholder="Your cover letter will appear here…"
            />

            {current?.alternateOpening && !busy && (
              <div className="px-8 pb-7 pt-4 border-t border-neutral-150 bg-neutral-50">
                <div className="eyebrow mb-2">Alternate opening</div>
                <p className="text-sm text-neutral-600 italic leading-relaxed">
                  {current.alternateOpening}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Refinement */}
      {drafts.a && (
        <div className="card-inset p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="eyebrow">Refine with AI</div>
            {activeDraft === "b" && (
              <div className="text-xs text-neutral-500 italic">
                Refinements apply to the active draft
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {PRESET_CHIPS.map((chip) => (
              <button
                key={chip.label}
                onClick={() => refine(chip.instruction, chip.label)}
                disabled={busy || dirty}
                className="btn-refine"
              >
                {refining === chip.label ? (
                  <span className="text-neutral-500">{chip.label}…</span>
                ) : (
                  chip.label
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={freeInstruction}
              onChange={(e) => setFreeInstruction(e.target.value)}
              placeholder="Or type: 'lead with Berlin experience'"
              className="field flex-1"
              disabled={busy || dirty}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  freeInstruction.trim() &&
                  !busy &&
                  !dirty
                ) {
                  refine(freeInstruction.trim(), "custom");
                }
              }}
            />
            <button
              onClick={() => {
                if (freeInstruction.trim()) {
                  refine(freeInstruction.trim(), "custom");
                }
              }}
              disabled={!freeInstruction.trim() || busy || dirty}
              className="btn-primary"
            >
              {refining === "custom" ? "Refining…" : "Apply"}
            </button>
          </div>
          {dirty && (
            <div className="mt-3 text-xs text-neutral-500">
              Save or revert your manual edits before applying an AI refinement.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DraftSwitcher({
  activeDraft,
  onChange,
  hasB,
}: {
  activeDraft: "a" | "b";
  onChange: (d: "a" | "b") => void;
  hasB: boolean;
}) {
  return (
    <div className="inline-flex p-1 bg-neutral-100 rounded-lg text-sm">
      <button
        onClick={() => onChange("a")}
        className={`px-4 py-1.5 rounded transition-colors ${
          activeDraft === "a"
            ? "bg-panel text-ink shadow-sm"
            : "text-neutral-500 hover:text-ink"
        }`}
      >
        Draft A
      </button>
      <button
        onClick={() => onChange("b")}
        disabled={!hasB}
        className={`px-4 py-1.5 rounded transition-colors ${
          activeDraft === "b"
            ? "bg-panel text-ink shadow-sm"
            : "text-neutral-500 hover:text-ink disabled:opacity-40 disabled:hover:text-neutral-500"
        }`}
      >
        Draft B
      </button>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className="btn-ghost"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// Best-effort extraction of the letter body while streaming JSON.
// The model returns a JSON blob; we surface letter_markdown live even before the close brace.
function extractStreamingBody(raw: string): string {
  const key = '"letter_markdown"';
  const keyIdx = raw.indexOf(key);
  if (keyIdx < 0) return "";
  const afterKey = raw.slice(keyIdx + key.length);
  const colonIdx = afterKey.indexOf(":");
  if (colonIdx < 0) return "";
  const afterColon = afterKey.slice(colonIdx + 1).trimStart();
  if (!afterColon.startsWith('"')) return "";
  const start = 1;
  let out = "";
  let i = start;
  while (i < afterColon.length) {
    const ch = afterColon[i];
    if (ch === "\\" && i + 1 < afterColon.length) {
      const next = afterColon[i + 1];
      if (next === "n") out += "\n";
      else if (next === "t") out += "\t";
      else if (next === '"') out += '"';
      else if (next === "\\") out += "\\";
      else if (next === "r") {}
      else out += next;
      i += 2;
      continue;
    }
    if (ch === '"') break;
    out += ch;
    i++;
  }
  return out;
}
