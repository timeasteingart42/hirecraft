"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewApplication() {
  const [jobPostingText, setJobPostingText] = useState("");
  const [jobPostingUrl, setJobPostingUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

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
      <header className="border-b border-neutral-200 bg-paper">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-brand">
            ← Back to dashboard
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-widest text-brand mb-2">
            New application
          </div>
          <h1 className="font-serif text-4xl tracking-tight mb-3">
            Analyze a job posting
          </h1>
          <p className="text-neutral-500">
            Paste the full job posting. We compute your fit score and identify strengths and gaps.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Job posting URL (optional)
            </label>
            <input
              type="url"
              value={jobPostingUrl}
              onChange={(e) => setJobPostingUrl(e.target.value)}
              placeholder="https://..."
              className="w-full p-3 border border-neutral-200 rounded focus:outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Full job posting text
            </label>
            <textarea
              value={jobPostingText}
              onChange={(e) => setJobPostingText(e.target.value)}
              placeholder="Paste the entire job posting: role, requirements, responsibilities, everything..."
              className="w-full h-96 p-4 border border-neutral-200 rounded font-mono text-sm focus:outline-none focus:border-brand"
              required
            />
          </div>
          {error && (
            <div className="p-4 bg-status-skip/10 border border-status-skip/30 rounded text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || jobPostingText.length < 100}
            className="px-6 py-3 bg-brand text-paper rounded hover:bg-brand-dark disabled:opacity-40 transition-colors"
          >
            {loading ? "Analyzing..." : "Analyze fit"}
          </button>
        </form>
      </main>
    </div>
  );
}
