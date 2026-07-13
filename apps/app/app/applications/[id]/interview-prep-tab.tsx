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

const TYPE_ACCENT: Record<Question["type"], string> = {
  competency: "border-l-status-fit",
  domain: "border-l-ink",
  fit: "border-l-status-strong",
  red_flag: "border-l-status-reach",
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
    <div className="space-y-8">
      <div className="card-inset p-6 flex items-center justify-between gap-4">
        <div>
          <div className="eyebrow mb-2">Interview prep</div>
          <p className="text-sm text-neutral-600 leading-relaxed max-w-xl">
            Questions tailored to this role and your background, with STAR
            scaffolds anchored in your profile.
          </p>
        </div>
        <button onClick={generate} disabled={generating} className="btn-primary shrink-0">
          {generating ? "Writing…" : prep ? "Regenerate" : "Generate prep"}
        </button>
      </div>

      {error && (
        <div className="card px-5 py-4 border-l-2 border-l-status-skip text-sm text-neutral-700">
          {error}
        </div>
      )}

      {prep && (
        <>
          <ol className="space-y-4">
            {prep.questions.map((q, i) => (
              <li
                key={i}
                className={`card p-6 border-l-2 ${TYPE_ACCENT[q.type]}`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <span className="chip-neutral shrink-0 mt-1">
                    {TYPE_LABEL[q.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-serif text-lg leading-snug mb-1">
                      <span className="text-neutral-400 mr-1 tabular-nums">
                        {String(i + 1).padStart(2, "0")}.
                      </span>
                      {q.question}
                    </div>
                    <div className="text-xs text-neutral-500 italic">
                      Why they ask · {q.why_they_ask}
                    </div>
                  </div>
                </div>

                <div className="pl-3 border-l border-neutral-200 space-y-2 text-sm">
                  <StarLine label="Situation" text={q.star_scaffold.situation} />
                  <StarLine label="Task" text={q.star_scaffold.task} />
                  <StarLine label="Action" text={q.star_scaffold.action} />
                  <StarLine label="Result" text={q.star_scaffold.result} />
                </div>

                {q.watch_out && (
                  <div className="mt-4 pt-4 border-t border-neutral-150 text-sm">
                    <span className="text-neutral-500 mr-2 text-xs uppercase tracking-widest">
                      Watch out
                    </span>
                    <span className="text-neutral-700">{q.watch_out}</span>
                  </div>
                )}
              </li>
            ))}
          </ol>

          {prep.curveball && (
            <div className="card p-8 border-l-2 border-l-ink">
              <div className="eyebrow mb-3">Curveball</div>
              <div className="font-serif text-xl leading-snug mb-3">
                {prep.curveball.question}
              </div>
              <p className="text-sm text-neutral-600 italic mb-4">
                {prep.curveball.why_it_matters}
              </p>
              <div className="text-sm text-neutral-700">
                <span className="text-xs uppercase tracking-widest text-neutral-500 mr-2">
                  Angle
                </span>
                {prep.curveball.suggested_angle}
              </div>
            </div>
          )}

          {prep.questions_to_ask_them && prep.questions_to_ask_them.length > 0 && (
            <div className="card p-6">
              <div className="eyebrow mb-4">Questions to ask them</div>
              <ol className="space-y-3 text-sm">
                {prep.questions_to_ask_them.map((q, i) => (
                  <li key={i} className="flex gap-3 leading-relaxed">
                    <span className="text-neutral-400 tabular-nums shrink-0">
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
    <div className="flex gap-3 leading-relaxed">
      <span className="text-xs uppercase tracking-widest text-neutral-500 shrink-0 w-[64px] pt-0.5">
        {label}
      </span>
      <span className="text-neutral-700">{text}</span>
    </div>
  );
}
