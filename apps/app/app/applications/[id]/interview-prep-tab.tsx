"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Question = {
  type: "competency" | "domain" | "fit" | "red_flag";
  question: string;
  why_they_ask: string;
  star_scaffold: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  watch_out: string;
};

type Prep = {
  questions: Question[];
  curveball?: {
    question: string;
    why_it_matters: string;
    suggested_angle: string;
  };
  questions_to_ask_them?: string[];
};

const TYPE_LABEL: Record<Question["type"], string> = {
  competency: "Behavioural",
  domain: "Domain",
  fit: "Fit",
  red_flag: "Gap probe",
};

export function InterviewPrepTab({
  applicationId,
  existing,
}: {
  applicationId: string;
  existing?: { id: string; content: string; metadata: any } | null;
}) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const router = useRouter();

  const prep: Prep | null = existing?.content
    ? (() => {
        try {
          return JSON.parse(existing.content) as Prep;
        } catch {
          return null;
        }
      })()
    : null;

  async function generate() {
    setError(null);
    setGenerating(true);
    const res = await fetch("/api/ai/interview-prep", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ applicationId }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to generate interview prep");
      setGenerating(false);
      return;
    }
    setGenerating(false);
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between">
        <p className="text-sm text-neutral-600 max-w-xl leading-relaxed">
          Questions tailored to this role, with STAR scaffolds anchored in your profile.
        </p>
        <button onClick={generate} disabled={generating} className="btn-primary shrink-0">
          {generating ? "Writing…" : prep ? "Regenerate" : "Generate prep"}
        </button>
      </div>

      {error && (
        <div className="text-sm text-status-skip">{error}</div>
      )}

      {prep && (
        <>
          <ol className="border-t border-neutral-200">
            {prep.questions.map((q, i) => {
              const open = openIndex === i;
              return (
                <li key={i} className="border-b border-neutral-200">
                  <button
                    onClick={() => setOpenIndex(open ? null : i)}
                    className="w-full text-left py-6 group"
                  >
                    <div className="flex items-start gap-6">
                      <span className="text-xs text-neutral-400 tabular-nums font-mono shrink-0 pt-1.5">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-3 mb-1">
                          <span className="eyebrow">{TYPE_LABEL[q.type]}</span>
                        </div>
                        <div className="font-serif text-lg leading-snug text-ink group-hover:opacity-80 transition-opacity">
                          {q.question}
                        </div>
                      </div>
                      <span className="shrink-0 text-neutral-400 pt-1.5 text-sm">
                        {open ? "−" : "+"}
                      </span>
                    </div>
                  </button>

                  {open && (
                    <div className="pl-14 pr-2 pb-8 animate-fade-in">
                      <p className="text-sm text-neutral-500 italic mb-5">
                        Why they ask · {q.why_they_ask}
                      </p>

                      <div className="space-y-3 mb-6">
                        <StarLine label="Situation" text={q.star_scaffold.situation} />
                        <StarLine label="Task" text={q.star_scaffold.task} />
                        <StarLine label="Action" text={q.star_scaffold.action} />
                        <StarLine label="Result" text={q.star_scaffold.result} />
                      </div>

                      {q.watch_out && (
                        <div className="text-sm text-neutral-700 pt-4 border-t border-neutral-100">
                          <span className="eyebrow mr-3">Watch out</span>
                          {q.watch_out}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          {prep.curveball && (
            <div className="pt-4">
              <div className="eyebrow mb-3">Curveball</div>
              <div className="font-serif text-2xl leading-snug mb-4 max-w-2xl">
                {prep.curveball.question}
              </div>
              <p className="text-sm text-neutral-500 italic mb-4">
                {prep.curveball.why_it_matters}
              </p>
              <p className="text-sm text-neutral-700 leading-relaxed max-w-2xl">
                <span className="eyebrow mr-3">Angle</span>
                {prep.curveball.suggested_angle}
              </p>
            </div>
          )}

          {prep.questions_to_ask_them && prep.questions_to_ask_them.length > 0 && (
            <div className="pt-6 border-t border-neutral-200">
              <div className="eyebrow mb-4">Questions to ask them</div>
              <ol className="space-y-3 text-sm max-w-2xl">
                {prep.questions_to_ask_them.map((q, i) => (
                  <li key={i} className="flex gap-4 leading-relaxed">
                    <span className="text-neutral-400 tabular-nums font-mono shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-neutral-700">{q}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StarLine({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex gap-4 leading-relaxed text-sm">
      <span className="eyebrow shrink-0 w-[70px] pt-0.5">{label}</span>
      <span className="text-neutral-700">{text}</span>
    </div>
  );
}
