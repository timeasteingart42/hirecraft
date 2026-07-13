import Link from "next/link";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/get-or-create-user";
import { getUsageThisMonth, planFor } from "@/lib/plan";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const baseline = await db.resumeBaseline.findUnique({ where: { userId: user.id } });
  const plan = planFor(user.plan);
  const usageThisMonth = await getUsageThisMonth(user.id);
  const applications = await db.application.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const stats = {
    total: await db.application.count({ where: { userId: user.id } }),
    active: await db.application.count({
      where: { userId: user.id, status: { in: ["draft", "submitted", "interview"] } },
    }),
    strong: await db.application.count({
      where: { userId: user.id, matchTier: "STRONG_FIT" },
    }),
  };

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="max-w-5xl mx-auto px-8 py-14">
        <header className="flex items-end justify-between mb-16 pb-6 border-b border-neutral-150">
          <div>
            <div className="eyebrow mb-3">Dashboard</div>
            <h1 className="font-serif text-4xl">
              Welcome{user.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}.
            </h1>
          </div>
          <Link href="/applications/new" className="btn-primary">
            New application
          </Link>
        </header>

        {!baseline && (
          <div className="mb-12 p-6 border-l-2 border-accent bg-accent/5 rounded-r animate-fade-in">
            <div className="font-medium text-ink mb-1">Upload your resume first.</div>
            <p className="text-sm text-neutral-600 mb-3">
              HireCraft tailors every application against your baseline. One minute.
            </p>
            <Link href="/resume" className="text-sm text-ink underline underline-offset-4 hover:text-neutral-600">
              Upload now
            </Link>
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-150 border border-neutral-150 rounded-lg overflow-hidden mb-14">
          <Stat label="Total" value={stats.total} sub="applications" />
          <Stat label="Active" value={stats.active} sub="in progress" />
          <Stat label="Strong fits" value={stats.strong} sub="ready to apply" />
        </section>

        <section className="mb-14">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-serif text-2xl">Recent applications</h2>
            <Link href="/applications" className="text-sm text-neutral-500 hover:text-ink transition-colors">
              View all →
            </Link>
          </div>
          {applications.length === 0 ? (
            <div className="p-12 border border-neutral-150 rounded-lg text-center bg-panel">
              <div className="text-neutral-500 mb-1">Nothing here yet.</div>
              <Link href="/applications/new" className="text-sm text-ink underline underline-offset-4">
                Analyze your first job posting
              </Link>
            </div>
          ) : (
            <ul className="border border-neutral-150 rounded-lg overflow-hidden bg-panel divide-y divide-neutral-150">
              {applications.map((app) => (
                <li key={app.id}>
                  <Link
                    href={`/applications/${app.id}`}
                    className="flex items-center justify-between px-6 py-5 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{app.roleTitle}</div>
                      <div className="text-sm text-neutral-500 truncate">
                        {app.organization}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {app.matchTier && <TierChip tier={app.matchTier} />}
                      <StatusChip status={app.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 border border-neutral-150 rounded-lg bg-panel">
          <div>
            <div className="eyebrow mb-1.5">Current plan</div>
            <div className="text-sm">
              <span className="font-medium">{plan.name}</span>
              {plan.monthlyAiCalls !== null && (
                <span className="text-neutral-500 ml-2">
                  {usageThisMonth} / {plan.monthlyAiCalls} AI calls this month
                </span>
              )}
              {plan.monthlyAiCalls === null && (
                <span className="text-neutral-500 ml-2">unlimited</span>
              )}
            </div>
          </div>
          {plan.id === "free" ? (
            <Link href="/pricing" className="btn-primary">
              Upgrade to Pro
            </Link>
          ) : (
            <form action="/api/stripe/portal" method="POST">
              <button type="submit" className="btn-secondary">
                Manage billing
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

function TopBar() {
  return (
    <header className="border-b border-neutral-150 bg-paper/95 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="font-serif text-xl tracking-tight">
          HireCraft
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-neutral-500">
          <Link href="/dashboard" className="hover:text-ink transition-colors">
            Dashboard
          </Link>
          <Link href="/applications" className="hover:text-ink transition-colors">
            Applications
          </Link>
          <Link href="/resume" className="hover:text-ink transition-colors">
            Resume
          </Link>
        </nav>
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="bg-panel p-7">
      <div className="eyebrow mb-3">{label}</div>
      <div className="font-serif text-4xl mb-1 tabular-nums">{value}</div>
      <div className="text-xs text-neutral-400">{sub}</div>
    </div>
  );
}

function TierChip({ tier }: { tier: string }) {
  const map: Record<string, string> = {
    STRONG_FIT: "chip-strong",
    FIT: "chip-fit",
    REACH: "chip-reach",
    SKIP: "chip-skip",
  };
  return <span className={map[tier] || "chip-neutral"}>{tier.replace("_", " ")}</span>;
}

function StatusChip({ status }: { status: string }) {
  return <span className="chip-neutral">{status}</span>;
}
