"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const STAGES = [
  { at: 0, label: "Reading job posting" },
  { at: 3, label: "Extracting requirements" },
  { at: 7, label: "Matching your profile" },
  { at: 12, label: "Computing fit and score" },
  { at: 18, label: "Almost done" },
];

export default function NewApplication() {
  const [jobPostingText, setJobPostingText] = useState("");
  const [jobPostingUrl, setJobPostingUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!loading) return;
    const start = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, [loading]);

  const stageLabel =
    [...STAGES].reverse().find((s) => elapsed >= s.at)?.label ?? STAGES[0].label;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setElapsed(0);

    const insightsRes = await fetch("/api/ai/match-insights", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobPostingText }),
    });
    if (!insightsRes.ok) {
      const data = await insightsRes.json();
      setError(`Match analysis failed: ${data.error}`);
      setLoading(false);
      return;
    }
    const { insights } = await insightsRes.json();

    const createRes = await fetch("/api/applications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jobPostingText,
        jobPostingUrl,
        roleTitle: insights.role_title,
        organization: insights.organization,
        matchTier: insights.tier,
        matchScore: insights.score,
        matchInsights: insights,
      }),
    });
    if (!createRes.ok) {
      const data = await createRes.json();
      setError(data.error || "Failed to save application");
      setLoading(false);
      return;
    }
    const { application } = await createRes.json();
    router.push(`/applications/${application.id}`);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-150 bg-paper/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-8 py-4 flex items-center justify-between text-sm">
          <Link
            href="/dashboard"
            className="text-neutral-500 hover:text-ink transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-8 py-14">
        <div className="mb-10">
          <div className="eyebrow mb-3">New application</div>
          <h1 className="font-serif text-4xl leading-tight mb-3">
            Analyze a job posting
          </h1>
          <p className="text-neutral-500 leading-relaxed max-w-xl">
            Paste the full job posting. We compute your fit score and identify
            strengths, gaps, and the next step.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-8">
          <div>
            <label className="eyebrow block mb-2">Posting URL — optional</label>
            <input
              type="url"
              value={jobPostingUrl}
              onChange={(e) => setJobPostingUrl(e.target.value)}
              placeholder="https://…"
              className="field"
              disabled={loading}
            />
          </div>
          <div>
            <label className="eyebrow block mb-2">Full posting text</label>
            <textarea
              value={jobPostingText}
              onChange={(e) => setJobPostingText(e.target.value)}
              placeholder="Paste the entire posting: role, requirements, responsibilities, everything."
              className="w-full h-96 px-4 py-3 border border-neutral-200 rounded font-mono text-[13px] leading-relaxed bg-panel focus:outline-none focus:border-ink transition-colors"
              required
              disabled={loading}
              minLength={100}
            />
            <div className="mt-1.5 text-xs text-neutral-400 tabular-nums">
              {jobPostingText.length.toLocaleString()} chars
              {jobPostingText.length < 100 && jobPostingText.length > 0 && (
                <span className="ml-2 text-status-reach">
                  need at least 100 to analyze
                </span>
              )}
            </div>
          </div>

          {error && (
            <div className="text-sm text-status-skip animate-fade-in">
              {error}
            </div>
          )}

          <div className="flex items-center gap-5">
            <button
              type="submit"
              disabled={loading || jobPostingText.length < 100}
              className="btn-primary"
            >
              {loading ? "Analyzing…" : "Analyze fit"}
            </button>

            {loading && (
              <div className="flex items-center gap-3 text-sm animate-fade-in">
                <span className="inline-block w-2 h-2 bg-ink rounded-full animate-pulse" />
                <span className="text-neutral-600">{stageLabel}</span>
                <span className="text-neutral-400 tabular-nums text-xs">
                  {elapsed}s
                </span>
              </div>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
