import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/get-or-create-user";

export const dynamic = "force-dynamic";

export default async function ApplicationsList() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const applications = await db.application.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-200 bg-paper">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="font-serif text-2xl tracking-tight">
            HireCraft
          </Link>
          <Link
            href="/applications/new"
            className="px-4 py-2 bg-brand text-paper text-sm rounded hover:bg-brand-dark transition-colors"
          >
            New application
          </Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-widest text-brand mb-2">
            Job tracker
          </div>
          <h1 className="font-serif text-4xl tracking-tight">Your applications</h1>
        </div>
        {applications.length === 0 ? (
          <div className="p-12 border border-neutral-200 rounded text-center">
            <div className="mb-3 text-neutral-500">No applications yet.</div>
            <Link
              href="/applications/new"
              className="text-brand hover:underline"
            >
              Create your first →
            </Link>
          </div>
        ) : (
          <div className="border border-neutral-200 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">Role</th>
                  <th className="text-left px-6 py-3 font-medium">Organization</th>
                  <th className="text-left px-6 py-3 font-medium">Tier</th>
                  <th className="text-left px-6 py-3 font-medium">Score</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                  <th className="text-left px-6 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-neutral-200 last:border-b-0 hover:bg-neutral-50"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/applications/${app.id}`}
                        className="font-medium hover:text-brand"
                      >
                        {app.roleTitle}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-neutral-500">{app.organization}</td>
                    <td className="px-6 py-4">
                      {app.matchTier ? (
                        <TierChip tier={app.matchTier} />
                      ) : (
                        <span className="text-neutral-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {app.matchScore ?? "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="chip bg-neutral-100 text-neutral-700 border border-neutral-200">
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-500">
                      {app.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
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
