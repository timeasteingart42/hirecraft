import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/get-or-create-user";
import { CoverLetterTab } from "./cover-letter-tab";
import { MatchInsightsTab } from "./match-insights-tab";
import { InterviewPrepTab } from "./interview-prep-tab";

export const dynamic = "force-dynamic";

export default async function ApplicationDetail({
  params,
}: {
  params: { id: string };
}) {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const application = await db.application.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      documents: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!application) notFound();

  const coverLetter = application.documents.find((d) => d.type === "cover_letter");
  const interviewPrep = application.documents.find((d) => d.type === "interview_prep");

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-200 bg-paper">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-brand">
            ← Dashboard
          </Link>
          <Link href="/applications" className="text-sm hover:text-brand">
            All applications
          </Link>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-4xl tracking-tight mb-1">
                {application.roleTitle}
              </h1>
              <div className="text-neutral-500">{application.organization}</div>
            </div>
            {application.matchTier && (
              <div className="text-right">
                <div className="text-xs uppercase tracking-widest text-neutral-500 mb-1">
                  Match tier
                </div>
                <TierBadge tier={application.matchTier} score={application.matchScore} />
              </div>
            )}
          </div>
        </div>

        <div className="border-b border-neutral-200 mb-8">
          <div className="flex gap-6 text-sm">
            <Tab active label="Match insights" />
            <Tab active={!!coverLetter} label="Cover letter" />
            <Tab label="Resume (soon)" />
            <Tab active={!!interviewPrep} label="Interview prep" />
          </div>
        </div>

        <section className="mb-16">
          <h2 className="font-serif text-2xl mb-4">Match insights</h2>
          <MatchInsightsTab insights={application.matchInsights as any} />
        </section>

        <section className="mb-16">
          <h2 className="font-serif text-2xl mb-4">Cover letter</h2>
          <CoverLetterTab applicationId={application.id} existing={coverLetter as any} />
        </section>

        <section>
          <h2 className="font-serif text-2xl mb-4">Interview prep</h2>
          <InterviewPrepTab applicationId={application.id} existing={interviewPrep as any} />
        </section>
      </main>
    </div>
  );
}

function TierBadge({ tier, score }: { tier: string; score: number | null }) {
  const map: Record<string, string> = {
    STRONG_FIT: "chip-strong",
    FIT: "chip-fit",
    REACH: "chip-reach",
    SKIP: "chip-skip",
  };
  return (
    <div className="flex items-center gap-3">
      <span className={map[tier] || "chip"}>{tier.replace("_", " ")}</span>
      {score !== null && <span className="font-mono text-2xl">{score}</span>}
    </div>
  );
}

function Tab({ active, label }: { active?: boolean; label: string }) {
  return (
    <div
      className={`pb-3 -mb-px border-b-2 ${
        active
          ? "border-brand text-ink"
          : "border-transparent text-neutral-400"
      }`}
    >
      {label}
    </div>
  );
}
