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
  red_flag: "Gap-probe",
};

const TYPE_STYLE: Record<Question["type"], string> = {
  competency: "bg-status-fit/10 text-status-fit border-status-fit/30",
  domain: "bg-brand/10 text-brand border-brand/30",
  fit: "bg-status-strong/10 text-status-strong border-status-strong/30",
  red_flag: "bg-status-reach/10 text-status-reach border-status-reach/30",
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
    <div className="space-y-6">
      <div className="p-6 border border-neutral-200 rounded bg-neutral-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-neutral-500 mb-1">
              Interview prep
            </div>
            <div className="text-sm text-neutral-600">
              Questions tailored to this role and your background, with STAR scaffolds and gap-probe warnings.
            </div>
          </div>
          <button
            onClick={generate}
            disabled={generating}
            className="px-6 py-2 bg-brand text-paper rounded hover:bg-brand-dark disabled:opacity-40 transition-colors whitespace-nowrap"
          >
            {generating ? "Generating..." : prep ? "Regenerate" : "Generate prep"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-status-skip/10 border border-status-skip/30 rounded text-sm">
          {error}
        </div>
      )}

      {prep && (
        <>
          <div className="space-y-4">
            {prep.questions.map((q, i) => (
              <div key={i} className="p-6 border border-neutral-200 rounded bg-white">
                <div className="flex items-start gap-3 mb-4">
                  <span
                    className={`text-xs uppercase tracking-widest px-2 py-1 border rounded ${TYPE_STYLE[q.type]}`}
                  >
                    {TYPE_LABEL[q.type]}
                  </span>
                  <div className="flex-1">
                    <div className="font-serif text-lg leading-snug mb-1">
                      Q{i + 1}. {q.question}
                    </div>
                    <div className="text-sm text-neutral-500 italic">
                      Why they ask: {q.why_they_ask}
                    </div>
                  </div>
                </div>

                <div className="pl-4 border-l-2 border-neutral-200 space-y-3 text-sm">
                  <StarLine label="Situation" text={q.star_scaffold.situation} />
                  <StarLine label="Task" text={q.star_scaffold.task} />
                  <StarLine label="Action" text={q.star_scaffold.action} />
                  <StarLine label="Result" text={q.star_scaffold.result} />
                </div>

                {q.watch_out && (
                  <div className="mt-4 p-3 bg-accent/10 border border-accent/30 rounded text-sm">
                    <span className="font-medium text-status-reach">Watch out:</span>{" "}
                    {q.watch_out}
                  </div>
                )}
              </div>
            ))}
          </div>

          {prep.curveball && (
            <div className="p-6 border-2 border-brand rounded bg-brand/5">
              <div className="text-xs uppercase tracking-widest text-brand mb-2">
                Curveball
              </div>
              <div className="font-serif text-lg mb-2">{prep.curveball.question}</div>
              <div className="text-sm text-neutral-600 italic mb-3">
                {prep.curveball.why_it_matters}
              </div>
              <div className="text-sm">
                <span className="font-medium">Suggested angle:</span>{" "}
                {prep.curveball.suggested_angle}
              </div>
            </div>
          )}

          {prep.questions_to_ask_them && prep.questions_to_ask_them.length > 0 && (
            <div className="p-6 border border-neutral-200 rounded bg-white">
              <div className="text-xs uppercase tracking-widest text-brand mb-3">
                Questions to ask them
              </div>
              <ul className="space-y-2 text-sm">
                {prep.questions_to_ask_them.map((q, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-neutral-400">{i + 1}.</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StarLine({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <span className="text-xs uppercase tracking-widest text-neutral-500 mr-2">
        {label}
      </span>
      <span>{text}</span>
    </div>
  );
}
