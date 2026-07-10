"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subscribe() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (!res.ok || !data.url) {
      setError(data.error || "Checkout failed");
      setLoading(false);
      return;
    }
    window.location.href = data.url;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-200 bg-paper">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-brand">
            ← Back to dashboard
          </Link>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="mb-12 text-center">
          <div className="text-xs uppercase tracking-widest text-brand mb-3">Pricing</div>
          <h1 className="font-serif text-5xl tracking-tight mb-4">
            Simple, honest pricing.
          </h1>
          <p className="text-neutral-500 max-w-xl mx-auto">
            Start free. Upgrade when you need more analyses. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="p-8 border border-neutral-200 rounded bg-paper">
            <div className="text-xs uppercase tracking-widest text-neutral-500 mb-4">
              Free
            </div>
            <div className="font-serif text-5xl mb-2">€0</div>
            <div className="text-sm text-neutral-500 mb-8">forever</div>
            <ul className="space-y-3 text-sm mb-8">
              <li>15 AI analyses / month</li>
              <li>Match insights, cover letters, interview prep</li>
              <li>Application tracker</li>
              <li>PDF and DOCX resume upload</li>
            </ul>
            <Link
              href="/dashboard"
              className="block text-center px-6 py-3 border border-neutral-300 rounded hover:border-brand hover:text-brand transition-colors"
            >
              Current plan
            </Link>
          </div>

          <div className="p-8 border-2 border-brand rounded bg-brand/5 relative">
            <div className="absolute -top-3 left-8 px-3 py-1 bg-brand text-paper text-xs uppercase tracking-widest rounded">
              Recommended
            </div>
            <div className="text-xs uppercase tracking-widest text-brand mb-4">Pro</div>
            <div className="font-serif text-5xl mb-2">€19</div>
            <div className="text-sm text-neutral-500 mb-8">per month</div>
            <ul className="space-y-3 text-sm mb-8">
              <li>Unlimited match analyses</li>
              <li>Unlimited cover letters</li>
              <li>All application tools</li>
              <li>Priority support</li>
              <li>Cancel anytime</li>
            </ul>
            <button
              onClick={subscribe}
              disabled={loading}
              className="w-full px-6 py-3 bg-brand text-paper rounded hover:bg-brand-dark disabled:opacity-50 transition-colors"
            >
              {loading ? "Redirecting…" : "Upgrade to Pro"}
            </button>
            {error && (
              <div className="mt-3 text-sm text-status-skip">{error}</div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-neutral-500 mt-12">
          Payments handled by Stripe. Cancel anytime from your billing portal.
        </p>
      </main>
    </div>
  );
}
