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
      <header className="border-b border-neutral-150 bg-paper/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between text-sm">
          <Link
            href="/dashboard"
            className="text-neutral-500 hover:text-ink transition-colors inline-flex items-center gap-1"
          >
            <span aria-hidden>←</span> Dashboard
          </Link>
          <Link
            href="/applications"
            className="text-neutral-500 hover:text-ink transition-colors"
          >
            All applications
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-12">
        <div className="mb-12 pb-8 border-b border-neutral-150">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="eyebrow mb-3">Application</div>
              <h1 className="font-serif text-4xl leading-tight mb-2 text-balance">
                {application.roleTitle}
              </h1>
              <div className="text-neutral-500">{application.organization}</div>
            </div>
            {application.matchTier && (
              <TierBadge
                tier={application.matchTier}
                score={application.matchScore}
              />
            )}
          </div>
        </div>

        <nav className="mb-14">
          <ul className="flex gap-8 text-sm border-b border-neutral-150">
            <Tab active label="Match insights" />
            <Tab active={!!coverLetter} label="Cover letter" />
            <Tab label="Resume (soon)" />
            <Tab active={!!interviewPrep} label="Interview prep" />
          </ul>
        </nav>

        <section className="mb-20">
          <SectionHeader kicker="Section 1" title="Match insights" />
          <MatchInsightsTab insights={application.matchInsights as any} />
        </section>

        <section className="mb-20">
          <SectionHeader kicker="Section 2" title="Cover letter" />
          <CoverLetterTab applicationId={application.id} existing={coverLetter as any} />
        </section>

        <section className="mb-8">
          <SectionHeader kicker="Section 3" title="Interview prep" />
          <InterviewPrepTab applicationId={application.id} existing={interviewPrep as any} />
        </section>
      </main>
    </div>
  );
}

function SectionHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-6">
      <div className="eyebrow mb-2">{kicker}</div>
      <h2 className="font-serif text-3xl">{title}</h2>
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
    <div className="shrink-0 text-right">
      <div className="eyebrow mb-2">Match</div>
      <div className="flex items-center gap-3 justify-end">
        <span className={map[tier] || "chip-neutral"}>{tier.replace("_", " ")}</span>
        {score !== null && (
          <span className="font-serif text-3xl tabular-nums">{score}</span>
        )}
      </div>
    </div>
  );
}

function Tab({ active, label }: { active?: boolean; label: string }) {
  return (
    <li
      className={`pb-3 -mb-px border-b transition-colors ${
        active
          ? "border-ink text-ink font-medium"
          : "border-transparent text-neutral-400"
      }`}
    >
      {label}
    </li>
  );
}
