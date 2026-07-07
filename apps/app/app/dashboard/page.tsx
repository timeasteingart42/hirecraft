import Link from "next/link";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/get-or-create-user";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const baseline = await db.resumeBaseline.findUnique({ where: { userId: user.id } });
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
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="text-xs uppercase tracking-widest text-brand mb-1">
              Dashboard
            </div>
            <h1 className="font-serif text-4xl tracking-tight">
              Welcome{user.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}.
            </h1>
          </div>
          <Link
            href="/applications/new"
            className="px-4 py-2 bg-brand text-paper rounded hover:bg-brand-dark transition-colors"
          >
            New application
          </Link>
        </div>

        {!baseline && (
          <div className="mb-10 p-6 border border-accent bg-accent/10 rounded">
            <div className="font-medium mb-1">Upload your resume first.</div>
            <p className="text-sm text-neutral-700 mb-3">
              HireCraft needs your baseline resume to tailor every application. Takes one minute.
            </p>
            <Link href="/resume" className="text-sm underline hover:text-brand">
              Upload now →
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Stat label="Total applications" value={stats.total} />
          <Stat label="Active" value={stats.active} />
          <Stat label="Strong fits" value={stats.strong} />
        </div>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-2xl tracking-tight">Recent applications</h2>
            <Link href="/applications" className="text-sm text-brand hover:underline">
              View all →
            </Link>
          </div>
          {applications.length === 0 ? (
            <div className="p-8 border border-neutral-200 rounded text-center text-neutral-500">
              No applications yet.{" "}
              <Link href="/applications/new" className="text-brand hover:underline">
                Create your first
              </Link>
              .
            </div>
          ) : (
            <div className="border border-neutral-200 rounded overflow-hidden">
              {applications.map((app) => (
                <Link
                  key={app.id}
                  href={`/applications/${app.id}`}
                  className="block px-6 py-4 border-b border-neutral-200 last:border-b-0 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{app.roleTitle}</div>
                      <div className="text-sm text-neutral-500">{app.organization}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {app.matchTier && <TierChip tier={app.matchTier} />}
                      <StatusChip status={app.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function TopBar() {
  return (
    <header className="border-b border-neutral-200 bg-paper">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="font-serif text-2xl tracking-tight">
          HireCraft
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/dashboard" className="hover:text-brand">
            Dashboard
          </Link>
          <Link href="/applications" className="hover:text-brand">
            Applications
          </Link>
          <Link href="/resume" className="hover:text-brand">
            Resume
          </Link>
        </nav>
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-6 border border-neutral-200 rounded bg-neutral-50">
      <div className="text-xs uppercase tracking-widest text-neutral-500 mb-2">
        {label}
      </div>
      <div className="font-serif text-4xl">{value}</div>
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
  return <span className={map[tier] || "chip"}>{tier.replace("_", " ")}</span>;
}

function StatusChip({ status }: { status: string }) {
  return (
    <span className="chip bg-neutral-100 text-neutral-700 border border-neutral-200">
      {status}
    </span>
  );
}
